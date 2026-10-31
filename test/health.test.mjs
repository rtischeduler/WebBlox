import test from "node:test";
import assert from "node:assert/strict";
import { parseEngineFailure, classifyLog, createBadList, createWatchdog } from "../src/health.mjs";
import { provisionalWisp, markWispBad, FALLBACK } from "../src/wisps.mjs";

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k) };
};

test("only the engine failure line is classified", () => {
  assert.equal(classifyLog('[LoadingScreen] Engine failure: {"message":"Error: Failed to open send channel Chat!"}'), "engine-failure");
  assert.equal(classifyLog('Request "https://ephemeralcounters.api.roblox.com/" failed with error code 60'), null);
  assert.equal(classifyLog(undefined), null);
});

test("bad list entries expire", () => {
  let t = 1000;
  const list = createBadList({ storage: memory(), now: () => t, ttl: 500, key: (e) => e.toLowerCase() });
  list.add("A.example");
  assert.equal(list.has("a.example"), true);
  t += 499;
  assert.equal(list.has("A.example"), true);
  t += 2;
  assert.equal(list.has("a.example"), false);
});

test("watchdog marks the failed server, switches and relaunches once per failure", async () => {
  const calls = [];
  let wisp = "wss://one/";
  const dog = createWatchdog({
    current: () => wisp,
    markBad: (w) => calls.push(["bad", w]),
    switchWisp: async (exclude) => { calls.push(["switch", exclude]); wisp = "wss://two/"; return wisp; },
    relaunch: async () => calls.push(["relaunch"]),
    max: 2,
  });
  assert.equal(await dog.feed("something else"), false);
  assert.equal(await dog.feed("[LoadingScreen] Engine failure: {}"), true);
  assert.deepEqual(calls, [["bad", "wss://one/"], ["switch", ["wss://one/"]], ["relaunch"]]);
});

test("watchdog stops after max attempts and skips relaunch when no other server exists", async () => {
  let relaunches = 0;
  const dog = createWatchdog({
    current: () => "wss://one/",
    markBad: () => {},
    switchWisp: async () => "wss://one/",
    relaunch: async () => { relaunches++; },
    max: 2,
  });
  assert.equal(await dog.feed("[LoadingScreen] Engine failure"), false);
  assert.equal(await dog.feed("[LoadingScreen] Engine failure"), false);
  assert.equal(await dog.feed("[LoadingScreen] Engine failure"), false);
  assert.equal(relaunches, 0);
  assert.equal(dog.used, 2);
});

test("provisional wisp skips a last-used server that was marked bad", () => {
  globalThis.localStorage = memory();
  try {
    localStorage.setItem("WB_LAST", JSON.stringify({ entry: "cdn.good.example", ts: Date.now() }));
    let set = null;
    assert.equal(provisionalWisp({ set_websocket: (u) => { set = u; } }), "wss://cdn.good.example/");
    markWispBad("cdn.good.example");
    assert.equal(provisionalWisp({ set_websocket: (u) => { set = u; } }), FALLBACK);
    assert.equal(set, FALLBACK);
  } finally {
    delete globalThis.localStorage;
  }
});

test("identical failure on a second server stops retries and does not blame it", async () => {
  const bad = [];
  let n = 0;
  const dog = createWatchdog({ current: () => "wss://s" + n, markBad: (w) => bad.push(w), switchWisp: async () => "wss://s" + ++n, relaunch: async () => {}, max: 5 });
  const f = '[LoadingScreen] Engine failure: {"message":"Error: Failed to open send channel Chat!","errorCode":256}';
  assert.deepEqual(parseEngineFailure(f), { message: "Error: Failed to open send channel Chat!", code: 256 });
  assert.equal(await dog.feed(f), true);
  assert.equal(await dog.feed(f), false);
  assert.equal(await dog.feed(f), false);
  assert.deepEqual(bad, ["wss://s0"]);
});
