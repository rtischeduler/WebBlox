export const ENDPOINTS = {
  join: "https://gamejoin.roblox.com/v1/join-game",
  instance: "https://gamejoin.roblox.com/v1/join-game-instance",
};
export const PENDING = new Set([0, 1]);
export const JOINED = 2;

export class JoinError extends Error {
  constructor(message, { status = null, data = null } = {}) {
    super(message);
    this.name = "JoinError";
    this.status = status;
    this.data = data;
  }
}

export const randomTrackerId = (random = Math.random) => {
  let n = "";
  for (let i = 0; i < 12; i++) n += Math.floor(random() * 10);
  return Number(n.replace(/^0+/, "") || "1");
};

export const buildJoinBody = ({ placeId, jobId, browserTrackerId, forcedPop, tracker = randomTrackerId }) => {
  const body = { placeId: Number(placeId) };
  if (jobId) {
    body.gameId = jobId;
    body.isPlayTogetherGame = false;
  }
  body.browserTrackerId = Number(browserTrackerId) || tracker();
  if (forcedPop) body.forcedPop = forcedPop;
  return body;
};

export const parseJoinScript = (value) => {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return null;
  const start = value.indexOf("{");
  if (start < 0) return null;
  try {
    return JSON.parse(value.slice(start));
  } catch {
    return null;
  }
};

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJoinScript(request, url, signal) {
  const res = await request(url, { method: "GET", signal });
  if (!res.ok) return null;
  return parseJoinScript(await res.text());
}

export async function joinGame({
  request,
  placeId,
  jobId = "",
  browserTrackerId = "",
  forcedPop = "",
  signal,
  onStatus = () => {},
  sleep = defaultSleep,
  maxPolls = 60,
  pollMs = 1500,
  uuid = () => crypto.randomUUID(),
}) {
  if (!Number.isFinite(Number(placeId)) || Number(placeId) <= 0) throw new JoinError("Invalid place id");
  const url = jobId ? ENDPOINTS.instance : ENDPOINTS.join;
  const body = JSON.stringify(buildJoinBody({ placeId, jobId, browserTrackerId, forcedPop }));
  const headers = {
    "content-type": "application/json",
    accept: "application/json",
    origin: "https://www.roblox.com",
    referer: `https://www.roblox.com/games/${placeId}/`,
  };
  for (let poll = 0; poll < maxPolls; poll++) {
    if (signal?.aborted) throw new JoinError("Cancelled");
    const res = await request(url, { method: "POST", headers, body, signal });
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {}
    if (!data || typeof data !== "object") {
      throw new JoinError(`Join request failed: HTTP ${res.status}`, { data: text.slice(0, 200) });
    }
    const status = data.status;
    const message = data.message || data.statusMessage || data.errors?.[0]?.message || "";
    onStatus({ poll, status, message, queuePosition: data.queuePosition ?? null, httpStatus: res.status, raw: redact(data) });
    if (PENDING.has(status)) {
      await sleep(pollMs);
      continue;
    }
    if (status === JOINED) {
      let script = parseJoinScript(data.joinScript);
      if (!script && data.joinScriptUrl) script = await fetchJoinScript(request, data.joinScriptUrl, signal);
      if (!script) throw new JoinError("Join succeeded but no join script was returned", { status, data });
      return { jobId: data.jobId || script.GameId || "", status, message, script, raw: data };
    }
    const code = data.errors?.[0]?.code ?? data.code ?? null;
    const detail = `status ${status ?? "none"}, HTTP ${res.status}${code != null ? ", code " + code : ""}`;
    throw new JoinError(message ? `${message} (${detail})` : `Join failed (${detail})`, { status, data });
  }
  throw new JoinError("Timed out waiting for a server");
}

export const PROBE_VARIANTS = [
  { name: "baseline", url: ENDPOINTS.join, headers: (place) => ({ "content-type": "application/json", accept: "application/json", origin: "https://www.roblox.com", referer: `https://www.roblox.com/games/${place}/` }) },
  { name: "v2 endpoint", url: "https://gamejoin.roblox.com/v2/join-game", headers: (place) => ({ "content-type": "application/json", accept: "application/json", origin: "https://www.roblox.com", referer: `https://www.roblox.com/games/${place}/` }) },
  { name: "content-type only", url: ENDPOINTS.join, headers: () => ({ "content-type": "application/json" }) },
  { name: "referer root", url: ENDPOINTS.join, headers: () => ({ "content-type": "application/json", accept: "application/json", origin: "https://www.roblox.com", referer: "https://www.roblox.com/" }) },
  { name: "desktop user-agent", url: ENDPOINTS.join, headers: (place) => ({ "content-type": "application/json", accept: "application/json", "user-agent": "Roblox/WinInet", referer: `https://www.roblox.com/games/${place}/` }) },
];

export async function probeJoin({ request, placeId, browserTrackerId, signal, log = () => {} }) {
  const out = [];
  try {
    const res = await request("https://users.roblox.com/v1/users/authenticated", { method: "GET", signal });
    const j = res.ok ? JSON.parse(await res.text()) : null;
    out.push({ name: "auth check", http: res.status, authenticated: Boolean(j && j.id), userId: j?.id ?? null });
  } catch (e) {
    out.push({ name: "auth check", error: String(e.message || e) });
  }
  const body = JSON.stringify(buildJoinBody({ placeId, browserTrackerId }));
  for (const v of PROBE_VARIANTS) {
    let row;
    try {
      const res = await request(v.url, { method: "POST", headers: v.headers(placeId), body, signal });
      let data = null;
      try { data = JSON.parse(await res.text()); } catch {}
      row = { name: v.name, http: res.status, status: data?.status ?? null, message: data?.message ?? "", hasJoinScript: Boolean(data?.joinScript || data?.joinScriptUrl) };
    } catch (e) {
      row = { name: v.name, error: String(e.message || e) };
    }
    out.push(row);
    log("[probe]", JSON.stringify(row));
  }
  return out;
}

const ci = (obj, ...names) => {
  if (!obj || typeof obj !== "object") return undefined;
  const wanted = names.map((n) => n.toLowerCase());
  const key = Object.keys(obj).find((k) => wanted.includes(k.toLowerCase()));
  return key === undefined ? undefined : obj[key];
};

const toEndpoint = (entry) => {
  if (typeof entry === "string") {
    const m = entry.match(/^\[?([^\]]+?)\]?:(\d{1,5})$/);
    return m ? { host: m[1], port: Number(m[2]) } : null;
  }
  const host = ci(entry, "address", "ip", "host", "udmuxip");
  const port = Number(ci(entry, "port", "udmuxport"));
  return host && port ? { host: String(host), port } : null;
};

export const normalizeHash = (value) => {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (/^[0-9a-f]{64}$/i.test(t)) return btoa(String.fromCharCode(...t.match(/../g).map((h) => parseInt(h, 16))));
  if (/^[A-Za-z0-9+/]{43}=$/.test(t)) return t;
  return null;
};

const collectHashes = (obj, out = [], depth = 0) => {
  if (!obj || typeof obj !== "object" || depth > 4) return out;
  for (const [key, value] of Object.entries(obj)) {
    if (/hash/i.test(key)) {
      for (const item of Array.isArray(value) ? value : [value]) {
        const raw = typeof item === "string" ? item : ci(item, "value", "sha256", "hash");
        const hash = normalizeHash(raw);
        if (hash && !out.includes(hash)) out.push(hash);
      }
    } else if (value && typeof value === "object") {
      collectHashes(value, out, depth + 1);
    }
  }
  return out;
};

export function describeJoin(script) {
  const s = script && typeof script === "object" ? script : {};
  const list = ci(s, "udmuxendpoints");
  let udmux = Array.isArray(list) ? list.map(toEndpoint).filter(Boolean) : [];
  if (!udmux.length) {
    const single = toEndpoint({ address: ci(s, "udmuxip"), port: ci(s, "udmuxport") });
    if (single) udmux = [single];
  }
  const machine = ci(s, "machineaddress");
  const config = ci(s, "rbxtransportconfig", "transportconfig");
  return {
    user: {
      id: ci(s, "userid") ?? null,
      name: ci(s, "username") ?? null,
      displayName: ci(s, "displayname") ?? null,
    },
    placeId: ci(s, "placeid") ?? null,
    jobId: ci(s, "gameid", "jobid") ?? null,
    machine: machine ? { host: String(machine), port: Number(ci(s, "serverport")) || null } : null,
    udmux,
    certHashes: collectHashes(config ?? s),
    configKeys: config && typeof config === "object" ? Object.keys(config) : [],
    topKeys: Object.keys(s),
  };
}

const SECRET = /ticket|token|secret|cookie|auth|signature|private|session|clientip/i;

export const redact = (value, depth = 0) => {
  if (Array.isArray(value)) return depth > 6 ? "[..]" : value.map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    if (depth > 6) return "{..}";
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        SECRET.test(k) && v != null && typeof v !== "object" ? `<redacted ${String(v).length}>` : redact(v, depth + 1),
      ]),
    );
  }
  return value;
};
