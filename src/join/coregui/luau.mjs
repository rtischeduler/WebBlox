// Reads the string table of a CoreGui ModuleScript's bytecode.
// Layout seen in every script of the real patches (see analysis/coregui/samples):
//   8-byte header | version | types version | varint string count | (varint length + bytes)*
// This does not execute anything. It is enough to index what each module is called, requires and says.
const td = new TextDecoder();
const HEADER = 8;

const varint = (b, p) => {
  let v = 0, shift = 0;
  for (;;) {
    if (p >= b.length) return null;
    const x = b[p++]; v += (x & 127) * 2 ** shift;
    if (!(x & 128)) return [v, p];
    shift += 7; if (shift > 35) return null;
  }
};

export function readStringTable(b) {
  if (!b || b.length < HEADER + 3) return null;
  const version = b[HEADER], typesVersion = b[HEADER + 1];
  if (version === 0 || version > 63 || typesVersion > 16) return null;
  let r = varint(b, HEADER + 2);
  if (!r) return null;
  const count = r[0]; let p = r[1];
  if (count > b.length) return null;
  const strings = [];
  for (let i = 0; i < count; i++) {
    r = varint(b, p);
    if (!r || r[1] + r[0] > b.length) return null;
    strings.push(td.decode(b.subarray(r[1], r[1] + r[0]))); p = r[1] + r[0];
  }
  return { version, typesVersion, strings };
}

// Strings that look like text a user would read (not identifiers, paths or API names).
export const looksLikeUiText = (s) =>
  s.length >= 3 && s.length <= 120 && /[A-Za-z]{3}/.test(s) && /\s/.test(s) && !/[{}<>=\\/_]|rbxasset|https?:/.test(s) && /^[A-Z0-9"'(]/.test(s);
