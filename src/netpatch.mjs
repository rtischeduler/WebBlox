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
