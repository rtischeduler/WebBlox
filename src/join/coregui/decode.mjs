// Roblox ships CoreGui bytecode as standard Luau bytecode with two changes:
//   1. an 8-byte wrapper in front of the Luau header;
//   2. the opcode byte of every instruction is stored multiplied by 227 (mod 256).
// decodeBytecode() undoes both so the result loads in an unmodified Luau VM (luau_load).
// Layout follows Luau's lvmload.cpp. Version >= 12 length-prefixes each proto, which is what the real patches use.
// OP_LENGTH has the instruction size in 32-bit words (1, or 2 when an AUX word follows) for opcodes 0..94 of Luau
// bytecode 13, generated from Luau's own getOpLength().
export const WRAPPER = 8;
const INV227 = 203; // 227 * 203 = 1 (mod 256)
const OP_LENGTH = [1,1,1,1,1,1,1,2,2,1,1,1,2,1,1,2,2,1,1,1,2,1,1,1,1,1,1,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,2,1,2,1,1,1,1,1,2,1,1,1,1,1,1,1,2,2,1,2,2,2,2,1,1,2,2,2,2,2,2,1,2,2,1,2,2];

const varint = (b, p) => {
  let v = 0, shift = 0;
  for (;;) {
    if (p >= b.length) throw new Error("bytecode truncated");
    const x = b[p++]; v += (x & 127) * 2 ** shift;
    if (!(x & 128)) return [v, p];
    shift += 7; if (shift > 35) throw new Error("bad varint");
  }
};

export function decodeBytecode(raw) {
  const wrapped = raw[0] > 14 && raw[0] !== 100;
  const out = Uint8Array.from(wrapped ? raw.subarray(WRAPPER) : raw);
  let p = 0;
  const version = out[p++];
  if (version === 0) throw new Error("bytecode is an error message");
  if (version < 12) throw new Error(`bytecode version ${version} has no proto sizes; only >= 12 is supported`);
  const typesVersion = out[p++];
  let n; [n, p] = varint(out, p);
  for (let i = 0; i < n; i++) { let l; [l, p] = varint(out, p); p += l; }
  if (typesVersion === 3) for (let idx = out[p++]; idx !== 0; idx = out[p++]) [, p] = varint(out, p);
  let protos; [protos, p] = varint(out, p);
  for (let i = 0; i < protos; i++) {
    let size; [size, p] = varint(out, p);
    const end = p + size;
    if (end > out.length) throw new Error("proto overruns bytecode");
    p += 5; // maxstacksize, numparams, nups, is_vararg, flags
    let ts; [ts, p] = varint(out, p); p += ts;
    let words; [words, p] = varint(out, p);
    for (let w = 0; w < words;) {
      const at = p + 4 * w;
      const op = (out[at] * INV227) & 255;
      if (op >= OP_LENGTH.length) throw new Error(`unknown opcode ${op} in proto ${i}`);
      out[at] = op; w += OP_LENGTH[op];
    }
    p = end;
  }
  return out;
}
