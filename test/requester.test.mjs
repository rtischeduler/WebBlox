import test from "node:test";
import assert from "node:assert/strict";
import { createRequester } from "../src/join/requester.mjs";

const res = (status, token) => ({ status, ok: status < 300, headers: new Headers(token ? { "x-csrf-token": token } : {}) });

test("blocks non-Roblox hosts and plain http", async () => {
  const request = createRequester({ fetch: async () => res(200), getCookie: () => "c" });
  await assert.rejects(request("https://example.com/x"), /Blocked/);
  await assert.rejects(request("http://www.roblox.com/x"), /Blocked/);
});

test("attaches the normalised cookie to Roblox hosts", async () => {
  let sent = null;
  const request = createRequester({
    fetch: async (_u, init) => {
      sent = init;
      return res(200);
    },
    getCookie: () => "abc",
  });
  await request("https://games.roblox.com/v1/x");
  assert.equal(sent.headers.cookie, ".ROBLOSECURITY=abc");
  assert.equal(sent.method, "GET");
});

test("retries a POST once with the csrf token from a 403", async () => {
  const sent = [];
  const request = createRequester({
    fetch: async (_u, init) => {
      sent.push(init.headers["x-csrf-token"]);
      return sent.length === 1 ? res(403, "tok") : res(200);
    },
    getCookie: () => "c",
  });
  const out = await request("https://gamejoin.roblox.com/v1/join-game", { method: "POST", body: "{}" });
  assert.equal(out.status, 200);
  assert.deepEqual(sent, [undefined, "tok"]);
});

test("reuses the token on later requests and does not loop on a real 403", async () => {
  const sent = [];
  const request = createRequester({
    fetch: async (_u, init) => {
      sent.push(init.headers["x-csrf-token"]);
      return sent.length === 1 ? res(200, "tok") : res(403, "tok");
    },
    getCookie: () => "c",
  });
  await request("https://gamejoin.roblox.com/a", { method: "POST" });
  const out = await request("https://gamejoin.roblox.com/b", { method: "POST" });
  assert.equal(out.status, 403);
  assert.deepEqual(sent, [undefined, "tok"]);
});

test("never retries a GET", async () => {
  let calls = 0;
  const request = createRequester({
    fetch: async () => {
      calls++;
      return res(403, "tok");
    },
    getCookie: () => "c",
  });
  const out = await request("https://games.roblox.com/x");
  assert.equal(out.status, 403);
  assert.equal(calls, 1);
});
