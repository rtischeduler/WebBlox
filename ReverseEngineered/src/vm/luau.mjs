// JS wrapper over engine/luau (stock Luau VM built to wasm, see engine/luau/build.sh).
// Values cross the boundary on the Lua stack; JS functions become Lua C closures via wb_js_call (see shim.cpp).
import createLuau from "../../engine/luau/luau.js";

export const LUA = { OK: 0, YIELD: 1, ERRRUN: 2, ERRSYNTAX: 3, ERRMEM: 4, ERRERR: 5 };
export const T = { nil: 0, boolean: 1, lightuserdata: 2, number: 3, integer: 4, vector: 5, string: 6, table: 7, function: 8, userdata: 9, thread: 10, buffer: 11 }; // Luau main lua_Type (has LUA_TINTEGER)
export const REGISTRY = -10000, ENVIRON = -10001, GLOBALS = -10002; // Luau: LUA_REGISTRYINDEX, LUA_ENVIRONINDEX, LUA_GLOBALSINDEX
const upvalueIndex = (i) => GLOBALS - i;
void upvalueIndex;

export class LuaError extends Error {}

export async function createVM(opts = {}) {
  const funcs = [];
  const mod = await createLuau({ wasmBinary: opts.wasmBinary, locateFile: opts.locateFile, wbCall: (L, id) => callHost(L, id) });
  const x = mod; // exports are underscore-prefixed
  const enc = new TextEncoder(), dec = new TextDecoder();
  let current = null; // Lua wrapper for the thread currently inside a host call

  function callHost(L, id) {
    const fn = funcs[id];
    const lua = new Thread(L);
    try {
      const r = fn(lua);
      return r === undefined ? 0 : r;
    } catch (e) {
      if (e && e.yield !== undefined) return -(e.yield + 2);
      lua.pushString(e instanceof Error ? e.message : String(e));
      return -1;
    }
  }

  const mem = () => mod.HEAPU8;
  const withBytes = (bytes, f) => {
    const p = x._malloc(bytes.length || 1);
    mod.HEAPU8.set(bytes, p);
    try { return f(p, bytes.length); } finally { x._free(p); }
  };
  const cstr = (s, f) => withBytes(enc.encode(s + "\0"), (p) => f(p));

  class Thread {
    constructor(L) { this.L = L; }
    top() { return x._lua_gettop(this.L); }
    settop(n) { x._lua_settop(this.L, n); }
    pop(n = 1) { x._lua_settop(this.L, -n - 1); }
    type(i) { return x._lua_type(this.L, i); }
    pushNil() { x._lua_pushnil(this.L); }
    pushNumber(n) { x._lua_pushnumber(this.L, n); }
    pushBoolean(b) { x._lua_pushboolean(this.L, b ? 1 : 0); }
    pushString(s) { withBytes(enc.encode(s), (p, n) => x._lua_pushlstring(this.L, p, n)); }
    pushValue(i) { x._lua_pushvalue(this.L, i); }
    newTable(a = 0, h = 0) { x._lua_createtable(this.L, a, h); }
    toNumber(i) { return x._lua_tonumberx(this.L, i, 0); }
    toBoolean(i) { return x._lua_toboolean(this.L, i) !== 0; }
    toString(i) {
      const lenp = x._malloc(4);
      try {
        const p = x._lua_tolstring(this.L, i, lenp);
        if (!p) return null;
        const n = new DataView(mod.HEAPU8.buffer).getUint32(lenp, true);
        return dec.decode(mod.HEAPU8.subarray(p, p + n));
      } finally { x._free(lenp); }
    }
    getField(i, k) { cstr(k, (p) => x._lua_getfield(this.L, i, p)); }
    setField(i, k) { cstr(k, (p) => x._lua_setfield(this.L, i, p)); }
    setGlobal(k) { this.setField(GLOBALS, k); }
    getGlobal(k) { this.getField(GLOBALS, k); }
    rawGetI(i, n) { x._lua_rawgeti(this.L, i, n); }
    rawSetI(i, n) { x._lua_rawseti(this.L, i, n); }
    pushFunction(fn, name = "host") {
      funcs.push(fn);
      cstr(name, (p) => x._wb_push_jsfunc(this.L, funcs.length - 1, p));
    }
    // Yield from inside a host function: `throw lua.yield(nresults)` after pushing the values to hand to resume().
    yield(n) { return { yield: n }; }
    load(bytecode, chunk = "=chunk") {
      const r = cstr(chunk, (c) => withBytes(bytecode, (p, n) => x._wb_load(this.L, c, p, n)));
      if (r !== 0) { const m = this.toString(-1); this.pop(); throw new LuaError(`load failed: ${m}`); }
    }
    loadSource(src, chunk = "=chunk") {
      const r = cstr(chunk, (c) => withBytes(enc.encode(src), (p, n) => x._wb_loadsource(this.L, c, p, n)));
      if (r !== 0) { const m = this.toString(-1); this.pop(); throw new LuaError(`compile failed: ${m}`); }
    }
    // Calls the function below the nargs arguments on top of the stack. Results stay on the stack. Throws LuaError.
    pcall(nargs, nresults = -1) {
      const r = x._lua_pcall(this.L, nargs, nresults, 0);
      if (r !== 0) { const m = this.toString(-1); this.pop(); throw new LuaError(m ?? `error ${r}`); }
    }
    newThread() { const L2 = x._lua_newthread(this.L); return new Thread(L2); }
    // resume this coroutine with nargs on its stack; returns status (OK=done, YIELD=yielded) or throws
    resume(nargs, from = 0) {
      const r = x._lua_resume(this.L, from, nargs);
      if (r !== LUA.OK && r !== LUA.YIELD) { const m = this.toString(-1); throw new LuaError(m ?? `error ${r}`); }
      return r;
    }
    status() { return x._lua_status(this.L); }
    ref(i) { return x._lua_ref(this.L, i); }
    unref(r) { x._lua_unref(this.L, r); }
  }

  x._wb_enable_flags();
  const L = x._wb_new_state();
  const main = new Thread(L);
  if (opts.sandbox) x._wb_sandbox(L); // makes globals read-only: register host functions first
  return { main, Thread, mod, LuaError, sandbox: () => x._wb_sandbox(L) };
}
