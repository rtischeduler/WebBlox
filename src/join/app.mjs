import { createProxy } from "./proxy.mjs";
import { joinGame, describeJoin, redact, randomTrackerId, probeJoin, JoinError } from "./gamejoin.mjs";
import { findServer, loadAvatars } from "./servers.mjs";
import { PlayerList } from "./players.mjs";
import { Transport, Capture } from "./transport.mjs";
import { ChatClient, ChatLog } from "./chat.mjs";
import { LoadingScreen } from "./loading.mjs";
import { Session } from "./session.mjs";
import { downloadText } from "../download.mjs";
import { startCoreGui } from "./coregui/index.mjs";
import { readHostCookie, readBrowserTrackerId } from "./cookie.mjs";

const missingIds = new Set();
// Never throw on a missing element (stale or different join.html): hand back an inert stub and remember the id so the status line can name it.
const stub = () => new Proxy(function () {}, { get: (_, k) => (k === Symbol.toPrimitive ? () => "" : k === "classList" || k === "style" || k === "dataset" ? stub() : stub()), set: () => true, apply: () => stub() });
const $ = (id) => {
  const e = document.getElementById(id);
  if (e) return e;
  if (!missingIds.has(id)) { missingIds.add(id); console.warn("[join] missing element #" + id); }
  return stub();
};

const store = {
  get(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

const players = new PlayerList();
const blobUrls = [];
let proxy = null;
let capture = new Capture();
let lastJoin = null;
let controller = null;
const makeLoading = () =>
  new LoadingScreen({ request: (u, i) => proxy.request(u, i), resolveImage: (u) => fetchBlobUrl(u), onLeave: (why) => leaveGame(why) });

const say = (text) => {
  $("wb-status").textContent = text;
};

const log = (...args) => {
  const el = $("wb-log");
  el.textContent +=
    args.map((x) => (typeof x === "string" ? x : x instanceof Error ? x.stack || x.message : JSON.stringify(x))).join(" ") + "\n";
  if (el.textContent.length > 80000) el.textContent = el.textContent.slice(-50000);
  el.scrollTop = el.scrollHeight;
};

addEventListener("error", (e) => log("[error]", e.message));
addEventListener("unhandledrejection", (e) => log("[reject]", e.reason));

const el = (tag, props = {}, ...children) => {
  const { dataset, ...rest } = props;
  const node = Object.assign(document.createElement(tag), rest);
  if (dataset) Object.assign(node.dataset, dataset);
  for (const child of children) node.append(child);
  return node;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const hostForUrl = (host) => (host.includes(":") ? `[${host}]` : host);

const setStep = (name, state, note = "") => {
  const li = document.querySelector(`[data-step="${name}"]`);
  li.dataset.state = state;
  li.querySelector(".note").textContent = note;
};

const resetSteps = () => {
  for (const li of document.querySelectorAll("[data-step]")) {
    li.dataset.state = "idle";
    li.querySelector(".note").textContent = "";
  }
};

const setBusy = (busy) => {
  $("wb-go").disabled = busy;
  $("wb-cancel").hidden = !busy;
};

const renderInfo = (info, script) => {
  const root = $("info");
  if (!root) return;
  root.replaceChildren();
  if (!info) {
    root.append(el("p", { className: "dim", textContent: "Nothing yet." }));
    return;
  }
  const who = [info.user.displayName, info.user.name && `@${info.user.name}`, info.user.id && `(${info.user.id})`]
    .filter(Boolean)
    .join(" ");
  const rows = [
    ["User", who || "—"],
    ["Place", String(info.placeId ?? "—")],
    ["Server (job id)", info.jobId || "—"],
    ["Game server", info.machine ? info.machine.host + (info.machine.port ? ":" + info.machine.port : "") : "—"],
    ["UDMUX endpoints", info.udmux.length ? info.udmux.map((e) => `${e.host}:${e.port}`).join(", ") : "—"],
    ["Certificate hashes", String(info.certHashes.length)],
    ["Transport config keys", info.configKeys.length ? info.configKeys.join(", ") : "—"],
  ];
  const list = el("dl", { className: "kv" });
  for (const [key, value] of rows) list.append(el("dt", { textContent: key }), el("dd", { textContent: value }));
  const details = el(
    "details",
    {},
    el("summary", { textContent: "Join script (secrets redacted)" }),
    el("pre", { textContent: JSON.stringify(redact(script), null, 2) }),
  );
  root.append(list, details);
};

const renderPlayers = (sections) => {
  const root = $("players");
  if (!root) return;
  root.replaceChildren();
  if (!sections.length) {
    root.append(el("p", { className: "dim", textContent: "Join a server to see its players." }));
    return;
  }
  for (const section of sections) {
    root.append(el("h3", { textContent: `${section.label} · ${section.players.length}` }));
    if (section.meta.note) root.append(el("p", { className: "dim", textContent: section.meta.note }));
    const grid = el("div", { className: "plist" });
    section.players.forEach((p, i) => {
      const label = p.displayName || p.name || `Player ${i + 1}`;
      const sub = p.name && p.displayName && p.name !== p.displayName ? "@" + p.name : p.id ? String(p.id) : "";
      const avatar = p.avatarUrl ? el("img", { src: p.avatarUrl, alt: "", width: 48, height: 48 }) : el("span", { className: "ph" });
      grid.append(
        el(
          "div",
          { className: "prow" },
          avatar,
          el(
            "div",
            {},
            el("div", { className: "pname", textContent: label + (p.you ? " (you)" : "") }),
            el("div", { className: "dim", textContent: sub }),
          ),
        ),
      );
    });
    root.append(grid);
  }
};

players.onChange(renderPlayers);

async function fetchBlobUrl(url) {
  try {
    const res = await proxy.request(url, { method: "GET", signal: controller?.signal });
    if (!res.ok) return "";
    const objectUrl = URL.createObjectURL(await res.blob());
    blobUrls.push(objectUrl);
    return objectUrl;
  } catch {
    return "";
  }
}

async function lookupPlayers(jobId, placeId) {
  setStep("server", "run");
  const found = await findServer({
    request: proxy.request,
    placeId,
    jobId,
    signal: controller.signal,
    onPage: (p) => setStep("server", "run", `scanned ${p.scanned}`),
  });
  if (!found.server) {
    const why = found.rateLimited ? "rate limited" : found.error || `not in the first ${found.scanned} public servers`;
    setStep("server", "warn", why);
    setStep("players", "warn", "no server list entry");
    return;
  }
  const server = found.server;
  setStep("server", "ok", `${server.playing}/${server.maxPlayers} players`);
  setStep("players", "run");
  const avatars = await loadAvatars({ request: proxy.request, tokens: server.playerTokens, signal: controller.signal });
  const list = await Promise.all(
    avatars.map(async (a) => ({ token: a.token, avatarUrl: a.imageUrl ? await fetchBlobUrl(a.imageUrl) : "" })),
  );
  players.update("web", list, {
    note: `The server list exposes ${server.playerTokens.length} of ${server.playing} players as anonymous avatars. Names arrive over the replication stream, which is not decoded yet.`,
  });
  setStep("players", list.length ? "ok" : "warn", `${list.length} avatars`);
}

const chatLog = new ChatLog();
chatLog.onChange((_, lines) => { const l = lines[lines.length - 1]; if (l) log("[chat]", l.kind === "system" ? l.text : `[${l.speaker}] ${l.text}`); });
const chat = new ChatClient({ log: chatLog });
let session = null;
let loading = null;

function downloadCapture() {
  downloadText("webblox-capture.json", JSON.stringify({ version: 1, join: lastJoin, capture: capture.toJSON() }, null, 1));
}

/* ---------- game layer lifecycle ---------- */
const inGame = () => !$("g-layer").hidden;

const showGame = () => {
  $("g-layer").hidden = false;
  loading.prepare(true);
  loading.setStatus("Preparing Roblox…");
};

// The loading screen stays until the real CoreGui has drawn (or failed/timed out), then fades away revealing it.
const showHud = async () => {
  loading.setStatus("Loading CoreGui…");
  const r = await (globalThis.webblox?.coreguiReady || Promise.resolve({ drawn: false, status: "CoreGui not started" }));
  if (!r.drawn) { chatLog.system("CoreGui drew nothing: " + r.status); log("[coregui] ready without UI:", r.status, r.errors); }
  loading.setStatus("Joined.");
  loading.dismissAfterRenderedFrame();
};

const hideGame = () => {
  $("g-layer").hidden = true;
};

async function leaveGame(reason = "Leave") {
  loading?.abort();
  controller?.abort();
  if (session?.live) await session.leave();
  session = null;
  for (const url of blobUrls.splice(0)) URL.revokeObjectURL(url);
  hideGame();
  say(reason === "cancel" ? "Cancelled." : "You left the game.");
  syncSessionUi();
}

const syncSessionUi = () => {
  $("wb-go").disabled = Boolean(controller) || inGame();
};

async function startSession(info) {
  setStep("transport", "run");
  const endpoint = info.udmux[0];
  const url = $("wb-wt-url").value.trim() || (endpoint ? `https://${hostForUrl(endpoint.host)}:${endpoint.port}/` : "");
  if (!url) {
    setStep("transport", "warn", "no endpoint in join script");
    chatLog.system("The join script has no game server endpoint.");
    return;
  }
  session = new Session({ chat, capture, log });
  session.onState((state, detail) => {
    syncSessionUi();
    if (state === "connected") setStep("transport", "ok", `connected (max datagram ${detail.maxDatagramSize}) — press Esc in the game view to leave`);
    else if (state === "left") setStep("transport", "ok", `left after ${detail.stayed}`);
    else if (state === "dropped") setStep("transport", "warn", `server closed it after ${detail.stayed}`);
    else if (state === "failed") setStep("transport", "fail", detail.error);
  });
  syncSessionUi();
  try {
    await session.join(url, info.certHashes);
  } catch (e) {
    log("[transport]", url, e.message || String(e));
  }
}

addEventListener("pagehide", () => {
  if (session?.live) session.transport?.close();
});

async function run() {
  const hostCookie = readHostCookie();
  const cookie = hostCookie || $("wb-cookie").value.trim() || store.get("wb.cookie");
  const placeId = Number($("wb-place").value);
  const jobId = $("wb-job").value.trim();
  if (!cookie) {
    say("Paste your .ROBLOSECURITY cookie first.");
    return;
  }
  if (!Number.isInteger(placeId) || placeId <= 0) {
    say("Enter a numeric place id.");
    return;
  }
  if (!hostCookie) store.set("wb.cookie", cookie);
  store.set("wb.place", String(placeId));
  store.set("wb.job", jobId);
  chatLog.clear();
  controller = new AbortController();
  loading ||= makeLoading();
  showGame();
  for (const url of blobUrls.splice(0)) URL.revokeObjectURL(url);
  capture = new Capture();
  lastJoin = null;
  players.clear();
  renderInfo(null);
  resetSteps();
  setBusy(true);
  try {
    setStep("proxy", "run");
    proxy ||= await createProxy({ getCookie: () => readHostCookie() || store.get("wb.cookie"), log, say });
    startCoreGui({ proxy, canvas: $("canvas"), log }); // non-blocking: latest real CoreGui patch -> canvas
    setStep("proxy", "ok", proxy.wisp.replace(/^wss:\/\//, "").replace(/\/$/, ""));
    loading.request = proxy.request;
    loading.loadExperience(placeId).catch(() => {});
    setStep("join", "run");
    say("Requesting a server…");
    loading.setStatus("Joining experience…");
    let browserTrackerId = readBrowserTrackerId() || Number(store.get("wb.tracker")) || 0;
    if (!browserTrackerId) {
      browserTrackerId = randomTrackerId();
      store.set("wb.tracker", String(browserTrackerId));
    }
    const result = await joinGame({
      request: proxy.request,
      placeId,
      jobId,
      browserTrackerId,
      signal: controller.signal,
      onStatus: (s) => {
        say(`Waiting for a server (status ${s.status}${s.message ? ": " + s.message : ""})`);
        loading.setStatus(s.message || "Waiting for a server…");
        log("[join] status", s.status, s.message || "", s.queuePosition ?? "", JSON.stringify(s.raw));
      },
    });
    const info = describeJoin(result.script);
    lastJoin = redact(result.script);
    renderInfo(info, result.script);
    players.update("joinscript", [
      { id: info.user.id, name: info.user.name, displayName: info.user.displayName, you: true },
    ]);
    setStep("join", "ok", `status ${result.status}`);
    await lookupPlayers(result.jobId || info.jobId, placeId);
    loading.setStatus("Connecting to the server…");
    chatLog.system(`Joined as ${info.user.displayName || info.user.name || "guest"}.`);
    if ($("wb-direct").checked) await startSession(info);
    else chatLog.system("The game connection is off (see the launcher).");
    showHud();
    say(session?.live ? "In game. Press Esc to leave." : "Done.");
  } catch (e) {
    const cancelled = controller.signal.aborted;
    say(cancelled ? "Cancelled." : "Failed: " + (window.__wbFmtErr ? window.__wbFmtErr(e) : (e.message || e)));
    if (!cancelled) {
      log("[join]", e);
      const code = e instanceof JoinError && Number.isInteger(e.status) ? e.status : null;
      loading?.showEngineFailure({ message: e.message || String(e), errorCode: code, source: "join", statusCode: e instanceof JoinError ? e.status : null });
    } else hideGame();
    if (!cancelled && new URLSearchParams(location.search).has("probe") && proxy) {
      say("Failed: " + (window.__wbFmtErr ? window.__wbFmtErr(e) : (e.message || e)) + "\n— probing variants…");
      try {
        const rows = await probeJoin({ request: proxy.request, placeId, browserTrackerId: Number(store.get("wb.tracker")) || undefined, signal: controller.signal, log });
        log("[probe] done", rows.length, "rows");
      } catch (pe) { log("[probe] failed", pe); }
    }
    for (const li of document.querySelectorAll('[data-step][data-state="run"]')) {
      li.dataset.state = cancelled ? "warn" : "fail";
      li.querySelector(".note").textContent = cancelled ? "cancelled" : e.message || "error";
    }
  } finally {
    setBusy(false);
    controller = null;
    syncSessionUi();
  }
}

export function boot() {
  const params = new URLSearchParams(location.search);
  $("wb-place").value = params.get("placeId") || store.get("wb.place");
  $("wb-job").value = params.get("jobId") || store.get("wb.job");
  if (readHostCookie()) {
    $("wb-cookie-field").hidden = true;
    $("wb-cookie-note").hidden = false;
  } else if (store.get("wb.cookie")) {
    $("wb-cookie").placeholder = "Saved on this device — paste to replace";
  }
  const supported = Transport.supported();
  $("wb-wt-support").textContent = supported ? "WebTransport is available in this browser." : "WebTransport is not available in this browser.";
  $("wb-direct").disabled = !supported;
  renderPlayers([]);
  renderInfo(null);
  $("wb-go").onclick = () => run();
  $("wb-cancel").onclick = () => controller?.abort();
  // Until the real CoreGui menu runs, Escape is the only way out of the game view.
  addEventListener("keydown", (e) => { if (e.key === "Escape" && inGame()) leaveGame("Leave"); });
  syncSessionUi();
  $("wb-copy").onclick = () => navigator.clipboard?.writeText($("wb-log").textContent).catch(() => {});
  $("wb-export").onclick = () =>
    downloadText("webblox-capture.json", JSON.stringify({ version: 1, join: lastJoin, capture: capture.toJSON() }, null, 1));
  say(missingIds.size ? "Ready, but this page is missing: #" + [...missingIds].join(", #") + " (stale join.html? hard-refresh)" : "Ready.");
}
