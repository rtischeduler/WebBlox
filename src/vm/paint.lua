-- Step 3b: turns the laid-out GUI tree into a flat draw list for the canvas, and routes pointer input back to Instances.
-- Loaded by runtime.mjs after gui.lua. Output is JSON (HttpService) so the JS painter stays dumb.
local RT = ...
local D = RT.D
local G = getfenv(0)
local gui = RT.gui
local P, enumName = gui.P, gui.enumName
local floor, max, min = math.floor, math.max, math.min

local function hex(c)
  if c == nil or c.R == nil then return "#000000" end
  local function b(v) return max(0, min(255, floor((v or 0) * 255 + 0.5))) end
  return string.format("#%02x%02x%02x", b(c.R), b(c.G), b(c.B))
end

local function chainHas(o, cls) return D[o].info.chain[cls] end
local function isGui(o) return chainHas(o, "GuiObject") end

-- children in paint order: ZIndex ascending, then tree order (Sibling behaviour)
local function paintKids(o)
  local kids = {}
  for i, c in ipairs(RT.kidsOf(o)) do
    if isGui(c) and P(c, "Visible") then kids[#kids + 1] = { c, P(c, "ZIndex") or 1, i } end
  end
  table.sort(kids, function(a, b) if a[2] ~= b[2] then return a[2] < b[2] end return a[3] < b[3] end)
  local out = {}
  for i, k in ipairs(kids) do out[i] = k[1] end
  return out
end

local function deco(o)
  local radius, stroke, grad
  for _, c in ipairs(RT.kidsOf(o)) do
    if chainHas(c, "UICorner") then
      local r = P(c, "CornerRadius")
      radius = { r and r.Scale or 0, r and r.Offset or 0 }
    elseif chainHas(c, "UIStroke") and P(c, "Enabled") ~= false then
      stroke = { c = hex(P(c, "Color")), t = P(c, "Thickness") or 1, a = 1 - (P(c, "Transparency") or 0) }
    end
  end
  return radius, stroke
end

local function emit(o, out, depth)
  if depth > 80 then return end
  local info = RT.layoutInfo[o]
  if not info then return end
  local x, y, w, h = info.x, info.y, info.w, info.h
  local cls = D[o].info.chain
  local clip = P(o, "ClipsDescendants") and true or false
  if clip or cls.ScrollingFrame then out[#out + 1] = { k = "clip", x = x, y = y, w = w, h = h } end
  local bgA = 1 - (P(o, "BackgroundTransparency") or 0)
  local rad, stroke = deco(o)
  local rpx = rad and min((rad[1] * min(w, h)) + rad[2], min(w, h) / 2) or 0
  if bgA > 0 and w > 0 and h > 0 then
    out[#out + 1] = { k = "rect", x = x, y = y, w = w, h = h, c = hex(P(o, "BackgroundColor3")), a = bgA, r = rpx }
  end
  if cls.ImageLabel or cls.ImageButton then
    local img = P(o, "Image")
    if img and img ~= "" then
      local ro, rs = P(o, "ImageRectOffset"), P(o, "ImageRectSize")
      out[#out + 1] = { k = "image", x = x, y = y, w = w, h = h, src = img, a = 1 - (P(o, "ImageTransparency") or 0), tint = hex(P(o, "ImageColor3")),
        sx = ro and ro.X or 0, sy = ro and ro.Y or 0, sw = rs and rs.X or 0, sh = rs and rs.Y or 0, r = rpx, scale = enumName(o, "ScaleType") }
    end
  end
  if cls.TextLabel or cls.TextButton or cls.TextBox then
    local text = P(o, "Text") or ""
    if cls.TextBox and text == "" then text = P(o, "PlaceholderText") or "" end
    if text ~= "" then
      local f = P(o, "FontFace")
      out[#out + 1] = { k = "text", x = x, y = y, w = w, h = h, text = text, c = hex(P(o, "TextColor3")), a = 1 - (P(o, "TextTransparency") or 0),
        size = P(o, "TextSize") or 14, wrap = P(o, "TextWrapped") and true or false, ax = enumName(o, "TextXAlignment"), ay = enumName(o, "TextYAlignment"),
        weight = f and f.Weight and f.Weight.Value or 400, family = f and f.Family or "", sc = P(o, "TextStrokeTransparency") or 1, scc = hex(P(o, "TextStrokeColor3")) }
    end
  end
  if stroke and w > 0 and h > 0 then out[#out + 1] = { k = "stroke", x = x, y = y, w = w, h = h, c = stroke.c, t = stroke.t, a = stroke.a, r = rpx } end
  if (P(o, "BorderSizePixel") or 0) > 0 and bgA > 0 and not stroke then
    out[#out + 1] = { k = "stroke", x = x, y = y, w = w, h = h, c = hex(P(o, "BorderColor3")), t = P(o, "BorderSizePixel"), a = bgA, r = 0 }
  end
  for _, c in ipairs(paintKids(o)) do emit(c, out, depth + 1) end
  if clip or cls.ScrollingFrame then out[#out + 1] = { k = "unclip" } end
end

function RT.guiDraw()
  local out = {}
  for _, sg in ipairs(gui.roots()) do
    if P(sg, "Enabled") then
      for _, c in ipairs(paintKids(sg)) do emit(c, out, 1) end
    end
  end
  gui.paint = false
  return G.game:GetService("HttpService"):JSONEncode(out)
end

-- ===== input =====
local function inside(info, px, py) return info and px >= info.x and py >= info.y and px < info.x + info.w and py < info.y + info.h end

-- topmost GuiObject under the point (reverse paint order, honouring clipping ancestors)
local function hitIn(o, px, py, depth)
  if depth > 80 then return nil end
  local info = RT.layoutInfo[o]
  if not info then return nil end
  local clips = P(o, "ClipsDescendants") or D[o].info.chain.ScrollingFrame
  if clips and not inside(info, px, py) then return nil end
  local kids = paintKids(o)
  for i = #kids, 1, -1 do
    local h = hitIn(kids[i], px, py, depth + 1)
    if h then return h end
  end
  if D[o].info.chain.GuiObject and inside(info, px, py) and (P(o, "Active") or D[o].info.chain.GuiButton or P(o, "BackgroundTransparency") < 1) and P(o, "Interactable") ~= false then return o end
  return nil
end

function RT.guiHit(px, py)
  local roots = gui.roots()
  for i = #roots, 1, -1 do
    if P(roots[i], "Enabled") then
      local kids = paintKids(roots[i])
      for j = #kids, 1, -1 do
        local h = hitIn(kids[j], px, py, 1)
        if h then return h end
      end
    end
  end
  return nil
end

local hover, pressed
local function setHover(o)
  if hover == o then return end
  if hover and not D[hover].destroyed then RT.fire(hover, "MouseLeave", 0, 0) end
  hover = o
  if hover then RT.fire(hover, "MouseEnter", 0, 0) end
end

-- kind: "move" | "down" | "up" ; button 1 = left. Returns the name of the object that took the event (or "").
function RT.guiPointer(kind, px, py, button)
  local o = RT.guiHit(px, py)
  if kind == "move" then
    setHover(o)
    if o then RT.fire(o, "MouseMoved", px, py) end
  elseif kind == "down" then
    setHover(o)
    pressed = o
    if o then
      local b = (button == 2) and "MouseButton2Down" or "MouseButton1Down"
      if D[o].info.chain.GuiButton then RT.fire(o, b, px, py) end
    end
  elseif kind == "up" then
    local p = pressed; pressed = nil
    if o and D[o].info.chain.GuiButton then
      RT.fire(o, (button == 2) and "MouseButton2Up" or "MouseButton1Up", px, py)
      if p == o then
        if button == 2 then RT.fire(o, "MouseButton2Click") RT.fire(o, "SecondaryActivated")
        else RT.fire(o, "MouseButton1Click") RT.fire(o, "Activated") end
      end
    end
  elseif kind == "wheel" then
    if o then RT.fire(o, button > 0 and "MouseWheelBackward" or "MouseWheelForward", px, py) end
  end
  return o and tostring(o.Name) or ""
end

function RT.guiNeedsPaint() return gui.paint or gui.dirty end

return true
