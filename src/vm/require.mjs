// Module loader: maps `require(script.Parent.X)` onto the CoreGui patch tree and runs the modules in the Luau VM.
// The tree is abstract so the browser (patch parsed from rbxm) and tests (extracted directory) share the same code:
//   tree.children(path) -> [{ name, class }]      tree.script(path) -> { kind: "bytecode"|"source", data } | null
//   tree.classOf(path) -> string | null           tree.root -> path of the DataModel-ish root
// Nodes handed to Lua are light Instance stand-ins (Name, ClassName, Parent, child lookup, FindFirstChild, ...).
// The Roblox runtime (step 2) replaces them with the real Instance system and keeps the same `require` contract.
import { decodeBytecode } from "../join/coregui/decode.mjs";

const PRELUDE = `
local hostChildren, hostLoad, hostClass = ...
local G = getfenv(0)
local nodes, paths, results, loading, failed = {}, setmetatable({}, {__mode = "k"}), {}, {}, {}
local methods = {}
local Node = {}
local function parentOf(p) return (string.match(p, "^(.*)/[^/]*$")) end
local function nameOf(p) return (string.match(p, "([^/]*)$")) end
local function wrap(p)
  local n = nodes[p]
  if n then return n end
  n = setmetatable({}, Node)
  paths[n] = p; nodes[p] = n
  return n
end
local function kids(p)
  local names, classes = hostChildren(p)
  return names, classes
end
function methods.GetChildren(self)
  local p = paths[self]; local names = kids(p); local out = {}
  for i, nm in ipairs(names) do out[i] = wrap(p .. "/" .. nm) end
  return out
end
methods.GetDescendants = function(self)
  local out = {}
  local function walk(n) for _, c in ipairs(methods.GetChildren(n)) do out[#out + 1] = c; walk(c) end end
  walk(self); return out
end
function methods.FindFirstChild(self, name, recursive)
  local p = paths[self]; local names = kids(p)
  for _, nm in ipairs(names) do if nm == name then return wrap(p .. "/" .. nm) end end
  if recursive then for _, c in ipairs(methods.GetChildren(self)) do local r = methods.FindFirstChild(c, name, true); if r then return r end end end
  return nil
end
function methods.WaitForChild(self, name)
  local c = methods.FindFirstChild(self, name)
  if c then return c end
  error("Infinite yield possible: " .. name .. " is not a child of " .. methods.GetFullName(self), 2)
end
function methods.IsA(self, c) local k = hostClass(paths[self]); return k == c or c == "Instance" or (c == "LuaSourceContainer" and k == "ModuleScript") end
function methods.GetFullName(self) return (string.gsub(paths[self], "/", ".")) end
function methods.FindFirstAncestor(self, name) local p = parentOf(paths[self]); while p do if nameOf(p) == name then return wrap(p) end; p = parentOf(p) end end
Node.__index = function(self, k)
  local p = paths[self]
  if k == "Name" then return nameOf(p) elseif k == "ClassName" then return hostClass(p)
  elseif k == "Parent" then local pp = parentOf(p); return pp and wrap(pp) or nil end
  local m = methods[k]; if m then return m end
  local c = methods.FindFirstChild(self, k)
  if c then return c end
  error(tostring(k) .. " is not a valid member of " .. hostClass(p) .. " \\"" .. string.gsub(p, "/", ".") .. "\\"", 2)
end
Node.__newindex = function(self, k) error("cannot set " .. tostring(k), 2) end
Node.__tostring = function(self) return nameOf(paths[self]) end

local function require_(n)
  local p = type(n) == "table" and paths[n]
  if not p or hostClass(p) ~= "ModuleScript" then error("Attempted to call require with invalid argument(s).", 2) end
  if results[p] ~= nil then return results[p][1] end
  if failed[p] then error(failed[p], 0) end
  if loading[p] then error("Requested module was required recursively", 2) end
  loading[p] = true
  local fn = hostLoad(p)
  local env = setmetatable({ script = n, require = require_ }, { __index = G })
  setfenv(fn, env)
  local ok, r = pcall(fn)
  loading[p] = nil
  if not ok then failed[p] = "Requested module experienced an error while loading: " .. tostring(r); error(failed[p], 0) end
  results[p] = { r }
  return r
end
G.require = require_
if not G.typeof then G.typeof = function(v) return type(v) end end
if not G.warn then G.warn = function(...) print("[warn]", ...) end end
return wrap, require_
`;

export function createLoader(vm, tree) {
  const L = vm.main;
  const classCache = new Map();
  const classOf = (p) => { let c = classCache.get(p); if (c === undefined) { c = tree.classOf(p) || "Folder"; classCache.set(p, c); } return c; };
  const stats = { loaded: 0 };
  L.loadSource(PRELUDE, "=prelude");
  L.pushFunction((l) => {
    const kids = tree.children(l.toString(1));
    l.newTable(kids.length);
    kids.forEach((k, i) => { l.pushString(k.name); l.rawSetI(-2, i + 1); });
    l.newTable(kids.length);
    kids.forEach((k, i) => { l.pushString(k.class || "Folder"); l.rawSetI(-2, i + 1); });
    return 2;
  }, "children");
  L.pushFunction((l) => {
    const path = l.toString(1);
    const s = tree.script(path);
    if (!s) throw new Error("no script source at " + path);
    stats.loaded++;
    if (s.kind === "bytecode") l.load(decodeBytecode(s.data), "=" + path);
    else l.loadSource(typeof s.data === "string" ? s.data : new TextDecoder().decode(s.data), "=" + path);
    return 1;
  }, "load");
  L.pushFunction((l) => { l.pushString(classOf(l.toString(1))); return 1; }, "classOf");
  L.pcall(3, 2); // -> wrap, require
  L.setGlobal("__wb_require"); L.setGlobal("__wb_node");
  return {
    stats,
    // Runs Lua source with `node(path)` and `require` available; returns results left on the stack (caller reads then settop(0)).
    run(src, name = "=run", nresults = 1) { L.loadSource(src, name); L.pcall(0, nresults); },
  };
}

// Tree over an indexPatch() result from src/join/coregui/loader.mjs (instances carry path, class, name, source).
export function treeFromPatch(patch, root = "PatchRoot") {
  return {
    root,
    children: (path) => (patch.children.get(path) || []).map((i) => ({ name: i.name, class: i.class })),
    classOf: (path) => patch.byPath.get(path)?.class || null,
    script: (path) => { const i = patch.byPath.get(path); return i?.source ? { kind: "bytecode", data: i.source } : null; },
  };
}
