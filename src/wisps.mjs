// Wisp server discovery, modelled on lotsacookie/kstuff (Assets/js/wisp.js).
const REPO = "lotsacookie/kstuff";
const LIST_PATH = "Assets/json/wss.json";
// jsdelivr first, then backups.
export const MIRRORS = [
  `https://cdn.jsdelivr.net/gh/${REPO}@main/`,
  `https://fastly.jsdelivr.net/gh/${REPO}@main/`,
  `https://gcore.jsdelivr.net/gh/${REPO}@main/`,
  `https://raw.githubusercontent.com/${REPO}/main/`,
  `https://cdn.statically.io/gh/${REPO}/main/`,
];
// Built-ins copied from kstuff's wisp.js; bare hosts are wss://host/.
export const BUILTIN = [
  "cdn.northstreetumc.org", "cdn.vipersfutbol.com", "cdn.pcesc.org", "cdn.kcchallengevbc.com",
  "cdn.slcbmooc.org", "cdn.topstargym.net", "cdn.goaplytexas.org", "cdn.clearfieldswimming.com",
  "wss://athollcottage.com/connection/", "wss://api.personalloanonline.net/ws/",
  "wss://kristenblackburnvolleyballcamps.com/socket/", "wss://southpadreislandkiteboarding.com/socket/",
];
export const FALLBACK = "wss://api.personalloanonline.net/ws/";

export const toWss = (e) => {
  e = String(e || "").trim();
  if (!e) return null;
  const u = /^wss?:\/\//i.test(e) ? e : `wss://${e}/`;
  return u.endsWith("/") ? u : u + "/";
};

const b64ToText = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.trim()), (c) => c.charCodeAt(0)));

// wss.json is ["<base64 of a JSON array of wss:// urls>"]
export function parseWispList(json) {
  let b64 = Array.isArray(json) ? json.find((v) => typeof v === "string" && v.trim()) : json;
  if (typeof b64 !== "string") return [];
  let data;
  try { data = JSON.parse(b64ToText(b64)); } catch { return []; }
  const out = [];
  (function walk(v) {
    if (typeof v === "string" && /^wss:\/\//i.test(v.trim())) out.push(v.trim());
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(data);
  return [...new Set(out)];
}

async function getJson(url, ms = 5000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url + "?t=" + Date.now(), { cache: "no-store", signal: c.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export async function fetchWispList() {
  try { return parseWispList(await Promise.any(MIRRORS.map((m) => getJson(m + LIST_PATH)))); }
  catch { return []; }
}

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Pick a working wisp with Singuloxy's own benchmark, falling back to a known one.
export async function pickWisp(network, say = () => {}) {
  say("Finding a wisp server…");
  const remote = await fetchWispList();
  const builtin = BUILTIN.map(toWss);
  const extra = shuffle(remote.map(toWss).filter((u) => !builtin.includes(u))).slice(0, 12);
  const pool = [...new Set([...builtin, ...extra])].filter(Boolean);
  try {
    const { best } = await network.pick_best_wisp(pool, { limit: 16, verbose: false });
    if (best) return best;
  } catch (e) { console.warn("[webblox] wisp pick failed", e); }
  network.set_websocket(FALLBACK);
  return FALLBACK;
}
