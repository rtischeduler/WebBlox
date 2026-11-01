const UPSTREAM = "https://rtischeduler.github.io/WebBlox";

export default {
  async fetch(request, env) {
    const base = (env && env.UPSTREAM) || UPSTREAM;
    const url = new URL(request.url);
    const upstream = await fetch(base + url.pathname + url.search, {
      method: request.method,
      headers: { accept: request.headers.get("accept") || "*/*" },
      redirect: "follow",
    });
    const headers = new Headers(upstream.headers);
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    headers.set("Cache-Control", "no-cache");
    headers.delete("content-security-policy");
    headers.delete("x-frame-options");
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
  },
};
