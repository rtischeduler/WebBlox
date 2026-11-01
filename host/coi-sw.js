const PARAM = "wbcoi";
const COEP = new URL(self.location.href).searchParams.get("coep") === "require-corp" ? "require-corp" : "credentialless";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isolate = request.mode === "navigate" && request.destination === "document" && url.searchParams.has(PARAM);
  event.respondWith(
    fetch(request).then((response) => {
      if (response.status === 0 || response.type === "opaque" || response.type === "opaqueredirect") return response;
      const headers = new Headers(response.headers);
      headers.set("Cross-Origin-Resource-Policy", "cross-origin");
      if (isolate) {
        headers.set("Cross-Origin-Opener-Policy", "same-origin");
        headers.set("Cross-Origin-Embedder-Policy", COEP);
      }
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }).catch(() => fetch(request))
  );
});
