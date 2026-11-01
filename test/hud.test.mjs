import test from "node:test";
import assert from "node:assert/strict";
import { nameColor, NAME_COLORS, flattenPlayers } from "../src/join/hud.mjs";

test("nameColor is stable and always from the palette", () => {
  for (const n of ["", "Roblox", "a", "Builderman", "😀"]) {
    assert.equal(nameColor(n), nameColor(n));
    assert.ok(NAME_COLORS.includes(nameColor(n)));
  }
});

test("flattenPlayers puts you first, labels anonymous players, and does not duplicate you", () => {
  const sections = [{ players: [{ token: "a" }, { token: "b" }] }, { players: [{ name: "me", displayName: "Me", you: true }] }];
  const list = flattenPlayers(sections);
  assert.equal(list.length, 3);
  assert.equal(list[0].label, "Me");
  assert.deepEqual(list.slice(1).map((p) => p.label), ["Player 1", "Player 2"]);
});
