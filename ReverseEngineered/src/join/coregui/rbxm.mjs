// Browser/Node reader for Roblox binary models (.rbxm) as used by the CoreGui OTA patches.
// JS port of parse_rbxm() in .github/scripts/extract-coregui.py. Only what CoreGui needs:
// INST, PROP (strings + the type-29 Source encoding), PRNT. Sources stay as views into the chunk buffer.

const MAGIC = [0x3c, 0x72, 0x6f, 0x62, 0x6c, 0x6f, 0x78, 0x21, 0x89, 0xff, 0x0d, 0x0a, 0x1a, 0x0a];
const td = new TextDecoder();

export function lz4Block(src, size) {
  const out = new Uint8Array(size);
  let i = 0, o = 0;
  while (i < src.length) {
    const t = src[i++];
    let n = t >> 4;
    if (n === 15) for (;;) { const x = src[i++]; n += x; if (x !== 255) break; }
    out.set(src.subarray(i, i + n), o); i += n; o += n;
    if (i >= src.length) break;
    const off = src[i] | (src[i + 1] << 8); i += 2;
    let m = t & 15;
    if (m === 15) for (;;) { const x = src[i++]; m += x; if (x !== 255) break; }
    m += 4;
    for (let k = 0; k < m; k++, o++) out[o] = out[o - off];
  }
  if (o !== size) throw new Error(`lz4 size ${o} != ${size}`);
  return out;
}

const isZstd = (b) => b.length > 3 && b[0] === 0x28 && b[1] === 0xb5 && b[2] === 0x2f && b[3] === 0xfd;

// zstd(Uint8Array, size) -> Uint8Array is injected (fzstd in the browser, node:zlib in tests).
function unpack(raw, cl, ul, zstd) {
  if (cl === 0) return raw;
  if (isZstd(raw)) {
    if (!zstd) throw new Error("zstd chunk but no zstd decoder supplied");
    return zstd(raw, ul);
  }
  return lz4Block(raw, ul);
}

const u32 = (b, p) => (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0;
const i32 = (b, p) => u32(b, p) | 0;

function ints(b, p, n) { // interleaved big-endian, zigzag
  const v = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = ((b[p + i] << 24) | (b[p + n + i] << 16) | (b[p + 2 * n + i] << 8) | b[p + 3 * n + i]) >>> 0;
    v[i] = (x >>> 1) ^ -(x & 1);
  }
  return [v, p + 4 * n];
}
const delta = (v) => { let a = 0; return v.map((x) => (a += x)); };
const rstr = (b, p) => { const n = u32(b, p); return [b.subarray(p + 4, p + 4 + n), p + 4 + n]; };

// Type-29 Source: n x (u32 length + bytes). Returns null when the layout does not fit exactly.
export function decodeSource29(b, n) {
  const out = []; let p = 0;
  for (let i = 0; i < n; i++) {
    if (p + 4 > b.length) return null;
    const l = u32(b, p); p += 4;
    if (p + l > b.length) return null;
    out.push(b.subarray(p, p + l)); p += l;
  }
  return p === b.length ? out : null;
}

export function parseRbxm(data, { zstd, onWarn = () => {} } = {}) {
  const all = data instanceof Uint8Array ? data : new Uint8Array(data);
  let h = -1;
  outer: for (let i = 0; i < Math.min(all.length - MAGIC.length, 64); i++) {
    for (let k = 0; k < MAGIC.length; k++) if (all[i + k] !== MAGIC[k]) continue outer;
    h = i; break;
  }
  if (h < 0) throw new Error("no <roblox!> magic");
  const b = all.subarray(h);
  let p = 32;
  const cls = new Map(), classRefs = new Map(), refClass = new Map(), props = new Map(), parent = new Map();
  const warn = [];
  while (p + 16 <= b.length) {
    const name = String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]);
    const cl = u32(b, p + 4), ul = u32(b, p + 8); p += 16;
    const raw = b.subarray(p, p + (cl || ul)); p += cl || ul;
    if (name === "END\0") break;
    let c;
    try { c = unpack(raw, cl, ul, zstd); } catch (e) { warn.push(`${name}: ${e.message}`); onWarn(name, e); continue; }
    try {
      if (name === "INST") {
        const cid = i32(c, 0); const [cn, q0] = rstr(c, 4); let q = q0 + 1;
        const n = i32(c, q); q += 4;
        const refs = delta(ints(c, q, n)[0]);
        cls.set(cid, td.decode(cn)); classRefs.set(cid, refs);
        for (const r of refs) refClass.set(r, cid);
      } else if (name === "PROP") {
        const cid = i32(c, 0); const [pnb, q0] = rstr(c, 4); const pn = td.decode(pnb);
        const t = c[q0]; let q = q0 + 1; const refs = classRefs.get(cid) || [];
        if (t === 29 && pn === "Source") {
          const got = decodeSource29(c.subarray(q), refs.length);
          if (got) refs.forEach((r, i) => { (props.get(r) || props.set(r, {}).get(r)).Source = got[i]; });
          else warn.push(`Source(29) undecoded for ${cls.get(cid)} (${refs.length})`);
        } else if (t === 1) {
          for (const r of refs) { const [s, nq] = rstr(c, q); q = nq; (props.get(r) || props.set(r, {}).get(r))[pn] = s; }
        }
      } else if (name === "PRNT") {
        const n = i32(c, 1);
        const [ch, q] = ints(c, 5, n); const [pa] = ints(c, q, n);
        const chd = delta(ch), pad = delta(pa);
        for (let i = 0; i < n; i++) parent.set(chd[i], pad[i]);
      }
    } catch (e) { warn.push(`${name}: ${e.message}`); }
  }
  const nameOf = (r) => { const s = props.get(r)?.Name; return s ? td.decode(s) : "?"; };
  const pathCache = new Map();
  const pathOf = (r) => {
    if (pathCache.has(r)) return pathCache.get(r);
    const par = parent.get(r);
    const path = par === undefined || par === -1 ? nameOf(r) : pathOf(par) + "/" + nameOf(r);
    pathCache.set(r, path); return path;
  };
  const instances = [];
  for (const [r, cid] of refClass) {
    const pr = props.get(r) || {};
    instances.push({
      ref: r, class: cls.get(cid), name: nameOf(r), path: pathOf(r), parent: parent.get(r) ?? -1,
      source: pr.Source || null,
      guid: pr.ScriptGuid ? td.decode(pr.ScriptGuid) : "",
      value: pr.Value ? td.decode(pr.Value) : null,
      contents: pr.Contents ? td.decode(pr.Contents) : null,
    });
  }
  return { instances, warnings: warn };
}
