import { isProxied, cookieHeader } from "../netpatch.mjs";

export function createRequester({ fetch: send, getCookie, log = () => {} }) {
  let csrf = "";
  return async function request(url, init = {}) {
    const target = new URL(url);
    if (target.protocol !== "https:" || !isProxied(url)) {
      throw new Error("Blocked request to non-Roblox host: " + target.hostname);
    }
    const method = (init.method || "GET").toUpperCase();
    const call = async () => {
      const headers = { ...(init.headers || {}) };
      const cookie = cookieHeader(getCookie());
      if (cookie) headers.cookie = cookie;
      if (csrf && method !== "GET") headers["x-csrf-token"] = csrf;
      const res = await send(url, { method, headers, body: init.body, redirect: "follow", signal: init.signal });
      const fresh = res.headers.get("x-csrf-token");
      const changed = Boolean(fresh) && fresh !== csrf;
      if (fresh) csrf = fresh;
      log("[net]", method, target.hostname + target.pathname.slice(0, 60), res.status);
      return { res, changed };
    };
    let { res, changed } = await call();
    if (res.status === 403 && changed && method !== "GET") ({ res } = await call());
    return res;
  };
}
