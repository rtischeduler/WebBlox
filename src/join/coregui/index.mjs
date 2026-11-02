// Glue: load the latest real CoreGui through the proxy and paint what was found onto the game canvas.
import { loadCoreGui, idbCache } from "./loader.mjs";
import { paintCoreGui } from "./canvas.mjs";

const ZSTD = ["https://cdn.jsdelivr.net/npm/fzstd@0.1.1/+esm", "https://fastly.jsdelivr.net/npm/fzstd@0.1.1/+esm"];

async function loadZstd() {
  let last;
  for (const u of ZSTD) {
    try { const m = await import(u); return (raw) => m.decompress(raw); } catch (e) { last = e; }
  }
  throw last;
}

let running = null;

export function startCoreGui({ proxy, canvas, log = () => {}, fallbackBase = "engine/engine-base.txt" }) {
  if (running) return running;
  const state = { progress: "Starting…" };
  const repaint = (cg) => { try { paintCoreGui(canvas, cg, state); } catch (e) { log("[coregui] paint", e); } };
  repaint(null);
  addEventListener("resize", () => repaint(running?.value || null));
  running = (async () => {
    const [zstd, base] = await Promise.all([
      loadZstd(),
      fetch(fallbackBase).then((r) => (r.ok ? r.text() : "")).then((t) => t.trim()).catch(() => ""),
    ]);
    let cache = null;
    try { cache = idbCache(); } catch {}
    const cg = await loadCoreGui({
      request: proxy.request, zstd, cache, fallbackBase: base || undefined,
      patches: ["InExperience", "UniversalApp"],
      onProgress: (m) => { state.progress = m; log("[coregui]", m); repaint(null); },
    });
    running.value = cg;
    for (const s of cg.summary()) log("[coregui]", JSON.stringify(s));
    for (const [n, e] of Object.entries(cg.errors)) log("[coregui] failed", n, e);
    repaint(cg);
    globalThis.webblox = Object.assign(globalThis.webblox || {}, { coregui: cg });
    import("../../vm/boot.mjs").then((m) => m.bootVM(cg, { log })).then((v) => { globalThis.webblox.vm = v; })
      .catch((e) => log("[vm] failed", e));
    return cg;
  })().catch((e) => { state.error = String(e.message || e); log("[coregui] failed", e); repaint(null); running = null; });
  return running;
}
