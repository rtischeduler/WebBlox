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
