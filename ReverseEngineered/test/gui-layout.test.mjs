import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createVM } from "../src/vm/luau.mjs";
import { createRuntime } from "../src/vm/runtime.mjs";

const wasmBinary = readFileSync(new URL("../engine/luau/luau.wasm", import.meta.url));
const tree = { root: "R", children: () => [], classOf: () => "Folder", script: () => null };
const make = async () => {
  const rt = await createRuntime(await createVM({ wasmBinary }), tree, { measure: (t, s, _f, w) => [w > 0 ? Math.min(t.length * s * 0.5, w) : t.length * s * 0.5, s] });
  rt.mount();
  return rt;
};

test("scale, offset, anchor, padding and nesting", async () => {
  const rt = await make();
  const out = rt.run(`
    local sg = Instance.new("ScreenGui", game:GetService("CoreGui")); sg.IgnoreGuiInset = true
    local a = Instance.new("Frame", sg); a.Size = UDim2.new(0.5, 0, 0.5, 0); a.Position = UDim2.new(0.5, 0, 0.5, 0); a.AnchorPoint = Vector2.new(0.5, 0.5)
    local pad = Instance.new("UIPadding", a); pad.PaddingLeft = UDim.new(0, 10); pad.PaddingTop = UDim.new(0, 20)
    local b = Instance.new("Frame", a); b.Size = UDim2.new(1, 0, 0, 30); b.Position = UDim2.new(0, 5, 0, 5)
    __wb.guiLayout(1000, 800, 36)
    return a.AbsolutePosition.X, a.AbsolutePosition.Y, a.AbsoluteSize.X, a.AbsoluteSize.Y, b.AbsolutePosition.X, b.AbsolutePosition.Y, b.AbsoluteSize.X
  `, 7);
  assert.deepEqual(out, [250, 200, 500, 400, 265, 225, 490]);
});

test("list layout, alignment, automatic size and text", async () => {
  const rt = await make();
  const out = rt.run(`
    local sg = Instance.new("ScreenGui", game:GetService("CoreGui")); sg.IgnoreGuiInset = true
    local box = Instance.new("Frame", sg); box.Size = UDim2.new(0, 200, 0, 100); box.AutomaticSize = Enum.AutomaticSize.Y
    local l = Instance.new("UIListLayout", box); l.Padding = UDim.new(0, 4); l.HorizontalAlignment = Enum.HorizontalAlignment.Center
    local t = Instance.new("TextLabel", box); t.Text = "abcd"; t.TextSize = 10; t.AutomaticSize = Enum.AutomaticSize.XY; t.Size = UDim2.new(); t.LayoutOrder = 2
    local f = Instance.new("Frame", box); f.Size = UDim2.new(0, 50, 0, 40); f.LayoutOrder = 1
    local g = Instance.new("Frame", box); g.Size = UDim2.new(0, 10, 0, 300); g.LayoutOrder = 3
    __wb.guiLayout(1000, 800, 0)
    return f.AbsolutePosition.X, f.AbsolutePosition.Y, t.AbsoluteSize.X, t.AbsolutePosition.Y, g.AbsolutePosition.Y, box.AbsoluteSize.Y, l.AbsoluteContentSize.Y
  `, 7);
  assert.deepEqual(out, [75, 0, 20, 44, 58, 358, 358]);
});

test("grid layout and relayout after a change", async () => {
  const rt = await make();
  const out = rt.run(`
    local sg = Instance.new("ScreenGui", game:GetService("CoreGui")); sg.IgnoreGuiInset = true
    local box = Instance.new("Frame", sg); box.Size = UDim2.new(0, 100, 0, 100)
    local grid = Instance.new("UIGridLayout", box); grid.CellSize = UDim2.new(0, 40, 0, 40); grid.CellPadding = UDim2.new(0, 10, 0, 10)
    local kids = {}; for i = 1, 3 do kids[i] = Instance.new("Frame", box) end
    __wb.guiLayout(500, 500, 0)
    local x3, y3 = kids[3].AbsolutePosition.X, kids[3].AbsolutePosition.Y
    box.Size = UDim2.new(0, 200, 0, 100); __wb.guiStep()
    return x3, y3, kids[3].AbsolutePosition.X, kids[3].AbsolutePosition.Y
  `, 4);
  assert.deepEqual(out, [0, 50, 100, 0]);
});
