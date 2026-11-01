import test from "node:test";
import assert from "node:assert/strict";
import { readWasmInfo, formatWasmInfo, jsHints } from "../.github/scripts/wasm-info.mjs";

const bytes = (...a) => Buffer.from(a);
const s = (t) => Buffer.concat([bytes(t.length), Buffer.from(t)]);

test("reads imported shared memory and exports", () => {
  const imp = Buffer.concat([bytes(1), s("env"), s("memory"), bytes(2, 3, 1, 4)]);
  const exp = Buffer.concat([bytes(1), s("emscripten_pthread_init"), bytes(0, 0)]);
  const wasm = Buffer.concat([bytes(0, 0x61, 0x73, 0x6d, 1, 0, 0, 0), bytes(2, imp.length), imp, bytes(7, exp.length), exp]);
  const info = readWasmInfo(wasm);
  assert.deepEqual(info.memories[0], { imported: true, min: 1, max: 4, shared: true, is64: false });
  assert.equal(info.exports[0].name, "emscripten_pthread_init");
  assert.match(formatWasmInfo(info), /shared=true/);
  assert.match(formatWasmInfo(info), /emscripten_pthread_init/);
});

test("js hints", () => {
  const h = jsHints("a;b;if(self.crossOriginIsolated){x()}", "f");
  assert.equal(h.length, 1);
  assert.match(h[0], /crossOriginIsolated/);
});
