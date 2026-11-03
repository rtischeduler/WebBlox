import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createVM, T } from "../src/vm/luau.mjs";
import { createLoader } from "../src/vm/require.mjs";
import { decodeBytecode } from "../src/join/coregui/decode.mjs";

const wasmBinary = readFileSync(new URL("../engine/luau/luau.wasm", import.meta.url));

test("Luau VM compiles and runs source", async () => {
  const { main: L } = await createVM({ wasmBinary });
  L.loadSource("local s = 0 for i = 1, 100 do s += i end return s, 'ok'");
  L.pcall(0, 2);
  assert.equal(L.toNumber(-2), 5050);
  assert.equal(L.toString(-1), "ok");
});

test("host functions are callable from Lua, errors cross pcall both ways", async () => {
  const { main: L } = await createVM({ wasmBinary });
  L.pushFunction((l) => { l.pushString("hi " + l.toString(1)); return 1; }, "greet"); L.setGlobal("greet");
  L.pushFunction(() => { throw new Error("boom"); }, "bad"); L.setGlobal("bad");
  L.loadSource("local ok, e = pcall(bad) return greet('lua'), ok, e"); L.pcall(0, 3);
  assert.equal(L.toString(-3), "hi lua"); assert.equal(L.toBoolean(-2), false); assert.equal(L.toString(-1), "boom");
  L.settop(0);
  L.loadSource("error('from lua')");
  assert.throws(() => L.pcall(0, 0), /from lua/);
});

test("coroutines can yield from host functions and resume", async () => {
  const { main: L } = await createVM({ wasmBinary });
  L.pushFunction((l) => { l.pushString("waiting"); throw l.yield(1); }, "wait"); L.setGlobal("wait");
  L.loadSource("local co = coroutine.create(function() local v = wait() return 'resumed:' .. tostring(v) end) local a, b = coroutine.resume(co) local c, d = coroutine.resume(co, 7) return b, d");
  L.pcall(0, 2);
  assert.equal(L.toString(-2), "waiting"); assert.equal(L.toString(-1), "resumed:7");
});

test("real CoreGui bytecode (decoded) loads in the VM", async () => {
  const { main: L } = await createVM({ wasmBinary });
  const raw = new Uint8Array(readFileSync(new URL("./fixtures/TopStatConnector.luauc", import.meta.url)));
  L.load(decodeBytecode(raw), "=TopStatConnector");
  assert.equal(L.type(-1), T.function);
  // version 0 = compiler error message payload; luau_load reports it instead of trapping
  assert.throws(() => L.load(Uint8Array.from([0, ...new TextEncoder().encode("syntax oops")]), "=bad"), /load failed.*syntax oops/);
});

const memTree = (files) => ({
  root: "R",
  children: (p) => Object.keys(files).filter((k) => k.startsWith(p + "/") && !k.slice(p.length + 1).includes("/")).map((k) => ({ name: k.slice(p.length + 1), class: files[k] === null ? "Folder" : "ModuleScript" }))
    .concat([...new Set(Object.keys(files).filter((k) => k.startsWith(p + "/") && k.slice(p.length + 1).includes("/")).map((k) => k.slice(p.length + 1).split("/")[0]))].filter((n) => !files[p + "/" + n] && files[p + "/" + n] !== null).map((name) => ({ name, class: "Folder" }))),
  classOf: (p) => (typeof files[p] === "string" ? "ModuleScript" : "Folder"),
  script: (p) => (typeof files[p] === "string" ? { kind: "source", data: files[p] } : null),
});

test("require maps script.Parent.X onto the tree, caches, detects cycles", async () => {
  const vm = await createVM({ wasmBinary });
  const files = {
    "R/Pkg/Util": "local n = 0 return { next = function() n += 1 return n end }",
    "R/Pkg/Main": "local U = require(script.Parent.Util) U.next() return { name = script.Name, parent = script.Parent.Name, n = U.next(), same = U == require(script.Parent:WaitForChild('Util')) }",
    "R/Pkg/A": "return require(script.Parent.B)", "R/Pkg/B": "return require(script.Parent.A)",
    "R/Pkg/Bad": "error('nope')",
  };
  const ld = createLoader(vm, memTree(files));
  ld.run("local m = require(__wb_node('R/Pkg/Main')) return m.name, m.parent, m.n, m.same", "=t", 4);
  const L = vm.main;
  assert.equal(L.toString(-4), "Main"); assert.equal(L.toString(-3), "Pkg"); assert.equal(L.toNumber(-2), 2); assert.equal(L.toBoolean(-1), true);
  L.settop(0);
  ld.run("local ok, e = pcall(require, __wb_node('R/Pkg/A')) return ok, tostring(e)", "=t", 2);
  assert.equal(L.toBoolean(-2), false); assert.match(L.toString(-1), /required recursively/); L.settop(0);
  ld.run("local ok, e = pcall(require, __wb_node('R/Pkg/Bad')) local ok2, e2 = pcall(require, __wb_node('R/Pkg/Bad')) return e == e2, e", "=t", 2);
  assert.equal(L.toBoolean(-2), true); assert.match(L.toString(-1), /nope/); L.settop(0);
  ld.run("local ok, e = pcall(function() return __wb_node('R/Pkg').Missing end) return tostring(e)", "=t", 1);
  assert.match(L.toString(-1), /Missing is not a valid member of Folder/);
});
