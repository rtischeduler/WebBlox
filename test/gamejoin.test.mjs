import test from "node:test";
import assert from "node:assert/strict";
import {
  ENDPOINTS,
  JoinError,
  buildJoinBody,
  describeJoin,
  joinGame,
  normalizeHash,
  parseJoinScript,
  probeJoin,
  randomTrackerId,
  redact,
} from "../src/join/gamejoin.mjs";

const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(body) });
const base = { placeId: 123, uuid: () => "attempt-1", sleep: async () => {} };

test("buildJoinBody matches the engine's standard and instance join bodies", () => {
  const tracker = () => 777;
  assert.deepEqual(buildJoinBody({ placeId: "5", tracker }), { placeId: 5, browserTrackerId: 777 });
  assert.deepEqual(buildJoinBody({ placeId: 5, browserTrackerId: "42", tracker }), { placeId: 5, browserTrackerId: 42 });
  assert.deepEqual(buildJoinBody({ placeId: 5, jobId: "job", browserTrackerId: 42 }), { placeId: 5, gameId: "job", isPlayTogetherGame: false, browserTrackerId: 42 });
  assert.equal(buildJoinBody({ placeId: 5, browserTrackerId: 1, forcedPop: "x" }).forcedPop, "x");
  assert.equal("isTeleport" in buildJoinBody({ placeId: 5, tracker }), false);
  assert.equal("gameJoinAttemptId" in buildJoinBody({ placeId: 5, tracker }), false);
});

test("randomTrackerId makes a positive integer without a leading zero", () => {
  const n = randomTrackerId(() => 0.05);
  assert.ok(Number.isInteger(n) && n > 0 && !String(n).startsWith("0"));
});

test("parseJoinScript accepts objects and signed text", () => {
  assert.deepEqual(parseJoinScript({ a: 1 }), { a: 1 });
  assert.deepEqual(parseJoinScript('--rbxsig%abc%{"UserId":7}'), { UserId: 7 });
  assert.equal(parseJoinScript("nonsense"), null);
  assert.equal(parseJoinScript(null), null);
});

test("normalizeHash converts hex sha-256 to base64 and passes base64 through", () => {
  const zeros = "A".repeat(43) + "=";
  assert.equal(normalizeHash("00".repeat(32)), zeros);
  assert.equal(normalizeHash(zeros), zeros);
  assert.equal(normalizeHash("short"), null);
  assert.equal(normalizeHash(5), null);
});

test("describeJoin reads object endpoints, string endpoints and the UdMux fallback", () => {
  const a = describeJoin({
    UserId: 9,
    UserName: "bob",
    DisplayName: "Bob",
    PlaceId: 1,
    GameId: "job-1",
    MachineAddress: "10.0.0.1",
    ServerPort: 53000,
    UdmuxEndpoints: [{ Address: "1.2.3.4", Port: 4444 }, "5.6.7.8:5555", { nope: true }],
    RbxTransportConfig: { ephemeralEarlyPublicKey: "k", certHashes: ["00".repeat(32)], rbxTransportToken: "t" },
  });
  assert.deepEqual(a.udmux, [{ host: "1.2.3.4", port: 4444 }, { host: "5.6.7.8", port: 5555 }]);
  assert.deepEqual(a.user, { id: 9, name: "bob", displayName: "Bob" });
  assert.deepEqual(a.machine, { host: "10.0.0.1", port: 53000 });
  assert.equal(a.jobId, "job-1");
  assert.deepEqual(a.certHashes, ["A".repeat(43) + "="]);
  assert.deepEqual(a.configKeys, ["ephemeralEarlyPublicKey", "certHashes", "rbxTransportToken"]);

  const b = describeJoin({ UdMuxIp: "9.9.9.9", UdMuxPort: "6000" });
  assert.deepEqual(b.udmux, [{ host: "9.9.9.9", port: 6000 }]);
  assert.deepEqual(describeJoin(null).udmux, []);
});

test("redact hides tickets and sessions but keeps public data", () => {
  const out = redact({
    ClientTicket: "abcdef",
    SessionId: "{json}",
    UserName: "bob",
    RbxTransportConfig: { rbxTransportToken: "tok", ephemeralEarlyPublicKey: "pub" },
    UdmuxEndpoints: [{ Address: "1.1.1.1", Port: 1 }],
  });
  assert.equal(out.ClientTicket, "<redacted 6>");
  assert.equal(out.SessionId, "<redacted 6>");
  assert.equal(out.UserName, "bob");
  assert.equal(out.RbxTransportConfig.rbxTransportToken, "<redacted 3>");
  assert.equal(out.RbxTransportConfig.ephemeralEarlyPublicKey, "pub");
  assert.deepEqual(out.UdmuxEndpoints, [{ Address: "1.1.1.1", Port: 1 }]);
});

test("joinGame polls until joined and returns the script", async () => {
  const replies = [reply(200, { status: 0 }), reply(200, { status: 1, message: "loading" }), reply(200, { status: 2, jobId: "j1", joinScript: { UserId: 1 } })];
  const seen = [];
  const calls = [];
  const result = await joinGame({
    ...base,
    request: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body), method: init.method });
      return replies.shift();
    },
    onStatus: (s) => seen.push(s.status),
  });
  assert.deepEqual(seen, [0, 1, 2]);
  assert.equal(result.jobId, "j1");
  assert.deepEqual(result.script, { UserId: 1 });
  assert.equal(calls[0].url, ENDPOINTS.join);
  assert.equal(calls[0].method, "POST");
  assert.deepEqual(Object.keys(calls[0].body).sort(), ["browserTrackerId", "placeId"]);
});

test("joinGame uses the instance endpoint with a job id", async () => {
  let url = "";
  let body = null;
  await joinGame({
    ...base,
    jobId: "abc",
    request: async (u, init) => {
      url = u;
      body = JSON.parse(init.body);
      return reply(200, { status: 2, joinScript: { GameId: "abc" } });
    },
  });
  assert.equal(url, ENDPOINTS.instance);
  assert.equal(body.gameId, "abc");
});

test("joinGame fetches joinScriptUrl when the script is not inline", async () => {
  const requests = [];
  const result = await joinGame({
    ...base,
    request: async (url, init) => {
      requests.push(url);
      if (init.method === "POST") return reply(200, { status: 2, joinScriptUrl: "https://assetgame.roblox.com/js" });
      return { status: 200, ok: true, text: async () => '--rbxsig%x%{"UserId":3}' };
    },
  });
  assert.deepEqual(result.script, { UserId: 3 });
  assert.equal(requests.length, 2);
});

test("joinGame reports terminal statuses, HTTP errors and timeouts", async () => {
  await assert.rejects(
    joinGame({ ...base, request: async () => reply(200, { status: 6, message: "Game is full" }) }),
    (e) => e instanceof JoinError && e.status === 6 && e.message === "Game is full (status 6, HTTP 200)",
  );
  await assert.rejects(
    joinGame({ ...base, request: async () => reply(401, { errors: [{ code: 0, message: "Unauthorized" }] }) }),
    (e) => e instanceof JoinError && e.message === "Unauthorized (status none, HTTP 401, code 0)",
  );
  await assert.rejects(
    joinGame({ ...base, request: async () => ({ status: 502, ok: false, text: async () => "<html>" }) }),
    /HTTP 502/,
  );
  await assert.rejects(joinGame({ ...base, maxPolls: 2, request: async () => reply(200, { status: 0 }) }), /Timed out/);
  await assert.rejects(joinGame({ ...base, placeId: "x", request: async () => reply(200, {}) }), /Invalid place id/);
});

test("joinGame stops when aborted", async () => {
  const ac = new AbortController();
  ac.abort();
  await assert.rejects(joinGame({ ...base, signal: ac.signal, request: async () => reply(200, { status: 0 }) }), /Cancelled/);
});

test("joinGame fails clearly when success has no script", async () => {
  await assert.rejects(joinGame({ ...base, request: async () => reply(200, { status: 2 }) }), /no join script/);
});

test("probeJoin checks auth then tries each variant once and reports rows", async () => {
  const seen = [];
  const request = async (url, init) => {
    seen.push({ url, method: init.method, headers: init.headers });
    if (url.includes("users.roblox.com")) return { status: 200, ok: true, text: async () => JSON.stringify({ id: 9 }) };
    return reply(200, { status: 12, message: "Unable to join Game 211" });
  };
  const rows = await probeJoin({ request, placeId: 5, browserTrackerId: 1 });
  assert.equal(rows[0].authenticated, true);
  assert.equal(rows[0].userId, 9);
  assert.equal(rows.length, 6);
  assert.ok(rows.slice(1).every((r) => r.status === 12 && r.http === 200));
  assert.ok(seen.some((r) => r.url === "https://gamejoin.roblox.com/v2/join-game"));
  assert.deepEqual(Object.keys(seen.find((r) => r.method === "POST" && r.headers["user-agent"]).headers).includes("user-agent"), true);
});

test("probeJoin records network errors per variant", async () => {
  const rows = await probeJoin({ request: async () => { throw new Error("boom"); }, placeId: 5, browserTrackerId: 1 });
  assert.equal(rows.length, 6);
  assert.ok(rows.every((r) => r.error === "boom"));
});
