import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createVM } from "../src/vm/luau.mjs";
import { createRuntime } from "../src/vm/runtime.mjs";

const wasmBinary = readFileSync(new URL("../engine/luau/luau.wasm", import.meta.url));
const kids = {
  PatchRoot: [["DataModelInstances", "Folder"], ["CoreScripts", "Folder"]],
  "PatchRoot/DataModelInstances": [["CoreGui", "Folder"]],
  "PatchRoot/CoreScripts": [["StarterScript", "ModuleScript"], ["CoreScripts", "Folder"]],
  "PatchRoot/CoreScripts/CoreScripts": [["Hello", "ModuleScript"]],
};
const src = {
  "PatchRoot/CoreScripts/StarterScript": `game:GetService("ScriptContext"):AddCoreScriptLocal("CoreScripts/Hello", script.Parent)`,
  "PatchRoot/CoreScripts/CoreScripts/Hello": `local sg = Instance.new("ScreenGui"); sg.Parent = game:GetService("CoreGui"); local f = Instance.new("Frame", sg); f.Size = UDim2.new(0, 50, 0, 50); f.BackgroundColor3 = Color3.new(1, 0, 0)`,
};
const tree = {
  root: "PatchRoot",
  children: (p) => (kids[p] || []).map(([name, cls]) => ({ name, class: cls })),
  classOf: (p) => (src[p] ? "ModuleScript" : "Folder"),
  script: (p) => (src[p] ? { kind: "source", data: src[p] } : null),
};

test("StarterScript runs, AddCoreScriptLocal starts a CoreScript that draws", async () => {
  const rt = await createRuntime(await createVM({ wasmBinary }), tree, {});
  rt.mount();
  const [state] = rt.tryRequire("PatchRoot/CoreScripts/StarterScript");
  assert.notEqual(state, "err");
  rt.step(1 / 60);
  rt.layout(400, 300, 0);
  assert.ok(rt.drawCount() >= 1);
  const l = JSON.parse(rt.draw());
  const r = l.find((c) => c.k === "rect");
  assert.ok(r); assert.equal(r.c, "#ff0000");
  assert.match(rt.coreStatus(), /2 ok/);
});
