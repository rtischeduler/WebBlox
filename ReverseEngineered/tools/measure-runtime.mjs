// Measures the step-2 runtime against an extracted patch: node tools/measure-runtime.mjs <extracted dir> [every=25] [prefix=DataModelInstances/CorePackages]
// Reports how many modules require() cleanly with the Roblox runtime present, and the most common failures (the next worklist).
// Env: RAW=<substring> prints sample full errors containing it; SINGLE=<patch path> requires one module and prints its traceback.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createVM } from "../src/vm/luau.mjs";
import { createRuntime } from "../src/vm/runtime.mjs";
const [dir, every = "25", prefix = "DataModelInstances/CorePackages"] = process.argv.slice(2);
const wasmBinary = readFileSync(new URL("../engine/luau/luau.wasm", import.meta.url));
const kidsCache = new Map();
const kids = (p) => {
  let k = kidsCache.get(p);
  if (!k) {
    const fs = join(dir, p); k = [];
    try { for (const n of readdirSync(fs)) { const isDir = statSync(join(fs, n)).isDirectory(); const m = n.match(/^(.*)\.luauc?$/); k.push({ name: m ? m[1] : n, class: isDir ? "Folder" : "ModuleScript", file: isDir ? null : n }); } } catch {}
    const by = new Map(); for (const x of k) { const o = by.get(x.name); if (!o) by.set(x.name, x); else if (x.file) by.set(x.name, { ...x }); } k = [...by.values()];
    kidsCache.set(p, k);
  }
  return k;
};
const split = (p) => [p.slice(0, p.lastIndexOf("/")), p.slice(p.lastIndexOf("/") + 1)];
const tree = {
  root: "PatchRoot",
  children: (p) => kids(p),
  classOf: (p) => { const [parent, name] = split(p); return kids(parent).find((k) => k.name === name)?.class || "Folder"; },
  script: (p) => { const [parent, name] = split(p); const k = kids(parent).find((x) => x.name === name); return k?.file ? { kind: "bytecode", data: new Uint8Array(readFileSync(join(dir, parent, k.file))) } : null; },
};
const clean = (v, n) => String(v).replace(/(Requested module experienced an error while loading: )+/g, "").replace(/\S*:\d+: /g, "").slice(0, n);
const msgs = [];
const rt = await createRuntime(await createVM({ wasmBinary }), tree, { log: (lv, m) => { if (lv === "error" && msgs.length < 5) msgs.push(m.slice(0, 200)); } });
rt.mount("PatchRoot");
if (process.env.SINGLE) {
  rt.run("__wb.debugTraces = true", 0);
  rt.tryRequire(process.env.SINGLE); for (let i = 0; i < 5; i++) rt.step(0.05);
  console.log(rt.outcome(process.env.SINGLE).join(" | ").replace(/(Requested module experienced an error while loading: )+/g, "").slice(0, 2500));
  console.log(msgs.join("\n---\n").slice(0, 1500)); process.exit(0);
}
const all = []; const walk = (p) => { for (const k of kids(p)) { const q = p + "/" + k.name; if (k.class === "ModuleScript") all.push(q); walk(q); } };
walk("PatchRoot/" + prefix);
const picked = all.filter((_, i) => i % Number(every) === 0);
const raw = []; const t0 = Date.now(); let ok = 0; const fails = new Map();
const bump = (key) => fails.set(key, (fails.get(key) || 0) + 1);
for (const p of picked) {
  try { rt.tryRequire(p); } catch (e) { bump("host: " + e.message.slice(0, 80)); continue; }
  for (let i = 0; i < 3; i++) rt.step(0.05);
}
for (const p of picked) {
  const [st, v] = rt.outcome(p);
  if (st === "ok") ok++;
  else {
    if (process.env.RAW && String(v).includes(process.env.RAW) && raw.length < 6) raw.push(p.slice(-70) + "  =>  " + clean(v, 300));
    bump(st === "pending" ? "pending (yielded)" : clean(v, 110));
  }
}
console.log(`required ${ok} of ${picked.length} (every ${every}th of ${all.length}) in ${Date.now() - t0} ms`);
console.log("lazy enums auto-created:", rt.lazyEnums().split(",").filter(Boolean).slice(0, 30).join(" "));
for (const [k, n] of [...fails].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(String(n).padStart(5), k);
if (raw.length) console.log("\nRAW samples:\n" + raw.join("\n"));
