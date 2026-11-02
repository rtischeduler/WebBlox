// Runs the real StarterScript against an extracted patch: node tools/run-corescripts.mjs <extracted dir> [steps=200]
// Prints coreStatus, draw count and the first runtime errors (the worklist for "CoreGui never draws").
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createVM } from "../src/vm/luau.mjs";
import { createRuntime } from "../src/vm/runtime.mjs";
const [dir, steps = "200"] = process.argv.slice(2);
const wasmBinary = readFileSync(new URL("../engine/luau/luau.wasm", import.meta.url));
const cache = new Map();
const kids = (p) => { let k = cache.get(p); if (k) return k; k = []; try { for (const n of readdirSync(join(dir, p))) { const d = statSync(join(dir, p, n)).isDirectory(); const m = n.match(/^(.*)\.luauc?$/); k.push({ name: m ? m[1] : n, class: d ? "Folder" : "ModuleScript", file: d ? null : n }); } } catch {} const by = new Map(); for (const x of k) { const o = by.get(x.name); if (!o || x.file) by.set(x.name, x); } k = [...by.values()]; cache.set(p, k); return k; };
const split = (p) => [p.slice(0, p.lastIndexOf("/")), p.slice(p.lastIndexOf("/") + 1)];
const tree = { root: "PatchRoot", children: kids,
  classOf: (p) => { const [a, b] = split(p); return kids(a).find((k) => k.name === b)?.class || "Folder"; },
  script: (p) => { const [a, b] = split(p); const k = kids(a).find((x) => x.name === b); return k?.file ? { kind: "bytecode", data: new Uint8Array(readFileSync(join(dir, a, k.file))) } : null; } };
const logs = [];
const rt = await createRuntime(await createVM({ wasmBinary }), tree, { log: (lv, m) => { if (logs.length < 12) logs.push(lv + ": " + String(m).slice(0, 250)); } });
rt.mount("PatchRoot"); rt.addPlayer(1, "Player", "Player", true);
rt.run?.("__wb.debugTraces = true", 0);
console.log("StarterScript:", rt.tryRequire("PatchRoot/CoreScripts/StarterScript"));
for (let i = 0; i < Number(steps); i++) { rt.step(1 / 30); if (i === 5) rt.layout(1280, 720, 0); }
console.log("status:", rt.coreStatus(), "| draws:", rt.drawCount());
console.log("errors:\n" + rt.errors(6)); console.log("logs:\n" + logs.join("\n"));
