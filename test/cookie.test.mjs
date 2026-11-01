import test from "node:test";
import assert from "node:assert/strict";
import { parseCookies, readHostCookie } from "../src/join/cookie.mjs";

test("parseCookies splits on the first equals sign and keeps the first duplicate", () => {
  const jar = parseCookies("a=1; b=x=y=; a=2; junk");
  assert.equal(jar.get("a"), "1");
  assert.equal(jar.get("b"), "x=y=");
  assert.equal(jar.has("junk"), false);
});

test("reads the Roblox cookie by its usual names, ignoring case", () => {
  assert.equal(readHostCookie("x=1; .ROBLOSECURITY=abc"), "abc");
  assert.equal(readHostCookie("roblosecurity=abc"), "abc");
  assert.equal(readHostCookie("x=1"), "");
  assert.equal(readHostCookie(""), "");
});

test("decodes a url-encoded value and keeps raw values intact", () => {
  assert.equal(readHostCookie(".ROBLOSECURITY=_%7CWARNING%3A-DO-NOT-SHARE"), "_|WARNING:-DO-NOT-SHARE");
  assert.equal(readHostCookie(".ROBLOSECURITY=_|WARNING:-x=y"), "_|WARNING:-x=y");
  assert.equal(readHostCookie(".ROBLOSECURITY=100%"), "100%");
});

test("skips an empty value and falls through to the next match", () => {
  assert.equal(readHostCookie("ROBLOSECURITY=; .ROBLOSECURITY=real"), "real");
});

test("supports a custom cookie name", () => {
  assert.equal(readHostCookie("session=tok", ["session"]), "tok");
  globalThis.WEBBLOX_COOKIE_NAME = "my_rbx";
  try {
    assert.equal(readHostCookie("my_rbx=tok"), "tok");
  } finally {
    delete globalThis.WEBBLOX_COOKIE_NAME;
  }
});
