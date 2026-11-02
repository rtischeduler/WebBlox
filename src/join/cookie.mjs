const NAMES = [".ROBLOSECURITY", "ROBLOSECURITY"];

export const cookieNames = () => {
  const custom = globalThis.WEBBLOX_COOKIE_NAME;
  return custom ? [String(custom), ...NAMES] : NAMES;
};

export const parseCookies = (source) => {
  const jar = new Map();
  for (const part of String(source || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const name = part.slice(0, i).trim();
    if (name && !jar.has(name)) jar.set(name, part.slice(i + 1).trim());
  }
  return jar;
};

const decode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const readHostCookie = (source = globalThis.document?.cookie ?? "", names = cookieNames()) => {
  const wanted = names.map((n) => n.toLowerCase());
  for (const [name, value] of parseCookies(source)) {
    if (value && wanted.includes(name.toLowerCase())) return decode(value);
  }
  return "";
};

export const readBrowserTrackerId = (source = globalThis.document?.cookie ?? "") => {
  const raw = parseCookies(source).get("RBXEventTrackerV2");
  if (!raw) return 0;
  const m = decode(raw).match(/(?:^|&)browserid=(\d{1,20})/i);
  return m ? Number(m[1]) : 0;
};

// The real site sets RBXEventTrackerV2=CreateDate=..&rbxid=..&browserid=<digits>; the engine reads browserid from
// document.cookie and sends it as browserTrackerId when joining. Without it the engine joins with an empty id.
export const buildTrackerCookie = ({ browserId, userId = "", now = new Date() }) => {
  const d = now;
  const h = d.getHours() % 12 || 12;
  const pad = (n) => String(n).padStart(2, "0");
  const create = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${h}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getHours() < 12 ? "AM" : "PM"}`;
  return `RBXEventTrackerV2=CreateDate=${create}&rbxid=${userId}&browserid=${browserId}`;
};

export const ensureBrowserTrackerId = ({ doc, store, random = Math.random, userId = "" }) => {
  const have = readBrowserTrackerId(doc.cookie);
  if (have) return have;
  let id = Number(store?.getItem?.("wb.tracker")) || 0;
  if (!id) {
    let n = "";
    for (let i = 0; i < 12; i++) n += Math.floor(random() * 10);
    id = Number(n.replace(/^0+/, "") || "1");
    try { store?.setItem?.("wb.tracker", String(id)); } catch {}
  }
  doc.cookie = `${buildTrackerCookie({ browserId: id, userId })}; path=/; max-age=31536000; samesite=lax`;
  return id;
};
