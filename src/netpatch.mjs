export const HOSTS = /(^|\.)(roblox\.com|rbxcdn\.com|robloxlabs\.com)$/i;
export const isProxied = (u, base = "https://x.invalid/") => { try { return HOSTS.test(new URL(u, base).hostname); } catch { return false; } };
export const cookieHeader = (c) => {
  c = String(c || "").trim().replace(/^"|"$/g, "");
  if (!c) return "";
  return /^\.?ROBLOSECURITY=/i.test(c) ? (c[0] === "." ? c : "." + c) : ".ROBLOSECURITY=" + c;
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
