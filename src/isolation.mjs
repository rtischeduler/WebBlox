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
    case "no-service-worker":
      return "This WebView has no service workers, so the page cannot add isolation headers itself. Load WebBlox from a host that sends them (see worker/coi-proxy.js)." + webview;
    case "no-isolation-after-reload":
      return "Isolation is still off after reloading. This WebView ignores COOP/COEP; if the headers are already sent by the host, the WebView itself does not support isolation." + webview;
    default:
      return "This page is not cross-origin isolated, which Roblox's threaded WebAssembly needs." + webview;
  }
}
