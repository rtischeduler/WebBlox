import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Pull latest()/read()/write() out of join.html's module script and run them against a fake fetch + localStorage.
const html = readFileSync(new URL("../join.html", import.meta.url), "utf8");
const body = html.match(/<script type="module">([\s\S]*?)<\/script>/g).pop();
const code = body.slice(body.indexOf("const HEX"), body.indexOf("const bases"));
const make = (responses) => {
  const store = new Map();
  const calls = [];
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); const r = responses.shift(); if (r instanceof Error) throw r; return r; };
  const mod = new Function(code + "\nreturn { latest, read, write };")();
  return { ...mod, calls, store };
};
const A = "a".repeat(40), B = "b".repeat(40);
const ok = (sha, etag) => ({ status: 200, ok: true, headers: { get: () => etag }, json: async () => ({ sha }) });

test("stores newest sha, revalidates with ETag (304 keeps it), reuses it when GitHub fails", async () => {
  const t = make([ok(A, "W/\"1\""), { status: 304, ok: false, headers: { get: () => null } }, new Error("offline"), ok(B, "W/\"2\"")]);
  assert.equal(await t.latest("o/r"), A);
  t.write("o/r", { ...t.read("o/r"), at: 0 });
  assert.equal(await t.latest("o/r"), A);
  assert.equal(t.calls[1].init.headers["If-None-Match"], "W/\"1\"");
  t.write("o/r", { ...t.read("o/r"), at: 0 });
  assert.equal(await t.latest("o/r"), A); // API down -> stored sha, never empty
  t.write("o/r", { ...t.read("o/r"), at: 0 });
  assert.equal(await t.latest("o/r"), B); // GitHub reports a newer one -> replaces it
  assert.equal(t.read("o/r").sha, B);
});
