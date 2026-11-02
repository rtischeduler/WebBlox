// Tiny Luau bytecode disassembler for the CoreGui patch (debugging aid): node tools/disasm.mjs <file> <lineFrom> <lineTo>
import { readFileSync } from "node:fs";
import { decodeBytecode } from "../src/join/coregui/decode.mjs";
const OPS = "NOP BREAK LOADNIL LOADB LOADN LOADK MOVE GETGLOBAL SETGLOBAL GETUPVAL SETUPVAL CLOSEUPVALS GETIMPORT GETTABLE SETTABLE GETTABLEKS SETTABLEKS GETTABLEN SETTABLEN NEWCLOSURE NAMECALL CALL RETURN JUMP JUMPBACK JUMPIF JUMPIFNOT JUMPIFEQ JUMPIFLE JUMPIFLT JUMPIFNOTEQ JUMPIFNOTLE JUMPIFNOTLT ADD SUB MUL DIV MOD POW ADDK SUBK MULK DIVK MODK POWK AND OR ANDK ORK CONCAT NOT MINUS LENGTH NEWTABLE DUPTABLE SETLIST FORNPREP FORNLOOP FORGLOOP FORGPREP_INEXT FASTCALL3 FORGPREP_NEXT NATIVECALL GETVARARGS DUPCLOSURE PREPVARARGS LOADKX JUMPX FASTCALL COVERAGE CAPTURE SUBRK DIVRK FASTCALL1 FASTCALL2 FASTCALL2K FORGPREP JUMPXEQKNIL JUMPXEQKB JUMPXEQKN JUMPXEQKS IDIV IDIVK GETUDATAKS SETUDATAKS NAMECALLUDATA NEWCLASSMEMBER CALLFB CMPPROTO FASTPCALL NEWCLASS CONSTRUCT FINCONSTRUCT GETPRIVATEFIELD SETPRIVATEFIELD".split(" ");
const LEN = [1,1,1,1,1,1,1,2,2,1,1,1,2,1,1,2,2,1,1,1,2,1,1,1,1,1,1,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,2,1,2,1,1,1,1,1,2,1,1,1,1,1,1,1,2,2,1,2,2,2,2,1,1,2,2,2,2,2,2,1,2,2,1,2,2];
export function disasm(raw, from, to) {
  const b = decodeBytecode(raw); const dv = new DataView(b.buffer, b.byteOffset, b.byteLength); let p = 0;
  const vi = () => { let v = 0, s = 0; for (;;) { const x = b[p++]; v += (x & 127) * 2 ** s; if (!(x & 128)) return v; s += 7; } };
  p++; const tv = b[p++]; const strs = [""]; const n = vi();
  for (let i = 0; i < n; i++) { const l = vi(); strs.push(Buffer.from(b.subarray(p, p + l)).toString("latin1")); p += l; }
  if (tv === 3) for (let idx = b[p++]; idx !== 0; idx = b[p++]) vi();
  const np = vi(); const out = [];
  const protos = [];
  for (let i = 0; i < np; i++) {
    const size = vi(); const end = p + size; p += 5; const ts = vi(); p += ts;
    const sc = vi(); const code = []; for (let w = 0; w < sc; w++) code.push(dv.getUint32(p + 4 * w, true)); p += 4 * sc;
    const sk = vi(); const K = [];
    for (let k = 0; k < sk; k++) {
      const t = b[p++];
      if (t === 0) K.push("nil"); else if (t === 1) K.push(b[p++] ? "true" : "false");
      else if (t === 2) { K.push(String(dv.getFloat64(p, true))); p += 8; }
      else if (t === 3) K.push(JSON.stringify(strs[vi()]));
      else if (t === 4) { const id = dv.getUint32(p, true); p += 4; K.push({ imp: [(id >> 20) & 1023, (id >> 10) & 1023, id & 1023].slice(0, id >>> 30) }); }
      else if (t === 5) { const c = vi(); for (let q = 0; q < c; q++) vi(); K.push("<table>"); }
      else if (t === 6) K.push("<closure " + vi() + ">");
      else if (t === 7) { p += 16; K.push("<vector>"); }
      else if (t === 8) { const c = vi(); for (let q = 0; q < c; q++) { vi(); p += 4; } K.push("<tablek>"); }
      else if (t === 9) { p += 8; K.push("<int>"); } else throw new Error("const type " + t);
    }
    const sp = vi(); const kids = []; for (let q = 0; q < sp; q++) kids.push(vi());
    const lineDefined = vi(); const dn = vi(); const hasLine = b[p++]; let lines = [];
    if (hasLine) {
      const gap = b[p++]; const iv = ((sc - 1) >> gap) + 1; let last = 0; const rel = [];
      for (let q = 0; q < sc; q++) { last = (last + b[p++]) & 255; rel.push(last); }
      let la = 0; const abs = []; for (let q = 0; q < iv; q++) { la += dv.getInt32(p, true); p += 4; abs.push(la); }
      lines = rel.map((r, q) => abs[q >> gap] + r);
    }
    protos.push({ code, K, lineDefined, name: strs[dn], lines }); p = end;
  }
  const kname = (K, i) => { const k = K[i]; return k && k.imp ? k.imp.map((x) => (K[x] ?? "?")).map((x) => (typeof x === "object" ? "?" : x)).join(".") : String(k); };
  for (const [pi, pr] of protos.entries()) {
    let hdr = false;
    for (let pc = 0; pc < pr.code.length;) {
      const w = pr.code[pc]; const op = w & 255; const A = (w >> 8) & 255, B = (w >> 16) & 255, C = (w >> 24) & 255, D = w >> 16;
      const aux = LEN[op] === 2 ? pr.code[pc + 1] : null; const line = pr.lines[pc] ?? 0;
      if (line >= from && line <= to) {
        if (!hdr) { out.push(`-- proto ${pi} ${pr.name || "?"} @${pr.lineDefined}`); hdr = true; }
        let note = "";
        const nm = OPS[op];
        if (nm === "GETIMPORT") note = kname(pr.K, D) ; else if (nm === "LOADK") note = String(pr.K[D]);
        else if (nm === "GETTABLEKS" || nm === "SETTABLEKS" || nm === "NAMECALL") note = String(pr.K[aux]);
        else if (nm === "GETGLOBAL" || nm === "SETGLOBAL") note = String(pr.K[aux]);
        else if (nm.endsWith("K") && ["ADDK","SUBK","MULK","DIVK","MODK","POWK","IDIVK","ANDK","ORK"].includes(nm)) note = String(pr.K[C]);
        out.push(`${String(line).padStart(4)} ${String(pc).padStart(4)} ${nm} A=${A} B=${B} C=${C} D=${D}${aux !== null ? " aux=" + aux : ""}${note ? "  ; " + note : ""}`);
      }
      pc += LEN[op];
    }
  }
  return out.join("\n");
}
if (process.argv[1].endsWith("disasm.mjs")) console.log(disasm(readFileSync(process.argv[2]), +process.argv[3], +process.argv[4]));
