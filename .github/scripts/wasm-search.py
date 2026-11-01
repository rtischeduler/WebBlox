#!/usr/bin/env python3
"""Static search of the Roblox web client wasm: network call graph, referenced strings, key function bodies.
usage: wasm-search.py WebClient.wasm outdir [wasm-tools]"""
import sys, re, os, gzip, subprocess, collections
wasm, out = sys.argv[1], sys.argv[2]
WT = sys.argv[3] if len(sys.argv) > 3 else "wasm-tools"
os.makedirs(out, exist_ok=True)
WATCH = ["emscripten_websocket_new", "emscripten_websocket_send_binary", "emscripten_websocket_send_utf8_text",
         "emscripten_websocket_set_onmessage_callback_on_thread", "emscripten_websocket_set_onopen_callback_on_thread",
         "emscripten_websocket_close", "emscripten_start_fetch", "js_fetch_file"]
KEY = re.compile(r"join|handshake|ticket|connect|packet|raknet|replicator|chat|websocket|socket|authenticat|negotiat|udmux|schema|dictionary|hello|protocol", re.I)

# ---- binary: data segments
b = open(wasm, "rb").read()
def rv(p):
    r = s = 0
    while True:
        x = b[p]; p += 1; r |= (x & 127) << s; s += 7
        if x < 128: return r, p
def sections():
    p = 8
    while p < len(b):
        i = b[p]; p += 1; n, p = rv(p); yield i, p, p + n; p += n
segs = []
for i, s, e in sections():
    if i == 11:
        p = s; n, p = rv(p)
        for _ in range(n):
            f, p = rv(p); off = None
            if f in (0, 2):
                if f == 2: _, p = rv(p)
                assert b[p] == 0x41; p += 1
                v = 0; sh = 0
                while True:
                    x = b[p]; p += 1; v |= (x & 127) << sh; sh += 7
                    if x < 128: break
                if v & (1 << (sh - 1)): v -= 1 << sh
                off = v & 0xFFFFFFFF; assert b[p] == 0x0b; p += 1
            l, p = rv(p); segs.append([off, b[p:p + l]]); p += l
print("data segments", len(segs), file=sys.stderr)

def text():
    pr = subprocess.Popen([WT, "print", wasm], stdout=subprocess.PIPE, text=True, bufsize=1 << 20, errors="replace")
    for line in pr.stdout: yield line
    pr.wait()

# ---- pass A: imports, call graph, memory.init layout
imp = {}; fn = None; calls = collections.defaultdict(set); size = collections.Counter(); consts = []
for line in text():
    s = line.lstrip()
    if s.startswith("(import "):
        m = re.match(r'\(import "[^"]*" "([^"]*)" \(func \(;(\d+);\)', s)
        if m: imp[int(m.group(2))] = m.group(1)
    elif s.startswith("(func (;"):
        fn = int(s[8:s.index(";", 8)]); consts = []
    elif fn is not None:
        size[fn] += 1
        if s.startswith("call "):
            try: calls[fn].add(int(s[5:].split()[0].rstrip(")")))
            except ValueError: pass
        elif s.startswith("i32.const "):
            try: consts.append(int(s[10:].split()[0].rstrip(")")))
            except ValueError: pass
            consts = consts[-3:]
        elif s.startswith("memory.init "):
            try:
                si = int(s.split()[1].rstrip(")"))
                if len(consts) >= 3 and segs[si][0] is None: segs[si][0] = consts[-3] & 0xFFFFFFFF
            except (ValueError, IndexError): pass
print("funcs", len(size), "imports", len(imp), "placed segs", sum(1 for x in segs if x[0] is not None), file=sys.stderr)

# ---- strings table
strs = {}
for off, data in segs:
    if off is None: continue
    for m in re.finditer(rb"[\x20-\x7e\t\n]{4,}", data):
        strs[off + m.start()] = m.group(0).decode("latin1")
with gzip.open(os.path.join(out, "strings.txt.gz"), "wt") as g:
    for a in sorted(strs): g.write("%d\t%s\n" % (a, strs[a].replace("\n", "\\n")[:400]))
open(os.path.join(out, "imports.txt"), "w").write("\n".join("%d\t%s" % kv for kv in sorted(imp.items())) + "\n")

# ---- network cone
watch_ids = {i for i, n in imp.items() if n in WATCH}
rev = collections.defaultdict(set)
for f, cs in calls.items():
    for c in cs: rev[c].add(f)
D = {f for w in watch_ids for f in rev[w]}
cone = {}; frontier = set(D)
for d in range(4):
    for f in frontier: cone.setdefault(f, d)
    frontier = {c for f in frontier for c in rev[f]} - set(cone)
print("direct network callers", len(D), "cone", len(cone), file=sys.stderr)

# ---- pass B: referenced strings per function; bodies of D
fstr = collections.defaultdict(list); bodies = {}; fn = None; buf = None
def flush():
    global buf
    if buf is not None and fn in D and len(buf) < 6000: bodies[fn] = buf
for line in text():
    s = line.lstrip()
    if s.startswith("(func (;"):
        flush(); fn = int(s[8:s.index(";", 8)]); buf = [line] if fn in D else None
        continue
    if buf is not None: buf.append(line)
    if s.startswith("i32.const "):
        try: v = int(s[10:].split()[0].rstrip(")")) & 0xFFFFFFFF
        except ValueError: continue
        if v in strs and strs[v] not in fstr[fn]: fstr[fn].append(strs[v])
flush()

def cn(c): return imp.get(c, "f%d" % c)
with open(os.path.join(out, "network-callgraph.txt"), "w") as o:
    for w in sorted(watch_ids):
        o.write("== %s (import %d) callers: %s\n" % (imp[w], w, sorted(rev[w])))
    o.write("\n== cone (depth = hops from a direct network caller)\n")
    for f, d in sorted(cone.items(), key=lambda x: (x[1], x[0])):
        o.write("f%d depth=%d instrs=%d calls=%s\n" % (f, d, size[f], [cn(c) for c in sorted(calls[f])][:40]))
        for t in fstr.get(f, [])[:25]: o.write("    str: %s\n" % t[:200].replace("\n", "\\n"))
with open(os.path.join(out, "network-functions.wat"), "w") as o:
    for f in sorted(bodies): o.write("".join(bodies[f]) + "\n")

# ---- keyword functions
score = {}
for f, ss in fstr.items():
    n = sum(1 for t in ss if KEY.search(t))
    if n: score[f] = n + (100 if f in cone else 0)
top = sorted(score, key=lambda f: -score[f])[:120]
with open(os.path.join(out, "keyword-functions.txt"), "w") as o:
    for f in top:
        o.write("f%d score=%d cone=%s instrs=%d calls=%s\n" % (f, score[f], cone.get(f), size[f], [cn(c) for c in sorted(calls[f])][:30]))
        for t in fstr[f]:
            if KEY.search(t): o.write("    str: %s\n" % t[:200].replace("\n", "\\n"))
want = {f for f in top[:60] if size[f] <= 1500}
with open(os.path.join(out, "keyword-functions.wat"), "w") as o:
    fn = None; keep = False
    for line in text():
        s = line.lstrip()
        if s.startswith("(func (;"):
            fn = int(s[8:s.index(";", 8)]); keep = fn in want
        if keep: o.write(line)
print("done", file=sys.stderr)
