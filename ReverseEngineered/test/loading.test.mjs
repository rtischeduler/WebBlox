import test from "node:test";
import assert from "node:assert/strict";
import { subdomainUrl, experienceUrls, pollThumbnail, failureView, RETRY_MS } from "../src/join/loading.mjs";

test("subdomainUrl swaps www or prepends, like the engine", () => {
  assert.equal(subdomainUrl("https://www.roblox.com", "apis", "/x"), "https://apis.roblox.com/x");
  assert.equal(subdomainUrl("roblox.com", "economy", "/y"), "https://economy.roblox.com/y");
});

test("experienceUrls match the engine's requests", () => {
  const u = experienceUrls(123);
  assert.equal(u.details, "https://economy.roblox.com/v2/assets/123/details");
  assert.equal(u.universe, "https://apis.roblox.com/universes/v1/places/123/universe");
  const icon = new URL(u.icon(9));
  assert.equal(icon.pathname, "/v1/games/icons");
  assert.deepEqual(Object.fromEntries(icon.searchParams), { universeIds: "9", returnPolicy: "PlaceHolder", size: "256x256", format: "Png", isCircular: "false" });
  const bg = new URL(u.background(9));
  assert.equal(bg.pathname, "/v1/games/multiget/thumbnails");
  assert.equal(bg.searchParams.get("size"), "768x432");
  assert.equal(bg.searchParams.get("countPerUniverse"), "1");
  assert.equal(bg.searchParams.get("defaults"), "true");
});

test("pollThumbnail retries Pending on the engine's schedule, then returns the url", async () => {
  const waits = [];
  const replies = [{ state: "Pending" }, { state: "Pending" }, { state: "Completed", imageUrl: "https://t/1.png" }];
  const url = await pollThumbnail(async () => ({ data: [replies.shift()] }), "https://t.roblox.com/v1/x", (f) => f.data[0], { sleep: async (ms) => waits.push(ms) });
  assert.equal(url, "https://t/1.png");
  assert.deepEqual(waits, RETRY_MS.slice(0, 2));
});

test("pollThumbnail gives up after the last retry and on non-pending states", async () => {
  const waits = [];
  await assert.rejects(pollThumbnail(async () => ({ s: { state: "Pending" } }), "https://t.roblox.com/v1/x", (f) => f.s, { sleep: async (ms) => waits.push(ms) }), /thumbnail state Pending/);
  assert.deepEqual(waits, RETRY_MS);
  await assert.rejects(pollThumbnail(async () => ({ s: { state: "Blocked" } }), "https://t.roblox.com/v1/x", (f) => f.s), /Blocked/);
});

test("failureView titles and codes follow the engine", () => {
  assert.deepEqual(failureView("Nope", 12, "join"), { status: "Nope\nError Code: 12", title: "Join Error", message: "Nope", code: "(Error Code: 12)", showPanel: true });
  assert.equal(failureView("x", null, "teleport").title, "Teleport Failed");
  const b = failureView("  ", null, "browser");
  assert.equal(b.title, "Error");
  assert.equal(b.code, "");
  assert.equal(b.message, "Unable to join the experience.");
  assert.equal(failureView("x", null, "join").code, "(Error Code: -1)");
});
