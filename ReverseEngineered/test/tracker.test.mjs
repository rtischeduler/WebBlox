import test from "node:test";
import assert from "node:assert/strict";
import { ensureBrowserTrackerId, buildTrackerCookie, readBrowserTrackerId } from "../src/join/cookie.mjs";
import { installWtTap } from "../src/wt-tap.mjs";

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const jarDoc = () => { const d = { _c: "", get cookie() { return this._c; }, set cookie(v) { this._c = v.split(";")[0]; } }; return d; };

test("sets a numeric browser tracker cookie the engine can read, and keeps it stable", () => {
  const doc = jarDoc(), store = mem();
  const id = ensureBrowserTrackerId({ doc, store, random: () => 0.5 });
  assert.equal(id, 555555555555);
  assert.equal(readBrowserTrackerId(doc.cookie), id);
  assert.equal(ensureBrowserTrackerId({ doc, store, random: () => 0.1 }), id);
  const doc2 = jarDoc();
  assert.equal(ensureBrowserTrackerId({ doc: doc2, store, random: () => 0.1 }), id);
});

test("tracker cookie has the site format", () => {
  const c = buildTrackerCookie({ browserId: 7, userId: 9, now: new Date(2026, 10, 2, 15, 4, 5) });
  assert.equal(c, "RBXEventTrackerV2=CreateDate=11/2/2026 3:04:05 PM&rbxid=9&browserid=7");
});

test("WebTransport tap reports new/ready/closed and still returns the real object", async () => {
  const seen = [];
  class Fake { constructor(u, o) { this.u = u; this.ready = Promise.resolve(); this.closed = Promise.resolve({ closeCode: 0, reason: "" }); } }
  const scope = { WebTransport: Fake };
  assert.equal(installWtTap(scope, (e) => seen.push(e)), true);
  assert.equal(installWtTap(scope, () => {}), false);
  const wt = new scope.WebTransport("https://h:1/x", { serverCertificateHashes: [{}, {}] });
  assert.ok(wt instanceof Fake);
  await wt.closed;
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(seen.map((e) => e.ev), ["new", "ready", "closed"]);
  assert.equal(seen[0].hashes, 2);
});
