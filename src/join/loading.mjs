// Port of the real LoadingScreen class from engine/WasmPlayer.js (class `re`), driving the markup and CSS
// copied from play.roblox.com/games/start. Same endpoints, same status priorities, same failure titles.
// Differences: requests go through our proxy requester (not fetch), images are resolved through the proxy
// first, and "Leave" returns to the launcher instead of closing the tab.

export const RETRY_MS = [250, 500, 1000, 2000]; // engine `ce`
export const EXIT_MS = 600; // engine `Ge`
export const BROWSER_PRIORITY = 1; // engine `de`

// engine `ue`: swap the leading "www" for a subdomain, or prepend one.
export const subdomainUrl = (base, sub, path) => {
  const u = new URL(base.includes("://") ? base : `https://${base}`);
  const parts = u.hostname.split(".");
  if (parts[0] === "www") parts[0] = sub;
  else parts.unshift(sub);
  u.hostname = parts.join(".");
  u.pathname = path;
  u.search = "";
  u.hash = "";
  return u.href;
};

export const experienceUrls = (placeId, base = "https://www.roblox.com") => {
  const universe = subdomainUrl(base, "apis", `/universes/v1/places/${placeId}/universe`);
  const details = subdomainUrl(base, "economy", `/v2/assets/${placeId}/details`);
  const thumbs = subdomainUrl(base, "thumbnails", "/");
  const icon = new URL("/v1/games/icons", thumbs);
  const background = new URL("/v1/games/multiget/thumbnails", thumbs);
  return {
    details,
    universe,
    icon: (universeId) => {
      icon.search = new URLSearchParams({ universeIds: String(universeId), returnPolicy: "PlaceHolder", size: "256x256", format: "Png", isCircular: "false" }).toString();
      return icon.href;
    },
    background: (universeId) => {
      background.search = new URLSearchParams({ universeIds: String(universeId), countPerUniverse: "1", defaults: "true", size: "768x432", format: "Png", isCircular: "false" }).toString();
      return background.href;
    },
  };
};

const defaultSleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Loading screen request cancelled", "AbortError")); }, { once: true });
  });

// engine `fetchThumbnailUrl`: poll while Pending, return the image url once Completed.
export async function pollThumbnail(fetchJson, url, pick, { sleep = defaultSleep, signal } = {}) {
  for (let i = 0; i <= RETRY_MS.length; i++) {
    const item = pick(await fetchJson(url));
    if (item?.state === "Completed" && typeof item.imageUrl === "string") return item.imageUrl;
    if (item?.state !== "Pending" || i === RETRY_MS.length) {
      throw new Error(`${new URL(url).pathname} returned thumbnail state ${String(item?.state)}`);
    }
    await sleep(RETRY_MS[i], signal);
  }
  return null;
}

// engine `showFailureDetails`: what the error panel and status line say.
export const failureView = (message, errorCode, source, { errorPrompt = true } = {}) => {
  const hasCode = errorCode !== null && errorCode !== undefined && Number.isInteger(errorCode) && errorCode > 0;
  const text = String(message ?? "").trim() || "Unable to join the experience.";
  return {
    status: hasCode ? `${text}\nError Code: ${errorCode}` : text,
    title: source === "teleport" ? "Teleport Failed" : source === "browser" ? "Error" : "Join Error",
    message: text,
    code: source === "browser" ? "" : `(Error Code: ${hasCode ? errorCode : -1})`,
    showPanel: errorPrompt,
  };
};

export class LoadingScreen {
  constructor({ doc = globalThis.document, request, resolveImage = async (u) => u, onLeave = () => {}, setTimeoutFn = (f, ms) => setTimeout(f, ms), raf = (f) => requestAnimationFrame(f) } = {}) {
    const $ = (id) => doc.getElementById(id);
    this.doc = doc;
    this.request = request;
    this.resolveImage = resolveImage;
    this.onLeave = onLeave;
    this.setTimeoutFn = setTimeoutFn;
    this.raf = raf;
    this.root = $("loading-overlay");
    this.background = $("loading-background-image");
    this.icon = $("loading-experience-icon");
    this.iconShell = $("loading-icon-shell");
    this.title = $("loading-experience-title");
    this.creator = $("loading-experience-creator");
    this.verifiedBadge = $("loading-verified-badge");
    this.status = $("status");
    this.errorPanel = doc.querySelector(".loading-error-panel");
    this.errorTitle = $("loading-error-title");
    this.errorMessage = $("loading-error-message");
    this.errorCode = $("loading-error-code");
    this.cancelButton = $("loading-cancel");
    this.errorLeaveButton = $("loading-error-leave");
    this.abortController = new AbortController();
    this.state = { dismissed: false, hiddenAfterSuccess: false, experienceLoaded: false, statusPriority: 0, failureSourcePriority: -1 };
    this.frame = null;
    this.timer = null;
    this.cancelButton?.addEventListener("click", () => this.onLeave("cancel"));
    this.errorLeaveButton?.addEventListener("click", () => this.onLeave("error"));
  }

  prepare(joining = true) {
    Object.assign(this.state, { failureSourcePriority: -1, statusPriority: 0, dismissed: false, hiddenAfterSuccess: false, experienceLoaded: false });
    this.abortController = new AbortController();
    this.cancelPendingDismissal();
    if (this.root) {
      this.setRootHidden(false);
      this.root.classList.remove("loading-failed", "loading-exiting");
      this.root.setAttribute("aria-label", "Loading Roblox");
      this.root.setAttribute("aria-busy", "true");
    }
    if (this.errorPanel) this.errorPanel.hidden = true;
    if (this.errorMessage) this.errorMessage.textContent = "";
    if (this.errorCode) this.errorCode.textContent = "";
    if (this.title) this.title.textContent = joining ? "Joining experience" : "Roblox";
    // fresh artwork for each join
    this.creator && ((this.creator.hidden = true), (this.creator.textContent = ""));
    if (this.verifiedBadge) this.verifiedBadge.hidden = true;
    for (const [img, shell] of [[this.icon, this.iconShell], [this.background, this.background?.parentElement]]) {
      img?.removeAttribute("src");
      shell?.classList.remove("loading-image-ready");
    }
    // restart the 5 s reveal of the cancel button
    if (this.cancelButton) {
      this.cancelButton.style.animation = "none";
      void this.cancelButton.offsetWidth;
      this.cancelButton.style.animation = "";
    }
  }

  // engine setStatus / setEngineStatus: a lower-priority message never replaces a higher-priority one.
  setStatus(text) { this.setStatusWithPriority(text, 0); }
  setEngineStatus(text) { this.setStatusWithPriority(text, 1); }
  clearEngineStatus() { this.clearStatusWithPriority(1); }
  setStatusWithPriority(text, priority) {
    const t = String(text).trim();
    if (!t || !this.status || priority < this.state.statusPriority) return;
    this.state.statusPriority = priority;
    this.status.textContent = t;
    this.status.removeAttribute("aria-valuenow");
    this.status.removeAttribute("title");
  }
  clearStatusWithPriority(priority) {
    if (!this.status || priority < this.state.statusPriority || this.state.statusPriority === 2) return;
    this.state.statusPriority = 0;
    this.status.textContent = "";
    this.status.removeAttribute("aria-valuenow");
  }

  showFailure(message) { this.showFailureDetails(message, null, "browser", BROWSER_PRIORITY); }
  showEngineFailure({ message, errorCode = null, source = "join", statusCode = null }) {
    this.showFailureDetails(message || "Unable to join the experience.", errorCode, source, source === "gui-service" ? 3 : 2, statusCode);
  }

  showFailureDetails(message, errorCode, source, priority, statusCode = null) {
    const s = this.state;
    if (s.hiddenAfterSuccess || priority < s.failureSourcePriority || (s.experienceLoaded && priority <= BROWSER_PRIORITY)) return;
    s.failureSourcePriority = priority;
    s.statusPriority = 2;
    s.dismissed = false;
    this.cancelPendingDismissal();
    const v = failureView(message, errorCode, source);
    if (this.status) {
      this.status.textContent = v.status;
      this.status.removeAttribute("aria-valuenow");
      this.status.title = [`Source: ${source}`, ...(statusCode !== null ? [`Join status: ${statusCode}`] : [])].join("; ");
    }
    if (this.errorTitle) this.errorTitle.textContent = v.title;
    if (this.errorMessage) this.errorMessage.textContent = v.message;
    if (this.errorCode) this.errorCode.textContent = v.code;
    if (this.errorPanel) this.errorPanel.hidden = !v.showPanel;
    if (this.root) {
      this.setRootHidden(false);
      this.root.classList.remove("loading-exiting");
      this.root.classList.toggle("loading-failed", v.showPanel);
      this.root.setAttribute("aria-label", "Unable to join Roblox");
      this.root.setAttribute("aria-busy", "false");
    }
  }

  hasEngineFailure() { return this.state.failureSourcePriority > BROWSER_PRIORITY; }

  dismiss() {
    const s = this.state;
    if (s.dismissed || this.hasEngineFailure()) return;
    s.dismissed = true;
    this.abortController.abort();
    this.cancelPendingDismissal();
    this.root?.setAttribute("aria-busy", "false");
    this.root?.classList.add("loading-exiting");
    this.timer = this.setTimeoutFn(() => { this.timer = null; s.hiddenAfterSuccess = true; this.setRootHidden(true); }, EXIT_MS);
  }

  dismissAfterRenderedFrame() {
    const s = this.state;
    s.experienceLoaded = true;
    if (s.dismissed || this.frame !== null || this.hasEngineFailure()) return;
    this.frame = this.raf(() => { this.frame = this.raf(() => { this.frame = null; this.dismiss(); }); });
  }

  cancelPendingDismissal() {
    this.frame = null;
    if (this.timer !== null) { clearTimeout(this.timer); this.timer = null; }
  }

  setRootHidden(hidden) {
    if (!this.root) return;
    this.root.hidden = hidden;
    this.root.style.display = hidden ? "none" : "";
  }

  abort() { this.abortController.abort(); }

  async fetchJson(url) {
    const res = await this.request(url, { method: "GET", signal: this.abortController.signal });
    if (!res.ok) throw new Error(`${new URL(url).hostname} returned HTTP ${res.status}`);
    return res.json();
  }

  async loadExperience(placeId) {
    const urls = experienceUrls(placeId);
    const fail = async (what, p) => {
      try { await p; } catch (e) {
        if (e?.name === "AbortError") throw e;
        console.warn(`[LoadingScreen] Failed to load ${what}:`, e);
      }
    };
    const details = this.fetchJson(urls.details).then((d) => this.applyProductInfo(d));
    const art = this.fetchJson(urls.universe).then(async (u) => {
      if (typeof u.universeId !== "number" || u.universeId <= 0) return;
      const fj = (x) => this.fetchJson(x);
      const opts = { signal: this.abortController.signal };
      await Promise.all([
        fail("experience icon", pollThumbnail(fj, urls.icon(u.universeId), (f) => f.data?.[0], opts).then((src) => this.applyImage(this.icon, this.iconShell, src))),
        fail("experience background", pollThumbnail(fj, urls.background(u.universeId), (f) => f.data?.[0]?.thumbnails?.[0], opts).then((src) => this.applyImage(this.background, this.background?.parentElement ?? null, src))),
      ]);
    });
    try {
      await Promise.all([fail("experience details", details), fail("experience artwork", art)]);
    } catch (e) {
      if (e?.name !== "AbortError") throw e;
    }
  }

  applyProductInfo(info) {
    if (this.title && typeof info.Name === "string" && info.Name) this.title.textContent = info.Name;
    const name = info.Creator?.Name;
    if (this.creator && typeof name === "string" && name) { this.creator.textContent = name; this.creator.hidden = false; }
    if (this.verifiedBadge && info.Creator?.HasVerifiedBadge === true) this.verifiedBadge.hidden = false;
  }

  async applyImage(img, shell, src) {
    if (!img || !shell || !src) return;
    let url = src;
    try { url = (await this.resolveImage(src)) || src; } catch {}
    img.addEventListener("load", () => shell.classList.add("loading-image-ready"), { once: true });
    img.addEventListener("error", () => img.removeAttribute("src"), { once: true });
    img.src = url;
  }
}
