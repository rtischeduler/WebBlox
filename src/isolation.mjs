export const DEFAULT_HOST = "https://rtischeduler.github.io/WebBlox/";

export const isOpaqueOrigin = (loc) => !/^https?:$/.test(loc.protocol) || loc.origin === "null";

export const hostedUrl = (host, loc) => String(host || DEFAULT_HOST).replace(/\/?$/, "/") + (loc.search || "") + (loc.hash || "");

export const pickCoep = (hasCredentialless) => (hasCredentialless ? "credentialless" : "require-corp");

export function explainIsolation(reason, ua = "") {
  const webview = /; wv\)/.test(ua) ? " This looks like an Android WebView." : "";
  switch (reason) {
    case "framed":
      return "WebBlox is inside a frame of a page that is not cross-origin isolated. Open index.html as the top-level page of the WebView, from a server that sends COOP/COEP headers (see worker/coi-proxy.js)." + webview;
    case "opaque-origin-framed":
      return "WebBlox was loaded as inline HTML inside a frame, so it has no real address. Load the https address of a COOP/COEP-sending host in the WebView instead of pasting the HTML." + webview;
    case "host-missing-sw":
      return "The page hosting WebBlox has no coi-sw.js next to it, so it cannot be made isolated. Add coi-sw.js to the root of that site (see README)." + webview;
    case "host-not-isolated":
      return "The hosting page was reloaded with isolation turned on but the WebView still reports it as not isolated. This WebView does not support cross-origin isolation." + webview;
    case "no-service-worker":
      return "This WebView has no service workers, so the page cannot add isolation headers itself. Load WebBlox from a host that sends them (see worker/coi-proxy.js)." + webview;
    case "no-isolation-after-reload":
      return "Isolation is still off after reloading. This WebView ignores COOP/COEP; if the headers are already sent by the host, the WebView itself does not support isolation." + webview;
    default:
      return "This page is not cross-origin isolated, which Roblox's threaded WebAssembly needs." + webview;
  }
}

const KEY = "webblox_coi_reloads";
export const HOST_PARAM = "wbcoi";
const forever = () => new Promise(() => {});
const result = (ok, reason, url) => ({ ok, reason: reason || "", url: url || "" });

async function isolateViaHost(win) {
  let top;
  try { top = win.top; void top.location.href; void top.document; } catch { return null; }
  const tl = top.location;
  const params = new URLSearchParams(tl.search);
  if (params.has(HOST_PARAM)) return result(false, "host-not-isolated");
  if (!top.isSecureContext || !("serviceWorker" in top.navigator)) return result(false, "host-no-service-worker");
  const coep = pickCoep("credentialless" in top.HTMLIFrameElement.prototype);
  const swUrl = new URL("coi-sw.js?coep=" + coep, top.document.baseURI).href;
  try {
    const probe = await fetch(swUrl, { cache: "no-store" });
    if (!probe.ok) return result(false, "host-missing-sw");
    const sw = top.navigator.serviceWorker;
    await sw.register(swUrl, { updateViaCache: "none" });
    await sw.ready;
    params.set(HOST_PARAM, "1");
    console.warn("[webblox] reloading the host page with isolation on");
    tl.replace(tl.origin + tl.pathname + "?" + params.toString() + tl.hash);
    return forever();
  } catch (e) { console.warn("[webblox] host isolation failed", e); return result(false, "host-sw-failed"); }
}

export async function ensureIsolation(win = globalThis.window) {
  if (win.__wbIsolation) return win.__wbIsolation;
  const loc = win.location;
  const store = {
    get: () => { try { return +win.sessionStorage.getItem(KEY) || 0; } catch { return 99; } },
    bump() { try { win.sessionStorage.setItem(KEY, String(store.get() + 1)); } catch {} },
    clear: () => { try { win.sessionStorage.removeItem(KEY); } catch {} },
  };
  if (win.crossOriginIsolated) { store.clear(); return result(true); }
  const target = hostedUrl(win.WEBBLOX_HOST, loc);
  const framed = win !== win.top;
  if (framed) {
    const viaHost = await isolateViaHost(win);
    if (viaHost && viaHost.reason === "host-not-isolated") return { ...viaHost, url: target };
    if (viaHost && !/^host-(missing-sw|no-service-worker|sw-failed)$/.test(viaHost.reason)) return viaHost;
  }
  if (isOpaqueOrigin(loc)) {
    console.warn("[webblox] no real origin here (" + loc.protocol + "), moving to " + target);
    try { (framed ? win.top : win).location.replace(target); return forever(); } catch {}
    return result(false, framed ? "opaque-origin-framed" : "no-service-worker", target);
  }
  if (framed) {
    try { win.top.location.replace(target); return forever(); } catch {}
    return result(false, "framed", target);
  }
  if (!win.isSecureContext || !("serviceWorker" in win.navigator)) return result(false, "no-service-worker", target);
  const coep = pickCoep("credentialless" in win.HTMLIFrameElement.prototype);
  const swUrl = new URL("coi-sw.js?coep=" + coep, win.document.baseURI).href;
  try {
    const probe = await fetch(swUrl, { cache: "no-store" });
    if (!probe.ok) { console.error("[webblox] coi-sw.js not reachable: HTTP " + probe.status + " at " + swUrl); return result(false, "no-service-worker", target); }
    const sw = win.navigator.serviceWorker;
    for (const r of await sw.getRegistrations()) {
      const u = (r.active || r.waiting || r.installing || {}).scriptURL;
      if (u && u !== swUrl && loc.href.startsWith(r.scope)) { console.warn("[webblox] removing conflicting service worker", u); await r.unregister(); }
    }
    await sw.register(swUrl, { updateViaCache: "none" });
    await sw.ready;
    if (!sw.controller) await new Promise((res) => { sw.addEventListener("controllerchange", res, { once: true }); setTimeout(res, 1500); });
    if (win.crossOriginIsolated) return result(true);
    if (store.get() < 3) { store.bump(); loc.reload(); return forever(); }
    return result(false, "no-isolation-after-reload", target);
  } catch (e) { console.warn("[webblox] isolation worker failed", e); return result(false, "no-service-worker", target); }
}
