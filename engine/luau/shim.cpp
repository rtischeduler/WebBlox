// WebBlox Luau wasm shim: stock luau-lang/luau VM + compiler, plus a tiny bridge so JS can implement Lua C functions.
// JS function N is exposed to Lua as a C closure (upvalue 1 = N). When Lua calls it, wb_js_call(L, N) runs in JS:
// it reads args from the Lua stack (via the exported lua_* API), pushes results, and returns their count.
// Return -1 to raise an error (JS pushes the error value first); -2 to yield that many results (coroutine yield).
// Raising and yielding happen here, outside the JS frame, so no JS frame is ever unwound by a C++ exception.
#include <emscripten.h>
#include <string.h>
#include "lua.h"
#include "lualib.h"
#include "luacode.h"
#include "Luau/Common.h"

EM_JS(int, wb_js_call, (lua_State* L, int id), { return Module.wbCall(L, id); });

static int wb_trampoline(lua_State* L)
{
    int id = (int)lua_tonumber(L, lua_upvalueindex(1));
    int n = wb_js_call(L, id);
    if (n == -1) { lua_error(L); return 0; }
    if (n <= -2) return lua_yield(L, -n - 2);
    return n;
}

extern "C" {

EMSCRIPTEN_KEEPALIVE void wb_enable_flags()
{
    for (Luau::FValue<bool>* f = Luau::FValue<bool>::list; f; f = f->next)
        if (strncmp(f->name, "Luau", 4) == 0) f->value = true;
}

EMSCRIPTEN_KEEPALIVE lua_State* wb_new_state()
{
    lua_State* L = luaL_newstate();
    luaL_openlibs(L);
    return L;
}

EMSCRIPTEN_KEEPALIVE void wb_push_jsfunc(lua_State* L, int id, const char* debugname)
{
    lua_pushnumber(L, id);
    lua_pushcclosurek(L, wb_trampoline, debugname, 1, nullptr);
}

// Load bytecode (already decoded to stock Luau format). Pushes the function, or an error string. Returns lua status.
EMSCRIPTEN_KEEPALIVE int wb_load(lua_State* L, const char* chunkname, const char* bytecode, size_t size)
{
    return luau_load(L, chunkname, bytecode, size, 0);
}

// Compile source and load it (used by tests and by the runtime's own Luau prelude).
EMSCRIPTEN_KEEPALIVE int wb_loadsource(lua_State* L, const char* chunkname, const char* source, size_t size)
{
    size_t bsize = 0;
    char* bc = luau_compile(source, size, nullptr, &bsize);
    int r = luau_load(L, chunkname, bc, bsize, 0);
    free(bc);
    return r;
}

EMSCRIPTEN_KEEPALIVE void wb_sandbox(lua_State* L) { luaL_sandbox(L); }
EMSCRIPTEN_KEEPALIVE void wb_sandboxthread(lua_State* L) { luaL_sandboxthread(L); }

}
