#!/usr/bin/env bash
# Builds engine/luau/luau.js + luau.wasm from stock luau-lang/luau (LUAU_SRC) plus shim.cpp.
# Needs emscripten (conda-forge: micromamba create -n em -c conda-forge emscripten). Objects compile in parallel and are cached in $OBJ.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
LUAU_SRC="${LUAU_SRC:-/tmp/luau}"; OUT="${OUT:-$HERE}"; OBJ="${OBJ:-/tmp/luau-obj}"; mkdir -p "$OBJ"
INC="-I$LUAU_SRC/VM/include -I$LUAU_SRC/VM/src -I$LUAU_SRC/Compiler/include -I$LUAU_SRC/Compiler/src -I$LUAU_SRC/Ast/include -I$LUAU_SRC/Common/include -I$LUAU_SRC/Bytecode/include -I$LUAU_SRC/Bytecode/src"
CF="-DLUA_API='extern \"C\"' -O2 -std=c++17 -fwasm-exceptions -DNDEBUG $INC"
SRCS="$(ls $LUAU_SRC/VM/src/*.cpp $LUAU_SRC/Compiler/src/*.cpp $LUAU_SRC/Ast/src/*.cpp $LUAU_SRC/Common/src/*.cpp $LUAU_SRC/Bytecode/src/*.cpp) $HERE/shim.cpp"
echo "$SRCS" | tr ' ' '\n' | xargs -P "$(nproc)" -I{} bash -c 'o="'"$OBJ"'/$(echo {} | md5sum | cut -c1-8)_$(basename {}).o"; [ "$o" -nt {} ] && [ "{}" != "'"$HERE"'/shim.cpp" ] || emcc '"$CF"' -c {} -o "$o"'
API="lua_gettop lua_settop lua_pushvalue lua_remove lua_insert lua_replace lua_checkstack lua_rawcheckstack lua_type lua_typename lua_tonumberx lua_tointegerx lua_tounsignedx lua_toboolean lua_tolstring lua_tolstringatom lua_touserdata lua_touserdatatagged lua_userdatatag lua_tothread lua_topointer lua_objlen lua_rawequal lua_equal lua_lessthan lua_isnumber lua_isstring lua_iscfunction lua_isLfunction lua_pushnil lua_pushnumber lua_pushinteger lua_pushunsigned lua_pushvector lua_pushlstring lua_pushstring lua_pushboolean lua_pushlightuserdatatagged lua_pushthread lua_pushcclosurek lua_getfield lua_rawgetfield lua_rawget lua_rawgeti lua_createtable lua_setreadonly lua_getreadonly lua_newuserdatatagged lua_newuserdatadtor lua_getmetatable lua_getfenv lua_setfield lua_rawsetfield lua_rawset lua_rawseti lua_setmetatable lua_setfenv lua_call lua_pcall lua_yield lua_break lua_resume lua_resumeerror lua_status lua_isyieldable lua_costatus lua_newthread lua_mainthread lua_xmove lua_gettable lua_settable lua_next lua_concat lua_error lua_ref lua_unref lua_setuserdatatag lua_setuserdatametatable lua_getuserdatametatable lua_gc lua_getupvalue lua_setupvalue lua_clonefunction lua_cleartable lua_close lua_resetthread lua_isthreadreset luaL_register luaL_getmetafield luaL_newmetatable luaL_findtable luaL_openlibs luaL_sandbox luaL_sandboxthread lua_clock"
EXPORTS="_malloc,_free,_wb_enable_flags,_wb_new_state,_wb_push_jsfunc,_wb_load,_wb_loadsource,_wb_sandbox,_wb_sandboxthread"
for f in $API; do EXPORTS="$EXPORTS,_$f"; done
emcc -Wl,--error-limit=0 -O0 -fwasm-exceptions $OBJ/*.o -o "$OUT/luau.js" \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=createLuau -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=16MB \
  -sENVIRONMENT=web,worker,node -sFILESYSTEM=0 -sSTACK_SIZE=1MB \
  -sEXPORTED_FUNCTIONS="$EXPORTS" -sEXPORTED_RUNTIME_METHODS=HEAPU8,UTF8ToString,stringToUTF8,lengthBytesUTF8,wasmMemory
echo BUILD-DONE
