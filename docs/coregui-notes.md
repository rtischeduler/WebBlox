# CoreGui: where the real UI comes from

Findings from static analysis of `WebClient.wasm` + `WebClient.metadata.json`:

- No Luau source is embedded in the wasm (no `local function`, `--!strict`, `require(script` etc.).
- `WebClient.metadata.json` (2862 entries) is only on-demand assets: UI textures/sprite sheets
  (`content/textures/ui`, `ExtraContent/LuaPackages/Packages/_Index/FoundationImages/...`), fonts. No scripts.
- The engine references `rbxasset://scripts/CoreScripts`, `CorePackages`, `LuaPackages`, `LuauForgeChunks`.
- CoreScripts are delivered as a **DataModel patch** (`DataModelPatchConfigCollection` / `DataModelPatchConfigurer` /
  `DataModelPatcher`): OTA configs name an `assetId` + `assetVersion`, the signed rbxm is downloaded, verified,
  and applied post-TTI (`DataModelInstances` child, `CorePackages.LuauForgeChunks`). Flags: `DataModelPatchEnableOTAPolling`,
  `DebugLoadCoreScriptsFromPatchOnly`, `DebugSkipOtaPatchVerification`.

Plan: run the `extract-coregui` workflow. It reads the WebClientApp flag set, collects any `assetId`/`assetVersion`
patch configs, downloads each patch via assetdelivery, parses the rbxm (pure python) and commits the instance tree
and every script `Source` to `analysis/coregui/` (`report.txt` says what was found/failed). The client should then
load that tree and drive the HUD from it instead of the hand-written HTML/CSS in `src/`, which later also lets it
render real GUIs replicated from joined games.
Unknown until the first run: whether the patch needs auth, and whether `Source` is plain Luau or bytecode.

## Status: loader in the browser (src/join/coregui/)

First `extract-coregui` run answered the unknowns: the patch needs no auth to list, and every `Source` is **Luau bytecode**
(8-byte header, version, types version, varint string count, strings). There are no GUI instances in the patch
(34,225 ModuleScripts, 2,731 Folders, 6 StringValues, 2 LocalizationTables): the UI is React-Lua built at runtime.

What join.html now does on Join (non-blocking, through the same proxy as everything else):
1. `clientsettings.roblox.com/v2/client-version/WebClientApp` -> latest engine base (falls back to `engine/engine-base.txt`, and says so).
2. Reads `InExperiencePatchConfig` / `UniversalAppPatchConfig` from that base -> `AssetId` + `AssetVersion`.
3. `assetdelivery.roblox.com/v2/assetId/<id>/version/<v>` -> signed URL -> downloads the rbxm (cached in IndexedDB per id@version, newest only).
4. `rbxm.mjs` parses it (zstd via fzstd), `luau.mjs` reads each module's string table, `loader.mjs` indexes paths, modules, localization.
5. `canvas.mjs` draws the real patch identity, module counts and strings found in Chat / PlayerList / TopBar / menu modules onto the canvas. `window.webblox.coregui` exposes `get`, `list`, `modulesMatching`, `uiText`, `summary`.

**Not done:** actually rendering the real CoreGui. That needs a Luau VM that runs this bytecode (bytecode version 6-13 as seen in the patches)
plus the engine's GUI classes (ScreenGui, Frame, TextLabel, UIListLayout, ...) and services (Players, GuiService, TextChatService, ...) bound to a 2D canvas.
The data side is ready for it; the VM and the GUI class layer are the remaining work.
Unverified from the author's sandbox: the live fetch (the sandbox cannot reach roblox.com). The parser is covered by tests on synthetic models and on the checked-in bytecode samples.

## Bytecode is runnable (verified)
The patch bytecode is standard Luau (v13 for InExperience/UniversalApp) with two differences, handled by `src/join/coregui/decode.mjs`:
an 8-byte wrapper, and each instruction's opcode byte stored as `op * 227 mod 256`. Stock Luau's `luau_load` accepts the header but aborts
on the scrambled opcodes (about 18% of scripts crashed the loader before decoding). After `decodeBytecode()`:
- 4,890 of 4,890 sampled InExperience scripts (every 7th of 34,225) load in an unmodified Luau VM built from luau-lang/luau (all fast flags on);
- executing decoded modules works: 21 of 300 small modules ran to completion and returned tables/functions; the rest stopped only because
  `script` / `game` are nil, i.e. the Roblox environment does not exist yet.

Remaining work to render the real CoreGui, in order:
1. Luau VM in the browser (wasm build of luau-lang/luau; needs a toolchain with exception or longjmp support) and a module loader that maps `require(script.Parent.X)` to the patch tree.
2. Roblox runtime for the VM: `game`, `script`, `Instance` + property/signal system, `Enum`, datatypes (UDim2, Vector2, Color3, ...), task/RunService, and the services CoreGui touches (Players, GuiService, UserInputService, TextChatService, HttpService via the proxy).
3. GUI layer: GuiObject classes, layout (UIListLayout, UIGridLayout, UIPadding, AutomaticSize), text measurement, image/sprite-sheet loading from `WebClient.metadata.json`, UICorner/UIStroke/UIGradient, input hit-testing, drawn on the canvas.
4. Replication from the game server (transport.mjs) feeding Players, chat and the player list.

## Step 1 done: Luau VM in the browser + require loader
- `engine/luau/` builds stock luau-lang/luau (commit `2a3d8937`, all `Luau*` fast flags on, as in the earlier native check) plus `shim.cpp` to wasm
  (`build.sh`, emscripten 4.0.9 from conda-forge, `-fwasm-exceptions`). Output `luau.js` + `luau.wasm` (~950 KB, includes the compiler for tests/prelude) is checked in.
  Luau's API has C++ linkage, so the build defines `LUA_API='extern "C"'`. Link runs at `-O0` only because conda's binaryen (117) is older than emscripten expects; objects are `-O2`.
- The shim turns JS functions into Lua C closures (`wb_js_call`). A JS throw becomes a Lua error and `throw lua.yield(n)` becomes `lua_yield`, both raised
  outside the JS frame, so no JS frame is unwound by a C++ exception.
- `src/vm/luau.mjs`: `createVM()` and a small stack API (`load` bytecode, `loadSource`, `pcall`, `pushFunction`, `resume`, ...).
  `luau_load` is not hardened against corrupt bytecode (it traps), so only feed it what `decodeBytecode()` accepted.
- `src/vm/require.mjs`: `createLoader(vm, tree)` + `treeFromPatch(indexPatch)`. `script`/`require` per module, `require(script.Parent.X)`, results cached, failures cached,
  recursive requires detected. Nodes are Instance stand-ins (Name, ClassName, Parent, child lookup, FindFirstChild, WaitForChild, GetChildren, IsA, GetFullName) that step 2 replaces.
- `src/vm/boot.mjs` starts it after the patch loads (`window.webblox.vm`); failures are logged and never break join.

Measured against the real InExperience patch (extracted archive, every 25th CorePackages module, 1,273 of 31,805), with **no Roblox environment at all**:
148 require successfully. The remaining failures are the missing Roblox runtime: `game`/`GetService` (nil), `DefineFastFlag`/`DefineFastString`
(flag module needs `game`), and failures cascading from those. That list is the step 2 worklist.
Finding: 419 files are `.luau` binary blobs in a different encoding from the `.luauc` bytecode (first bytes are not a Luau header); not handled yet.

## Step 2 done: Roblox runtime (src/vm/runtime.lua + runtime.mjs)
Plain Luau run inside the VM (`runtime.lua`), fed host functions by `runtime.mjs` (`createRuntime(vm, tree, { flags, log, measure, async })`).
`boot.mjs` now starts it after the patch loads and mounts `DataModelInstances/*` into `game` (`window.webblox.vm.runtime`).
- **Instance system**: real classes with property tables and defaults, read-only/computed properties, `Instance.new`, Parent/ancestry events, `Changed`/`GetPropertyChangedSignal`,
  attributes, tags (`CollectionService`), `Clone`/`Destroy`, `WaitForChild` with timeout. Patch nodes are lazy Instances (children materialised on first access).
  Classes: Folder, ModuleScript, values, Bindable/Remote events, and the GUI set (ScreenGui, Frame, TextLabel/Button/Box, Image*, ScrollingFrame, CanvasGroup, UIListLayout/Grid/Padding/Corner/Stroke/Gradient/Scale/constraints/flex).
  Unknown members raise Roblox's own "X is not a valid member of Y" error, which keeps the worklist honest.
- **Enum / datatypes**: Enum (known sets with real values for KeyCode/UserInputType; anything else auto-created and listed in `rt.lazyEnums()`), Vector2/3, UDim(2), Color3, Rect, Number/ColorSequence, Font, TweenInfo, Random, DateTime, CFrame (translation only), BrickColor, Path2DControlPoint.
  `type()` reports "userdata" for these (they are tables here) so deep-clone helpers do not walk Enum cycles; `typeof()` gives the Roblox name.
- **Scheduler**: `task.wait/spawn/defer/delay/cancel`, `wait/spawn/delay`, events run in their own coroutines, `rt.step(dt)` drives sleepers, deferred work, RunService (Stepped/PreRender/RenderStepped/Heartbeat, BindToRenderStep) and TweenService tweens.
  `RT.await(kind, payload)` yields a thread until the host answers (`createRuntime({ async: { http } })`): HttpService is built on it, so step 4 can reuse it for the proxy.
- **Services**: Players (LocalPlayer, `rt.addPlayer/removePlayer`), GuiService, UserInputService, StarterGui (SetCore/GetCore/CoreGui enabled), TextChatService + TextChannel, HttpService (JSON in Luau), TextService (measure hook), ContextActionService, LocalizationService, PolicyService, AppStorageService,
  plus telemetry-style services whose unknown methods are no-ops (recorded in `__wb.lenient`). Fast flags: `game:DefineFastFlag/Int/String` read the same flag set the client uses.
- **require**: runs modules in the requiring thread (yields propagate; no coroutine per module, so the ~200-deep C-call limit is not hit by chains), caches results and failures, detects recursion.

Measured against the real InExperience patch (extracted archive, every 25th CorePackages module, `node tools/measure-runtime.mjs <dir> 25`):
**1027 of 1289 require cleanly (80%)**, up from 148 of 1273 with no runtime. 228 of the rest stop at `UIBlox.init(config)`, which is app-level setup (CoreScripts call it before anything renders), not a missing runtime piece.
The leftovers are a few more services (InsertService), `Dev` folders the patch does not contain, and `ValidationEnums` (UGCValidation).
Not done on purpose: layout/`AbsoluteSize`/rendering (step 3), real input, replication of players/chat from the server (step 4). Hooks left for them: `__wb.hooks` (property-change listeners), `__wb.setRaw(inst, prop, value)` for computed values,
`__wb.remote` (RemoteEvent/TextChannel traffic), `host.measure` for text. 419 `.luau` blobs in the other encoding are still unhandled.

## Step 3 done: GUI layer on the canvas (layout + paint + input)
- `src/vm/gui.lua` (3a): layout engine, writes `AbsolutePosition/Size`.
- `src/vm/paint.lua` (3b): `__wb.guiDraw()` walks CoreGui/PlayerGui ScreenGuis (DisplayOrder, ZIndex, clipping) into a JSON draw list (rect/stroke/image/text/clip); `__wb.guiPointer(kind, x, y, button)` hit-tests topmost GuiObject and fires MouseEnter/Leave/MouseMoved, MouseButton1/2 Down/Up/Click, Activated.
- `src/vm/canvasgui.mjs`: paints the list on the 2D canvas, canvas text measurement for the layout engine, image loading (`resolveImage`), pointer wiring, rAF loop calling `rt.step` + relayout on resize.
- `boot.mjs` now attaches it to the join.html canvas, adds the local player, and tries to require the CoreGui entry modules (TopBarApp, PlayerList, Chat, InGameMenu...) logging the outcome in `window.webblox.vm.started`.
Not done: keyboard/TextBox input, rbxasset:// image resolution via `WebClient.metadata.json`, UIGradient painting, running the CoreScripts' own app roots (UIBlox.init etc).
Tests: `node --test test/gui-paint.test.mjs test/gui-layout.test.mjs`.
