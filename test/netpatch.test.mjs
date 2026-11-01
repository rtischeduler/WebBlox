import test from "node:test";
import assert from "node:assert/strict";
import { isProxied, cookieHeader, engineName, shape } from "../src/netpatch.mjs";
test("hosts", () => { assert.ok(isProxied("https://gamejoin.roblox.com/v1/join-game")); assert.ok(isProxied("https://setup.rbxcdn.com/x")); assert.ok(!isProxied("https://example.com/")); });
test("cookie", () => { assert.equal(cookieHeader("abc"), ".ROBLOSECURITY=abc"); assert.equal(cookieHeader("ROBLOSECURITY=abc"), ".ROBLOSECURITY=abc"); assert.equal(cookieHeader(""), ""); });
test("engine name", () => { assert.equal(engineName("https://a/b/engine/WebClient.wasm?x=1", "https://a/b/engine/"), "WebClient.wasm"); assert.equal(engineName("https://z/", "https://a/"), null); });
test("shape hides values", () => { assert.deepEqual(shape({ t: "secret", n: 1 }), { t: "str(6)", n: 1 }); });
