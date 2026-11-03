import test from "node:test";
import assert from "node:assert/strict";
import { findServer, loadAvatars, parseServers, serversUrl, thumbBatchBody } from "../src/join/servers.mjs";

const json = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

test("serversUrl encodes the cursor", () => {
  assert.match(serversUrl(5), /games\/5\/servers\/Public\?sortOrder=Desc/);
  assert.match(serversUrl(5, "a b"), /&cursor=a%20b$/);
});

test("parseServers normalises entries and tolerates junk", () => {
  const out = parseServers({ data: [{ id: "a", playing: 2, maxPlayers: 10, playerTokens: ["t1", 2] }], nextPageCursor: "n" });
  assert.deepEqual(out.servers[0], { id: "a", playing: 2, maxPlayers: 10, ping: null, fps: null, playerTokens: ["t1", "2"] });
  assert.equal(out.next, "n");
  assert.deepEqual(parseServers(null), { servers: [], next: null });
});

test("findServer pages until it finds the job id", async () => {
  const pages = [
    json(200, { data: [{ id: "x" }], nextPageCursor: "p2" }),
    json(200, { data: [{ id: "target", playing: 3, maxPlayers: 8, playerTokens: ["a"] }] }),
  ];
  const urls = [];
  const out = await findServer({
    placeId: 7,
    jobId: "target",
    request: async (url) => {
      urls.push(url);
      return pages.shift();
    },
  });
  assert.equal(out.server.id, "target");
  assert.equal(out.scanned, 2);
  assert.match(urls[1], /cursor=p2/);
});

test("findServer reports misses, rate limits and errors", async () => {
  const miss = await findServer({ placeId: 1, jobId: "z", request: async () => json(200, { data: [{ id: "a" }] }) });
  assert.deepEqual(miss, { server: null, scanned: 1 });
  const limited = await findServer({ placeId: 1, jobId: "z", request: async () => json(429, {}) });
  assert.equal(limited.rateLimited, true);
  const failed = await findServer({ placeId: 1, jobId: "z", request: async () => json(500, {}) });
  assert.equal(failed.error, "HTTP 500");
  const capped = await findServer({
    placeId: 1,
    jobId: "z",
    maxPages: 2,
    request: async () => json(200, { data: [{ id: "a" }], nextPageCursor: "more" }),
  });
  assert.equal(capped.scanned, 2);
});

test("thumbBatchBody builds one request per token", () => {
  const body = thumbBatchBody(["t1", "t2"]);
  assert.equal(body.length, 2);
  assert.equal(body[1].token, "t2");
  assert.equal(body[1].type, "AvatarHeadShot");
  assert.notEqual(body[0].requestId, body[1].requestId);
});

test("loadAvatars maps responses back to tokens", async () => {
  const out = await loadAvatars({
    tokens: ["t1", "t2"],
    request: async (_url, init) => {
      const sent = JSON.parse(init.body);
      return json(200, {
        data: [
          { requestId: sent[0].requestId, state: "Completed", imageUrl: "https://tr.rbxcdn.com/a.png" },
          { requestId: sent[1].requestId, state: "Pending", imageUrl: "" },
        ],
      });
    },
  });
  assert.deepEqual(out, [
    { token: "t1", imageUrl: "https://tr.rbxcdn.com/a.png" },
    { token: "t2", imageUrl: "" },
  ]);
});

test("loadAvatars stops on an HTTP failure", async () => {
  assert.deepEqual(await loadAvatars({ tokens: ["a"], request: async () => json(500, {}) }), []);
});
