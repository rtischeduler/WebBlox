// Adds the headers that make the page cross-origin isolated (SharedArrayBuffer), which the Roblox web client's
// pthread wasm needs. Based on Singuloxy's example/coi-sw.js (AGPL-3.0, ading2210/sandstone). Same-origin only.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request).then((response) => {
      if (response.status === 0 || response.type === "opaque" || response.type === "opaqueredirect") return response;
      const headers = new Headers(response.headers);
      headers.set("Cross-Origin-Opener-Policy", "same-origin");
      headers.set("Cross-Origin-Embedder-Policy", "credentialless");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    })
  );
});
