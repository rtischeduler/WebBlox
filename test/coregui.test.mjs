import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseRbxm, lz4Block, decodeSource29 } from "../src/join/coregui/rbxm.mjs";
import { readStringTable, looksLikeUiText } from "../src/join/coregui/luau.mjs";
import { loadCoreGui, downloadPatch, resolveEngineBase, engineBase } from "../src/join/coregui/loader.mjs";
import { coreGuiLines } from "../src/join/coregui/canvas.mjs";

// ---- tiny rbxm writer (raw, uncompressed chunks) ----
const te = new TextEncoder();
const u32 = (n) => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
const cat = (...a) => { const o = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const str = (s) => { const b = typeof s === "string" ? te.encode(s) : s; return cat(u32(b.length), b); };
const ints = (v) => { // delta already applied by caller; zigzag + interleave
  const n = v.length, o = new Uint8Array(4 * n);
  v.forEach((x, i) => { const z = ((x << 1) ^ (x >> 31)) >>> 0; o[i] = z >>> 24; o[n + i] = (z >>> 16) & 255; o[2 * n + i] = (z >>> 8) & 255; o[3 * n + i] = z & 255; });
  return o;
};
const deltas = (v) => v.map((x, i) => x - (i ? v[i - 1] : 0));
const chunk = (name, data) => cat(te.encode(name), u32(0), u32(data.length), u32(0), data);
function buildRbxm(items) { // items: {cls, name, source?, parent(index)|-1, value?}
  const classes = [...new Set(items.map((i) => i.cls))];
  const out = [cat(te.encode("<roblox!"), new Uint8Array([0x89, 0xff, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]), u32(classes.length), u32(items.length), new Uint8Array(8))];
  classes.forEach((c, cid) => {
    const refs = items.map((it, r) => (it.cls === c ? r : -1)).filter((r) => r >= 0);
    out.push(chunk("INST", cat(u32(cid), str(c), new Uint8Array([0]), u32(refs.length), ints(deltas(refs)))));
    const mine = refs.map((r) => items[r]);
    out.push(chunk("PROP", cat(u32(cid), str("Name"), new Uint8Array([1]), ...mine.map((m) => str(m.name)))));
    if (mine.some((m) => m.source)) out.push(chunk("PROP", cat(u32(cid), str("Source"), new Uint8Array([29]), ...mine.map((m) => str(m.source || new Uint8Array())))));
    if (mine.some((m) => m.value != null)) out.push(chunk("PROP", cat(u32(cid), str("Value"), new Uint8Array([1]), ...mine.map((m) => str(m.value ?? "")))));
    if (mine.some((m) => m.contents)) out.push(chunk("PROP", cat(u32(cid), str("Contents"), new Uint8Array([1]), ...mine.map((m) => str(m.contents ?? "")))));
  });
  const ch = items.map((_, i) => i);
  out.push(chunk("PRNT", cat(new Uint8Array([0]), u32(items.length), ints(deltas(ch)), ints(deltas(items.map((i) => i.parent))))));
  out.push(chunk("END\0", te.encode("</roblox>")));
  return cat(...out);
}

const bc = (...strings) => cat(new Uint8Array([0x52, 0x7a, 0x10, 0x4a, 0x5b, 0x32, 0x09, 0xe0, 9, 3, strings.length]), ...strings.map((s) => cat(new Uint8Array([te.encode(s).length]), te.encode(s))));

test("lz4Block decodes literals and a match", () => {
  // token 0x40: 4 literals "abcd", then offset 4, match length 4+0 -> "abcdabcd"
  const out = lz4Block(new Uint8Array([0x40, 97, 98, 99, 100, 4, 0]), 8);
  assert.equal(new TextDecoder().decode(out), "abcdabcd");
  assert.throws(() => lz4Block(new Uint8Array([0x40, 97, 98, 99, 100, 4, 0]), 9));
});

test("decodeSource29 needs an exact fit", () => {
  const good = cat(str("ab"), str("c"));
  assert.deepEqual(decodeSource29(good, 2).map((x) => new TextDecoder().decode(x)), ["ab", "c"]);
  assert.equal(decodeSource29(good, 3), null);
  assert.equal(decodeSource29(cat(good, new Uint8Array([1])), 2), null);
});

test("parseRbxm rebuilds paths, classes, sources and values", () => {
  const src = bc("script", "Hello there friend");
  const data = buildRbxm([
    { cls: "Folder", name: "PatchRoot", parent: -1 },
    { cls: "Folder", name: "CorePackages", parent: 0 },
    { cls: "ModuleScript", name: "Chat", parent: 1, source: src },
    { cls: "StringValue", name: "Locale", parent: 1, value: "en-us" },
  ]);
  const { instances, warnings } = parseRbxm(data);
  assert.deepEqual(warnings, []);
  const byName = Object.fromEntries(instances.map((i) => [i.name, i]));
  assert.equal(byName.Chat.path, "PatchRoot/CorePackages/Chat");
  assert.equal(byName.Chat.class, "ModuleScript");
  assert.deepEqual([...byName.Chat.source], [...src]);
  assert.equal(byName.Locale.value, "en-us");
  assert.equal(byName.PatchRoot.parent, -1);
});

test("parseRbxm rejects non-models and reports zstd chunks it cannot decode", () => {
  assert.throws(() => parseRbxm(new Uint8Array(100)), /magic/);
  const data = buildRbxm([{ cls: "Folder", name: "R", parent: -1 }]);
  const { instances } = parseRbxm(data);
  assert.equal(instances.length, 1);
});

test("readStringTable reads the real bytecode samples checked into analysis/", () => {
  const s = readStringTable(new Uint8Array(readFileSync(new URL("../analysis/coregui/samples/3.bin", import.meta.url))));
  assert.equal(s.version, 9);
  assert.deepEqual(s.strings.slice(0, 4), ["script", "Parent", "_Workspace", "require"]);
  assert.ok(s.strings.includes("SquadContract"));
  const big = readStringTable(new Uint8Array(readFileSync(new URL("../analysis/coregui/samples/5.bin", import.meta.url))));
  assert.ok(big && big.strings.length > 10);
});

test("readStringTable refuses garbage instead of guessing", () => {
  assert.equal(readStringTable(new Uint8Array([1, 2, 3])), null);
  assert.equal(readStringTable(new Uint8Array(40)), null);
  assert.equal(readStringTable(null), null);
});

test("looksLikeUiText keeps sentences, drops identifiers", () => {
  assert.ok(looksLikeUiText("Send a message"));
  assert.ok(!looksLikeUiText("PlayerList"));
  assert.ok(!looksLikeUiText("rbxasset://textures/ui x"));
  assert.ok(!looksLikeUiText("get_user_id now"));
});

// ---- loader with a fake proxy ----
const json = (o, status = 200) => ({ ok: status < 300, status, json: async () => o, arrayBuffer: async () => te.encode(JSON.stringify(o)).buffer });
const bin = (u8) => ({ ok: true, status: 200, arrayBuffer: async () => u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.length) });

function fakeProxy({ version = "version-abc", ver = 7, model, failLatest = false } = {}) {
  const calls = [];
  const request = async (url) => {
    calls.push(url);
    if (url.includes("client-version")) return failLatest ? json({}, 500) : json({ clientVersionUpload: version });
    if (url.includes("/content/configs/InExperiencePatchConfig")) return json({ AssetId: "111", AssetVersion: String(ver) });
    if (url.includes("assetdelivery")) return json({ locations: [{ location: "https://fts.rbxcdn.com/signed" }] });
    if (url === "https://fts.rbxcdn.com/signed") return bin(model);
    return json({}, 404);
  };
  return { request, calls };
}

test("loadCoreGui fetches the latest version, parses the patch and indexes UI text", async () => {
  const model = buildRbxm([
    { cls: "Folder", name: "PatchRoot", parent: -1 },
    { cls: "Folder", name: "Chat", parent: 0 },
    { cls: "ModuleScript", name: "ChatWindow", parent: 1, source: bc("script", "Send a message", "PlayerList") },
    { cls: "LocalizationTable", name: "Strings", parent: 0, contents: JSON.stringify([{ Key: "k", Source: "Chat", Values: { "en-us": "Chat" } }]) },
  ]);
  const { request, calls } = fakeProxy({ model });
  const progress = [];
  const cg = await loadCoreGui({ request, onProgress: (m) => progress.push(m) });
  assert.equal(cg.engine.latest, true);
  assert.equal(cg.engine.base, engineBase("version-abc"));
  assert.ok(calls.some((u) => u.startsWith(engineBase("version-abc") + "/content/configs/InExperiencePatchConfig")));
  assert.ok(calls.some((u) => u.includes("assetdelivery.roblox.com/v2/assetId/111/version/7")));
  assert.deepEqual(cg.errors, {});
  assert.deepEqual(cg.list("PatchRoot"), ["Chat", "Strings"]);
  assert.equal(cg.get("PatchRoot/Chat/ChatWindow").class, "ModuleScript");
  assert.deepEqual(cg.uiText(/Chat/), ["Send a message"]);
  assert.equal(cg.patches.InExperience.localization[0].Source, "Chat");
  assert.equal(cg.summary()[0].modules, 1);
  assert.ok(progress.length >= 3);
});

test("a cached patch is not downloaded again and a new version is", async () => {
  const model = buildRbxm([{ cls: "Folder", name: "PatchRoot", parent: -1 }]);
  const store = new Map();
  const cache = { get: async (k) => store.get(k) || null, set: async (k, v) => { store.set(k, v); } };
  const first = fakeProxy({ model });
  await loadCoreGui({ request: first.request, cache });
  assert.ok(first.calls.some((u) => u.includes("assetdelivery")));
  const second = fakeProxy({ model });
  const cg = await loadCoreGui({ request: second.request, cache });
  assert.ok(!second.calls.some((u) => u.includes("assetdelivery")));
  assert.equal(cg.patches.InExperience.cached, true);
  const third = fakeProxy({ model, ver: 8 });
  await loadCoreGui({ request: third.request, cache });
  assert.ok(third.calls.some((u) => u.includes("version/8")));
});

test("falls back to the bundled engine base when the version lookup fails, and says so", async () => {
  const model = buildRbxm([{ cls: "Folder", name: "PatchRoot", parent: -1 }]);
  const { request } = fakeProxy({ model, failLatest: true });
  const cg = await loadCoreGui({ request, fallbackBase: "https://setup.rbxcdn.com/webclient/version-old-RobloxWebClient/" });
  assert.equal(cg.engine.latest, false);
  assert.equal(cg.engine.base, "https://setup.rbxcdn.com/webclient/version-old-RobloxWebClient");
  assert.match(coreGuiLines(cg).map((l) => l.t).join("\n"), /latest lookup failed/);
  await assert.rejects(resolveEngineBase(request));
});

test("download errors surface per patch instead of throwing", async () => {
  const request = async (url) => (url.includes("client-version") ? json({ clientVersionUpload: "v" }) : url.includes("PatchConfig") ? json({ AssetId: "1", AssetVersion: "2" }) : json({}, 403));
  const cg = await loadCoreGui({ request });
  assert.match(cg.errors.InExperience, /HTTP 403/);
  assert.match(coreGuiLines(cg).map((l) => l.t).join("\n"), /InExperience: .*403/);
  await assert.rejects(downloadPatch(async () => json({ locations: [] }), { assetId: 1, assetVersion: 1 }), /no location/);
  await assert.rejects(downloadPatch(async (u) => (u.includes("assetdelivery") ? json({ locations: [{ location: "https://x.rbxcdn.com/a" }] }) : bin(te.encode("<html>"))), { assetId: 1, assetVersion: 1 }), /not an rbxm/);
});

test("coreGuiLines handles loading and error states", () => {
  assert.equal(coreGuiLines(null, { progress: "Parsing…" })[1].t, "Parsing…");
  assert.equal(coreGuiLines(null, { error: "boom" })[1].bad, true);
});
