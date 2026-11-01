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
