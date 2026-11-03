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
