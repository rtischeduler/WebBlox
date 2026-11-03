import test from "node:test";
import assert from "node:assert/strict";
import { joinGame, JOIN_VARIANTS } from "../src/join/gamejoin.mjs";

const reply = (script) => async (url, opts) => ({ ok: true, status: 200, text: async () => JSON.stringify({ status: 2, jobId: "j", joinScript: script }) });

test("moves to the next request variant when the join script has no GameFqdn", async () => {
  const seen = [];
  const request = async (url, opts) => {
    seen.push(opts.headers);
    const script = seen.length === 1 ? { MachineAddress: "1.2.3.4", ServerPort: 53000 } : { GameFqdn: "a.example.com", NetStackPort: 443 };
    return reply(script)(url, opts);
  };
  const r = await joinGame({ request, placeId: 1, browserTrackerId: 5 });
  assert.equal(seen.length, 2);
  assert.equal(seen[1]["roblox-place-id"], "1");
  assert.equal(r.script.GameFqdn, "a.example.com");
  assert.deepEqual(r.tried.map((t) => t.variant), JOIN_VARIANTS.map((v) => v.name));
});

test("returns the first script with diagnostics when no variant yields GameFqdn", async () => {
  const r = await joinGame({ request: reply({ MachineAddress: "1.2.3.4" }), placeId: 1, browserTrackerId: 5 });
  assert.equal(r.tried.length, JOIN_VARIANTS.length);
  assert.equal(r.tried[0].hasMachine, true);
  assert.deepEqual(r.tried[0].wtMissing, ["GameFqdn", "NetStackPort"]);
});

import { buildWtUrl, describeJoin } from "../src/join/gamejoin.mjs";

test("reads port, caps and cert hashes from the URL-encoded NetStackConfig", () => {
  const cfg = encodeURIComponent(JSON.stringify({ pubKey: "k", port: 65116, caps: "022dd3e750bb1896", certHashes: ["aBpCKN56yPZ+HrwgO4pE36/l6ZmU58jZB5eOowGG/dY="] }));
  const w = buildWtUrl({ gameFqdn: "h.example.com", NetStackConfig: cfg });
  assert.equal(w.url, "https://h.example.com:65116/wt?X-Rbx-Capabilities=022dd3e750bb1896&X-Rbx-Close-Reason=utf8-v1");
  assert.equal(describeJoin({ NetStackConfig: cfg }).certHashes.length, 1);
});

test("fetches joinScriptUrl when the inline script has gameFqdn null", async () => {
  const calls = [];
  const request = async (url, opts) => {
    calls.push(opts.method);
    if (opts.method === "GET") return { ok: true, status: 200, text: async () => JSON.stringify({ GameFqdn: "h.example.com", NetStackPort: 443 }) };
    return { ok: true, status: 200, text: async () => JSON.stringify({ status: 2, joinScript: { gameFqdn: null, NetStackPort: 443, MachineAddress: "10.0.0.1" }, joinScriptUrl: "https://x/Join.ashx" }) };
  };
  const r = await joinGame({ request, placeId: 1, browserTrackerId: 5 });
  assert.deepEqual(calls, ["POST", "GET"]);
  assert.equal(r.script.GameFqdn, "h.example.com");
  assert.equal(r.script.MachineAddress, "10.0.0.1");
});
