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
