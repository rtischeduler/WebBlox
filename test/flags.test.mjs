import test from "node:test";
import assert from "node:assert/strict";
import { parseFlagParams, flagOverrideScript, DEFAULT_FLAG_OVERRIDES } from "../src/flags.mjs";

test("default override is applied, params add/replace/remove, junk is ignored", () => {
  assert.deepEqual(parseFlagParams(""), DEFAULT_FLAG_OVERRIDES);
  assert.equal(parseFlagParams("?flag=FFlagX=True").FFlagX, "True");
  assert.equal(parseFlagParams("?flag=FFlagBaseClientGateOnSendChannel=True").FFlagBaseClientGateOnSendChannel, "True");
  assert.equal("FFlagBaseClientGateOnSendChannel" in parseFlagParams("?flag=FFlagBaseClientGateOnSendChannel="), false);
  assert.deepEqual(parseFlagParams("?flag=bad name=1&flag=novalue&flag=A=<x>"), DEFAULT_FLAG_OVERRIDES);
});

test("script exposes getFlagOverrides and merges any previous provider", () => {
  const window = {};
  new Function("window", "console", flagOverrideScript({ FFlagA: "False" }))(window, { warn() {} });
  assert.deepEqual(window.__wasmDevSettings.getFlagOverrides(), { FFlagA: "False" });
  window.__wasmDevSettings.getFlagOverrides = () => ({ Old: "1" });
  new Function("window", "console", flagOverrideScript({ FFlagB: "True" }))(window, { warn() {} });
  assert.deepEqual(window.__wasmDevSettings.getFlagOverrides(), { Old: "1", FFlagB: "True" });
});

test("debugnet adds logging flags and can be combined with flag params", () => {
  const f = parseFlagParams("?debugnet=1&flag=DFFlagRbxTransportRtcioRejectChannelOpenOnFailedConnect=False");
  assert.equal(f.FLogNetwork, "7");
  assert.equal(f.DFFlagRbxTransportRtcioRejectChannelOpenOnFailedConnect, "False");
  assert.equal(f.FFlagBaseClientGateOnSendChannel, "False");
});
