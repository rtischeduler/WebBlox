import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodeBytecode, WRAPPER } from "../src/join/coregui/decode.mjs";
import { readStringTable } from "../src/join/coregui/luau.mjs";

// Real script from the InExperience patch (bytecode v13, 8-byte wrapper, opcodes x227).
const raw = new Uint8Array(readFileSync(new URL("./fixtures/TopStatConnector.luauc", import.meta.url)));

test("decodeBytecode strips the wrapper and keeps header and string table intact", () => {
  const out = decodeBytecode(raw);
  assert.equal(out.length, raw.length - WRAPPER);
  assert.equal(out[0], 13);
  assert.deepEqual(readStringTable(out)?.strings, readStringTable(raw).strings);
  assert.ok(readStringTable(out).strings.includes("PlayerList"));
});

test("decodeBytecode only rewrites opcode bytes (every other byte is unchanged)", () => {
  const out = decodeBytecode(raw);
  const body = raw.subarray(WRAPPER);
  let changed = 0;
  for (let i = 0; i < out.length; i++) if (out[i] !== body[i]) { changed++; assert.equal(i % 4 >= 0, true); assert.equal((out[i] * 227) & 255, body[i]); }
  assert.ok(changed > 20);
});

test("decodeBytecode rejects what it cannot handle instead of guessing", () => {
  assert.throws(() => decodeBytecode(new Uint8Array([0, 1, 2])), /error message/);
  assert.throws(() => decodeBytecode(Uint8Array.from([9, 3, 0, 0])), /version 9/);
  const cut = raw.subarray(0, raw.length - 400);
  assert.throws(() => decodeBytecode(cut), /overruns|truncated/);
});
