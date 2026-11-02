// Roblox runtime for the Luau VM (step 2): game, Instance, Enum, datatypes, services, task scheduler, require.
// The runtime itself is Luau (runtime.lua); this file feeds it host functions and drives it.
//   const rt = await createRuntime(vm, tree, { flags, log, measure, async: { http(payload) -> Promise<string> } })
//   rt.mount(); rt.addPlayer(...); rt.step(1/60); rt.tryRequire(path)
import { decodeBytecode } from "../join/coregui/decode.mjs";
import { T } from "./luau.mjs";

async function readLua(name = "runtime.lua") {
  const url = new URL("./" + name, import.meta.url);
  if (typeof process !== "undefined" && process.versions?.node && url.protocol === "file:") {
    const { readFileSync } = await import("node:fs");
    return readFileSync(url, "utf8");
  }
  return (await fetch(url)).text();
}

// Default text measurement until the canvas layer (step 3) supplies a real one: 0.5em per character, 1.15em lines.
const estimateText = (text, size, _family, width) => {
  const cw = size * 0.5, lh = Math.ceil(size * 1.15);
  if (!width || width <= 0 || !isFinite(width)) return [Math.ceil(text.length * cw), lh];
  const per = Math.max(1, Math.floor(width / cw));
  return [Math.min(Math.ceil(text.length * cw), width), lh * Math.max(1, Math.ceil(text.length / per))];
};

export async function createRuntime(vm, tree, opts = {}) {
  const L = vm.main;
  const log = opts.log || (() => {});
  const measure = opts.measure || estimateText;
  const flags = opts.flags || {};
  const features = opts.features || {};
  const PREFIX = { flag: ["FFlag", "DFFlag", "SFFlag"], int: ["FInt", "DFInt", "SFInt"], string: ["FString", "DFString"], number: ["FInt", "DFInt", "FLog", "DFLog"] };
  const lookup = (name, kind) => { for (const p of PREFIX[kind] || []) if ((p + name) in flags) return flags[p + name]; return name in flags ? flags[name] : undefined; };
  const classCache = new Map();
  const classOf = (p) => { let c = classCache.get(p); if (c === undefined) { c = tree.classOf(p) || "Folder"; classCache.set(p, c); } return c; };
  const stats = { loaded: 0 };
  const push = (l, v) => {
    if (typeof v === "number") l.pushNumber(v);
    else if (typeof v === "string") l.pushString(v);
    else if (typeof v === "boolean") l.pushBoolean(v);
    else l.pushNil();
  };
  const read = (i) => {
    switch (L.type(i)) {
      case T.number: return L.toNumber(i);
      case T.string: return L.toString(i);
      case T.boolean: return L.toBoolean(i);
      default: return undefined;
    }
  };
  const base = L.top();
  const host = {
    children(l) {
      const kids = tree.children(l.toString(1));
      l.newTable(kids.length); kids.forEach((k, i) => { l.pushString(k.name); l.rawSetI(-2, i + 1); });
      l.newTable(kids.length); kids.forEach((k, i) => { l.pushString(k.class || "Folder"); l.rawSetI(-2, i + 1); });
      return 2;
    },
    load(l) {
      const path = l.toString(1), s = tree.script(path);
      if (!s) throw new Error("no script source at " + path);
      stats.loaded++;
      if (s.kind === "bytecode") l.load(decodeBytecode(s.data), "=" + path);
      else l.loadSource(typeof s.data === "string" ? s.data : new TextDecoder().decode(s.data), "=" + path);
      return 1;
    },
    classOf(l) { l.pushString(classOf(l.toString(1))); return 1; },
    log(l) { log(l.toString(1), l.toString(2)); return 0; },
    now(l) { l.pushNumber((opts.now ? opts.now() : Date.now()) / 1000); return 1; },
    measure(l) { const [w, h] = measure(l.toString(1) ?? "", l.toNumber(2), l.toString(3) ?? "", l.toNumber(4)); l.pushNumber(w); l.pushNumber(h); return 2; },
    flag(l) { push(l, lookup(l.toString(1), l.toString(2))); return 1; },
    feature(l) { l.pushBoolean(!!features[l.toString(1)]); return 1; },
    async(l) {
      const kind = l.toString(1), id = l.toNumber(2), payload = l.toString(3);
      const h = opts.async?.[kind];
      queueMicrotask(async () => {
        try { if (!h) throw new Error("no host handler for " + kind); complete(id, true, String(await h(payload))); }
        catch (e) { complete(id, false, e?.message || String(e)); }
      });
      return 0;
    },
  };
  L.loadSource(await readLua(), "=runtime.lua");
  L.newTable(0, Object.keys(host).length);
  for (const [name, fn] of Object.entries(host)) { L.pushFunction(fn, name); L.setField(-2, name); }
  L.pcall(1, 1); // -> RT
  L.setGlobal("__wb");
  L.settop(base);
  for (const name of ["gui.lua", "paint.lua"]) {
    L.loadSource(await readLua(name), "=" + name);
    L.getGlobal("__wb");
    L.pcall(1, 0);
    L.settop(base);
  }

  function call(name, args = [], nres = 0) {
    const b = L.top();
    L.getGlobal("__wb"); L.getField(-1, name);
    for (const a of args) push(L, a);
    L.pcall(args.length, nres);
    const out = []; for (let i = 0; i < nres; i++) out.push(read(b + 2 + i));
    L.settop(b); return out;
  }
  function complete(id, ok, res) { call("complete", [id, ok, res]); }

  return {
    stats,
    mount: (root = tree.root) => call("mount", [root]),
    step: (dt = 1 / 60) => { call("step", [dt]); call("guiStep"); },
    draw: () => call("guiDraw", [], 1)[0] || "[]",
    pointer: (kind, x, y, button = 1) => call("guiPointer", [kind, x, y, button], 1)[0],
    drawCount: () => call("guiCount", [], 1)[0] || 0,
    needsPaint: () => call("guiNeedsPaint", [], 1)[0],
    layout: (w, h, inset) => call("guiLayout", [w, h, inset], 1)[0],
    addPlayer: (userId, name, displayName = name, isLocal = false) => call("addPlayer", [userId, name, displayName, isLocal]),
    removePlayer: (userId) => call("removePlayer", [userId]),
    tryRequire: (path) => call("tryRequire", [path], 2),
    outcome: (path) => call("outcome", [path], 2),
    errors: (n = 8) => call("errorList", [n], 1)[0] || "",
    coreStatus: () => call("coreStatus", [], 1)[0] || "",
    errorCount: () => call("errorCount", [], 1)[0],
    lazyEnums: () => call("lazyEnumList", [], 1)[0],
    // Runs Lua source with the runtime globals; returns its first `nres` results as JS values (numbers/strings/booleans).
    run(src, nres = 1, name = "=run") {
      const b = L.top(); L.loadSource(src, name); L.pcall(0, nres);
      const out = []; for (let i = 0; i < nres; i++) out.push(read(b + 1 + i));
      L.settop(b); return out;
    },
  };
}
