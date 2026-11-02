local RT = ...
local host = RT.host
local D, NIL = RT.D, RT.NIL
local G = getfenv(0)
local V2 = G.Vector2.new
local floor, max, min, huge = math.floor, math.max, math.min, math.huge

local L = setmetatable({}, { __mode = "k" })
local gui = { dirty = true, paint = true, version = 0, vw = 1280, vh = 720, inset = 36 }
RT.gui = gui
RT.layoutInfo = L

local function P(o, k)
  local d = D[o]
  local v = d.props[k]
  if v == nil then v = d.info.props[k] end
  if v == NIL then return nil end
  return v
end

local function enumName(o, k)
  local v = P(o, k)
  return v and v.Name or ""
end

local outputKeys = { AbsolutePosition = true, AbsoluteSize = true, AbsoluteRotation = true, AbsoluteContentSize = true, AbsoluteWindowSize = true, AbsoluteCanvasSize = true, AbsoluteCellSize = true, AbsoluteCellCount = true, TextBounds = true }
local layoutKeys = {
  Size = true, Position = true, AnchorPoint = true, AutomaticSize = true, SizeConstraint = true, Visible = true, LayoutOrder = true, Parent = true, Name = true,
  Text = true, TextSize = true, Font = true, FontFace = true, TextWrapped = true, TextScaled = true, RichText = true, LineHeight = true,
  CanvasSize = true, CanvasPosition = true, AutomaticCanvasSize = true, ScrollBarThickness = true, VerticalScrollBarInset = true, HorizontalScrollBarInset = true,
  PaddingTop = true, PaddingBottom = true, PaddingLeft = true, PaddingRight = true, FillDirection = true, HorizontalAlignment = true, VerticalAlignment = true,
  SortOrder = true, Padding = true, CellPadding = true, CellSize = true, StartCorner = true, FillDirectionMaxCells = true, Wraps = true,
  HorizontalFlex = true, VerticalFlex = true, FlexMode = true, GrowRatio = true, ShrinkRatio = true, ItemLineAlignment = true,
  Scale = true, AspectRatio = true, AspectType = true, DominantAxis = true, MinSize = true, MaxSize = true, MinTextSize = true, MaxTextSize = true,
  Enabled = true, IgnoreGuiInset = true, ScreenInsets = true, DisplayOrder = true,
}

RT.hooks[#RT.hooks + 1] = function(inst, k, v)
  local ch = D[inst].info.chain
  if not (ch.GuiBase2d or ch.UIBase or ch.GuiBase) then return end
  if outputKeys[k] then return end
  gui.paint = true
  gui.version += 1
  if layoutKeys[k] then gui.dirty = true end
end

local function split(o)
  local items, mods = {}, {}
  for _, c in ipairs(RT.kidsOf(o)) do
    local ch = D[c].info.chain
    if ch.GuiObject then
      items[#items + 1] = c
    elseif ch.UIBase then
      if ch.UIPadding then mods.pad = c
      elseif ch.UIListLayout then mods.list = c
      elseif ch.UIGridLayout then mods.grid = c
      elseif ch.UIScale then mods.scale = c
      elseif ch.UIAspectRatioConstraint then mods.aspect = c
      elseif ch.UISizeConstraint then mods.sizec = c
      elseif ch.UITextSizeConstraint then mods.textc = c
      elseif ch.UIFlexItem then mods.flex = c
      elseif ch.UICorner then mods.corner = c
      elseif ch.UIStroke then mods.strokes = mods.strokes or {}; mods.strokes[#mods.strokes + 1] = c
      elseif ch.UIGradient then mods.grads = mods.grads or {}; mods.grads[#mods.grads + 1] = c
      end
    end
  end
  return items, mods
end

local function plain(o, s)
  if P(o, "RichText") then s = string.gsub(s, "<[^>]*>", "") end
  return s
end

local function measureText(o, size, wrapWidth)
  local fam = P(o, "FontFace").Family
  local lh = P(o, "LineHeight") or 1
  local w, h = host.measure(plain(o, P(o, "Text") or ""), size, fam, wrapWidth)
  if lh ~= 1 then h = h * lh end
  return w, h
end

local function fitText(o, mods, w, h)
  local size = P(o, "TextSize")
  if P(o, "TextScaled") then
    local lo, hi = 1, 100
    if mods.textc then lo = max(lo, P(mods.textc, "MinTextSize")); hi = min(hi, P(mods.textc, "MaxTextSize")) end
    local wrap = P(o, "TextWrapped")
    for _ = 1, 7 do
      local mid = (lo + hi) / 2
      local tw, th = measureText(o, mid, wrap and w or 0)
      if tw <= w + 0.5 and th <= h + 0.5 then lo = mid else hi = mid end
    end
    size = floor(lo)
    if size < 1 then size = 1 end
  elseif mods.textc then
    size = min(max(size, P(mods.textc, "MinTextSize")), P(mods.textc, "MaxTextSize"))
  end
  return size
end

local place
local visited, nvisited = {}, 0

local function shift(o, dx, dy)
  local i = L[o]
  if not i then return end
  i.x += dx; i.y += dy
  if i.items then for _, c in ipairs(i.items) do shift(c, dx, dy) end end
end

local function udimPx(u, base, m)
  return u.Scale * base + u.Offset * m
end

local function sortItems(items, order)
  local n = {}
  for i, c in ipairs(items) do n[i] = { c, i, P(c, "LayoutOrder"), D[c].name } end
  if order == "Name" then
    table.sort(n, function(a, b) if a[4] == b[4] then return a[2] < b[2] end; return a[4] < b[4] end)
  elseif order == "Custom" then
  else
    table.sort(n, function(a, b) if a[3] == b[3] then return a[2] < b[2] end; return a[3] < b[3] end)
  end
  local out = {}
  for i, e in ipairs(n) do out[i] = e[1] end
  return out
end

local function visibleItems(items)
  local out = {}
  for _, c in ipairs(items) do if P(c, "Visible") then out[#out + 1] = c end end
  return out
end

local function alignOffset(name, free)
  if name == "Center" then return free / 2 end
  if name == "Right" or name == "Bottom" then return free end
  return 0
end

local function listLayout(o, info, lay, items, ix, iy, iw, ih, m, rot)
  local horiz = enumName(lay, "FillDirection") == "Horizontal"
  local pad = P(lay, "Padding")
  local padPx = pad.Scale * (horiz and iw or ih) + pad.Offset * m
  local list = visibleItems(sortItems(items, enumName(lay, "SortOrder")))
  local n = #list
  local mainSpace = horiz and iw or ih
  local crossSpace = horiz and ih or iw
  for _, c in ipairs(list) do place(c, ix, iy, iw, ih, m, nil, nil, true, rot) end
  local sum = 0
  for _, c in ipairs(list) do local ci = L[c]; sum += horiz and ci.w or ci.h end
  sum += padPx * max(n - 1, 0)
  local leftover = mainSpace - sum
  local flexName = enumName(lay, horiz and "HorizontalFlex" or "VerticalFlex")
  local growTotal, shrinkTotal = 0, 0
  local gr = {}
  for _, c in ipairs(list) do
    local fi = L[c].mods.flex
    local g, s = 0, 0
    if fi then
      local mode = enumName(fi, "FlexMode")
      if mode == "Fill" then g, s = 1, 1
      elseif mode == "Grow" then g, s = P(fi, "GrowRatio"), 0
      elseif mode == "Shrink" then g, s = 0, P(fi, "ShrinkRatio")
      elseif mode == "Custom" then g, s = P(fi, "GrowRatio"), P(fi, "ShrinkRatio") end
    end
    gr[c] = { g, s }
    growTotal += g; shrinkTotal += s
  end
  if leftover > 0 and growTotal > 0 then
    local fill = flexName == "Fill"
    for _, c in ipairs(list) do
      local g = gr[c][1]
      if g > 0 then
        local ci = L[c]
        local nm = (horiz and ci.w or ci.h) + leftover * g / growTotal
        place(c, ix, iy, iw, ih, m, horiz and nm or nil, (not horiz) and nm or nil, true, rot)
      end
    end
    leftover = 0
  elseif leftover < 0 and shrinkTotal > 0 then
    for _, c in ipairs(list) do
      local s = gr[c][2]
      if s > 0 then
        local ci = L[c]
        local nm = max(0, (horiz and ci.w or ci.h) + leftover * s / shrinkTotal)
        place(c, ix, iy, iw, ih, m, horiz and nm or nil, (not horiz) and nm or nil, true, rot)
      end
    end
    leftover = 0
  end
  sum = 0
  for _, c in ipairs(list) do local ci = L[c]; sum += horiz and ci.w or ci.h end
  sum += padPx * max(n - 1, 0)
  local free = max(0, mainSpace - sum)
  local start, gap = 0, padPx
  if flexName == "SpaceBetween" and n > 1 then gap = padPx + free / (n - 1)
  elseif flexName == "SpaceAround" and n > 0 then gap = padPx + free / n; start = free / n / 2
  elseif flexName == "SpaceEvenly" and n > 0 then gap = padPx + free / (n + 1); start = free / (n + 1)
  else start = alignOffset(enumName(lay, horiz and "HorizontalAlignment" or "VerticalAlignment"), free) end
  local cursor = start
  local extMain, extCross = 0, 0
  for _, c in ipairs(list) do
    local ci = L[c]
    local cw, ch = ci.w, ci.h
    local crossFree = crossSpace - (horiz and ch or cw)
    local crossOff = alignOffset(enumName(lay, horiz and "VerticalAlignment" or "HorizontalAlignment"), crossFree)
    local tx, ty
    if horiz then tx, ty = ix + cursor, iy + crossOff else tx, ty = ix + crossOff, iy + cursor end
    shift(c, tx - ci.x, ty - ci.y)
    cursor += (horiz and cw or ch) + gap
    extMain = max(extMain, cursor - gap)
    extCross = max(extCross, (horiz and ch or cw))
  end
  local cs = horiz and V2(extMain - start, extCross) or V2(extCross, extMain - start)
  if n == 0 then cs = V2(0, 0) end
  info.extra[#info.extra + 1] = { lay, "AbsoluteContentSize", cs }
  return horiz and (start + (cs.X)) or cs.X, horiz and cs.Y or (start + cs.Y)
end

local function gridLayout(o, info, lay, items, ix, iy, iw, ih, m, rot)
  local list = visibleItems(sortItems(items, enumName(lay, "SortOrder")))
  local cs = P(lay, "CellSize")
  local cp = P(lay, "CellPadding")
  local cw, ch = udimPx(cs.X, iw, m), udimPx(cs.Y, ih, m)
  local px, py = udimPx(cp.X, iw, m), udimPx(cp.Y, ih, m)
  local horiz = enumName(lay, "FillDirection") == "Horizontal"
  local maxCells = P(lay, "FillDirectionMaxCells")
  local perLine
  if horiz then perLine = max(1, floor((iw + px) / max(cw + px, 1))) else perLine = max(1, floor((ih + py) / max(ch + py, 1))) end
  if maxCells > 0 then perLine = min(perLine, maxCells) end
  local n = #list
  local lines = n == 0 and 0 or math.ceil(n / perLine)
  local cols, rows
  if horiz then cols, rows = min(perLine, n), lines else cols, rows = lines, min(perLine, n) end
  local totalW = cols * cw + max(cols - 1, 0) * px
  local totalH = rows * ch + max(rows - 1, 0) * py
  local ox = alignOffset(enumName(lay, "HorizontalAlignment"), max(0, iw - totalW))
  local oy = alignOffset(enumName(lay, "VerticalAlignment"), max(0, ih - totalH))
  local corner = enumName(lay, "StartCorner")
  for idx, c in ipairs(list) do
    local k = idx - 1
    local col, row
    if horiz then col, row = k % perLine, floor(k / perLine) else row, col = k % perLine, floor(k / perLine) end
    if corner == "TopRight" or corner == "BottomRight" then col = cols - 1 - col end
    if corner == "BottomLeft" or corner == "BottomRight" then row = rows - 1 - row end
    place(c, ix, iy, iw, ih, m, cw, ch, true, rot)
    local ci = L[c]
    shift(c, ix + ox + col * (cw + px) - ci.x, iy + oy + row * (ch + py) - ci.y)
  end
  info.extra[#info.extra + 1] = { lay, "AbsoluteContentSize", V2(totalW, totalH) }
  info.extra[#info.extra + 1] = { lay, "AbsoluteCellSize", V2(cw, ch) }
  info.extra[#info.extra + 1] = { lay, "AbsoluteCellCount", V2(cols, rows) }
  return ox + totalW, oy + totalH
end

local function freeLayout(o, items, ix, iy, iw, ih, m, rot)
  local ex, ey = 0, 0
  for _, c in ipairs(items) do
    place(c, ix, iy, iw, ih, m, nil, nil, false, rot)
    local ci = L[c]
    ex = max(ex, ci.x + ci.w - ix)
    ey = max(ey, ci.y + ci.h - iy)
  end
  return ex, ey
end

local function needsSecondPass(items, mods)
  if mods.list then
    local h = enumName(mods.list, "HorizontalAlignment")
    local v = enumName(mods.list, "VerticalAlignment")
    if h ~= "Left" or v ~= "Top" then return true end
  end
  for _, c in ipairs(items) do
    local s, p = P(c, "Size"), P(c, "Position")
    if s.X.Scale ~= 0 or s.Y.Scale ~= 0 or p.X.Scale ~= 0 or p.Y.Scale ~= 0 then return true end
  end
  return false
end

function place(o, cx, cy, cw, ch, m, fw, fh, lay, parentRot)
  local items, mods = split(o)
  local info = { items = items, mods = mods, extra = {} }
  L[o] = info
  nvisited += 1
  visited[nvisited] = o
  local size = P(o, "Size")
  local rw, rh = cw, ch
  local sc = enumName(o, "SizeConstraint")
  if sc == "RelativeXX" then rh = cw elseif sc == "RelativeYY" then rw = ch end
  local us = mods.scale and P(mods.scale, "Scale") or 1
  local w = fw or (size.X.Scale * rw + size.X.Offset * m) * us
  local h = fh or (size.Y.Scale * rh + size.Y.Offset * m) * us
  if mods.aspect then
    local r = P(mods.aspect, "AspectRatio")
    if r > 0 then
      if enumName(mods.aspect, "AspectType") == "FitWithinMaxSize" then
        if w / max(h, 1e-6) > r then w = h * r else h = w / r end
      elseif enumName(mods.aspect, "DominantAxis") == "Width" then h = w / r
      else w = h * r end
    end
  end
  if mods.sizec then
    local mn, mx = P(mods.sizec, "MinSize"), P(mods.sizec, "MaxSize")
    w = min(max(w, mn.X), mx.X); h = min(max(h, mn.Y), mx.Y)
  end
  w = max(w, 0); h = max(h, 0)
  local auto = enumName(o, "AutomaticSize")
  local ax = auto == "X" or auto == "XY"
  local ay = auto == "Y" or auto == "XY"
  local isText = D[o].info.props.TextSize ~= nil and D[o].info.props.Text ~= nil
  local isScroll = D[o].info.chain.ScrollingFrame == true
  local pl, pr, pt, pb = 0, 0, 0, 0
  local m2 = m * us
  local anchor = P(o, "AnchorPoint")
  local pos = P(o, "Position")
  local rotation = (P(o, "Rotation") or 0)
  info.rot = (parentRot or 0) + rotation

  local function run(w, h)
    local x, y
    if lay then x, y = cx, cy else
      x = cx + pos.X.Scale * cw + pos.X.Offset * m - anchor.X * w
      y = cy + pos.Y.Scale * ch + pos.Y.Offset * m - anchor.Y * h
    end
    info.x, info.y, info.w, info.h = x, y, w, h
    if mods.pad then
      local p = mods.pad
      pl = udimPx(P(p, "PaddingLeft"), w, m2); pr = udimPx(P(p, "PaddingRight"), w, m2)
      pt = udimPx(P(p, "PaddingTop"), h, m2); pb = udimPx(P(p, "PaddingBottom"), h, m2)
    end
    local ix, iy, iw, ih = x + pl, y + pt, max(w - pl - pr, 0), max(h - pt - pb, 0)
    local ex, ey
    if isScroll then
      local thick = P(o, "ScrollBarThickness")
      local win = V2(w, h)
      local cs = P(o, "CanvasSize")
      local cwid, chei = udimPx(cs.X, w, m2), udimPx(cs.Y, h, m2)
      local cp = P(o, "CanvasPosition")
      local autoCanvas = enumName(o, "AutomaticCanvasSize")
      info.thick = thick
      info.win = win
      iw, ih = cwid, chei
      if autoCanvas == "X" or autoCanvas == "XY" then iw = max(iw, 0) end
      local ox, oy = x + pl - cp.X, y + pt - cp.Y
      ix, iy = ox, oy
      if mods.list then ex, ey = listLayout(o, info, mods.list, items, ix, iy, max(iw, w - pl - pr), max(ih, h - pt - pb), m2, info.rot)
      elseif mods.grid then ex, ey = gridLayout(o, info, mods.grid, items, ix, iy, max(iw, w - pl - pr), max(ih, h - pt - pb), m2, info.rot)
      else ex, ey = freeLayout(o, items, ix, iy, max(iw, 0), max(ih, 0), m2, info.rot) end
      local fx, fy = iw, ih
      if autoCanvas == "X" or autoCanvas == "XY" then fx = max(0, ex + pl + pr) end
      if autoCanvas == "Y" or autoCanvas == "XY" then fy = max(0, ey + pt + pb) end
      info.canvas = V2(fx, fy)
      info.extra[#info.extra + 1] = { o, "AbsoluteWindowSize", win }
      info.extra[#info.extra + 1] = { o, "AbsoluteCanvasSize", info.canvas }
      return ex, ey
    end
    if mods.list then ex, ey = listLayout(o, info, mods.list, items, ix, iy, iw, ih, m2, info.rot)
    elseif mods.grid then ex, ey = gridLayout(o, info, mods.grid, items, ix, iy, iw, ih, m2, info.rot)
    else ex, ey = freeLayout(o, items, ix, iy, iw, ih, m2, info.rot) end
    return ex, ey
  end

  local ex, ey = run(w, h)
  if isText then
    if (ax or ay) and not P(o, "TextScaled") then
      local wrapW = (P(o, "TextWrapped") and not ax) and max(w - pl - pr, 0) or 0
      local tw, th = measureText(o, P(o, "TextSize"), wrapW)
      ex = max(ex, tw); ey = max(ey, th)
    end
  end
  if ax or ay then
    local nw, nh = w, h
    if ax and not fw then nw = max(w, ex + pl + pr) end
    if ay and not fh then nh = max(h, ey + pt + pb) end
    if nw ~= w or nh ~= h then
      w, h = nw, nh
      if needsSecondPass(items, mods) then
        ex, ey = run(w, h)
      else
        local x, y = info.x, info.y
        if not lay then
          x = cx + pos.X.Scale * cw + pos.X.Offset * m - anchor.X * w
          y = cy + pos.Y.Scale * ch + pos.Y.Offset * m - anchor.Y * h
        end
        info.w, info.h = w, h
        local dx, dy = x - info.x, y - info.y
        if dx ~= 0 or dy ~= 0 then shift(o, dx, dy) end
      end
    end
  end
  if isText then
    local tw = max(info.w - pl - pr, 0)
    local th = max(info.h - pt - pb, 0)
    info.fontSize = fitText(o, mods, tw, th)
    info.textBox = { tw, th }
    local bw, bh = measureText(o, info.fontSize, P(o, "TextWrapped") and tw or 0)
    info.extra[#info.extra + 1] = { o, "TextBounds", V2(bw, bh) }
  end
  info.cw, info.ch = ex, ey
  return w, h
end

local function rootsList()
  local out = {}
  local players = G.game:GetService("Players")
  local lp = players.LocalPlayer
  if lp then
    local pg = lp:FindFirstChildOfClass("PlayerGui")
    if pg then
      for _, c in ipairs(RT.kidsOf(pg)) do if D[c].info.chain.ScreenGui then out[#out + 1] = { c, 0 } end end
    end
  end
  local cg = G.game:FindFirstChildOfClass("CoreGui")
  if cg then
    for _, c in ipairs(RT.kidsOf(cg)) do if D[c].info.chain.ScreenGui then out[#out + 1] = { c, 1 } end end
  end
  for i, e in ipairs(out) do e[3] = P(e[1], "DisplayOrder"); e[4] = i end
  table.sort(out, function(a, b)
    if a[2] ~= b[2] then return a[2] < b[2] end
    if a[3] ~= b[3] then return a[3] < b[3] end
    return a[4] < b[4]
  end)
  local res = {}
  for i, e in ipairs(out) do res[i] = e[1] end
  return res
end

local function layoutRoot(sg)
  local ins = 0
  if not P(sg, "IgnoreGuiInset") and enumName(sg, "ScreenInsets") ~= "None" then ins = gui.inset end
  local info = { items = {}, mods = {}, extra = {}, x = 0, y = ins, w = gui.vw, h = max(gui.vh - ins, 0), rot = 0, root = true }
  L[sg] = info
  nvisited += 1
  visited[nvisited] = sg
  local items, mods = split(sg)
  info.items = items
  info.mods = mods
  local ex, ey = 0, 0
  if P(sg, "Enabled") then
    ex, ey = freeLayout(sg, items, 0, ins, gui.vw, max(gui.vh - ins, 0), 1, 0)
  end
  info.cw, info.ch = ex, ey
end

local pendingSets = {}

local function commit()
  local n = 0
  for i = 1, nvisited do
    local o = visited[i]
    local info = L[o]
    if info and not D[o].destroyed then
      n += 1; pendingSets[n] = { o, "AbsolutePosition", V2(info.x, info.y) }
      n += 1; pendingSets[n] = { o, "AbsoluteSize", V2(info.w, info.h) }
      n += 1; pendingSets[n] = { o, "AbsoluteRotation", info.rot or 0 }
      for _, e in ipairs(info.extra) do n += 1; pendingSets[n] = e end
    end
  end
  for i = 1, n do
    local e = pendingSets[i]
    if not D[e[1]].destroyed then RT.setRaw(e[1], e[2], e[3]) end
    pendingSets[i] = nil
  end
end

local function pass()
  nvisited = 0
  table.clear(visited)
  gui.dirty = false
  for _, sg in ipairs(rootsList()) do layoutRoot(sg) end
  commit()
  gui.version += 1
  gui.paint = true
end

function RT.guiLayout(vw, vh, inset)
  if vw and vw > 0 then gui.vw = vw end
  if vh and vh > 0 then gui.vh = vh end
  if inset then gui.inset = inset end
  gui.dirty = true
  local passes = 0
  repeat
    pass()
    passes += 1
  until not gui.dirty or passes >= 3
  return passes
end

function RT.guiStep()
  if not gui.dirty then return 0 end
  local passes = 0
  repeat
    pass()
    passes += 1
  until not gui.dirty or passes >= 3
  return passes
end

gui.place = place
gui.roots = rootsList
gui.P = P
gui.enumName = enumName
gui.split = split
return gui
