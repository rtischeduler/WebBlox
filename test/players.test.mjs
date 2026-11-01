import test from "node:test";
import assert from "node:assert/strict";
import { PlayerList } from "../src/join/players.mjs";

test("sections are ordered by source priority and skip empty ones", () => {
  const list = new PlayerList();
  list.update("joinscript", [{ name: "me", you: true }]);
  list.update("web", [{ token: "t" }, { token: "u" }], { note: "n" });
  list.update("replication", []);
  const sections = list.sections();
  assert.deepEqual(sections.map((s) => s.id), ["web", "joinscript"]);
  assert.equal(sections[0].players.length, 2);
  assert.equal(sections[0].meta.note, "n");
  assert.equal(sections[1].players[0].you, true);
});

test("replicated players take the first section once available", () => {
  const list = new PlayerList();
  list.update("web", [{ token: "t" }]);
  list.update("replication", [{ id: 1, name: "a", displayName: "A" }]);
  assert.equal(list.sections()[0].id, "replication");
  assert.equal(list.sections()[0].players[0].displayName, "A");
});

test("listeners fire on update and clear, and can be removed", () => {
  const list = new PlayerList();
  const seen = [];
  const off = list.onChange((s) => seen.push(s.length));
  list.update("web", [{ token: "t" }]);
  list.clear();
  off();
  list.update("web", [{ token: "t" }]);
  assert.deepEqual(seen, [1, 0]);
});

test("unknown sources are rejected and names fall back sensibly", () => {
  const list = new PlayerList();
  assert.throws(() => list.update("nope", []), /Unknown player source/);
  list.update("joinscript", [{ name: "solo" }]);
  assert.equal(list.sections()[0].players[0].displayName, "solo");
});
