export const THUMB_URL = "https://thumbnails.roblox.com/v1/batch";

export const serversUrl = (placeId, cursor = "") =>
  `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Desc&excludeFullGames=false&limit=100` +
  (cursor ? "&cursor=" + encodeURIComponent(cursor) : "");

export const parseServers = (json) => ({
  servers: (Array.isArray(json?.data) ? json.data : []).map((s) => ({
    id: String(s.id || ""),
    playing: Number(s.playing) || 0,
    maxPlayers: Number(s.maxPlayers) || 0,
    ping: s.ping ?? null,
    fps: s.fps ?? null,
    playerTokens: Array.isArray(s.playerTokens) ? s.playerTokens.map(String) : [],
  })),
  next: json?.nextPageCursor || null,
});

export async function findServer({ request, placeId, jobId, maxPages = 5, signal, onPage = () => {} }) {
  let cursor = "";
  let scanned = 0;
  for (let page = 0; page < maxPages; page++) {
    const res = await request(serversUrl(placeId, cursor), {
      method: "GET",
      headers: { accept: "application/json" },
      signal,
    });
    if (res.status === 429) return { server: null, scanned, rateLimited: true };
    if (!res.ok) return { server: null, scanned, error: "HTTP " + res.status };
    let json;
    try {
      json = await res.json();
    } catch {
      return { server: null, scanned, error: "unreadable server list" };
    }
    const { servers, next } = parseServers(json);
    scanned += servers.length;
    onPage({ page, scanned });
    const hit = servers.find((s) => s.id === jobId);
    if (hit) return { server: hit, scanned };
    if (!next) break;
    cursor = next;
  }
  return { server: null, scanned };
}

export const thumbBatchBody = (tokens, size = "150x150") =>
  tokens.map((token, i) => ({
    requestId: `${i}:${token}:AvatarHeadshot:${size}:png:regular`,
    type: "AvatarHeadShot",
    targetId: 0,
    token,
    format: "png",
    size,
    isCircular: false,
  }));

export async function loadAvatars({ request, tokens, signal }) {
  const out = [];
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    const body = thumbBatchBody(batch);
    const byId = new Map(body.map((b, j) => [b.requestId, batch[j]]));
    const res = await request(THUMB_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) break;
    let json;
    try {
      json = await res.json();
    } catch {
      break;
    }
    for (const item of Array.isArray(json?.data) ? json.data : []) {
      out.push({
        token: byId.get(item.requestId) ?? null,
        imageUrl: item.state === "Completed" ? item.imageUrl || "" : "",
      });
    }
  }
  return out;
}
