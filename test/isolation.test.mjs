import test from "node:test";
import assert from "node:assert/strict";
import { isOpaqueOrigin, hostedUrl, pickCoep, explainIsolation, DEFAULT_HOST } from "../src/isolation.mjs";

test("opaque origins", () => {
  assert.equal(isOpaqueOrigin({ protocol: "about:", origin: "null" }), true);
  assert.equal(isOpaqueOrigin({ protocol: "data:", origin: "null" }), true);
  assert.equal(isOpaqueOrigin({ protocol: "file:", origin: "null" }), true);
  assert.equal(isOpaqueOrigin({ protocol: "https:", origin: "https://a.b" }), false);
});

test("hosted url keeps query and hash", () => {
  assert.equal(hostedUrl("https://x.dev", { search: "?placeId=5", hash: "#a" }), "https://x.dev/?placeId=5#a");
  assert.equal(hostedUrl("", { search: "", hash: "" }), DEFAULT_HOST);
});

test("coep choice and messages", () => {
  assert.equal(pickCoep(true), "credentialless");
  assert.equal(pickCoep(false), "require-corp");
  assert.match(explainIsolation("no-service-worker", "x; wv) y"), /WebView/);
  assert.match(explainIsolation("whatever"), /cross-origin isolated/);
});
