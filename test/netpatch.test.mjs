import test from "node:test";
import assert from "node:assert/strict";
import { isProxied, cookieHeader, engineName, shape } from "../src/netpatch.mjs";
test("hosts", () => { assert.ok(isProxied("https://gamejoin.roblox.com/v1/join-game")); assert.ok(isProxied("https://setup.rbxcdn.com/x")); assert.ok(!isProxied("https://example.com/")); });
test("cookie", () => { assert.equal(cookieHeader("abc"), ".ROBLOSECURITY=abc"); assert.equal(cookieHeader("ROBLOSECURITY=abc"), ".ROBLOSECURITY=abc"); assert.equal(cookieHeader(""), ""); });
test("engine name", () => { assert.equal(engineName("https://a/b/engine/WebClient.wasm?x=1", "https://a/b/engine/"), "WebClient.wasm"); assert.equal(engineName("https://z/", "https://a/"), null); });
test("shape hides values", () => { assert.deepEqual(shape({ t: "secret", n: 1 }), { t: "str(6)", n: 1 }); });

test("cookieHeader accepts a full pasted cookie with the warning prefix", () => {
  const v = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you.|_ABC123";
  assert.equal(cookieHeader(v), ".ROBLOSECURITY=" + v);
  assert.equal(cookieHeader(".ROBLOSECURITY=" + v + "; path=/; secure; HttpOnly"), ".ROBLOSECURITY=" + v);
  assert.equal(cookieHeader('Cookie: ".ROBLOSECURITY=' + v.slice(0, 20) + '\n' + v.slice(20) + '"'), ".ROBLOSECURITY=" + v);
  assert.equal(cookieHeader(v.replace(/\|/g, "%7C")), ".ROBLOSECURITY=" + v);
  assert.equal(cookieHeader("  "), "");
});

import { isJoinUrl, describeRequest } from "../src/netpatch.mjs";
test("describeRequest redacts secrets and decodes bodies", () => {
  assert.equal(isJoinUrl("https://gamejoin.roblox.com/v1/join-game"), true);
  assert.equal(isJoinUrl("https://www.roblox.com/x"), false);
  const d = describeRequest("post", "https://gamejoin.roblox.com/v1/join-game", { "Content-Type": "application/json", "X-CSRF-TOKEN": "abc", Cookie: "secret" }, new TextEncoder().encode('{"placeId":1}'));
  assert.equal(d.method, "POST");
  assert.equal(d.headers["Content-Type"], "application/json");
  assert.equal(d.headers["X-CSRF-TOKEN"], "<redacted 3>");
  assert.equal(d.headers.Cookie, "<redacted 6>");
  assert.equal(d.body, '{"placeId":1}');
  assert.equal(describeRequest("get", "u").body, null);
});
