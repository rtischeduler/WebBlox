import test from "node:test";
import assert from "node:assert/strict";
import { startUrlFor, injectIntoHtml, runNavHooks, onNavigate, runHtmlHooks, injectJs, resetHooks } from "../src/hooks.mjs";
import vm from "node:vm";
import { parseWispList, toWss, parseServerList, decodeLoaderList, provisionalWisp, FALLBACK, HOST_RE, WSS_RE } from "../src/wisps.mjs";

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

test("TongSherbet-style obfuscated loader decodes in a sealed vm", () => {
  const inner = 'var serverList=["a.example.org","b.example.org","c.example.org","wss://d.example.org/wisp/"]';
  const src = `globalThis["ev"+"al"](${JSON.stringify(inner.replace(/\\/g, ""))})`;
  const decode = (s) => vm.runInNewContext(`(${decodeLoaderList})(s,h,w,32)`, { s, h: HOST_RE, w: WSS_RE }, { timeout: 2000 });
  assert.deepEqual([...parseServerList(src, decode)], ["a.example.org", "b.example.org", "c.example.org", "wss://d.example.org/wisp/"]);
});

test("plain serverList with reversed hosts", () => {
  assert.deepEqual(parseServerList('serverList=["gro.elpmaxe.a".split("").reverse().join(""),"b.example.org"];'), ["a.example.org", "b.example.org"]);
});

test("provisional wisp is set synchronously (libcurl needs one before its wasm finishes loading)", () => {
  let set = null;
  const url = provisionalWisp({ set_websocket: (u) => { set = u; } });
  assert.equal(set, FALLBACK);
  assert.equal(url, FALLBACK);
});

test("start url defaults to placeId 187909 and only accepts numeric ids", () => {
  assert.equal(startUrlFor(null), "https://play.roblox.com/games/start?placeId=187909");
  assert.equal(startUrlFor("920587237"), "https://play.roblox.com/games/start?placeId=920587237");
  assert.equal(startUrlFor("1&x=2"), "https://play.roblox.com/games/start?placeId=187909");
});
