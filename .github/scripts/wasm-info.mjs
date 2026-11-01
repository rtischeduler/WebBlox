export function readWasmInfo(buf) {
  let p = 0;
  const u8 = () => buf[p++];
  const leb = () => {
    let result = 0n, shift = 0n, b;
    do { b = buf[p++]; result |= BigInt(b & 0x7f) << shift; shift += 7n; } while (b & 0x80);
    return Number(result);
  };
  const str = () => { const n = leb(); const s = Buffer.from(buf.subarray(p, p + n)).toString("utf8"); p += n; return s; };
  const limits = () => {
    const flags = leb();
    const min = leb();
    const max = flags & 1 ? leb() : null;
    return { min, max, shared: !!(flags & 2), is64: !!(flags & 4) };
  };
  if (buf.length < 8 || buf.readUInt32LE(0) !== 0x6d736100) throw new Error("not a wasm file");
  const info = { version: buf.readUInt32LE(4), sections: [], imports: [], exports: [], memories: [], tables: 0, functions: 0, dataSegments: 0, tags: 0 };
  const names = { 0: "custom", 1: "type", 2: "import", 3: "function", 4: "table", 5: "memory", 6: "global", 7: "export", 8: "start", 9: "element", 10: "code", 11: "data", 12: "datacount", 13: "tag" };
  p = 8;
  while (p < buf.length) {
    const id = u8();
    const size = leb();
    const end = p + size;
    const entry = { id, name: names[id] || "unknown", size, offset: p };
    if (id === 0) { const save = p; entry.custom = str(); p = save; }
    info.sections.push(entry);
    try {
      if (id === 2) {
        const n = leb();
        for (let i = 0; i < n; i++) {
          const module = str(), name = str(), kind = u8();
          const imp = { module, name, kind: ["func", "table", "memory", "global", "tag"][kind] || String(kind) };
          if (kind === 0) imp.type = leb();
          else if (kind === 1) { u8(); imp.limits = limits(); }
          else if (kind === 2) { imp.limits = limits(); info.memories.push({ imported: true, ...imp.limits }); }
          else if (kind === 3) { u8(); u8(); }
          else if (kind === 4) { u8(); leb(); }
          info.imports.push(imp);
        }
      } else if (id === 3) info.functions = leb();
      else if (id === 4) info.tables = leb();
      else if (id === 5) { const n = leb(); for (let i = 0; i < n; i++) info.memories.push({ imported: false, ...limits() }); }
      else if (id === 7) {
        const n = leb();
        for (let i = 0; i < n; i++) { const name = str(), kind = u8(), index = leb(); info.exports.push({ name, kind: ["func", "table", "memory", "global", "tag"][kind] || String(kind), index }); }
      } else if (id === 11) info.dataSegments = leb();
      else if (id === 13) info.tags = leb();
    } catch (e) { entry.error = String(e.message || e); }
    p = end;
  }
  return info;
}

const INTERESTING = /thread|pthread|atomic|futex|worker|wait|notify|shared|spawn|proxy|jspi|suspend|promising/i;

export function formatWasmInfo(info, label = "") {
  const lines = [];
  lines.push(`wasm ${label} version=${info.version} functions=${info.functions} imports=${info.imports.length} exports=${info.exports.length} tables=${info.tables} dataSegments=${info.dataSegments} tags=${info.tags}`);
  lines.push("", "sections:");
  for (const s of info.sections) lines.push(`  ${s.name}${s.custom ? ":" + s.custom : ""} size=${s.size}${s.error ? " ERROR " + s.error : ""}`);
  lines.push("", "memories:");
  for (const m of info.memories) lines.push(`  ${m.imported ? "imported" : "defined"} min=${m.min} max=${m.max} shared=${m.shared} 64bit=${m.is64}`);
  lines.push("", "imports of interest:");
  for (const i of info.imports) if (INTERESTING.test(i.module + "." + i.name)) lines.push(`  ${i.kind} ${i.module}.${i.name}`);
  lines.push("", "exports of interest:");
  for (const e of info.exports) if (INTERESTING.test(e.name)) lines.push(`  ${e.kind} ${e.name}`);
  const modules = {};
  for (const i of info.imports) modules[i.module] = (modules[i.module] || 0) + 1;
  lines.push("", "import counts by module:");
  for (const [k, v] of Object.entries(modules)) lines.push(`  ${k}: ${v}`);
  return lines.join("\n") + "\n";
}

export function jsHints(text, label, pattern = /pthread|PTHREAD|SharedArrayBuffer|crossOriginIsolated|hardwareConcurrency|Atomics\.|shared\s*:\s*(?:!0|true)|loadWasmModuleToWorker|new Worker/g, ctx = 140) {
  const out = [];
  let last = -1;
  for (const m of text.matchAll(pattern)) {
    if (m.index < last) continue;
    const a = Math.max(0, m.index - ctx), b = Math.min(text.length, m.index + m[0].length + ctx);
    out.push(`[${label}@${m.index}] ${text.slice(a, b).replace(/\s+/g, " ")}`);
    last = b;
  }
  return out;
}
