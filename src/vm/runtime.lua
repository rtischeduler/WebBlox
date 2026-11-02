-- Roblox runtime for the Luau VM (step 2). Plain Luau, run once per VM by runtime.mjs.
-- host = { children(path)->names,classes  load(path)->fn  classOf(path)  log(level,msg)  now()  measure(text,size,family,width)->w,h
--          flag(name)->value|nil  feature(name)->bool  async(kind,id,payload) }
-- Not here yet (step 3/4): layout/AbsoluteSize, rendering, real input, server replication. Hooks for them: RT.hooks (property changes),
-- RT.setRaw (computed values), RT.addPlayer/removePlayer, RT.await (async host calls), RT.remote (RemoteEvent traffic).
local host = ...
local G = getfenv(0)
local type = type -- raw type() for the runtime itself; scripts get the userdata-aware one below
local RT = { errors = {}, lazyEnums = {}, hooks = {}, host = host, outcomes = {}, mouse = { X = 0, Y = 0 }, strictEnums = false }
G.__wb = RT
local NIL = {}
-- Unknown member of a lenient service: callable (as a method) AND signal-shaped (:Connect/:Once/:Wait), so both `svc:Foo()` and `svc.OnFoo:Connect(f)` are harmless.
local noopConn = { Connected = false, Disconnect = function() end }
local noopAny = setmetatable({}, { __call = function() return nil end, __index = function(_, k)
  if k == "Connect" or k == "Once" or k == "ConnectParallel" then return function() return noopConn end end
  if k == "Wait" then return function() return nil end end
end })
RT.lenient = {}
local D = setmetatable({}, { __mode = "k" })
local function nameOf(p) return (string.match(p, "([^/]*)$")) end
local function log(level, msg) host.log(level, tostring(msg)) end
local function typeof(v)
  local t = type(v)
  if t == "table" then local mt = getmetatable(v); local ty = mt and rawget(mt, "__type"); if ty then return ty end end
  return t
end
G.typeof = typeof
-- Roblox datatypes, EnumItems and Instances are userdata there; here they are tables with a __type metatable.
-- Scripts that test type(v) == "table" (deep clones, serializers) must not walk into them (Enum cycles), so type() reports "userdata".
G.type = function(v) local t = type(v); if t == "table" then local mt = getmetatable(v); if mt and rawget(mt, "__type") then return "userdata" end end; return t end
G.warn = function(...) local t = table.pack(...); for i = 1, t.n do t[i] = tostring(t[i]) end; log("warn", table.concat(t, " ")) end
G.shared = G.shared or {}
pcall(function() debug.profilebegin = function() end; debug.profileend = function() end end)

-- ===== Enum =====
local Enum, enumItems = nil, {}
do
  local ItemMT = { __type = "EnumItem" }
  ItemMT.__index = { IsA = function(self, n) return n == "EnumItem" end }
  ItemMT.__tostring = function(s) return "Enum." .. s.EnumType.Name .. "." .. s.Name end
  local EnumMT = { __type = "Enum" }
  local enumMethods = {}
  local meta = setmetatable({}, { __mode = "k" })
  local function add(e, name, value)
    local it = setmetatable({ Name = name, Value = value, EnumType = e }, ItemMT)
    rawset(e, name, it); local m = meta[e]; m.list[#m.list + 1] = it; m.byValue[value] = it
    if value >= m.next then m.next = value + 1 end
    return it
  end
  EnumMT.__index = function(e, k)
    local m = enumMethods[k]; if m then return m end
    local mt = meta[e]
    if RT.strictEnums and not mt.lazy then error(tostring(k) .. " is not a valid EnumItem of " .. mt.name, 2) end
    RT.lazyEnums[#RT.lazyEnums + 1] = mt.name .. "." .. tostring(k)
    return add(e, k, mt.next)
  end
  EnumMT.__tostring = function(e) return "Enum." .. meta[e].name end
  function enumMethods.GetEnumItems(e) return table.clone(meta[e].list) end
  function enumMethods.FromName(e, n) local v = rawget(e, n); return v end
  function enumMethods.FromValue(e, v) return meta[e].byValue[v] end
  local function makeEnum(name, spec)
    local e = setmetatable({ Name = name }, EnumMT)
    meta[e] = { name = name, list = {}, byValue = {}, next = 0 }
    local i = 0
    for item in string.gmatch(spec, "[^,]+") do
      local n, v = string.match(item, "^%s*([%w_]+)=(%-?%d+)%s*$")
      if n then add(e, n, tonumber(v)) else n = string.match(item, "^%s*([%w_]+)%s*$"); add(e, n, meta[e].next) end
    end
    return e
  end
  local SPEC = {
    AutomaticSize = "None,X,Y,XY", SizeConstraint = "RelativeXY,RelativeXX,RelativeYY", FillDirection = "Horizontal,Vertical",
    HorizontalAlignment = "Center,Left,Right", VerticalAlignment = "Center,Top,Bottom", SortOrder = "Name,Custom,LayoutOrder",
    TextXAlignment = "Left,Right,Center", TextYAlignment = "Top,Center,Bottom", TextTruncate = "None,AtEnd,SplitWord",
    ScaleType = "Stretch,Slice,Tile,Fit,Crop", ZIndexBehavior = "Global,Sibling", BorderMode = "Outline,Middle,Inset",
    ApplyStrokeMode = "Contextual,Border", LineJoinMode = "Round,Bevel,Miter", StartCorner = "TopLeft,TopRight,BottomLeft,BottomRight",
    ScrollingDirection = "X=1,Y=2,XY=4", ScrollBarInset = "None,ScrollBar,Always", VerticalScrollBarPosition = "Right,Left",
    ElasticBehavior = "WhenScrollable,Always,Never", ResamplerMode = "Default,Pixelated", TextInputType = "Default,Email,Number,Password,Phone,Search,Username",
    EasingStyle = "Linear,Sine,Back,Quad,Quart,Quint,Bounce,Elastic,Exponential,Circular,Cubic", EasingDirection = "In,Out,InOut",
    PlaybackState = "Begin,Delayed,Playing,Paused,Completed,Cancelled", TweenStatus = "Canceled,Completed",
    FontWeight = "Thin=100,ExtraLight=200,Light=300,Regular=400,Medium=500,SemiBold=600,Bold=700,ExtraBold=800,Heavy=900", FontStyle = "Normal,Italic",
    Font = "Legacy,Arial,ArialBold,SourceSans,SourceSansBold,SourceSansLight,SourceSansItalic,Bangers,Merriweather,Oswald,Gotham,GothamMedium,GothamBold,GothamBlack,SourceSansSemibold,Code,Roboto,RobotoMono",
    UserInputState = "Begin,Change,End,Cancel,None",
    UserInputType = "MouseButton1=1,MouseButton2=2,MouseButton3=3,MouseWheel=4,MouseMovement=5,Touch=7,Keyboard=8,Focus=9,Accelerometer=10,Gyro=11,Gamepad1=12,Gamepad2=13,Gamepad3=14,Gamepad4=15,Gamepad5=16,Gamepad6=17,Gamepad7=18,Gamepad8=19,TextInput=20,InputMethod=21,None=22",
    KeyCode = "Unknown=0,Backspace=8,Tab=9,Return=13,Escape=27,Space=32,Comma=44,Minus=45,Period=46,Slash=47,Zero=48,One=49,Two=50,Three=51,Four=52,Five=53,Six=54,Seven=55,Eight=56,Nine=57,Semicolon=59,Equals=61,LeftBracket=91,BackSlash=92,RightBracket=93,Backquote=96,A=97,B=98,C=99,D=100,E=101,F=102,G=103,H=104,I=105,J=106,K=107,L=108,M=109,N=110,O=111,P=112,Q=113,R=114,S=115,T=116,U=117,V=118,W=119,X=120,Y=121,Z=122,Delete=127,Up=273,Down=274,Right=275,Left=276,Insert=277,Home=278,End=279,PageUp=280,PageDown=281,F1=282,F2=283,F3=284,F4=285,F5=286,F6=287,F7=288,F8=289,F9=290,F10=291,F11=292,F12=293,RightShift=303,LeftShift=304,RightControl=305,LeftControl=306,RightAlt=307,LeftAlt=308,ButtonA=1000,ButtonB=1001,ButtonX=1002,ButtonY=1003,ButtonR1=1004,ButtonL1=1005,ButtonR2=1006,ButtonL2=1007,ButtonR3=1008,ButtonL3=1009,ButtonStart=1010,ButtonSelect=1011,DPadLeft=1012,DPadRight=1013,DPadUp=1014,DPadDown=1015,Thumbstick1=1016,Thumbstick2=1017",
    Platform = "Windows=0,OSX=1,IOS=2,Android=3,XBoxOne=4,PS4=5,PS3=6,XBox360=7,WiiU=8,NX=9,Ouya=10,AndroidTV=11,Chromecast=12,Linux=13,SteamOS=14,WebOS=15,DOS=16,BeOS=17,UWP=18,None=19",
    MouseBehavior = "Default,LockCenter,LockCurrentPosition", ChatVersion = "LegacyChatService,TextChatService", CreatorType = "User,Group",
    CoreGuiType = "PlayerList=0,Health=1,Backpack=2,Chat=3,All=4,EmotesMenu=5,Captures=6", MembershipType = "None,BuildersClub,TurboBuildersClub,OutrageousBuildersClub,Premium=4",
    DeviceType = "Unknown,Desktop,Tablet,Phone", ScreenOrientation = "LandscapeLeft,LandscapeRight,LandscapeSensor,Portrait,Sensor", CameraType = "Fixed,Watch,Attach,Track,Follow,Custom,Scriptable,Orbital",
    TextDirection = "LeftToRight,RightToLeft", Status = "Poison,Confusion", ThumbnailType = "HeadShot,AvatarBust,AvatarThumbnail", ThumbnailSize = "Size48x48,Size180x180,Size420x420,Size60x60,Size100x100,Size150x150,Size352x352",
    PlayerChatType = "All,Team,Whisper", NetworkStatus = "Unknown,Disconnected,Connected", SelectionBehavior = "Escape,Stop", ContextActionResult = "Pass,Sink", ContextActionPriority = "Low=1000,Medium=2000,Default=2000,High=3000",
    OverrideMouseIconBehavior = "None,ForceShow,ForceHide", GuiType = "Core,Custom,PlayerNameplates", SafeAreaCompatibility = "None,FullscreenExtension", ScreenInsets = "None,DeviceSafeInsets,CoreUISafeInsets,TopbarSafeInsets",
    TextTruncateMode = "None", AspectType = "FitWithinMaxSize,ScaleWithParentSize", DominantAxis = "Width,Height", UIFlexMode = "None,Grow,Shrink,Fill,Custom", ItemLineAlignment = "Automatic,Start,Center,End,Stretch",
    UIFlexAlignment = "None,Fill,SpaceAround,SpaceBetween,SpaceEvenly", TableMajorAxis = "RowMajor,ColumnMajor", RenderFidelity = "Automatic,Precise,Performance", ProductPurchaseDecision = "NotProcessedYet,PurchaseGranted",
    InfoType = "Asset,Product,GamePass,Subscription,Bundle", AssetType = "Image=1,TeeShirt=2,Audio=3,Mesh=4,Lua=5,Hat=8,Place=9,Model=10,Shirt=11,Pants=12,Decal=13", PrivilegeType = "Banned,Visitor,Member,Admin,Owner",
    VirtualCursorMode = "Default,Disabled,Enabled", GamepadType = "Unknown", UITheme = "Light,Dark", Technology = "Legacy,Voxel,Compatibility,ShadowMap,Future", ReverbType = "NoReverb,GenericReverb",
  }
  Enum = setmetatable({}, { __type = "Enums", __tostring = function() return "Enum" end, __index = function(t, name)
    if name == "GetEnums" then return function(self) local out = {}; for n in pairs(SPEC) do out[#out + 1] = self[n] end; return out end end
    local spec = SPEC[name]
    local e = makeEnum(name, spec or "")
    meta[e].lazy = spec == nil; rawset(t, name, e); return e
  end })
  G.Enum = Enum
end
local E = Enum

-- ===== Datatypes =====
local V2, V3, UD, UD2, C3, RectT
local function datatype(name, methods, getters, ops)
  local mt = { __type = name }
  mt.__index = function(t, k) local g = getters and getters[k]; if g then return g(t) end; return methods[k] end
  if ops then for k, f in pairs(ops) do mt[k] = f end end
  return mt
end
do
  local sqrt, floor, abs = math.sqrt, math.floor, math.abs
  local function num(x, d) if x == nil then return d end; return x end
  -- Vector2
  local m2 = {}
  V2 = datatype("Vector2", m2, { Magnitude = function(v) return sqrt(v.X * v.X + v.Y * v.Y) end,
    Unit = function(v) local m = sqrt(v.X * v.X + v.Y * v.Y); if m == 0 then return v end; return setmetatable({ X = v.X / m, Y = v.Y / m }, getmetatable(v)) end }, {
    __add = function(a, b) return setmetatable({ X = a.X + b.X, Y = a.Y + b.Y }, getmetatable(a)) end,
    __sub = function(a, b) return setmetatable({ X = a.X - b.X, Y = a.Y - b.Y }, getmetatable(a)) end,
    __mul = function(a, b) if type(a) == "number" then a, b = b, a end; if type(b) == "number" then return setmetatable({ X = a.X * b, Y = a.Y * b }, getmetatable(a)) end; return setmetatable({ X = a.X * b.X, Y = a.Y * b.Y }, getmetatable(a)) end,
    __div = function(a, b) if type(b) == "number" then return setmetatable({ X = a.X / b, Y = a.Y / b }, getmetatable(a)) end; return setmetatable({ X = a.X / b.X, Y = a.Y / b.Y }, getmetatable(a)) end,
    __unm = function(a) return setmetatable({ X = -a.X, Y = -a.Y }, getmetatable(a)) end,
    __eq = function(a, b) return a.X == b.X and a.Y == b.Y end,
    __tostring = function(a) return a.X .. ", " .. a.Y end })
  local function v2(x, y) return setmetatable({ X = num(x, 0), Y = num(y, 0) }, V2) end
  function m2.Dot(a, b) return a.X * b.X + a.Y * b.Y end
  function m2.Lerp(a, b, t) return v2(a.X + (b.X - a.X) * t, a.Y + (b.Y - a.Y) * t) end
  function m2.Abs(a) return v2(abs(a.X), abs(a.Y)) end
  function m2.Floor(a) return v2(floor(a.X), floor(a.Y)) end
  function m2.Max(a, b) return v2(math.max(a.X, b.X), math.max(a.Y, b.Y)) end
  function m2.Min(a, b) return v2(math.min(a.X, b.X), math.min(a.Y, b.Y)) end
  G.Vector2 = { new = v2, zero = v2(0, 0), one = v2(1, 1), xAxis = v2(1, 0), yAxis = v2(0, 1) }
  -- Vector3
  local m3 = {}
  V3 = datatype("Vector3", m3, { Magnitude = function(v) return sqrt(v.X * v.X + v.Y * v.Y + v.Z * v.Z) end,
    Unit = function(v) local m = sqrt(v.X * v.X + v.Y * v.Y + v.Z * v.Z); if m == 0 then return v end; return setmetatable({ X = v.X / m, Y = v.Y / m, Z = v.Z / m }, getmetatable(v)) end }, {
    __add = function(a, b) return setmetatable({ X = a.X + b.X, Y = a.Y + b.Y, Z = a.Z + b.Z }, getmetatable(a)) end,
    __sub = function(a, b) return setmetatable({ X = a.X - b.X, Y = a.Y - b.Y, Z = a.Z - b.Z }, getmetatable(a)) end,
    __mul = function(a, b) if type(a) == "number" then a, b = b, a end; if type(b) == "number" then return setmetatable({ X = a.X * b, Y = a.Y * b, Z = a.Z * b }, getmetatable(a)) end; return setmetatable({ X = a.X * b.X, Y = a.Y * b.Y, Z = a.Z * b.Z }, getmetatable(a)) end,
    __div = function(a, b) if type(b) == "number" then return setmetatable({ X = a.X / b, Y = a.Y / b, Z = a.Z / b }, getmetatable(a)) end; return setmetatable({ X = a.X / b.X, Y = a.Y / b.Y, Z = a.Z / b.Z }, getmetatable(a)) end,
    __unm = function(a) return setmetatable({ X = -a.X, Y = -a.Y, Z = -a.Z }, getmetatable(a)) end,
    __eq = function(a, b) return a.X == b.X and a.Y == b.Y and a.Z == b.Z end,
    __tostring = function(a) return a.X .. ", " .. a.Y .. ", " .. a.Z end })
  local function v3(x, y, z) return setmetatable({ X = num(x, 0), Y = num(y, 0), Z = num(z, 0) }, V3) end
  function m3.Dot(a, b) return a.X * b.X + a.Y * b.Y + a.Z * b.Z end
  function m3.Cross(a, b) return v3(a.Y * b.Z - a.Z * b.Y, a.Z * b.X - a.X * b.Z, a.X * b.Y - a.Y * b.X) end
  function m3.Lerp(a, b, t) return v3(a.X + (b.X - a.X) * t, a.Y + (b.Y - a.Y) * t, a.Z + (b.Z - a.Z) * t) end
  G.Vector3 = { new = v3, zero = v3(0, 0, 0), one = v3(1, 1, 1), xAxis = v3(1, 0, 0), yAxis = v3(0, 1, 0), zAxis = v3(0, 0, 1) }
  -- CFrame (translation only; rotation is not modelled)
  local CF = datatype("CFrame", {}, { Position = function(c) return v3(c.X, c.Y, c.Z) end }, {
    __mul = function(a, b) if b.Position == nil then return a end; return setmetatable({ X = a.X + b.X, Y = a.Y + b.Y, Z = a.Z + b.Z }, getmetatable(a)) end,
    __eq = function(a, b) return a.X == b.X and a.Y == b.Y and a.Z == b.Z end })
  local function cf(x, y, z) if type(x) == "table" then return setmetatable({ X = x.X, Y = x.Y, Z = x.Z }, CF) end; return setmetatable({ X = num(x, 0), Y = num(y, 0), Z = num(z, 0) }, CF) end
  G.CFrame = { new = cf, identity = cf(0, 0, 0) }
  -- UDim / UDim2
  UD = datatype("UDim", {}, nil, { __eq = function(a, b) return a.Scale == b.Scale and a.Offset == b.Offset end,
    __add = function(a, b) return setmetatable({ Scale = a.Scale + b.Scale, Offset = a.Offset + b.Offset }, getmetatable(a)) end,
    __sub = function(a, b) return setmetatable({ Scale = a.Scale - b.Scale, Offset = a.Offset - b.Offset }, getmetatable(a)) end,
    __tostring = function(a) return a.Scale .. ", " .. a.Offset end })
  local function ud(s, o) return setmetatable({ Scale = num(s, 0), Offset = num(o, 0) }, UD) end
  G.UDim = { new = ud }
  local m22 = {}
  UD2 = datatype("UDim2", m22, { Width = function(u) return u.X end, Height = function(u) return u.Y end }, {
    __eq = function(a, b) return a.X == b.X and a.Y == b.Y end,
    __add = function(a, b) return setmetatable({ X = a.X + b.X, Y = a.Y + b.Y }, getmetatable(a)) end,
    __sub = function(a, b) return setmetatable({ X = a.X - b.X, Y = a.Y - b.Y }, getmetatable(a)) end,
    __tostring = function(a) return "{" .. tostring(a.X) .. "}, {" .. tostring(a.Y) .. "}" end })
  local function ud2(a, b, c, d)
    if type(a) == "table" then return setmetatable({ X = a, Y = b }, UD2) end
    return setmetatable({ X = ud(a, b), Y = ud(c, d) }, UD2)
  end
  function m22.Lerp(a, b, t)
    local function l(x, y) return ud(x.Scale + (y.Scale - x.Scale) * t, x.Offset + (y.Offset - x.Offset) * t) end
    return ud2(l(a.X, b.X), l(a.Y, b.Y))
  end
  G.UDim2 = { new = ud2, fromScale = function(x, y) return ud2(x, 0, y, 0) end, fromOffset = function(x, y) return ud2(0, x, 0, y) end }
  -- Color3
  local mc = {}
  C3 = datatype("Color3", mc, nil, { __eq = function(a, b) return a.R == b.R and a.G == b.G and a.B == b.B end, __tostring = function(a) return a.R .. ", " .. a.G .. ", " .. a.B end })
  local function c3(r, g, b) return setmetatable({ R = num(r, 0), G = num(g, 0), B = num(b, 0) }, C3) end
  local function hsv(h, s, v)
    h = (h % 1) * 6; local i = floor(h); local f = h - i
    local p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    local r, g, b = v, t, p
    if i == 1 then r, g, b = q, v, p elseif i == 2 then r, g, b = p, v, t elseif i == 3 then r, g, b = p, q, v elseif i == 4 then r, g, b = t, p, v elseif i == 5 then r, g, b = v, p, q end
    return c3(r, g, b)
  end
  function mc.Lerp(a, b, t) return c3(a.R + (b.R - a.R) * t, a.G + (b.G - a.G) * t, a.B + (b.B - a.B) * t) end
  function mc.ToHSV(c)
    local mx, mn = math.max(c.R, c.G, c.B), math.min(c.R, c.G, c.B); local d = mx - mn
    local h = 0
    if d > 0 then if mx == c.R then h = ((c.G - c.B) / d) % 6 elseif mx == c.G then h = (c.B - c.R) / d + 2 else h = (c.R - c.G) / d + 4 end; h = h / 6 end
    return h, mx == 0 and 0 or d / mx, mx
  end
  function mc.ToHex(c) return string.format("%02X%02X%02X", floor(c.R * 255 + 0.5), floor(c.G * 255 + 0.5), floor(c.B * 255 + 0.5)) end
  G.Color3 = { new = c3, fromRGB = function(r, g, b) return c3(num(r, 0) / 255, num(g, 0) / 255, num(b, 0) / 255) end, fromHSV = hsv,
    fromHex = function(s) s = string.gsub(tostring(s), "^#", ""); if #s == 3 then s = string.gsub(s, ".", "%0%0") end; s = string.sub(s .. "000000", 1, 6); return c3((tonumber(string.sub(s, 1, 2), 16) or 0) / 255, (tonumber(string.sub(s, 3, 4), 16) or 0) / 255, (tonumber(string.sub(s, 5, 6), 16) or 0) / 255) end }
  -- Rect, ranges, sequences
  RectT = datatype("Rect", {}, { Width = function(r) return r.Max.X - r.Min.X end, Height = function(r) return r.Max.Y - r.Min.Y end }, {
    __eq = function(a, b) return a.Min == b.Min and a.Max == b.Max end, __tostring = function(a) return tostring(a.Min) .. ", " .. tostring(a.Max) end })
  G.Rect = { new = function(a, b, c, d) if type(a) == "table" then return setmetatable({ Min = a, Max = b }, RectT) end; return setmetatable({ Min = v2(a, b), Max = v2(c, d) }, RectT) end }
  local NR = datatype("NumberRange", {}, nil, { __eq = function(a, b) return a.Min == b.Min and a.Max == b.Max end })
  G.NumberRange = { new = function(a, b) return setmetatable({ Min = a, Max = b or a }, NR) end }
  local NK = datatype("NumberSequenceKeypoint", {}); local CK = datatype("ColorSequenceKeypoint", {})
  G.NumberSequenceKeypoint = { new = function(t, v, e) return setmetatable({ Time = t, Value = v, Envelope = num(e, 0) }, NK) end }
  G.ColorSequenceKeypoint = { new = function(t, v) return setmetatable({ Time = t, Value = v }, CK) end }
  local NS = datatype("NumberSequence", {}); local CS = datatype("ColorSequence", {})
  G.NumberSequence = { new = function(a, b)
    if type(a) == "table" then return setmetatable({ Keypoints = a }, NS) end
    return setmetatable({ Keypoints = { G.NumberSequenceKeypoint.new(0, a), G.NumberSequenceKeypoint.new(1, num(b, a)) } }, NS) end }
  G.ColorSequence = { new = function(a, b)
    if typeof(a) == "table" and getmetatable(a) == nil then return setmetatable({ Keypoints = a }, CS) end
    return setmetatable({ Keypoints = { G.ColorSequenceKeypoint.new(0, a), G.ColorSequenceKeypoint.new(1, b or a) } }, CS) end }
  -- Font, TweenInfo
  local FontT = datatype("Font", {}, { Bold = function(f) return f.Weight.Value >= 700 end }, { __eq = function(a, b) return a.Family == b.Family and a.Weight == b.Weight and a.Style == b.Style end })
  local function font(family, weight, style) return setmetatable({ Family = family, Weight = weight or E.FontWeight.Regular, Style = style or E.FontStyle.Normal }, FontT) end
  G.Font = { new = font, fromEnum = function(e) return font("rbxasset://fonts/families/" .. e.Name .. ".json") end,
    fromName = function(n, w, s) return font("rbxasset://fonts/families/" .. n .. ".json", w, s) end, fromId = function(id, w, s) return font("rbxassetid://" .. id, w, s) end }
  local TI = datatype("TweenInfo", {})
  G.TweenInfo = { new = function(t, es, ed, rc, rev, dl) return setmetatable({ Time = num(t, 1), EasingStyle = es or E.EasingStyle.Quad, EasingDirection = ed or E.EasingDirection.Out, RepeatCount = num(rc, 0), Reverses = rev or false, DelayTime = num(dl, 0) }, TI) end }
  -- Random (xorshift32), DateTime
  local RM = {}
  local RND = datatype("Random", RM)
  local function rnext(r) local x = r.s; x = bit32.bxor(x, bit32.lshift(x, 13)); x = bit32.bxor(x, bit32.rshift(x, 17)); x = bit32.bxor(x, bit32.lshift(x, 5)); r.s = x; return x / 4294967296 end
  function RM.NextNumber(r, a, b) local n = rnext(r); if a then return a + n * (b - a) end; return n end
  function RM.NextInteger(r, a, b) return a + floor(rnext(r) * (b - a + 1)) end
  G.Random = { new = function(seed) seed = floor(num(seed, os.time())) % 4294967296; if seed == 0 then seed = 2463534242 end; return setmetatable({ s = seed }, RND) end }
  local DT = datatype("DateTime", {}, nil, {})
  local function dtime(ms) return setmetatable({ UnixTimestampMillis = ms, UnixTimestamp = floor(ms / 1000) }, DT) end
  G.DateTime = { now = function() return dtime(floor(host.now() * 1000)) end, fromUnixTimestamp = function(s) return dtime(s * 1000) end, fromUnixTimestampMillis = dtime }
end

-- ===== Scheduler + signals =====
local resume, newSignal, fire
local sched = { now = 0, seq = 0, sleepers = {}, deferred = {}, deadHooks = setmetatable({}, { __mode = "k" }), waiting = {}, nextId = 0 }
RT.sched = sched
local function reportError(err, co)
  local tb = ""
  if co then local ok, t = pcall(debug.traceback, co); if ok and t then tb = "\n" .. t end end
  local msg = tostring(err)
  if #RT.errors < 500 then RT.errors[#RT.errors + 1] = msg end
  log("error", msg .. tb)
end
function resume(co, ...)
  local ok, err = coroutine.resume(co, ...)
  if coroutine.status(co) == "dead" then
    local h = sched.deadHooks[co]
    if h then sched.deadHooks[co] = nil; h(ok, err) elseif not ok then reportError(err, co) end
  end
  return ok, err
end
local function spawnFn(fn, ...) local co = coroutine.create(fn); resume(co, ...); return co end
do
  local SigMT, ConMT = { __type = "RBXScriptSignal" }, { __type = "RBXScriptConnection" }
  local sm = {}
  SigMT.__index = sm
  ConMT.__index = { Disconnect = function(c)
    if not c.Connected then return end
    c.Connected = false
    local list = c.sig.conns
    for i = 1, #list do if list[i] == c then table.remove(list, i); break end end
  end }
  function newSignal() return setmetatable({ conns = {}, waiters = {} }, SigMT) end
  function sm.Connect(s, fn)
    if type(fn) ~= "function" then error("Attempt to connect failed: Passed value is not a function", 2) end
    local c = setmetatable({ Connected = true, fn = fn, sig = s }, ConMT); s.conns[#s.conns + 1] = c; return c
  end
  sm.ConnectParallel = sm.Connect; sm.connect = sm.Connect; sm.wait = function(...) return sm.Wait(...) end
  function sm.Once(s, fn) local c; c = s:Connect(function(...) c:Disconnect(); return fn(...) end); return c end
  function sm.Wait(s)
    if not coroutine.isyieldable() then error("Signal:Wait() called outside a yieldable thread", 2) end
    s.waiters[#s.waiters + 1] = coroutine.running(); return coroutine.yield()
  end
  function fire(s, ...)
    if not s then return end
    local conns = s.conns
    if #conns > 0 then
      local snap = table.clone(conns)
      for i = 1, #snap do local c = snap[i]; if c.Connected then spawnFn(c.fn, ...) end end
    end
    if #s.waiters > 0 then local w = s.waiters; s.waiters = {}; for i = 1, #w do resume(w[i], ...) end end
  end
  local function disconnectAll(s) for _, c in ipairs(s.conns) do c.Connected = false end; s.conns = {} end
  RT.disconnectAll = disconnectAll
end
do
  local function runDeferred()
    local guard = 0
    while #sched.deferred > 0 and guard < 10000 do
      guard += 1
      local q = sched.deferred; sched.deferred = {}
      for _, t in ipairs(q) do if not t.cancelled then spawnFn(t.fn, table.unpack(t.args, 1, t.n)) end end
    end
  end
  local function sleep(t, co, fn, args)
    sched.seq += 1
    local s = { t = sched.now + math.max(t or 0, 0), start = sched.now, co = co, fn = fn, args = args, seq = sched.seq }
    sched.sleepers[#sched.sleepers + 1] = s; return s
  end
  local task = {}
  function task.wait(t)
    if not coroutine.isyieldable() then error("task.wait called outside a yieldable thread", 2) end
    local s = sleep(t, coroutine.running()); coroutine.yield(); return sched.now - s.start
  end
  function task.spawn(f, ...)
    if type(f) == "thread" then resume(f, ...); return f end
    return spawnFn(f, ...)
  end
  function task.defer(f, ...)
    local co = type(f) == "thread" and f or coroutine.create(f)
    local args = table.pack(...)
    sched.deferred[#sched.deferred + 1] = { fn = function(...) resume(co, ...) end, args = args, n = args.n, co = co }; return co
  end
  function task.delay(t, f, ...)
    local co = type(f) == "thread" and f or coroutine.create(f)
    sleep(t, co, nil, table.pack(...)); return co
  end
  function task.cancel(co)
    for _, s in ipairs(sched.sleepers) do if s.co == co then s.cancelled = true end end
    for _, d in ipairs(sched.deferred) do if d.co == co then d.cancelled = true end end
    if coroutine.status(co) == "suspended" then pcall(coroutine.close, co) end
  end
  RT.sleep = sleep
  task.synchronize = function() end; task.desynchronize = function() end
  G.task = task
  G.wait = function(t) return task.wait(t), sched.now end
  G.delay = function(t, f) task.delay(t, f) end
  G.spawn = function(f, ...) return task.defer(f, ...) end
  G.tick = function() return host.now() end
  G.time = function() return sched.now end
  G.elapsedTime = G.time
  G.version = function() return "0.0.0.0" end
  G.printidentity = function() end
  RT.runDeferred = runDeferred
  function RT.step(dt)
    sched.now += dt
    runDeferred()
    local due, keep = {}, {}
    for _, s in ipairs(sched.sleepers) do if s.t <= sched.now then due[#due + 1] = s else keep[#keep + 1] = s end end
    sched.sleepers = keep
    table.sort(due, function(a, b) if a.t == b.t then return a.seq < b.seq end; return a.t < b.t end)
    for _, s in ipairs(due) do
      if not s.cancelled then
        if s.co and coroutine.status(s.co) == "suspended" then
          if s.args then resume(s.co, table.unpack(s.args, 1, s.args.n)) else resume(s.co) end
        end
      end
    end
    runDeferred()
    if RT.afterStep then RT.afterStep(dt) end
    runDeferred()
  end
  -- Generic async bridge: RT.await(kind, payloadString) yields the current thread until JS calls __wb.complete(id, ok, string).
  function RT.await(kind, payload)
    if not coroutine.isyieldable() then error("cannot yield here (" .. kind .. ")", 2) end
    sched.nextId += 1; local id = sched.nextId
    sched.waiting[id] = coroutine.running()
    host.async(kind, id, payload or "")
    local ok, res = coroutine.yield()
    return ok, res
  end
  function RT.complete(id, ok, res) local co = sched.waiting[id]; sched.waiting[id] = nil; if co then resume(co, ok, res) end; runDeferred() end
end

-- ===== Instance system =====
local classes = {}
local InstMT = { __type = "Instance" }
local byPath = {}
local nextId = 0
local fullName, ensure, setParent, kidsOf, destroyInner
local function isInst(v) return type(v) == "table" and D[v] ~= nil end
local function copyInto(dst, src) for k, v in pairs(src) do dst[k] = v end; return dst end
local function class(name, super, spec)
  spec = spec or {}
  local f = { lenient = spec.lenient, name = name, chain = { [name] = true }, props = {}, events = {}, methods = {}, readonly = {}, computed = {}, inits = {}, service = spec.service, notCreatable = spec.notCreatable, valueBase = spec.valueBase }
  local s = super and classes[super]
  if s then
    copyInto(f.chain, s.chain); copyInto(f.props, s.props); copyInto(f.events, s.events); copyInto(f.methods, s.methods)
    copyInto(f.readonly, s.readonly); copyInto(f.computed, s.computed); for i, v in ipairs(s.inits) do f.inits[i] = v end
    f.valueBase = f.valueBase or s.valueBase
  end
  if spec.props then for k, v in pairs(spec.props) do if v == false then f.props[k] = false else f.props[k] = v end end end
  if spec.events then for _, e in ipairs(spec.events) do f.events[e] = true end end
  if spec.methods then copyInto(f.methods, spec.methods) end
  if spec.readonly then for _, k in ipairs(spec.readonly) do f.readonly[k] = true end end
  if spec.computed then for k, fn in pairs(spec.computed) do f.computed[k] = fn; f.readonly[k] = true; if f.props[k] == nil then f.props[k] = NIL end end end
  if spec.init then f.inits[#f.inits + 1] = spec.init end
  classes[name] = f
  return f
end
RT.classes = classes
local function newInst(cname)
  local info = classes[cname]
  nextId += 1
  local o = setmetatable({}, InstMT)
  D[o] = { class = cname, info = info, name = cname, kids = {}, props = {}, signals = {}, attrs = {}, tags = {}, id = nextId }
  for _, init in ipairs(info.inits) do init(o, D[o]) end
  return o
end
local function attach(parent, child) -- silent: no events (used while building services/trees)
  local cd, pd = D[child], D[parent]
  cd.parent = parent; pd.kids[#pd.kids + 1] = child
end
local function addChild(parent, cname, name)
  local c = newInst(cname); if name then D[c].name = name end; attach(parent, c); return c
end
local function sig(d, key) local s = d.signals[key]; if not s then s = newSignal(); d.signals[key] = s end; return s end
local function fireSig(d, key, ...) local s = d.signals[key]; if s then fire(s, ...) end end
local function notify(self, d, k, v)
  fireSig(d, "prop:" .. k)
  if d.info.valueBase and k == "Value" then fireSig(d, "Changed", v) else fireSig(d, "Changed", k) end
  local hs = RT.hooks; for i = 1, #hs do hs[i](self, k, v) end
end
function ensure(self, d)
  if d.lazy then
    d.lazy = nil
    local names, cls = host.children(d.path)
    for i, nm in ipairs(names) do
      local c = RT.nodeFor(d.path .. "/" .. nm, cls[i]); attach(self, c)
    end
  end
end
function kidsOf(self) local d = D[self]; ensure(self, d); return d.kids end
function RT.nodeFor(path, cls)
  local o = byPath[path]
  if o then return o end
  if not classes[cls or ""] then cls = "Folder" end
  o = newInst(cls); local d = D[o]; d.path = path; d.name = nameOf(path); d.lazy = true; byPath[path] = o
  return o
end
function fullName(self)
  local parts, o = {}, self
  while o do local d = D[o]; if d.class == "DataModel" then break end; table.insert(parts, 1, d.name); o = d.parent end
  if #parts == 0 then return D[self].name end
  return table.concat(parts, ".")
end
local function eachLoaded(self, f) local d = D[self]; f(self); if not d.lazy then for _, c in ipairs(table.clone(d.kids)) do eachLoaded(c, f) end end end
local function ancestorsWith(p, key) local out = {}; local a = p; while a do local d = D[a]; if d.signals[key] then out[#out + 1] = d end; a = d.parent end; return out end
function setParent(self, p)
  local d = D[self]
  if d.locked then error("The Parent property of " .. d.name .. " is locked", 3) end
  if p ~= nil and not isInst(p) then error("Attempt to set Parent to a non-Instance value", 3) end
  if p == d.parent then return end
  if p then local a = p; while a do if a == self then error("Attempt to set " .. fullName(self) .. " as its own ancestor", 3) end; a = D[a].parent end end
  local old = d.parent
  if old then
    local rem = ancestorsWith(old, "DescendantRemoving")
    for _, ad in ipairs(rem) do eachLoaded(self, function(x) fire(ad.signals.DescendantRemoving, x) end) end
    local od = D[old]; for i, c in ipairs(od.kids) do if c == self then table.remove(od.kids, i); break end end
  end
  d.parent = p
  if p then local pd = D[p]; ensure(p, pd); pd.kids[#pd.kids + 1] = self end
  if old then fireSig(D[old], "ChildRemoved", self) end
  if p then fireSig(D[p], "ChildAdded", self) end
  eachLoaded(self, function(x) local xd = D[x]; fireSig(xd, "AncestryChanged", self, p) end)
  if p then local add = ancestorsWith(p, "DescendantAdded"); for _, ad in ipairs(add) do eachLoaded(self, function(x) fire(ad.signals.DescendantAdded, x) end) end end
  if d.tags and next(d.tags) and RT.tagParentChanged then RT.tagParentChanged(self, d) end
  notify(self, d, "Parent", p)
end
function destroyInner(self)
  local d = D[self]
  if d.destroyed then return end
  d.destroyed = true; d.locked = true
  fireSig(d, "Destroying")
  if not d.lazy then for _, c in ipairs(table.clone(d.kids)) do destroyInner(c) end end
  for _, s in pairs(d.signals) do RT.disconnectAll(s) end
end

local base = {}
local function checkName(n, level) if type(n) ~= "string" then error("Argument 1 missing or nil", level or 3) end end
function base.GetChildren(self) return table.clone(kidsOf(self)) end
function base.GetDescendants(self)
  local out = {}
  local function walk(n) for _, c in ipairs(kidsOf(n)) do out[#out + 1] = c; walk(c) end end
  walk(self); return out
end
function base.FindFirstChild(self, name, recursive)
  checkName(name)
  for _, c in ipairs(kidsOf(self)) do if D[c].name == name then return c end end
  if recursive then for _, c in ipairs(kidsOf(self)) do local r = base.FindFirstChild(c, name, true); if r then return r end end end
  return nil
end
function base.FindFirstChildOfClass(self, cn) for _, c in ipairs(kidsOf(self)) do if D[c].class == cn then return c end end end
function base.FindFirstChildWhichIsA(self, cn, recursive)
  for _, c in ipairs(kidsOf(self)) do if D[c].info.chain[cn] then return c end end
  if recursive then for _, c in ipairs(kidsOf(self)) do local r = base.FindFirstChildWhichIsA(c, cn, true); if r then return r end end end
end
function base.FindFirstAncestor(self, name) local a = D[self].parent; while a do if D[a].name == name then return a end; a = D[a].parent end end
function base.FindFirstAncestorOfClass(self, cn) local a = D[self].parent; while a do if D[a].class == cn then return a end; a = D[a].parent end end
function base.FindFirstAncestorWhichIsA(self, cn) local a = D[self].parent; while a do if D[a].info.chain[cn] then return a end; a = D[a].parent end end
function base.WaitForChild(self, name, timeout)
  checkName(name)
  local c = base.FindFirstChild(self, name)
  if c then return c end
  if not coroutine.isyieldable() then error("Infinite yield possible: " .. name .. " is not a child of " .. fullName(self) .. " (WaitForChild called outside a thread)", 2) end
  local co, done, result, timer = coroutine.running(), false, nil, nil
  local conn; conn = sig(D[self], "ChildAdded"):Connect(function(ch) if D[ch].name == name and not done then done = true; conn:Disconnect(); result = ch; if timer then timer.cancelled = true end; resume(co) end end)
  if timeout then timer = RT.sleep(timeout, co) end
  coroutine.yield(); conn:Disconnect()
  return result
end
function base.IsA(self, cn) return D[self].info.chain[cn] == true end
function base.IsAncestorOf(self, o) local a = D[o].parent; while a do if a == self then return true end; a = D[a].parent end; return false end
function base.IsDescendantOf(self, o) return base.IsAncestorOf(o, self) end
function base.GetFullName(self) return fullName(self) end
function base.GetDebugId(self) return "WB" .. D[self].id end
function base.ClearAllChildren(self) for _, c in ipairs(table.clone(kidsOf(self))) do base.Destroy(c) end end
function base.Destroy(self) local d = D[self]; if d.destroyed then return end; if d.parent then setParent(self, nil) end; destroyInner(self) end
function base.Remove(self) base.Destroy(self) end
function base.GetPropertyChangedSignal(self, prop) return sig(D[self], "prop:" .. prop) end
function base.GetAttribute(self, k) return D[self].attrs[k] end
function base.GetAttributes(self) return table.clone(D[self].attrs) end
function base.SetAttribute(self, k, v)
  local d = D[self]; if d.attrs[k] == v then return end
  d.attrs[k] = v; fireSig(d, "attr:" .. k); fireSig(d, "AttributeChanged", k)
end
function base.GetAttributeChangedSignal(self, k) return sig(D[self], "attr:" .. k) end
function base.AddTag(self, t) D[self].tags[t] = true; if RT.tagAdded then RT.tagAdded(self, t) end end
function base.RemoveTag(self, t) D[self].tags[t] = nil; if RT.tagRemoved then RT.tagRemoved(self, t) end end
function base.HasTag(self, t) return D[self].tags[t] == true end
function base.GetTags(self) local o = {}; for t in pairs(D[self].tags) do o[#o + 1] = t end; return o end
function base.Clone(self)
  local d = D[self]
  if d.info.notCreatable then return nil end
  local o = newInst(d.class); local od = D[o]
  od.name = d.name; od.path = d.path
  copyInto(od.props, d.props); copyInto(od.attrs, d.attrs); copyInto(od.tags, d.tags)
  for _, c in ipairs(kidsOf(self)) do local cc = base.Clone(c); if cc then attach(o, cc) end end
  return o
end
local baseEvents = { "Changed", "ChildAdded", "ChildRemoved", "DescendantAdded", "DescendantRemoving", "AncestryChanged", "Destroying", "AttributeChanged" }
class("Instance", nil, { props = { Archivable = true }, events = baseEvents, methods = base })
RT.base = base

InstMT.__tostring = function(self) return D[self].name end
InstMT.__index = function(self, k)
  local d = D[self]
  if k == "Name" or k == "name" then return d.name elseif k == "ClassName" then return d.class elseif k == "Parent" then return d.parent end
  local info = d.info
  local comp = info.computed[k]
  if comp then return comp(self, d) end
  local dv = info.props[k]
  if dv ~= nil then
    local v = d.props[k]; if v == nil then v = dv end
    if v == NIL then return nil end
    return v
  end
  local m = info.methods[k]; if m then return m end
  if info.events[k] then return sig(d, k) end
  ensure(self, d)
  for _, c in ipairs(d.kids) do if D[c].name == k then return c end end
  if info.lenient then RT.lenient[d.class .. "." .. tostring(k)] = true; return noopAny end
  error(tostring(k) .. " is not a valid member of " .. d.class .. " \"" .. fullName(self) .. "\"", 2)
end
InstMT.__newindex = function(self, k, v)
  local d = D[self]
  if k == "Parent" then return setParent(self, v) end
  if k == "Name" then checkName(v, 2); d.name = v; notify(self, d, "Name", v); return end
  local info = d.info
  if info.props[k] ~= nil then
    if info.readonly[k] then error("Unable to assign property " .. k .. ". Property is read only", 2) end
    if d.props[k] == v then return end
    if v == nil then d.props[k] = NIL else d.props[k] = v end
    notify(self, d, k, v); return
  end
  error(tostring(k) .. " is not a valid member of " .. d.class .. " \"" .. fullName(self) .. "\"", 2)
end
-- raw set for the engine (layout results etc.): bypasses read-only, still notifies
function RT.setRaw(inst, k, v) local d = D[inst]; if d.props[k] == v then return end; if v == nil then d.props[k] = NIL else d.props[k] = v end; notify(inst, d, k, v) end
function RT.isInstance(v) return isInst(v) end
RT.D = D; RT.NIL = NIL
function RT.kidsOf(o) return kidsOf(o) end
function RT.fire(o, key, ...) fireSig(D[o], key, ...) end
G.Instance = { new = function(cn, parent)
  local info = classes[cn]
  if not info or info.notCreatable then error("Unable to create an Instance of type \"" .. tostring(cn) .. "\"", 2) end
  local o = newInst(cn)
  if parent then setParent(o, parent) end
  return o
end }

-- ===== Classes: values, remotes, GUI =====
local v2, u2, c3 = G.Vector2.new, G.UDim2.new, G.Color3.new
local function merge(...) local o = {}; for _, t in ipairs({ ... }) do copyInto(o, t) end; return o end
local function list(s) local o = {}; for w in string.gmatch(s, "[^%s]+") do o[#o + 1] = w end; return o end
for _, v in ipairs({ { "StringValue", "" }, { "IntValue", 0 }, { "NumberValue", 0 }, { "BoolValue", false }, { "ObjectValue", NIL }, { "Color3Value", c3(0, 0, 0) }, { "Vector3Value", G.Vector3.new() }, { "CFrameValue", G.CFrame.new() } }) do
  class(v[1], "Instance", { valueBase = true, props = { Value = v[2] } })
end
class("Folder", "Instance"); class("Configuration", "Instance"); class("Model", "Instance"); class("Part", "Instance", { props = { Size = G.Vector3.new(4, 1, 2), Position = G.Vector3.new() } })
class("ModuleScript", "Instance", { props = { Source = "" } })
class("LocalScript", "Instance", { props = { Source = "", Disabled = false, Enabled = true } }); class("Script", "Instance", { props = { Source = "", Disabled = false } })
class("LocalizationTable", "Instance", { props = { Contents = "", SourceLocaleId = "en-us" } })
class("BindableEvent", "Instance", { events = { "Event" }, methods = { Fire = function(self, ...) fireSig(D[self], "Event", ...) end } })
class("BindableFunction", "Instance", { props = { OnInvoke = NIL }, methods = { Invoke = function(self, ...) local f = self.OnInvoke; if f then return f(...) end end } })
class("RemoteEvent", "Instance", { events = { "OnClientEvent" }, methods = {
  FireServer = function(self, ...) if RT.remote then RT.remote(self, "FireServer", ...) end end } })
class("RemoteFunction", "Instance", { props = { OnClientInvoke = NIL }, methods = {
  InvokeServer = function(self, ...) if RT.remote then return RT.remote(self, "InvokeServer", ...) end end } })
class("UnreliableRemoteEvent", "RemoteEvent")
class("Sound", "Instance", { props = { SoundId = "", Volume = 0.5, Playing = false, Looped = false, TimePosition = 0, PlaybackSpeed = 1, IsLoaded = true }, events = { "Played", "Ended", "Loaded" },
  methods = { Play = function() end, Stop = function() end, Pause = function() end, Resume = function() end } })
class("Camera", "Instance", { props = { CFrame = G.CFrame.new(), FieldOfView = 70, ViewportSize = v2(1280, 720), CameraType = E.CameraType.Custom, CameraSubject = NIL, Focus = G.CFrame.new() } })

-- GUI
local white, black, gray = c3(1, 1, 1), c3(0, 0, 0), c3(0.639, 0.635, 0.647)
local guiBase = { AbsolutePosition = v2(0, 0), AbsoluteSize = v2(0, 0), AbsoluteRotation = 0, Visible = true, AutoLocalize = true, RootLocalizationTable = NIL, SelectionBehaviorUp = E.SelectionBehavior.Escape,
  SelectionBehaviorDown = E.SelectionBehavior.Escape, SelectionBehaviorLeft = E.SelectionBehavior.Escape, SelectionBehaviorRight = E.SelectionBehavior.Escape }
class("GuiBase", "Instance"); class("GuiBase2d", "GuiBase", { props = guiBase, readonly = { "AbsolutePosition", "AbsoluteSize", "AbsoluteRotation" }, events = { "SelectionChanged" } })
local guiObject = { Active = false, AnchorPoint = v2(0, 0), AutomaticSize = E.AutomaticSize.None, BackgroundColor3 = gray, BackgroundTransparency = 0, BorderColor3 = black,
  BorderMode = E.BorderMode.Outline, BorderSizePixel = 1, ClipsDescendants = false, LayoutOrder = 0, Position = u2(), Size = u2(), SizeConstraint = E.SizeConstraint.RelativeXY,
  Rotation = 0, Selectable = true, SelectionGroup = false, SelectionImageObject = NIL, SelectionOrder = 0, ZIndex = 1, NextSelectionUp = NIL, NextSelectionDown = NIL, NextSelectionLeft = NIL, NextSelectionRight = NIL, Interactable = true }
local function noop() end
class("GuiObject", "GuiBase2d", { props = guiObject,
  events = { "InputBegan", "InputChanged", "InputEnded", "MouseEnter", "MouseLeave", "MouseMoved", "MouseWheelBackward", "MouseWheelForward", "SelectionGained", "SelectionLost",
    "TouchLongPress", "TouchPan", "TouchPinch", "TouchRotate", "TouchSwipe", "TouchTap" },
  methods = { TweenSize = noop, TweenPosition = noop, TweenSizeAndPosition = noop } })
local textProps = { FontSize = E.FontSize.Size14, Text = "", TextColor3 = black, TextSize = 14, TextTransparency = 0, TextStrokeColor3 = black, TextStrokeTransparency = 1, TextWrapped = false, TextScaled = false,
  RichText = false, TextXAlignment = E.TextXAlignment.Center, TextYAlignment = E.TextYAlignment.Center, TextTruncate = E.TextTruncate.None, LineHeight = 1, MaxVisibleGraphemes = -1,
  Font = E.Font.SourceSans, FontFace = G.Font.new("rbxasset://fonts/families/SourceSansPro.json"), TextDirection = E.TextDirection.LeftToRight, LocalizationMatchIdentifier = "", LocalizationMatchedSourceText = "", ContentText = "" }
local function textBounds(self, d)
  local w, h = host.measure(self.Text, self.TextSize, self.FontFace.Family, self.TextWrapped and self.AbsoluteSize.X or 0)
  return v2(w, h)
end
local textComputed = { TextBounds = textBounds, TextFits = function() return true end }
class("TextLabel", "GuiObject", { props = merge(textProps, { Text = "Label" }), computed = textComputed })
class("GuiButton", "GuiObject", { props = { AutoButtonColor = true, Modal = false, Style = E.Font.Legacy, Selected = false }, events = { "Activated", "MouseButton1Click", "MouseButton1Down", "MouseButton1Up", "MouseButton2Click", "MouseButton2Down", "MouseButton2Up", "TouchTap", "SecondaryActivated" } })
class("TextButton", "GuiButton", { props = merge(textProps, { Text = "Button" }), computed = textComputed })
class("TextBox", "GuiObject", { props = merge(textProps, { Text = "TextBox", ClearTextOnFocus = true, MultiLine = false, PlaceholderText = "", PlaceholderColor3 = c3(0.7, 0.7, 0.7), TextEditable = true, ShowNativeInput = true, CursorPosition = -1, SelectionStart = -1, ContentText = "" }),
  computed = merge(textComputed, { }), events = { "Focused", "FocusLost", "ReturnPressed" },
  methods = { CaptureFocus = function(self) RT.focusedTextBox = self; fireSig(D[self], "Focused") end, ReleaseFocus = function(self, submitted) if RT.focusedTextBox == self then RT.focusedTextBox = nil end; fireSig(D[self], "FocusLost", submitted or false, nil) end, IsFocused = function(self) return RT.focusedTextBox == self end } })
local imageProps = { Image = "", ImageColor3 = white, ImageTransparency = 0, ImageRectOffset = v2(0, 0), ImageRectSize = v2(0, 0), ScaleType = E.ScaleType.Stretch, SliceCenter = G.Rect.new(0, 0, 0, 0), SliceScale = 1, TileSize = u2(1, 0, 1, 0), ResampleMode = E.ResamplerMode.Default, IsLoaded = true }
class("ImageLabel", "GuiObject", { props = merge(imageProps, { BackgroundColor3 = gray }) })
class("ImageButton", "GuiButton", { props = merge(imageProps, { HoverImage = "", PressedImage = "" }) })
class("Frame", "GuiObject", { props = { Style = E.Font.Legacy } }); class("CanvasGroup", "GuiObject", { props = { GroupColor3 = white, GroupTransparency = 0 } })
class("ViewportFrame", "GuiObject", { props = { Ambient = c3(0.5, 0.5, 0.5), LightColor = white, CurrentCamera = NIL, ImageColor3 = white, ImageTransparency = 0 } })
class("ScrollingFrame", "GuiObject", { props = { CanvasPosition = v2(0, 0), CanvasSize = u2(0, 0, 2, 0), AutomaticCanvasSize = E.AutomaticSize.None, ScrollBarThickness = 12, AbsoluteCanvasSize = v2(0, 0), ScrollBarImageColor3 = c3(0, 0, 0), ScrollBarImageTransparency = 0,
  ScrollingEnabled = true, ScrollingDirection = E.ScrollingDirection.XY, ElasticBehavior = E.ElasticBehavior.WhenScrollable, VerticalScrollBarInset = E.ScrollBarInset.None, HorizontalScrollBarInset = E.ScrollBarInset.None,
  VerticalScrollBarPosition = E.VerticalScrollBarPosition.Right, TopImage = "", MidImage = "", BottomImage = "", ScrollBarImageColor3 = white, AbsoluteWindowSize = v2(0, 0), VerticalScrollBarVisible = true, ClipsDescendants = true }, readonly = { "AbsoluteWindowSize", "AbsoluteCanvasSize" },
  methods = { ScrollToTop = noop } })
class("LayerCollector", "GuiBase2d", { props = { Enabled = true, ResetOnSpawn = true, ZIndexBehavior = E.ZIndexBehavior.Sibling } })
class("ScreenGui", "LayerCollector", { props = { DisplayOrder = 0, IgnoreGuiInset = false, ScreenInsets = E.ScreenInsets.CoreUISafeInsets, SafeAreaCompatibility = E.SafeAreaCompatibility.FullscreenExtension, ClipToDeviceSafeArea = true, SelectionImageObject = NIL } })
class("BillboardGui", "LayerCollector", { props = { Size = u2(), Active = false, Adornee = NIL, AlwaysOnTop = false, StudsOffset = G.Vector3.new() } })
class("SurfaceGui", "LayerCollector", { props = { Face = 0, Adornee = NIL, CanvasSize = v2(800, 600), AlwaysOnTop = false } })
class("BasePlayerGui", "Instance", { methods = { GetGuiObjectsAtPosition = function() return {} end, GetTopbarInset = function() return G.Rect.new(0, 0, 0, 36) end } })
class("PlayerGui", "BasePlayerGui", { props = { CurrentScreenOrientation = E.ScreenOrientation.LandscapeLeft, ScreenOrientation = E.ScreenOrientation.LandscapeLeft, SelectionImageObject = NIL } })
class("CoreGui", "BasePlayerGui", { service = true, props = { SelectionImageObject = NIL }, init = function(self) addChild(self, "ScreenGui", "RobloxGui") end })
-- UI modifiers
class("UIBase", "Instance"); class("UIComponent", "UIBase"); class("UILayout", "UIComponent", { props = { SortOrder = E.SortOrder.LayoutOrder } })
local flex = { HorizontalFlex = E.UIFlexAlignment.None, VerticalFlex = E.UIFlexAlignment.None, ItemLineAlignment = E.ItemLineAlignment.Automatic, Wraps = false }
class("UIListLayout", "UILayout", { props = merge(flex, { FillDirection = E.FillDirection.Vertical, HorizontalAlignment = E.HorizontalAlignment.Left, VerticalAlignment = E.VerticalAlignment.Top, Padding = G.UDim.new(), AbsoluteContentSize = v2(0, 0) }), readonly = { "AbsoluteContentSize" } })
class("UIGridLayout", "UILayout", { props = { FillDirection = E.FillDirection.Horizontal, HorizontalAlignment = E.HorizontalAlignment.Left, VerticalAlignment = E.VerticalAlignment.Top, CellPadding = u2(0, 5, 0, 5), CellSize = u2(0, 100, 0, 100), StartCorner = E.StartCorner.TopLeft, FillDirectionMaxCells = 0, AbsoluteCellCount = v2(0, 0), AbsoluteCellSize = v2(0, 0), AbsoluteContentSize = v2(0, 0) }, readonly = { "AbsoluteCellCount", "AbsoluteCellSize", "AbsoluteContentSize" } })
class("UIPageLayout", "UILayout", { props = { Animated = true, Circular = false, EasingDirection = E.EasingDirection.Out, EasingStyle = E.EasingStyle.Cubic, GamepadInputEnabled = true, Padding = G.UDim.new(), ScrollWheelInputEnabled = true, TouchInputEnabled = true, TweenTime = 1, CurrentPage = NIL }, events = { "PageEnter", "PageLeave", "Stopped" } })
class("UITableLayout", "UILayout", { props = { FillEmptySpaceColumns = false, FillEmptySpaceRows = false, MajorAxis = E.TableMajorAxis.RowMajor, Padding = u2() } })
class("UIPadding", "UIComponent", { props = { PaddingTop = G.UDim.new(), PaddingBottom = G.UDim.new(), PaddingLeft = G.UDim.new(), PaddingRight = G.UDim.new() } })
class("UICorner", "UIComponent", { props = { CornerRadius = G.UDim.new(0, 8) } })
class("UIStroke", "UIComponent", { props = { ApplyStrokeMode = E.ApplyStrokeMode.Contextual, Color = black, Enabled = true, LineJoinMode = E.LineJoinMode.Round, Thickness = 1, Transparency = 0 } })
class("UIGradient", "UIComponent", { props = { Color = G.ColorSequence.new(white), Enabled = true, Offset = v2(0, 0), Rotation = 0, Transparency = G.NumberSequence.new(0) } })
class("UIScale", "UIComponent", { props = { Scale = 1 } })
class("UIAspectRatioConstraint", "UIComponent", { props = { AspectRatio = 1, AspectType = E.AspectType.FitWithinMaxSize, DominantAxis = E.DominantAxis.Width } })
class("UISizeConstraint", "UIComponent", { props = { MaxSize = v2(math.huge, math.huge), MinSize = v2(0, 0) } })
class("UITextSizeConstraint", "UIComponent", { props = { MaxTextSize = 100, MinTextSize = 1 } })
class("UIFlexItem", "UIComponent", { props = { FlexMode = E.UIFlexMode.None, GrowRatio = 0, ShrinkRatio = 0, ItemLineAlignment = E.ItemLineAlignment.Automatic } })

-- ===== Services =====
local coreStore, coreSet, coreGet = {}, {}, {}
local function service(name, spec) spec = spec or {}; spec.service = true; return class(name, "Instance", spec) end
local function serviceStub(names) for _, n in ipairs(list(names)) do service(n) end end
service("Workspace", { props = { CurrentCamera = NIL, Gravity = 196.2, DistributedGameTime = 0, FilteringEnabled = true, StreamingEnabled = false }, init = function(self, d) d.props.CurrentCamera = addChild(self, "Camera", "Camera") end,
  methods = { GetServerTimeNow = function() return host.now() end, Raycast = function() return nil end } })
service("Lighting", { props = { Brightness = 2, ClockTime = 14, FogEnd = 100000, Technology = E.Technology.Compatibility, Ambient = c3(0, 0, 0) } })
service("ReplicatedStorage"); service("ReplicatedFirst"); service("StarterPack"); service("StarterPlayer"); service("Teams"); service("ServerStorage")
service("SoundService", { props = { RespectFilteringEnabled = true, AmbientReverb = E.ReverbType.NoReverb }, methods = { SetListener = noop, PlayLocalSound = noop } })
service("StarterGui", { props = { ShowDevelopmentGui = true, ScreenOrientation = E.ScreenOrientation.LandscapeSensor, VirtualCursorMode = E.VirtualCursorMode.Default }, events = { "CoreGuiChangedSignal" }, methods = {
  SetCore = function(self, n, v) local h = coreSet[n]; if h then return h(v) end; coreStore[n] = v end,
  GetCore = function(self, n) local h = coreGet[n]; if h then return h() end; return coreStore[n] end,
  RegisterSetCore = function(self, n, f) coreSet[n] = f end, RegisterGetCore = function(self, n, f) coreGet[n] = f end,
  SetCoreGuiEnabled = function(self, t, en) coreStore["gui:" .. tostring(t)] = en; fireSig(D[self], "CoreGuiChangedSignal", t, en) end,
  GetCoreGuiEnabled = function(self, t) local v = coreStore["gui:" .. tostring(t)]; if v == nil then return true end; return v end } })
service("GuiService", { props = { MenuIsOpen = false, TouchControlsEnabled = true, AutoSelectGuiEnabled = true, GuiNavigationEnabled = true, CoreGuiNavigationEnabled = true, SelectedObject = NIL, TopbarInset = G.Rect.new(0, 0, 0, 36), IsWindows = true },
  events = { "MenuOpened", "MenuClosed", "SafeZoneOffsetsChanged", "NetworkPause", "ErrorMessageChanged", "UiMessageChanged", "KeyPressed", "EmotesMenuOpenChanged", "InspectMenuEnabledChanged", "BrowserWindowClosed" },
  methods = { GetGuiInset = function() return v2(0, 36), v2(0, 0) end, IsTenFootInterface = function() return false end, SetMenuIsOpen = function(self, o) D[self].props.MenuIsOpen = o; fireSig(D[self], o and "MenuOpened" or "MenuClosed") end,
    AddSelectionParent = noop, RemoveSelectionParent = noop, AddSelectionTuple = noop, RemoveSelectionTuple = noop, Select = noop, ClearSelection = noop, GetUiMessage = function() return nil, "" end,
    InspectPlayerFromUserId = noop, CloseInspectMenu = noop, SetEmotesMenuOpen = noop, GetEmotesMenuOpen = function() return false end, SetInspectMenuEnabled = noop, GetInspectMenuEnabled = function() return true end, GetScreenResolution = function() return v2(1280, 720) end } })
service("UserInputService", { props = { TouchEnabled = false, KeyboardEnabled = true, MouseEnabled = true, GamepadEnabled = false, GyroscopeEnabled = false, AccelerometerEnabled = false, VREnabled = false, MouseBehavior = E.MouseBehavior.Default,
  MouseIconEnabled = true, ModalEnabled = false, OnScreenKeyboardVisible = false, MouseDeltaSensitivity = 1, OverrideMouseIconBehavior = E.OverrideMouseIconBehavior.None, LastInputType = E.UserInputType.MouseMovement, PreferredInput = E.UserInputType.Keyboard,
  OnScreenKeyboardPosition = v2(0, 0), OnScreenKeyboardSize = v2(0, 0), StatusBarSize = v2(0, 0) },
  events = { "InputBegan", "InputChanged", "InputEnded", "LastInputTypeChanged", "TextBoxFocused", "TextBoxFocusReleased", "WindowFocused", "WindowFocusReleased", "TouchTap", "TouchStarted", "TouchEnded", "TouchMoved", "JumpRequest", "GamepadConnected", "GamepadDisconnected", "PointerAction", "UserInputTypeChanged", "DeviceTypeChanged" },
  methods = { GetLastInputType = function(self) return self.LastInputType end, GetMouseLocation = function() return v2(RT.mouse.X, RT.mouse.Y) end, IsKeyDown = function() return false end, IsMouseButtonPressed = function() return false end,
    GetKeysPressed = function() return {} end, GetConnectedGamepads = function() return {} end, GetGamepadConnected = function() return false end, GetNavigationGamepads = function() return {} end, GetFocusedTextBox = function() return RT.focusedTextBox end,
    GetPlatform = function() return E.Platform.Windows end, GetStringForKeyCode = function(self, k) if k.Value >= 32 and k.Value < 127 then return string.char(k.Value) end; return "" end, IsNavigationGamepad = function() return false end,
    GetSupportedGamepadKeyCodes = function() return {} end, GetImageForKeyCode = function() return "" end, GetDeviceType = function() return E.DeviceType.Desktop end, GetMouseDelta = function() return v2(0, 0) end, GetGamepadState = function() return {} end, GetUserCFrame = function() return G.CFrame.new() end } })
service("RunService", { events = { "Heartbeat", "RenderStepped", "Stepped", "PreRender", "PreAnimation", "PreSimulation", "PostSimulation" }, init = function(self) RT.runService = self; RT.renderBinds = {} end, methods = {
  IsClient = function() return true end, IsServer = function() return false end, IsStudio = function() return false end, IsRunning = function() return true end, IsRunMode = function() return false end, IsEdit = function() return false end,
  BindToRenderStep = function(self, n, p, f) RT.renderBinds[n] = { p = p, f = f } end, UnbindFromRenderStep = function(self, n) RT.renderBinds[n] = nil end, Set3dRenderingEnabled = noop, GetCoreScriptVersion = function() return "0" end } })
RT.afterStep = function(dt)
  local rs = RT.runService; if not rs then return end
  local d = D[rs]; local binds = {}
  for _, b in pairs(RT.renderBinds) do binds[#binds + 1] = b end
  table.sort(binds, function(a, b) return a.p < b.p end)
  for _, b in ipairs(binds) do spawnFn(b.f, dt) end
  fireSig(d, "Stepped", sched.now, dt); fireSig(d, "PreRender", dt); fireSig(d, "RenderStepped", dt); fireSig(d, "PreAnimation", dt); fireSig(d, "PreSimulation", dt); fireSig(d, "Heartbeat", dt); fireSig(d, "PostSimulation", dt)
end
-- JSON
local json = {}
do
  local esc = { ['"'] = '\\"', ["\\"] = "\\\\", ["\n"] = "\\n", ["\r"] = "\\r", ["\t"] = "\\t" }
  local function enc(v, out)
    local t = type(v)
    if t == "nil" then out[#out + 1] = "null" elseif t == "boolean" then out[#out + 1] = tostring(v) elseif t == "number" then out[#out + 1] = (v ~= v or v == math.huge or v == -math.huge) and "null" or string.format("%.14g", v)
    elseif t == "string" then out[#out + 1] = '"' .. string.gsub(v, '[%c"\\]', function(c) return esc[c] or string.format("\\u%04x", string.byte(c)) end) .. '"'
    elseif t == "table" then
      if #v > 0 or next(v) == nil then out[#out + 1] = "["; for i = 1, #v do if i > 1 then out[#out + 1] = "," end; enc(v[i], out) end; out[#out + 1] = "]"
      else out[#out + 1] = "{"; local first = true; for k, x in pairs(v) do if not first then out[#out + 1] = "," end; first = false; enc(tostring(k), out); out[#out + 1] = ":"; enc(x, out) end; out[#out + 1] = "}" end
    else error("Can't convert " .. t .. " to JSON", 3) end
  end
  function json.encode(v) local out = {}; enc(v, out); return table.concat(out) end
  function json.decode(s)
    local i = 1
    local function ws() i = string.find(s, "[^ \n\r\t]", i) or #s + 1 end
    local val
    local function str()
      local out = {}; i += 1
      while true do
        local c = string.sub(s, i, i)
        if c == "" then error("Can't parse JSON", 3) elseif c == '"' then i += 1; break
        elseif c == "\\" then
          local n = string.sub(s, i + 1, i + 1); i += 2
          if n == "u" then out[#out + 1] = utf8.char(tonumber(string.sub(s, i, i + 3), 16)); i += 4
          else out[#out + 1] = ({ n = "\n", r = "\r", t = "\t", b = "\b", f = "\f" })[n] or n end
        else out[#out + 1] = c; i += 1 end
      end
      return table.concat(out)
    end
    function val()
      ws(); local c = string.sub(s, i, i)
      if c == "{" then
        local o = {}; i += 1; ws(); if string.sub(s, i, i) == "}" then i += 1; return o end
        while true do ws(); local k = str(); ws(); i += 1; o[k] = val(); ws(); local d = string.sub(s, i, i); i += 1; if d == "}" then break elseif d ~= "," then error("Can't parse JSON", 3) end end
        return o
      elseif c == "[" then
        local a = {}; i += 1; ws(); if string.sub(s, i, i) == "]" then i += 1; return a end
        while true do a[#a + 1] = val(); ws(); local d = string.sub(s, i, i); i += 1; if d == "]" then break elseif d ~= "," then error("Can't parse JSON", 3) end end
        return a
      elseif c == '"' then return str()
      elseif string.sub(s, i, i + 3) == "true" then i += 4; return true elseif string.sub(s, i, i + 4) == "false" then i += 5; return false elseif string.sub(s, i, i + 3) == "null" then i += 4; return nil end
      local num = string.match(s, "^-?%d+%.?%d*[eE]?[+-]?%d*", i); if not num or num == "" then error("Can't parse JSON", 3) end; i += #num; return tonumber(num)
    end
    return val()
  end
end
RT.json = json
local function request(req)
  local ok, res = RT.await("http", json.encode({ Url = req.Url, Method = req.Method or "GET", Headers = req.Headers, Body = req.Body }))
  if not ok then error("HttpService: " .. tostring(res), 3) end
  local r = json.decode(res); r.Success = r.StatusCode >= 200 and r.StatusCode < 300; return r
end
service("HttpService", { props = { HttpEnabled = true }, methods = {
  JSONEncode = function(self, v) return json.encode(v) end, JSONDecode = function(self, s) return json.decode(s) end, RequestAsync = function(self, req) return request(req) end,
  GetAsync = function(self, url, nocache, headers) local r = request({ Url = url, Method = "GET", Headers = headers }); if not r.Success then error("HTTP " .. r.StatusCode, 2) end; return r.Body end,
  PostAsync = function(self, url, data) local r = request({ Url = url, Method = "POST", Body = data }); if not r.Success then error("HTTP " .. r.StatusCode, 2) end; return r.Body end,
  GenerateGUID = function(self, wrap) local g = string.gsub("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx", "[xy]", function(c) local v = c == "x" and math.random(0, 15) or math.random(8, 11); return string.format("%x", v) end); if wrap == false then return g end; return "{" .. g .. "}" end,
  UrlEncode = function(self, s) return (string.gsub(s, "[^%w%-_%.~]", function(c) return string.format("%%%02X", string.byte(c)) end)) end } })
service("TextService", { methods = {
  GetTextSize = function(self, text, size, font, frame) local w, h = host.measure(text, size, tostring(font), frame and frame.X or 0); return v2(w, h) end,
  GetTextBoundsAsync = function(self, p) local w, h = host.measure(p.Text, p.Size, p.Font.Family, p.Width); return v2(w, h) end } })
class("GetTextBoundsParams", "Instance", { props = { Text = "", Font = G.Font.new("rbxasset://fonts/families/SourceSansPro.json"), Size = 14, Width = math.huge, RichText = false } })
service("ContextActionService", { events = { "LocalToolEquipped", "LocalToolUnequipped" }, init = function(self, d) d.actions = {} end, methods = {
  BindAction = function(self, n, f) D[self].actions[n] = f end, BindActionAtPriority = function(self, n, f) D[self].actions[n] = f end, BindCoreAction = function(self, n, f) D[self].actions[n] = f end,
  UnbindAction = function(self, n) D[self].actions[n] = nil end, UnbindCoreAction = function(self, n) D[self].actions[n] = nil end, UnbindAllActions = function(self) D[self].actions = {} end,
  GetAllBoundActionInfo = function() return {} end, GetBoundActionInfo = function() return {} end, SetTitle = noop, SetImage = noop, SetPosition = noop, GetCurrentLocalToolIcon = function() return nil end } })
service("TweenService", { methods = {
  GetValue = function(self, a, es, ed) return RT.ease(a, es, ed) end,
  Create = function(self, inst, info, goals) return RT.newTween(inst, info, goals) end } })
do
  local tweens = {}
  local function ease(a, es, ed)
    local function f(t)
      local n = es.Name
      if n == "Linear" then return t elseif n == "Sine" then return 1 - math.cos(t * math.pi / 2) elseif n == "Cubic" then return t ^ 3 elseif n == "Quart" then return t ^ 4 elseif n == "Quint" then return t ^ 5
      elseif n == "Exponential" then return t == 0 and 0 or 2 ^ (10 * (t - 1)) elseif n == "Circular" then return 1 - math.sqrt(1 - t * t) end
      return t * t
    end
    if ed.Name == "In" then return f(a) elseif ed.Name == "Out" then return 1 - f(1 - a) end
    if a < 0.5 then return f(a * 2) / 2 end; return 1 - f((1 - a) * 2) / 2
  end
  RT.ease = ease
  local function lerp(a, b, t)
    local ty = typeof(a)
    if ty == "number" then return a + (b - a) * t elseif ty == "boolean" then return t >= 1 and b or a
    elseif a.Lerp then return a:Lerp(b, t) end
    return b
  end
  class("Tween", "Instance", { notCreatable = true, events = { "Completed" }, props = { PlaybackState = E.PlaybackState.Begin }, methods = {
    Play = function(self) local d = D[self]; local x = d.tween; x.from = {}; for p in pairs(x.goals) do x.from[p] = x.inst[p] end; x.t = -x.info.DelayTime; d.props.PlaybackState = E.PlaybackState.Playing; tweens[self] = true end,
    Pause = function(self) tweens[self] = nil; D[self].props.PlaybackState = E.PlaybackState.Paused end,
    Cancel = function(self) tweens[self] = nil; D[self].props.PlaybackState = E.PlaybackState.Cancelled end } })
  function RT.newTween(inst, info, goals) local tw = newInst("Tween"); D[tw].tween = { inst = inst, info = info, goals = goals, t = 0 }; return tw end
  local prev = RT.afterStep
  RT.afterStep = function(dt)
    for tw in pairs(tweens) do
      local d = D[tw]; local x = d.tween; x.t += dt
      if x.t >= 0 then
        local a = math.min(x.t / math.max(x.info.Time, 1e-6), 1); local k = ease(a, x.info.EasingStyle, x.info.EasingDirection)
        for p, goal in pairs(x.goals) do x.inst[p] = lerp(x.from[p], goal, k) end
        if a >= 1 then tweens[tw] = nil; d.props.PlaybackState = E.PlaybackState.Completed; fireSig(d, "Completed", E.PlaybackState.Completed) end
      end
    end
    prev(dt)
  end
end
service("CollectionService", { init = function(self, d) d.byTag = {} end, methods = {
  AddTag = function(self, i, t) base.AddTag(i, t) end, RemoveTag = function(self, i, t) base.RemoveTag(i, t) end, HasTag = function(self, i, t) return base.HasTag(i, t) end, GetTags = function(self, i) return base.GetTags(i) end,
  GetTagged = function(self, t) local o = {}; for i in pairs(D[self].byTag[t] or {}) do o[#o + 1] = i end; return o end,
  GetInstanceAddedSignal = function(self, t) return sig(D[self], "added:" .. t) end, GetInstanceRemovedSignal = function(self, t) return sig(D[self], "removed:" .. t) end } })
service("LocalizationService", { props = { RobloxLocaleId = "en-us", SystemLocaleId = "en-us", ForcePlayModeRobloxLocaleId = "", ForcePlayModeGameLocaleId = "" }, events = { "RobloxLocaleIdChanged" }, methods = {
  GetTranslatorForLocaleAsync = function(self, loc) local t = newInst("Translator"); D[t].props.LocaleId = loc; return t end, GetTranslatorForPlayerAsync = function(self) local t = newInst("Translator"); return t end,
  GetCountryRegionForPlayerAsync = function() return "US" end } })
class("Translator", "Instance", { props = { LocaleId = "en-us" }, methods = { FormatByKey = function(self, k, args) return k end, Translate = function(self, ctx, text) return text end } })
service("PolicyService", { methods = { GetPolicyInfoForPlayerAsync = function() return { AreAdsAllowed = false, ArePaidRandomItemsRestricted = false, IsPaidItemTradingAllowed = true, IsSubjectToChinaPolicies = false, AllowedExternalLinkReferences = {}, IsContentSharingAllowed = true } end, IsLuobuServer = function() return false end } })
service("VRService", { props = { VREnabled = false, GuiInputUserCFrame = 0, FadeOutViewOnCollision = true }, events = { "VRSessionStateChanged" }, methods = { GetUserCFrame = function() return G.CFrame.new() end } })
service("TextChatService", { props = { ChatVersion = E.ChatVersion.TextChatService, CreateDefaultTextChannels = true, CreateDefaultCommands = true }, events = { "SendingMessage", "MessageReceived", "OnIncomingMessage" } })
class("TextChannel", "Instance", { props = { OnIncomingMessage = NIL }, events = { "MessageReceived", "MessageSent" }, methods = { SendAsync = function(self, text) if RT.remote then return RT.remote(self, "SendAsync", text) end end } })
class("TextSource", "Instance", { props = { UserId = 0, CanSend = true } }); class("TextChatMessage", "Instance", { props = { Text = "", PrefixText = "", TextChannel = NIL, TextSource = NIL, Timestamp = G.DateTime.now(), MessageId = "", Metadata = "", Status = 0, Translation = "" } })
for _, n in ipairs(list("ChatWindowConfiguration ChatInputBarConfiguration ChannelTabsConfiguration BubbleChatConfiguration TextChatCommand TextChatMessageProperties")) do
  class(n, "Instance", { props = { Enabled = true, TextSize = 14, TextColor3 = white, BackgroundColor3 = black, BackgroundTransparency = 0.3, FontFace = G.Font.new("rbxasset://fonts/families/GothamSSm.json"), TextStrokeColor3 = black, TextStrokeTransparency = 1,
    HeightScale = 1, WidthScale = 1, AbsolutePosition = v2(0, 0), AbsoluteSize = v2(0, 0), HorizontalAlignment = E.HorizontalAlignment.Left, VerticalAlignment = E.VerticalAlignment.Top, PrimaryAlias = "", SecondaryAlias = "", AutocompleteVisible = true, Text = "", PrefixText = "", Translation = "" } })
end
serviceStub("CorePackages SocialService MarketplaceService BadgeService GroupService AnalyticsService VoiceChatService AvatarEditorService HapticService ScriptContext Stats LogService TestService MemStorageService UserService ProximityPromptService PermissionsService AssetService ContentProvider ExperienceStateCaptureService CaptureService VideoCaptureService GamePassService FriendService ChangeHistoryService Debris UserGameSettings AdService AvatarChatService MessageBusService CoreScriptSyncService VoiceChatInternal ExperienceService LanguageService SafetyService InputService CommerceService")
class("LogService", "Instance", { service = true, events = { "MessageOut" }, methods = { GetLogHistory = function() return {} end } })
class("Debris", "Instance", { service = true, methods = { AddItem = function(self, i, t) task.delay(t or 10, function() if isInst(i) then base.Destroy(i) end end) end } })

-- ===== Players, DataModel, require =====
class("Player", "Instance", { notCreatable = true, props = { UserId = 0, DisplayName = "", AccountAge = 0, MembershipType = E.MembershipType.None, Team = NIL, TeamColor = NIL, Character = NIL, Neutral = true,
  CameraMode = 0, CanLoadCharacterAppearance = true, GameplayPaused = false, FollowUserId = 0, HealthDisplayDistance = 100, NameDisplayDistance = 100, LocaleId = "en-us", Guest = false, UserIdentity = "" },
  events = { "CharacterAdded", "CharacterRemoving", "Chatted", "Idled", "OnTeleport", "CharacterAppearanceLoaded" }, init = function(self)
    addChild(self, "PlayerGui", "PlayerGui"); addChild(self, "Folder", "PlayerScripts"); addChild(self, "Folder", "Backpack") end,
  methods = { IsFriendsWith = function() return false end, IsInGroup = function() return false end, GetRankInGroup = function() return 0 end, GetRoleInGroup = function() return "Guest" end, HasAppearanceLoaded = function() return true end,
    GetMouse = function(self) local m = newInst("Mouse"); return m end, Kick = noop, IsVerified = function() return false end, GetFriendsOnline = function() return {} end, DistanceFromCharacter = function() return 0 end,
    RequestStreamAroundAsync = noop } })
class("Mouse", "Instance", { notCreatable = true, props = { X = 0, Y = 0, Hit = G.CFrame.new(), Target = NIL, ViewSizeX = 1280, ViewSizeY = 720, Icon = "" }, events = { "Button1Down", "Button1Up", "Button2Down", "Button2Up", "Move", "WheelForward", "WheelBackward", "Idle" } })
service("Players", { props = { LocalPlayer = NIL, MaxPlayers = 12, CharacterAutoLoads = true, RespawnTime = 5, NumPlayers = 0 }, readonly = { "LocalPlayer", "NumPlayers" }, events = { "PlayerAdded", "PlayerRemoving", "PlayerMembershipChanged", "UserSubscriptionStatusChanged" }, methods = {
  GetPlayers = function(self) local o = {}; for _, c in ipairs(D[self].kids) do if D[c].class == "Player" then o[#o + 1] = c end end; return o end,
  GetPlayerByUserId = function(self, id) for _, c in ipairs(D[self].kids) do if D[c].class == "Player" and D[c].props.UserId == id then return c end end end,
  GetPlayerFromCharacter = function() return nil end,
  GetUserIdFromNameAsync = function(self, n) for _, c in ipairs(D[self].kids) do if D[c].name == n then return D[c].props.UserId end end; error("Players:GetUserIdFromNameAsync: unknown user " .. tostring(n), 2) end,
  GetNameFromUserIdAsync = function(self, id) local p = self:GetPlayerByUserId(id); if p then return p.Name end; error("Players:GetNameFromUserIdAsync: unknown user " .. tostring(id), 2) end,
  GetFriendsAsync = function() return { GetCurrentPage = function() return {} end, IsFinished = true } end,
  GetCharacterAppearanceInfoAsync = function() return {} end, GetUserThumbnailAsync = function(self, id) return "rbxthumb://type=AvatarHeadShot&id=" .. id .. "&w=150&h=150", true end } })
function RT.addPlayer(userId, name, displayName, isLocal)
  local players = G.game:GetService("Players")
  local p = newInst("Player"); local d = D[p]
  d.name = name; d.props.UserId = userId; d.props.DisplayName = displayName or name
  if isLocal then D[players].props.LocalPlayer = p end
  setParent(p, players); D[players].props.NumPlayers = #players:GetPlayers()
  fireSig(D[players], "PlayerAdded", p); return p
end
function RT.removePlayer(userId)
  local players = G.game:GetService("Players"); local p = players:GetPlayerByUserId(userId); if not p then return end
  fireSig(D[players], "PlayerRemoving", p); if D[players].props.LocalPlayer == p then D[players].props.LocalPlayer = NIL end
  setParent(p, nil); D[players].props.NumPlayers = #players:GetPlayers()
end
-- tags
function RT.tagAdded(inst, t) local cs = G.game:FindFirstChildOfClass("CollectionService"); if not cs then return end; local cd = D[cs]; cd.byTag[t] = cd.byTag[t] or {}; cd.byTag[t][inst] = true; fireSig(cd, "added:" .. t, inst) end
function RT.tagRemoved(inst, t) local cs = G.game:FindFirstChildOfClass("CollectionService"); if not cs then return end; local cd = D[cs]; if cd.byTag[t] then cd.byTag[t][inst] = nil end; fireSig(cd, "removed:" .. t, inst) end
-- DataModel / game
local function flagVal(kind, name, default)
  local v = host.flag(name, kind)
  if v == nil then return default end
  return v
end
class("DataModel", "Instance", { notCreatable = true, props = { PlaceId = 0, GameId = 0, JobId = "", PlaceVersion = 0, CreatorId = 0, CreatorType = E.CreatorType.User, Workspace = NIL, PrivateServerId = "", PrivateServerOwnerId = 0, Genre = 0 },
  events = { "Loaded", "Close", "GameLoaded", "ServiceAdded", "ServiceRemoving", "ItemChanged" }, methods = {
  GetService = function(self, name)
    local d = D[self]
    for _, c in ipairs(d.kids) do if D[c].class == name then return c end end
    local info = classes[name]
    if not (info and info.service) then error("'" .. tostring(name) .. "' is not a valid Service name", 2) end
    local s = newInst(name); attach(self, s); return s
  end,
  FindService = function(self, name) for _, c in ipairs(D[self].kids) do if D[c].class == name then return c end end; return nil end,
  IsLoaded = function() return true end, BindToClose = noop, GetEngineFeature = function(self, n) return host.feature(n) == true end,
  DefineFastFlag = function(self, n, def) return flagVal("flag", n, def) end, DefineFastInt = function(self, n, def) return flagVal("int", n, def) end,
  DefineFastString = function(self, n, def) return flagVal("string", n, def) end, DefineFastNumber = function(self, n, def) return flagVal("number", n, def) end,
  GetFastFlag = function(self, n) return flagVal("flag", n, false) end, GetFastInt = function(self, n) return flagVal("int", n, 0) end, GetFastString = function(self, n) return flagVal("string", n, "") end, GetFastNumber = function(self, n) return flagVal("number", n, 0) end,
  SetFastFlagForTesting = noop, SetFlagVersion = noop, SetFastIntForTesting = noop, GetObjects = function() return {} end, HttpGet = function(self, u) return request({ Url = u }).Body end } })
local game = newInst("DataModel"); D[game].name = "Game"
G.game = game; G.Game = game
for _, n in ipairs(list("Workspace Players Lighting ReplicatedFirst ReplicatedStorage StarterGui StarterPack StarterPlayer SoundService TextChatService CoreGui CorePackages")) do game:GetService(n) end
G.workspace = game:GetService("Workspace"); G.Workspace = G.workspace
D[game].props.Workspace = G.workspace
-- settings()
do
  local st = { GetFFlag = function(self, n) return flagVal("flag", n, false) end, GetFVariable = function(self, n) return tostring(flagVal("string", n, "")) end }
  local S = setmetatable({}, { __index = function(_, k) if k == "GetService" then return function(self, n) local i = newInst("UserGameSettings"); return i end end; return st[k] end, __type = "GlobalSettings" })
  G.settings = function() return S end
  G.UserSettings = function() return S end
end
class("UserGameSettings", "Instance", { props = { MasterVolume = 1, SavedQualityLevel = 0, GraphicsQualityLevel = 5, RotationType = 0, ControlMode = 0, MouseSensitivity = 1, ChatVisible = true, ChatTranslationEnabled = false, UsedHideHudShortcut = false, HasEverUsedVR = false, StartMaximized = false, Fullscreen = false, PerformanceStatsVisible = false }, events = { "FullscreenChanged", "StartMaximizedChanged" } })
-- Patch tree -> game. DataModelInstances/<X> merges into the existing service X, otherwise becomes a child of game.
-- Same-named children merge recursively (the patch's CoreGui.RobloxGui joins the built-in RobloxGui ScreenGui).
local function mergeInto(target, node)
  ensure(node, D[node])
  for _, c in ipairs(table.clone(D[node].kids)) do
    local existing; for _, k in ipairs(D[target].kids) do if D[k].name == D[c].name then existing = k; break end end
    if existing and not D[existing].path then mergeInto(existing, c) else attach(target, c) end
  end
end
function RT.mount(root)
  local names = host.children(root)
  for _, nm in ipairs(names) do
    if nm == "DataModelInstances" then
      local dp = root .. "/" .. nm
      local n2, c2 = host.children(dp)
      for j, cn in ipairs(n2) do
        local node = RT.nodeFor(dp .. "/" .. cn, c2[j])
        local svc = game:FindFirstChild(cn)
        if svc then mergeInto(svc, node) else attach(game, node) end
      end
    end
  end
end
-- require
local results, failed, loading = {}, {}, {}
local function require_(n)
  local d = isInst(n) and D[n]
  if not d or d.class ~= "ModuleScript" then error("Attempted to call require with invalid argument(s).", 2) end
  local p = d.path
  if not p then error("Cannot require " .. fullName(n) .. ": module has no source in this runtime", 2) end
  if results[p] then return results[p][1] end
  if failed[p] then error(failed[p], 0) end
  local st = loading[p]
  if st then
    if st.co == coroutine.running() then error("Requested module was required recursively", 2) end
    if not coroutine.isyieldable() then error("Requested module is still loading: " .. fullName(n), 2) end
    st.waiters[#st.waiters + 1] = coroutine.running(); coroutine.yield()
    if results[p] then return results[p][1] end
    error(failed[p] or "Requested module failed to load", 0)
  end
  st = { waiters = {}, co = coroutine.running() }; loading[p] = st
  local fn = host.load(p)
  setfenv(fn, setmetatable({ script = n, require = require_ }, { __index = G }))
  -- Runs in the requiring thread (no coroutine per module): a module that yields yields its requirer, as in Roblox,
  -- and deep require chains do not nest coroutine resumes.
  local ok, r = xpcall(fn, function(e) if RT.debugTraces then return tostring(e) .. "\n" .. debug.traceback() end; return e end)
  loading[p] = nil
  if ok then results[p] = { r } else failed[p] = "Requested module experienced an error while loading: " .. tostring(r) end
  for _, w in ipairs(st.waiters) do resume(w) end
  if ok then return r end
  error(failed[p], 0)
end
G.require = require_
-- Instance for a patch path with its whole parent chain materialised (script.Parent.Parent... must work).
function RT.resolve(path)
  local o = byPath[path]; if o then return o end
  local parentPath = string.match(path, "^(.*)/[^/]*$")
  if parentPath then
    local pp = RT.resolve(parentPath); ensure(pp, D[pp]); o = byPath[path]; if o then return o end
  end
  return RT.nodeFor(path, host.classOf(path))
end
function RT.tryRequire(path)
  local inst = RT.resolve(path)
  local out = { state = "pending" }; RT.outcomes[path] = out
  spawnFn(function() local ok, r = pcall(require_, inst); out.state = ok and "ok" or "err"; out.value = ok and typeof(r) or tostring(r) end)
  return out.state, out.value
end
-- ScriptContext:AddCoreScriptLocal(name, parent): the engine's way of starting a CoreScript. Runs the patch script at CoreScripts/<name> in its own thread.
local function runCore(path)
  local out = { state = "pending" }; RT.outcomes[path] = out
  spawnFn(function()
    local ok, r = pcall(function() return require_(RT.resolve(path)) end)
    out.state = ok and "ok" or "err"; out.value = ok and typeof(r) or tostring(r)
    if not ok and #RT.errors < 500 then RT.errors[#RT.errors + 1] = path .. ": " .. tostring(r) end
  end)
end
RT.runCore = runCore
function RT.errorList(n)
  local out = {}
  for i = 1, math.min(#RT.errors, n or 8) do out[i] = string.sub(tostring(RT.errors[i]), 1, 500) end
  return table.concat(out, "\n--\n")
end
function RT.coreStatus()
  local ok, err, pend = 0, 0, 0
  for p, o in pairs(RT.outcomes) do if string.find(p, "CoreScripts", 1, true) then if o.state == "ok" then ok += 1 elseif o.state == "err" then err += 1 else pend += 1 end end end
  return string.format("%d ok, %d failed, %d running", ok, err, pend)
end
function RT.outcome(path) local o = RT.outcomes[path]; if not o then return "none", "" end; return o.state, o.value or "" end
function RT.errorCount() return #RT.errors end
function RT.lazyEnumList() return table.concat(RT.lazyEnums, ",") end

-- Telemetry/analytics-style services: unknown methods are harmless no-ops (recorded in RT.lenient so they stay visible).
for _, n in ipairs(list("TelemetryService UGCValidationService AppLifecycleObserverService AvatarCreationService IXPService HttpRbxApiService RbxAnalyticsService EventIngestService SessionService LinkingService WebViewService RobloxReplicatedStorage MessageBusService AvatarChatService")) do
  service(n, { lenient = true })
end
class("MessageBusService", "Instance", { service = true, lenient = true, methods = { GetMessageId = function(self, ...) return table.concat({ ... }, ":") end } })
class("ContentProvider", "Instance", { service = true, props = { BaseUrl = "https://www.roblox.com/", RequestQueueSize = 0 }, methods = { PreloadAsync = function(self, items, cb) if cb then task.defer(cb, "", E.TweenStatus.Completed) end end, GetAssetFetchStatus = function() return 0 end } })
do
  local gs = classes.GuiService
  gs.methods.GetNotificationTypeList = function() return setmetatable({}, { __index = function(_, k) return k end }) end
  gs.methods.GetResolutionScale = function() return 1 end
end
do
  local store = {}
  class("AppStorageService", "Instance", { service = true, methods = { GetItem = function(self, k) return store[k] or "" end, SetItem = function(self, k, v) store[k] = tostring(v) end, Flush = noop, Clear = function() store = {} end } })
  class("NotificationService", "Instance", { service = true, lenient = true, events = { "RobloxEventReceived", "RobloxConnectionChanged" } })
  class("Chat", "Instance", { service = true, lenient = true, props = { IsAutoMigrated = true, LoadDefaultChat = true, BubbleChatEnabled = false } })
  class("BrowserService", "Instance", { service = true, lenient = true })
  game:GetService("RunService")
end

-- more datatypes (field bags; enough for construction and field access)
for name, fields in pairs({ Path2DControlPoint = { "Position", "LeftTangent", "RightTangent" }, Vector2int16 = { "X", "Y" }, Vector3int16 = { "X", "Y", "Z" }, Ray = { "Origin", "Direction" },
  PhysicalProperties = { "Density", "Friction", "Elasticity" }, OverlapParams = {}, RaycastParams = {} }) do
  local mt = { __type = name }; mt.__index = mt
  G[name] = { new = function(...) local t = setmetatable({}, mt); local a = { ... }; for i, f in ipairs(fields) do t[f] = a[i] end; return t end }
end
do
  local mt = { __type = "BrickColor", __eq = function(a, b) return a.Name == b.Name end, __tostring = function(a) return a.Name end }; mt.__index = mt
  local function bc(n) return setmetatable({ Name = type(n) == "string" and n or "Medium stone grey", Number = type(n) == "number" and n or 194, Color = G.Color3.new(0.639, 0.635, 0.647) }, mt) end
  G.BrickColor = { new = bc, random = function() return bc("Bright red") end, White = function() return bc("White") end, Black = function() return bc("Really black") end }
end
classes.UserGameSettings.props.ReducedMotion = false; classes.UserGameSettings.props.PreferredTransparency = 1; classes.UserGameSettings.props.UiNavigationKeyBindEnabled = true
for _, n in ipairs(list("GamepadService ThirdPartyUserService AnimationClipProvider VideoService")) do service(n, { lenient = true }) end
classes.LocalizationTable.methods.SetEntries = noop; classes.LocalizationTable.methods.GetEntries = function() return {} end
classes.LocalizationTable.methods.GetString = function(self, target, key) return key end
classes.LocalizationTable.methods.GetTranslator = function() return newInst("Translator") end
classes.ScriptContext.methods.AddCoreScriptLocal = function(self, name, parent) runCore("PatchRoot/CoreScripts/" .. tostring(name)) end
-- Step 3c: members the real CoreScripts touch at startup (found by tools/run-corescripts.mjs).
for _, n in ipairs(list("PointsService InsertService FaceAnimatorService")) do service(n, { lenient = true }) end
classes.GuiService.methods.GetInsetArea = function() return G.Rect.new(0, 0, 0, 0) end
classes.Players.props.ClassicChat = false; classes.Players.props.BubbleChat = false
classes.LocalizationService.events.AutoTranslateWillRun = true
classes.VRService.props.AvatarGestures = false
service("TeleportService", { lenient = true })
classes.GuiService.props.SelectedCoreObject = NIL
classes.ScreenGui.props.OnTopOfCoreBlur = false
classes.Player.methods.GetUnder13 = function() return false end
classes.AdService.events.AdTeleportInitiated = true
-- legacy/less common globals and constructors modules list at load time
G.Delay = G.delay; G.Spawn = G.spawn; G.Wait = G.wait; G.ypcall = pcall; G.ElapsedTime = G.elapsedTime
G.CFrame.Angles = function() return G.CFrame.new() end; G.CFrame.fromEulerAnglesXYZ = G.CFrame.Angles; G.CFrame.fromEulerAnglesYXZ = G.CFrame.Angles
G.CFrame.fromEulerAngles = G.CFrame.Angles; G.CFrame.fromAxisAngle = G.CFrame.Angles; G.CFrame.fromMatrix = G.CFrame.Angles; G.CFrame.fromOrientation = G.CFrame.Angles
G.CFrame.lookAt = function(at) return G.CFrame.new(at) end
-- MemStorageService: in-memory key/value with change events
do
  local store, binds = {}, {}
  local m = classes.MemStorageService.methods
  m.GetItem = function(self, k) return store[k] or "" end
  m.HasItem = function(self, k) return store[k] ~= nil end
  m.SetItem = function(self, k, v) store[k] = tostring(v); for _, f in ipairs(binds[k] or {}) do spawnFn(f, store[k]) end end
  m.RemoveItem = function(self, k) store[k] = nil end
  m.BindAndFire = function(self, k, fn) binds[k] = binds[k] or {}; table.insert(binds[k], fn); spawnFn(fn, store[k] or ""); return setmetatable({ Connected = true, Disconnect = function() end }, ConMT) end
  m.Bind = function(self, k, fn) binds[k] = binds[k] or {}; table.insert(binds[k], fn); return setmetatable({ Connected = true, Disconnect = function() end }, ConMT) end
end
classes.Player.events.FriendStatusChanged = true
classes.GuiService.events.NetworkPausedEnabledChanged = true
classes.AdService.events.AdTeleportEnded = true
do
  local function enc(l) l = math.clamp(l or 0, 0, 1); if l <= 0.0031308 then return 12.92 * l end; return 1.055 * l ^ (1 / 2.4) - 0.055 end
  G.Color3.fromLinearRGB = function(r, g, b) return G.Color3.new(enc(r), enc(g), enc(b)) end
end
for _, n in ipairs(list("GenericChallengeService CreatorStoreService")) do service(n, { lenient = true }) end
return RT
