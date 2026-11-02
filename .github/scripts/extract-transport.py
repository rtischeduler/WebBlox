#!/usr/bin/env python3
"""Find how the Roblox web client wasm builds the WebTransport URL and cert hashes it hands to rbx_wasm_rna_connect_js.
usage: extract-transport.py WebClient.wasm outdir [wasm-tools] [strings.txt.gz] [imports.txt]
Writes transport-connect.txt (annotated bodies of the callers of the connect import, their callers, string neighbours)."""
import sys, re, os, gzip, subprocess, collections

IMPORT_NAME = "rbx_wasm_rna_connect_js"
WANT = re.compile(r"WebTransport|will connect to server|udmux|UdMux|CertHash|serverCert|://|rbxTransport|RbxTransport(Config|Client)|ephemeral|Rupp", re.I)

def import_index(path, name=IMPORT_NAME):
    for line in open(path, errors="replace"):
        a, _, b = line.rstrip("\n").partition("\t")
        if b == name and a.isdigit(): return int(a)
    sys.exit("import %s not found in %s" % (name, path))

def load_strings(path):
    strs = {}
    with gzip.open(path, "rt", errors="replace") as g:
        for line in g:
            a, _, t = line.rstrip("\n").partition("\t")
            if a.isdigit(): strs[int(a)] = t.replace("\\n", "\n")
    return strs

def annotate(line, strs):
    s = line.strip()
    if s.startswith("i32.const "):
        try: v = int(s[10:].split()[0].rstrip(")")) & 0xFFFFFFFF
        except ValueError: return line
        t = strs.get(v)
        if t and len(t) >= 3: return "%s   ;; %r" % (line.rstrip("\n"), t.replace("\n", "\\n")[:200])
    return line.rstrip("\n")

def scan(lines, strs, target, cap=8000):
    funcs = {}; fn = None; buf = []
    def flush():
        if fn is None: return
        f = funcs[fn]
        if target in f["calls"] or f["want"]: f["body"] = buf[:cap]
    for line in lines:
        s = line.lstrip()
        if s.startswith("(func (;"):
            flush(); fn = int(s[8:s.index(";", 8)]); buf = [line.rstrip("\n")]
            funcs[fn] = {"calls": set(), "want": [], "instrs": 0}
            continue
        if fn is None: continue
        if len(buf) < cap: buf.append(annotate(line, strs))
        f = funcs[fn]; f["instrs"] += 1
        if s.startswith("i32.const "):
            try: v = int(s[10:].split()[0].rstrip(")")) & 0xFFFFFFFF
            except ValueError: continue
            t = strs.get(v)
            if t and WANT.search(t) and t not in f["want"] and len(f["want"]) < 25: f["want"].append(t)
        elif s.startswith("call "):
            try: f["calls"].add(int(s[5:].split()[0].rstrip(")")))
            except ValueError: pass
    flush()
    return funcs

def report(funcs, strs, target):
    direct = sorted(f for f, v in funcs.items() if target in v["calls"])
    callers = collections.defaultdict(set)
    for f, v in funcs.items():
        for c in v["calls"]: callers[c].add(f)
    out = ["# import %s = func %d; direct callers: %s" % (IMPORT_NAME, target, ["f%d" % f for f in direct])]
    level = set(direct); seen = set(direct)
    for depth in (1, 2):
        up = set()
        for f in level: up |= callers[f]
        up -= seen; seen |= up
        out.append("\n# callers at depth %d" % depth)
        for f in sorted(up)[:40]:
            v = funcs[f]
            out.append("f%d instrs=%d calls=%s" % (f, v["instrs"], " ".join("f%d" % c for c in sorted(v["calls"])[:30])))
            for t in v["want"]: out.append("    str: " + t.replace("\n", "\\n")[:200])
        level = up
    out.append("\n# functions whose strings mention transport/udmux/hash/scheme")
    for f, v in sorted(funcs.items()):
        if v["want"] and f not in direct and v["instrs"] < 4000:
            out.append("f%d instrs=%d" % (f, v["instrs"]))
            for t in v["want"][:8]: out.append("    str: " + t.replace("\n", "\\n")[:200])
    wat = []
    for f in direct: wat.append("\n;; ===== f%d (calls the connect import) =====" % f); wat.extend(funcs[f].get("body", []))
    return "\n".join(out) + "\n", "\n".join(wat) + "\n"

def neighbours(strs, span=500):
    addrs = sorted(strs); out = []
    for a in addrs:
        if "Connecting WASM WebTransport" in strs[a] or "will connect to server" in strs[a]:
            out.append("\n== %d %s" % (a, strs[a][:90]))
            out += ["  %d\t%s" % (x, strs[x].replace("\n", "\\n")[:200]) for x in addrs if a - span <= x <= a + span]
    return "\n".join(out) + "\n"

def main():
    wasm, outd = sys.argv[1], sys.argv[2]
    wt = sys.argv[3] if len(sys.argv) > 3 else "wasm-tools"
    sp = sys.argv[4] if len(sys.argv) > 4 else "analysis/strings.txt.gz"
    ip = sys.argv[5] if len(sys.argv) > 5 else "analysis/imports.txt"
    os.makedirs(outd, exist_ok=True)
    strs = load_strings(sp); target = import_index(ip)
    pr = subprocess.Popen([wt, "print", wasm], stdout=subprocess.PIPE, text=True, bufsize=1 << 20, errors="replace")
    funcs = scan(pr.stdout, strs, target); pr.wait()
    rep, wat = report(funcs, strs, target)
    open(os.path.join(outd, "transport-connect.txt"), "w").write(rep + neighbours(strs))
    open(os.path.join(outd, "transport-connect-functions.wat"), "w").write(wat)

if __name__ == "__main__": main()
