import test from "node:test";
import assert from "node:assert/strict";
import { flagsUrl, engineBaseForUpload, loaderSeeds, versionUrl } from "../.github/scripts/loader-map.mjs";

test("engine base and seeds follow WasmLoader.js", () => {
  assert.equal(engineBaseForUpload("version-abc"), "https://setup.rbxcdn.com/webclient/version-abc-RobloxWebClient");
  assert.equal(versionUrl(), "https://clientsettings.roblox.com/v2/client-version/WebClientApp");
  const s = loaderSeeds("version-abc");
  assert.ok(s.includes("https://setup.rbxcdn.com/webclient/version-abc-RobloxWebClient/WasmPlayer.js"));
  assert.equal(flagsUrl(), "https://clientsettingscdn.roblox.com/v2/settings/application/WebClientApp");
  assert.ok(loaderSeeds(null).includes(flagsUrl()));
  assert.equal(loaderSeeds(null).length, 3);
});
