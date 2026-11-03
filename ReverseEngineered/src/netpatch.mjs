export const HOSTS = /(^|\.)(roblox\.com|rbxcdn\.com|robloxlabs\.com)$/i;
export const isProxied = (u, base = "https://x.invalid/") => { try { return HOSTS.test(new URL(u, base).hostname); } catch { return false; } };
export const cleanCookie = (c) => {
  let v = String(c || "").trim().replace(/^cookie:\s*/i, "").replace(/^["']|["']$/g, "");
  const named = v.match(/(?:^|;\s*)\.?ROBLOSECURITY=([^;]*)/i);
  v = named ? named[1] : v.split(";")[0];
  v = v.trim().replace(/^["']|["']$/g, "").replace(/\s+/g, "");
  if (/%[0-9a-f]{2}/i.test(v)) {
    try { v = decodeURIComponent(v); } catch {}
  }
  return v;
};
export const cookieHeader = (c) => {
  const v = cleanCookie(c);
  return v ? ".ROBLOSECURITY=" + v : "";
};
export const engineName = (u, base) => (u.startsWith(base) ? u.slice(base.length).split(/[?#]/)[0] : null);
export const hex = (d, n = 16) => {
  const v = d instanceof ArrayBuffer ? new Uint8Array(d) : ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : null;
  return v ? [...v.subarray(0, n)].map((b) => b.toString(16).padStart(2, "0")).join(" ") + " (" + v.byteLength + "b)" : "blob";
};
export const shape = (o, depth = 0) => {
  if (typeof o === "string") return "str(" + o.length + ")";
  if (Array.isArray(o)) return depth > 3 ? "[..]" : o.slice(0, 3).map((x) => shape(x, depth + 1));
  if (o && typeof o === "object") return depth > 3 ? "{..}" : Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v, depth + 1)]));
  return o;
};
export const isJoinUrl = (u) => { try { return /(^|\.)gamejoin\.roblox\.com$/i.test(new URL(u).hostname); } catch { return false; } };
const SECRETISH = /cookie|csrf|auth|token|ticket|signature|session/i;
export const describeRequest = (method, url, headers = {}, body) => {
  const h = {};
  for (const [k, v] of Object.entries(headers || {})) h[k] = SECRETISH.test(k) ? "<redacted " + String(v).length + ">" : String(v);
  let text = null;
  if (typeof body === "string") text = body;
  else if (body instanceof ArrayBuffer) text = new TextDecoder().decode(body);
  else if (ArrayBuffer.isView(body)) text = new TextDecoder().decode(body);
  else if (body != null) text = "[" + Object.prototype.toString.call(body) + "]";
  return { method: String(method || "GET").toUpperCase(), url: String(url), headers: h, body: text };
};
