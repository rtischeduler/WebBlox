#!/usr/bin/env python3
"""Find the CoreGui Lua the real client downloads (DataModel OTA patch, signed rbxm) and unpack it.
usage: extract-coregui.py outdir [asset_id asset_version]
Writes: report.txt, flags-matching.json, tree.json, src/<instance path>.luau
No third-party deps (pure-python LZ4 + rbxm reader)."""
import sys, os, re, json, struct, urllib.request, urllib.error

OUT = sys.argv[1]; os.makedirs(os.path.join(OUT, "src"), exist_ok=True)
REPORT = []
def log(*a):
    s = " ".join(str(x) for x in a); print(s, flush=True); REPORT.append(s)

# ---------- LZ4 block ----------
def lz4_block(d, size):
    o = bytearray(); i = 0
    while i < len(d):
        t = d[i]; i += 1; n = t >> 4
        if n == 15:
            while True:
                x = d[i]; i += 1; n += x
                if x != 255: break
        o += d[i:i + n]; i += n
        if i >= len(d): break
        off = d[i] | (d[i + 1] << 8); i += 2; m = t & 15
        if m == 15:
            while True:
                x = d[i]; i += 1; m += x
                if x != 255: break
        m += 4; s = len(o) - off
        if off >= m: o += o[s:s + m]
        else:
            for k in range(m): o.append(o[s + k])
    if len(o) != size: raise ValueError(f"lz4 size {len(o)} != {size}")
    return bytes(o)

# ---------- rbxm ----------
MAGIC = b"<roblox!\x89\xff\r\n\x1a\n"
def ints(b, p, n):  # interleaved, zigzag
    v = []
    for i in range(n):
        x = (b[p + i] << 24) | (b[p + n + i] << 16) | (b[p + 2 * n + i] << 8) | b[p + 3 * n + i]
        v.append((x >> 1) ^ -(x & 1))
    return v, p + 4 * n
def delta(v):
    r = []; a = 0
    for x in v: a += x; r.append(a)
    return r
def rstr(b, p):
    n = struct.unpack_from("<I", b, p)[0]; return b[p + 4:p + 4 + n], p + 4 + n

def parse_rbxm(data):
    h = data.find(MAGIC)
    if h < 0: raise ValueError("no <roblox!> magic")
    b = data[h:]; ncls, ninst = struct.unpack_from("<ii", b, 16); p = 32
    cls = {}; ref2cls = {}; props = {}; parent = {}
    while p + 16 <= len(b):
        name = b[p:p + 4]; cl, ul = struct.unpack_from("<II", b, p + 4); p += 16
        raw = b[p:p + (cl or ul)]; p += cl or ul
        c = raw if cl == 0 else lz4_block(raw, ul)
        if name == b"INST":
            cid = struct.unpack_from("<i", c, 0)[0]; cn, q = rstr(c, 4); q += 1
            n = struct.unpack_from("<i", c, q)[0]; q += 4
            refs, _ = ints(c, q, n); refs = delta(refs)
            cls[cid] = cn.decode("latin1")
            for r in refs: ref2cls[r] = cid
            cls[(cid, "refs")] = refs
        elif name == b"PROP":
            cid = struct.unpack_from("<i", c, 0)[0]; pn, q = rstr(c, 4); pn = pn.decode("latin1")
            t = c[q]; q += 1
            if t == 1:  # string
                for r in cls.get((cid, "refs"), []):
                    s, q = rstr(c, q); props.setdefault(r, {})[pn] = s
        elif name == b"PRNT":
            n = struct.unpack_from("<i", c, 1)[0]
            ch, q = ints(c, 5, n); ch = delta(ch); pa, _ = ints(c, q, n); pa = delta(pa)
            parent.update(zip(ch, pa))
        elif name == b"END\0": break
    out = []
    def path(r):
        names = []
        while r in parent or r in props:
            names.append(props.get(r, {}).get("Name", b"?").decode("utf8", "replace"))
            if parent.get(r, -1) == -1: break
            r = parent[r]
        return "/".join(reversed(names))
    for r, cid in ref2cls.items():
        pr = props.get(r, {})
        out.append({"path": path(r), "class": cls[cid], "props": sorted(pr),
                    "source": pr["Source"] if "Source" in pr else None})
    return out

# ---------- network ----------
def get(url, hdr=None):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", **(hdr or {})})
    with urllib.request.urlopen(req, timeout=300) as r: return r.read()

def walk_json(o, found):
    if isinstance(o, dict):
        if "assetId" in o and "assetVersion" in o: found.add((int(o["assetId"]), int(o["assetVersion"])))
        for v in o.values(): walk_json(v, found)
    elif isinstance(o, list):
        for v in o: walk_json(v, found)
    elif isinstance(o, str) and o[:1] in "[{":
        try: walk_json(json.loads(o), found)
        except Exception: pass

PATHS = ["/ExtraContent/models/InExperience/InExperience.rbxm",
         "/content/configs/DataModelPatchConfig/DataModelPatchConfig.json",
         "/content/configs/InExperiencePatchConfig/InExperiencePatchConfig.json",
         "/content/configs/UniversalAppPatchConfig/UniversalAppPatchConfig.json",
         "/content/configs/OtaPatchConfigs/DiscoveryOtaPatchConfig.json",
         "/ExtraContent/scripts/CoreScripts/Modules/AvatarEditorPrompts/service-descriptor.yml",
         "/ExtraContent/scripts/CoreScripts/Modules/InspectAndBuy/service-descriptor.yml",
         "/ExtraContent/scripts/CoreScripts/Modules/EmotesMenu/service-descriptor.yml"]

def is_bytecode(b): return not b or b[0] < 9 or (b[0] < 32 and b[0] not in (9, 10, 13))

def main():
    base = next(open(f).read().strip() for f in ("Client/engine-base.txt", "engine/engine-base.txt") if os.path.exists(f))
    log("engine base", base)
    tree = []
    for pth in PATHS:
        try:
            data = get(base + pth); log("fetched", pth, len(data), "bytes", data[:16])
            dst = os.path.join(OUT, "raw", pth.lstrip("/")); os.makedirs(os.path.dirname(dst), exist_ok=True)
            if not pth.endswith(".rbxm"): open(dst, "wb").write(data); log("   ", data[:300].decode("utf8", "replace").replace("\n", " "))
            else: tree += parse_rbxm(data)
        except Exception as e: log("fail", pth, repr(e)[:200])
    import collections
    cc = collections.Counter(e["class"] for e in tree)
    open(os.path.join(OUT, "classes.txt"), "w").write("\n".join(f"{n}\t{c}" for c, n in cc.most_common()) + "\n")
    pc = {}
    for e in tree: pc.setdefault(e["class"], set()).update(e["props"])
    json.dump({c: sorted(v) for c, v in pc.items()}, open(os.path.join(OUT, "class-props.json"), "w"), indent=0)
    n = bc = 0; rows = []
    for e in tree:
        if e["source"] is not None:
            isb = is_bytecode(e["source"]); bc += isb; n += 1
            f = os.path.join(OUT, "src", re.sub(r"[^\w./-]", "_", e["path"]) + (".luauc" if isb else ".luau"))
            os.makedirs(os.path.dirname(f), exist_ok=True); open(f, "wb").write(e["source"])
            rows.append(f"{e['class']}\t{len(e['source'])}\t{'bytecode' if isb else 'source'}\t{e['path']}")
    open(os.path.join(OUT, "scripts.tsv"), "w").write("\n".join(rows) + "\n")
    # structure: everything within 4 levels, plus every script path
    json.dump([{k: v for k, v in e.items() if k != "source"} for e in tree if e["path"].count("/") < 4 or e["source"] is not None],
              open(os.path.join(OUT, "tree.json"), "w"), indent=0)
    log("instances", len(tree), "classes", len(cc), "scripts with Source", n, "bytecode", bc)
    log("top classes", cc.most_common(12))
    open(os.path.join(OUT, "report.txt"), "w").write("\n".join(REPORT) + "\n")

if __name__ == "__main__": main()
