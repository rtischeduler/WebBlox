#!/usr/bin/env python3
"""Find the code in the Roblox web client wasm that builds the join-game request.
usage: extract-join.py WebClient.wasm outdir [wasm-tools] [strings.txt.gz]
Needs analysis/strings.txt.gz (address<TAB>string) from wasm-search.py."""
import sys, re, os, gzip, subprocess, collections

KEYS = ["placeId", "isTeleport", "gameJoinAttemptId", "gameJoinContext", "joinOrigin", "browserTrackerId",
        "isPlayTogetherGame", "gameId", "partyId", "isPartyLeader", "forcedPop", "popUdpProbeReport",
        "conversationId", "userId", "accessCode", "linkCode", "gameJoinAttemptId", "isNewJoinFlow",
        "clientPlatform", "joinAttemptId", "joinAttemptOrigin", "referralPage", "launchData"]
HEADER = re.compile(r"^(content-type|accept|referer|origin|user-agent|x-csrf-token|cookie|authorization|"
                    r"roblox-[a-z0-9-]+|rbx-[a-z0-9-]+)\s*:?\s*$", re.I)
URL = re.compile(r"join-?game|gamejoin\.|authentication-ticket|join-play-together|join-private|join-reserved", re.I)
INFO = re.compile(r"gamejoin|join-?game|joinscript|JoinGamePlaceLauncher|teleport", re.I)

def categorize(text):
    t = text.strip("\n\0 ")
    for k in KEYS:
        if t == k or ('"%s"' % k) in t:
            return "key"
    if URL.search(t): return "url"
    if HEADER.match(t): return "header"
    return None

def find_targets(strs):
    """strs: {addr: text} -> {addr: (category, text)}"""
    out = {}
    for a, t in strs.items():
        c = categorize(t)
        if c: out[a] = (c, t)
    return out

def scan(lines, targets, strs, cap=3000):
    """Single pass over wasm-tools print output. Returns per-function info and bodies of candidates."""
    funcs = {}; fn = None; buf = []
    def flush():
        if fn is None: return
        f = funcs[fn]
        cats = collections.Counter(targets[a][0] for a in f["refs"] if a in targets)
        f["keys"] = len({a for a in f["refs"] if a in targets and targets[a][0] == "key"})
        f["urls"] = len({a for a in f["refs"] if a in targets and targets[a][0] == "url"})
        if f["keys"] >= 2 or f["urls"] >= 1:
            f["body"] = buf[:cap]
    for line in lines:
        s = line.lstrip()
        if s.startswith("(func (;"):
            flush()
            fn = int(s[8:s.index(";", 8)]); buf = [line]
            funcs[fn] = {"refs": [], "calls": set(), "info": [], "instrs": 0}
            continue
        if fn is None: continue
        if len(buf) < cap: buf.append(line)
        f = funcs[fn]; f["instrs"] += 1
        if s.startswith("i32.const "):
            try: v = int(s[10:].split()[0].rstrip(")")) & 0xFFFFFFFF
            except ValueError: continue
            if v in targets: f["refs"].append(v)
            elif v in strs and INFO.search(strs[v]) and len(f["info"]) < 20 and strs[v] not in f["info"]:
                f["info"].append(strs[v])
        elif s.startswith("call "):
            try: f["calls"].add(int(s[5:].split()[0].rstrip(")")))
            except ValueError: pass
    flush()
    return funcs

def neighbors(targets, strs, span=300):
    addrs = sorted(strs)
    out = []
    for a, (c, t) in sorted(targets.items()):
        if c != "key": continue
        near = [(x, strs[x]) for x in addrs if a - span <= x <= a + span]
        out.append((a, t, near))
    return out

def report(funcs, targets, strs, nb):
    cand = {f: v for f, v in funcs.items() if "body" in v}
    callers = collections.defaultdict(set)
    for f, v in funcs.items():
        for c in v["calls"]:
            if c in cand: callers[c].add(f)
    lines = ["# targets (address, category, text)"]
    for a, (c, t) in sorted(targets.items()):
        lines.append("%d\t%s\t%s" % (a, c, t.replace("\n", "\\n")[:160]))
    order = sorted(cand, key=lambda f: (-cand[f]["keys"], -cand[f]["urls"], f))
    lines.append("\n# candidate functions (most body keys first)")
    for f in order:
        v = cand[f]
        seq = []
        for a in v["refs"]:
            t = targets[a][1].replace("\n", "\\n")[:120]
            if not seq or seq[-1] != t: seq.append(t)
        lines.append("f%d keys=%d urls=%d instrs=%d callers=%s" % (f, v["keys"], v["urls"], v["instrs"], sorted(callers[f])[:12]))
        lines.append("    strings in code order: " + " | ".join(seq))
        lines.append("    calls: " + " ".join("f%d" % c for c in sorted(v["calls"])[:40]))
        for t in v["info"]: lines.append("    info: " + t.replace("\n", "\\n")[:160])
    lines.append("\n# callers of candidates (join-related strings they reference)")
    seen = set()
    for f in order[:15]:
        for c in sorted(callers[f]):
            if c in seen: continue
            seen.add(c); v = funcs[c]
            lines.append("f%d (calls f%d) instrs=%d" % (c, f, v["instrs"]))
            for t in v["info"]: lines.append("    info: " + t.replace("\n", "\\n")[:160])
    nbl = ["# strings stored within +-300 bytes of each body key (data layout neighbours)"]
    for a, t, near in nb:
        nbl.append("\n== %d %s" % (a, t.replace("\n", "\\n")[:80]))
        for x, s in near: nbl.append("  %d\t%s" % (x, s.replace("\n", "\\n")[:160]))
    wat = []
    for f in order[:12]: wat.extend(cand[f]["body"]); wat.append("\n")
    return "\n".join(lines) + "\n", "\n".join(nbl) + "\n", "".join(wat)

def load_strings(path):
    strs = {}
    with gzip.open(path, "rt", errors="replace") as g:
        for line in g:
            a, _, t = line.rstrip("\n").partition("\t")
            if a.isdigit(): strs[int(a)] = t.replace("\\n", "\n")
    return strs

def main():
    wasm, out = sys.argv[1], sys.argv[2]
    wt = sys.argv[3] if len(sys.argv) > 3 else "wasm-tools"
    sp = sys.argv[4] if len(sys.argv) > 4 else "analysis/strings.txt.gz"
    if not os.path.exists(sp): sys.exit("missing %s: run the analyze-wasm workflow first" % sp)
    os.makedirs(out, exist_ok=True)
    strs = load_strings(sp); targets = find_targets(strs)
    print("strings", len(strs), "targets", len(targets), file=sys.stderr)
    pr = subprocess.Popen([wt, "print", wasm], stdout=subprocess.PIPE, text=True, bufsize=1 << 20, errors="replace")
    funcs = scan(pr.stdout, targets, strs); pr.wait()
    rep, nbt, wat = report(funcs, targets, strs, neighbors(targets, strs))
    open(os.path.join(out, "join-request.txt"), "w").write(rep)
    open(os.path.join(out, "join-neighbors.txt"), "w").write(nbt)
    open(os.path.join(out, "join-request-functions.wat"), "w").write(wat)
    print("candidates", sum(1 for v in funcs.values() if "body" in v), file=sys.stderr)

if __name__ == "__main__": main()
