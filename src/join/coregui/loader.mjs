// Fetches the CoreGui the real web client would load, always the latest published one:
//   client-version (WebClientApp) -> engine base -> OTA patch configs -> assetdelivery -> signed rbxm -> parse.
// Every request goes through the supplied `request` (the wisp/libcurl proxy), so cookies and CSRF are handled there.
import { parseRbxm } from "./rbxm.mjs";
import { readStringTable, looksLikeUiText } from "./luau.mjs";

export const PATCHES = {
  DataModelPatch: "/content/configs/DataModelPatchConfig/DataModelPatchConfig.json",
  InExperience: "/content/configs/InExperiencePatchConfig/InExperiencePatchConfig.json",
  UniversalApp: "/content/configs/UniversalAppPatchConfig/UniversalAppPatchConfig.json",
};
export const VERSION_URL = "https://clientsettings.roblox.com/v2/client-version/WebClientApp";
export const engineBase = (upload) => `https://setup.rbxcdn.com/webclient/${upload}-RobloxWebClient`;
const MAGIC_HEAD = "<roblox!";

export async function resolveEngineBase(request, { fallback } = {}) {
  try {
    const res = await request(VERSION_URL, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error("client-version HTTP " + res.status);
    const j = await res.json();
    if (!j.clientVersionUpload) throw new Error("no clientVersionUpload");
    return { base: engineBase(j.clientVersionUpload), upload: j.clientVersionUpload, latest: true };
  } catch (e) {
    if (!fallback) throw e;
    return { base: fallback.replace(/\/$/, ""), upload: null, latest: false, error: String(e.message || e) };
  }
}

const bytes = async (res) => new Uint8Array(await res.arrayBuffer());
const looksLikeModel = (b) => new TextDecoder().decode(b.subarray(0, 64)).includes(MAGIC_HEAD);

// assetdelivery answers with a JSON pointer to a short-lived signed URL.
export async function downloadPatch(request, { assetId, assetVersion }) {
  const meta = await request(`https://assetdelivery.roblox.com/v2/assetId/${assetId}/version/${assetVersion}`, { headers: { accept: "application/json" } });
  if (!meta.ok) throw new Error(`assetdelivery ${assetId}@${assetVersion} HTTP ${meta.status}`);
  const j = await meta.json();
  const loc = j.locations?.[0]?.location;
  if (!loc) throw new Error(`assetdelivery ${assetId}@${assetVersion}: no location (${JSON.stringify(j.errors || j).slice(0, 120)})`);
  const file = await request(loc);
  if (!file.ok) throw new Error(`patch download HTTP ${file.status}`);
  const data = await bytes(file);
  if (!looksLikeModel(data)) throw new Error("patch download is not an rbxm (" + data.length + " bytes)");
  return data;
}

export async function loadCoreGui({ request, zstd, cache, fallbackBase, patches = ["InExperience"], onProgress = () => {} } = {}) {
  if (!request) throw new Error("loadCoreGui needs a request function");
  onProgress("Finding the latest client version…");
  const engine = await resolveEngineBase(request, { fallback: fallbackBase });
  const result = { engine, patches: {}, errors: {} };
  for (const name of patches) {
    try {
      onProgress(`Reading ${name} patch config…`);
      const res = await request(engine.base + PATCHES[name], { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error("config HTTP " + res.status);
      const cfg = await res.json();
      const key = `coregui:${cfg.AssetId}@${cfg.AssetVersion}`;
      let data = cache ? await cache.get(key) : null;
      const cached = Boolean(data);
      if (!data) {
        onProgress(`Downloading ${name} ${cfg.AssetId}@${cfg.AssetVersion}…`);
        data = await downloadPatch(request, { assetId: cfg.AssetId, assetVersion: cfg.AssetVersion });
        if (cache) await cache.set(key, data).catch(() => {});
      }
      onProgress(`Parsing ${name}…`);
      const parsed = parseRbxm(data, { zstd });
      result.patches[name] = { config: cfg, cached, bytes: data.length, ...indexPatch(parsed) };
    } catch (e) {
      result.errors[name] = String(e.message || e);
    }
  }
  return Object.assign(result, api(result));
}

// Turns parsed instances into lookups the renderer and the rest of the client can use.
export function indexPatch({ instances, warnings = [] }) {
  const byPath = new Map(), children = new Map(), modules = [], localization = [];
  for (const i of instances) {
    byPath.set(i.path, i);
    const dir = i.path.includes("/") ? i.path.slice(0, i.path.lastIndexOf("/")) : "";
    (children.get(dir) || children.set(dir, []).get(dir)).push(i);
    if (i.class === "ModuleScript" && i.source) modules.push(i);
    if (i.class === "LocalizationTable" && i.contents) {
      try { localization.push(...JSON.parse(i.contents)); } catch { warnings.push("LocalizationTable JSON unreadable at " + i.path); }
    }
  }
  return { instances, byPath, children, modules, localization, warnings };
}

function api(result) {
  const first = () => Object.values(result.patches)[0];
  return {
    get: (path, patch) => (patch ? result.patches[patch] : first())?.byPath.get(path) || null,
    list: (path, patch) => ((patch ? result.patches[patch] : first())?.children.get(path) || []).map((i) => i.name),
    // Modules whose path matches, with the readable strings found in their bytecode.
    modulesMatching(re, patch) {
      const p = patch ? result.patches[patch] : first();
      return (p?.modules || []).filter((m) => re.test(m.path)).map((m) => ({ path: m.path, table: readStringTable(m.source) }));
    },
    uiText(re, patch, limit = 40) {
      const out = new Set();
      for (const m of this.modulesMatching(re, patch)) for (const s of m.table?.strings || []) if (looksLikeUiText(s)) { out.add(s); if (out.size >= limit) return [...out]; }
      return [...out];
    },
    summary() {
      return Object.entries(result.patches).map(([name, p]) => ({
        name, asset: `${p.config.AssetId}@${p.config.AssetVersion}`, instances: p.instances.length, modules: p.modules.length,
        localizationEntries: p.localization.length, cached: p.cached, warnings: p.warnings.length,
      }));
    },
  };
}

// IndexedDB byte cache so a 14 MB patch is only downloaded when a new version is published.
export function idbCache(name = "webblox-coregui") {
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open(name, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("p");
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction("p", mode); const q = fn(t.objectStore("p")); t.oncomplete = () => res(q?.result); t.onerror = () => rej(t.error); }); };
  return {
    get: async (k) => { try { return (await tx("readonly", (s) => s.get(k))) || null; } catch { return null; } },
    set: async (k, v) => {
      await tx("readwrite", (s) => { s.clear(); s.put(v, k); }); // keep only the newest patch
    },
  };
}
