import test from "node:test";
import assert from "node:assert/strict";
import { injectIntoHtml, runNavHooks, onNavigate, runHtmlHooks, injectJs, resetHooks } from "../src/hooks.mjs";
import { parseWispList, toWss } from "../src/wisps.mjs";

test("injects after <head>", () => {
  assert.equal(injectIntoHtml("<html><head lang=x><title>a</title>", "<b></b>"), "<html><head lang=x><b></b><title>a</title>");
  assert.equal(injectIntoHtml("<p>hi</p>", "<b></b>"), "<b></b><p>hi</p>");
});

test("nav hooks rewrite and cancel", () => {
  resetHooks();
  onNavigate((u) => (u.includes("ads") ? false : u.replace("http:", "https:")));
  assert.equal(runNavHooks("http://roblox.com/login"), "https://roblox.com/login");
  assert.equal(runNavHooks("https://ads.example"), false);
});

test("html hooks run after injection", () => {
  resetHooks();
  injectJs("window.x=1");
  const out = runHtmlHooks("<head></head>", "u");
  assert.match(out, /<script data-webblox>window\.x=1<\/script>/);
});

test("wisp list decoding", () => {
  const b64 = Buffer.from(JSON.stringify(["wss://a.b/wisp/", "nope"])).toString("base64");
  assert.deepEqual(parseWispList([b64]), ["wss://a.b/wisp/"]);
  assert.equal(toWss("cdn.x.org"), "wss://cdn.x.org/");
});
