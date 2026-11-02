import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createVM } from "../src/vm/luau.mjs";
import { createRuntime } from "../src/vm/runtime.mjs";
import { paintList } from "../src/vm/canvasgui.mjs";

const wasmBinary = readFileSync(new URL("../engine/luau/luau.wasm", import.meta.url));
const tree = { root: "R", children: () => [], classOf: () => "Folder", script: () => null };
const make = async () => { const rt = await createRuntime(await createVM({ wasmBinary }), tree, {}); rt.mount(); return rt; };

test("draw list: order, colour, text, clip; hit-test and click", async () => {
  const rt = await make();
  rt.run(`
    local sg = Instance.new("ScreenGui", game:GetService("CoreGui")); sg.IgnoreGuiInset = true
    local a = Instance.new("Frame", sg); a.Size = UDim2.new(0, 100, 0, 100); a.BackgroundColor3 = Color3.fromRGB(255, 0, 0); a.BorderSizePixel = 0; a.ClipsDescendants = true
    local b = Instance.new("TextButton", a); b.Size = UDim2.new(0, 50, 0, 20); b.Position = UDim2.new(0, 10, 0, 10); b.Text = "Hi"; b.ZIndex = 2; b.Name = "Btn"
    Instance.new("UICorner", a).CornerRadius = UDim.new(0, 8)
    clicks = 0
    b.MouseButton1Click:Connect(function() clicks += 1 end)
  `, 0);
  rt.layout(400, 300, 0);
  const l = JSON.parse(rt.draw());
  assert.deepEqual(l.map((c) => c.k), ["clip", "rect", "rect", "text", "stroke", "unclip"]);
  assert.equal(l[1].c, "#ff0000"); assert.equal(l[1].r, 8); assert.equal(l[3].text, "Hi");
  assert.equal(rt.pointer("move", 20, 20), "Btn");
  assert.equal(rt.pointer("down", 20, 20, 1), "Btn");
  rt.pointer("up", 20, 20, 1);
  assert.equal(rt.run("return clicks")[0], 1);
  assert.equal(rt.pointer("move", 300, 250), "");
});

test("painter handles the list on a stub context", () => {
  const calls = [];
  const ctx = new Proxy({ measureText: (t) => ({ width: t.length * 5 }) }, { get: (o, k) => (k in o ? o[k] : (...a) => calls.push(k)), set: (o, k, v) => { o[k] = v; return true; } });
  paintList(ctx, [{ k: "clip", x: 0, y: 0, w: 9, h: 9 }, { k: "rect", x: 0, y: 0, w: 9, h: 9, c: "#fff", a: 1, r: 0 }, { k: "text", x: 0, y: 0, w: 9, h: 9, text: "a", c: "#000", a: 1, size: 12, ax: "Center", ay: "Center", wrap: false, weight: 400, sc: 1, scc: "#000" }, { k: "unclip" }]);
  assert.ok(calls.includes("fillText") && calls.includes("clip"));
});
