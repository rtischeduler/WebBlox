import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createVM } from "../src/vm/luau.mjs";
import { createRuntime } from "../src/vm/runtime.mjs";

const wasmBinary = readFileSync(new URL("../engine/luau/luau.wasm", import.meta.url));
const files = {
  "R/DataModelInstances/CorePackages/Pkg/Util": "local n = 0 return { next = function() n += 1 return n end }",
  "R/DataModelInstances/CorePackages/Pkg/Main": "local U = require(script.Parent.Util) U.next() return { n = U.next(), svc = game:GetService('Players').ClassName, path = script:GetFullName() }",
  "R/DataModelInstances/CorePackages/Pkg/Slow": "task.wait(0.5) return 'late'",
  "R/DataModelInstances/CorePackages/Pkg/NeedsSlow": "return require(script.Parent.Slow) .. '!'",
  "R/DataModelInstances/CorePackages/Pkg/Bad": "return game:GetService('Nope')",
};
const dirs = new Set(["R", "R/DataModelInstances", "R/DataModelInstances/CorePackages", "R/DataModelInstances/CorePackages/Pkg"]);
const tree = {
  root: "R",
  children: (p) => [...dirs, ...Object.keys(files)].filter((k) => k.startsWith(p + "/") && !k.slice(p.length + 1).includes("/")).map((k) => ({ name: k.slice(p.length + 1), class: k in files ? "ModuleScript" : "Folder" })),
  classOf: (p) => (p in files ? "ModuleScript" : "Folder"),
  script: (p) => (p in files ? { kind: "source", data: files[p] } : null),
};
const make = async (o = {}) => createRuntime(await createVM({ wasmBinary }), tree, o);

test("datatypes, Enum and Instance basics", async () => {
  const rt = await make();
  const [a, b, c, d, e] = rt.run(`
    local f = Instance.new("Frame"); f.Size = UDim2.new(0.5, 10, 1, 0); f.Name = "F"
    local l = Instance.new("TextLabel", f); l.Text = "hello"
    local ok = pcall(function() f.Nope = 1 end)
    local added = 0; f.ChildAdded:Connect(function() added += 1 end); Instance.new("UICorner", f)
    return tostring(f.Size) .. "|" .. typeof(f.Size) .. "|" .. tostring(Color3.fromRGB(255, 0, 0)) .. "|" .. tostring(f.AutomaticSize) .. "|" .. f:GetFullName(),
      ok, added, #f:GetChildren(), l:IsA("GuiObject") and f:FindFirstChild("Frame") == nil
  `, 5);
  assert.equal(a, "{0.5, 10}, {1, 0}|UDim2|1, 0, 0|Enum.AutomaticSize.None|F");
  assert.equal(b, false); assert.equal(c, 1); assert.equal(d, 2);
});

test("task scheduler: wait, delay, signals, Changed", async () => {
  const rt = await make();
  rt.run(`
    R = {}
    task.spawn(function() local dt = task.wait(0.1); R[#R + 1] = "waited" end)
    task.delay(0.2, function() R[#R + 1] = "delayed" end)
    local f = Instance.new("Frame"); f:GetPropertyChangedSignal("Visible"):Connect(function() R[#R + 1] = "vis" end)
    f.Visible = false
    task.defer(function() R[#R + 1] = "deferred" end)
  `, 0);
  for (let i = 0; i < 20; i++) rt.step(0.016);
  const [out] = rt.run("return table.concat(R, ',')");
  assert.equal(out, "vis,deferred,waited,delayed");
});

test("services, players, flags, text measure, JSON", async () => {
  const rt = await make({ flags: { FFlagFoo: true, FIntBar: 7 }, measure: (t, s) => [t.length * s, s] });
  rt.mount(); rt.addPlayer(42, "Bob", "Bobby", true);
  const [n, uid, foo, bar, tb, json] = rt.run(`
    local P = game:GetService("Players")
    local l = Instance.new("TextLabel"); l.Text = "abcd"; l.TextSize = 10
    local J = game:GetService("HttpService")
    return P.LocalPlayer.DisplayName, P.LocalPlayer.UserId, game:DefineFastFlag("Foo", false), game:DefineFastInt("Bar", 1), l.TextBounds.X, J:JSONEncode(J:JSONDecode('{"a":[1,2]}'))
  `, 6);
  assert.deepEqual([n, uid, foo, bar, tb, json], ["Bobby", 42, true, 7, 40, '{"a":[1,2]}']);
});

test("require over the patch tree: cache, yielding modules, errors", async () => {
  const rt = await make();
  rt.mount();
  assert.deepEqual(rt.run(`local m = require(game.CorePackages.Pkg.Main) return m.n, m.svc, m.path`, 3), [2, "Players", "CorePackages.Pkg.Main"]);
  const P = "R/DataModelInstances/CorePackages/Pkg/";
  assert.equal(rt.tryRequire(P + "NeedsSlow")[0], "pending");
  for (let i = 0; i < 50; i++) rt.step(0.016);
  assert.deepEqual(rt.outcome(P + "NeedsSlow"), ["ok", "string"]);
  rt.tryRequire(P + "Bad");
  const [state, msg] = rt.outcome(P + "Bad");
  assert.equal(state, "err"); assert.match(msg, /not a valid Service name/);
});
