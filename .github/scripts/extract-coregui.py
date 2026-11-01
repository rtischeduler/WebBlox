#!/usr/bin/env python3
"""Find the CoreGui Lua the real client downloads (DataModel OTA patch, signed rbxm) and unpack it.
usage: extract-coregui.py outdir [asset_id asset_version]
Writes: report.txt, flags-matching.json, tree.json, src/<instance path>.luau
No third-party deps (pure-python LZ4 + rbxm reader)."""
import sys, os, re, json, struct, urllib.request, urllib.error

OUT = sys.argv[1]; SRC = "/tmp/cg-src"; os.makedirs(SRC, exist_ok=True)
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

class _L(list): how = ""

def _plausible(v):
    if not v: return True
    if v[:4] == b"\x28\xb5\x2f\xfd": return True
    t = v[:200]; return v[0] < 10 or sum(32 <= x < 127 or x in (9, 10, 13) for x in t) > 0.85 * len(t)

def decode29(b, n):
    """try plausible layouts for the new Source property encoding"""
    def seq(b, n, off):  # (u32 len + data) * n
        out = _L(); p = off
        for _ in range(n):
            if p + 4 > len(b): return None
            l = struct.unpack_from("<I", b, p)[0]; p += 4
            if p + l > len(b): return None
            out.append(b[p:p + l]); p += l
        return out if p == len(b) else None
    def blk(b, n):  # interleaved lengths then data
        if 4 * n > len(b): return None
        ls = [(b[i] << 24) | (b[n + i] << 16) | (b[2 * n + i] << 8) | b[3 * n + i] for i in range(n)]
        out = _L(); p = 4 * n
        for l in ls:
            if p + l > len(b): return None
            out.append(b[p:p + l]); p += l
        return out if p == len(b) else None
    for how, fn in (("seq", lambda: seq(b, n, 0)), ("seq+1", lambda: seq(b, n, 1)), ("blk", lambda: blk(b, n))):
        try: o = fn()
        except Exception: o = None
        if o is not None and all(_plausible(v) for v in o[:50]): o.how = how; return o
    return None

def zstd_block(raw, size):
    try:
        import zstandard
        return zstandard.ZstdDecompressor().decompress(raw, max_output_size=size)
    except ImportError:
        import subprocess
        return subprocess.run(["zstd", "-d", "-c", "-q"], input=raw, capture_output=True, check=True).stdout

def unpack(raw, cl, ul):
    if cl == 0: return raw
    if raw[:4] == b"\x28\xb5\x2f\xfd": return zstd_block(raw, ul)
    return lz4_block(raw, ul)

PTYPES = {}

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
    cls = {}; ref2cls = {}; props = {}; parent = {}; seen = set()
    while p + 16 <= len(b):
        name = b[p:p + 4]; cl, ul = struct.unpack_from("<II", b, p + 4); p += 16
        raw = b[p:p + (cl or ul)]; p += cl or ul
        try: c = unpack(raw, cl, ul)
        except Exception as e:
            log("chunk", name, "cl", cl, "ul", ul, "head", raw[:8], "decompress failed:", repr(e)[:120]); continue
        if name not in seen: seen.add(name); log("chunk", name, "cl", cl, "ul", ul, "zstd" if raw[:4] == b"\x28\xb5\x2f\xfd" else "lz4" if cl else "raw")
        try:
            if name == b"INST":
                cid = struct.unpack_from("<i", c, 0)[0]; cn, q = rstr(c, 4); q += 1
                n = struct.unpack_from("<i", c, q)[0]; q += 4
                refs, _ = ints(c, q, n); refs = delta(refs)
                cls[cid] = cn.decode("latin1")
                for r in refs: ref2cls[r] = cid
                cls[(cid, "refs")] = refs
            elif name == b"PROP":
                cid = struct.unpack_from("<i", c, 0)[0]; pn, q = rstr(c, 4); pn = pn.decode("latin1")
                t = c[q]; q += 1; PTYPES.setdefault(cls[cid], {})[pn] = t
                if t == 29 and pn == "Source":
                    refs = cls.get((cid, "refs"), []); body = c[q:]
                    if cls[cid] == "ModuleScript" and "src29" not in seen:
                        seen.add("src29"); log("Source(29) class", cls[cid], "n", len(refs), "bytes", len(body), "head", body[:96].hex())
                    got = decode29(body, len(refs))
                    if got:
                        for r, v in zip(refs, got): props.setdefault(r, {})["Source"] = v
                        if "src29ok" not in seen: seen.add("src29ok"); log("Source(29) decoded via", got.how, "sample", got[0][:80] if got else b"")
                    else: log("Source(29) undecoded", cls[cid], len(refs), len(body))
                elif t == 1:  # string
                    for r in cls.get((cid, "refs"), []):
                        s, q = rstr(c, q); props.setdefault(r, {})[pn] = s
            elif name == b"PRNT":
                n = struct.unpack_from("<i", c, 1)[0]
                ch, q = ints(c, 5, n); ch = delta(ch); pa, _ = ints(c, q, n); pa = delta(pa)
                parent.update(zip(ch, pa))
            elif name == b"HASH": log("HASH head", c[:48].hex(), "len", len(c))
            elif name == b"END\0": break
        except Exception as e: log("chunk", name, "parse failed:", repr(e)[:160])
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
                    "source": pr["Source"] if "Source" in pr else None,
                    "link": pr.get("LinkedSource", b"").decode("utf8", "replace"), "guid": pr.get("ScriptGuid", b"").decode("utf8", "replace")})
    return out

# ---------- network ----------
def get(url, hdr=None):
    h = {"User-Agent": "Mozilla/5.0", **(hdr or {})}
    if os.environ.get("ROBLOSECURITY") and "roblox.com" in url: h["Cookie"] = ".ROBLOSECURITY=" + os.environ["ROBLOSECURITY"]
    req = urllib.request.Request(url, headers=h)
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

CFG = {}

def main():
    base = next(open(f).read().strip() for f in ("Client/engine-base.txt", "engine/engine-base.txt") if os.path.exists(f))
    log("engine base", base)
    tree = []
    for pth in PATHS:
        try:
            data = get(base + pth); log("fetched", pth, len(data), "bytes", data[:16])
            dst = os.path.join(OUT, "raw", pth.lstrip("/")); os.makedirs(os.path.dirname(dst), exist_ok=True)
            CFG[pth] = data
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
            if e["source"][:4] == b"\x28\xb5\x2f\xfd":
                try: e["source"] = zstd_block(e["source"], 1 << 26)
                except Exception: pass
            isb = is_bytecode(e["source"]); bc += isb; n += 1
            f = os.path.join(SRC, re.sub(r"[^\w./-]", "_", e["path"]) + (".luauc" if isb else ".luau"))
            os.makedirs(os.path.dirname(f), exist_ok=True); open(f, "wb").write(e["source"])
            rows.append(f"{e['class']}\t{len(e['source'])}\t{'bytecode' if isb else 'source'}\t{e['path']}")
    open(os.path.join(OUT, "scripts.tsv"), "w").write("\n".join(rows) + "\n")
    # structure: everything within 4 levels, plus every script path
    json.dump([{k: v for k, v in e.items() if k != "source"} for e in tree if e["path"].count("/") < 4 or e["source"] is not None],
              open(os.path.join(OUT, "tree.json"), "w"), indent=0)
    mods = [e for e in tree if e["class"] == "ModuleScript"]
    open(os.path.join(OUT, "linked.tsv"), "w").write("\n".join(f"{e['guid']}\t{e['link']}\t{e['path']}" for e in mods) + "\n")
    pre = collections.Counter(re.sub(r"[A-Za-z0-9_./-]{12,}.*", "...", e["link"])[:40] for e in mods)
    log("LinkedSource prefixes", pre.most_common(8)); log("sample", [(e["link"][:120], e["guid"][:40], e["path"]) for e in mods[:5]])
    probed = 0
    for e in mods:
        l = e["link"]
        if not l or probed >= 4: continue
        probed += 1; cand = []
        if l.startswith("http"): cand = [l]
        elif l.startswith("rbxasset://"): cand = [base + "/content/" + l[11:], base + "/ExtraContent/" + l[11:]]
        else:
            m = re.search(r"(\d{6,})", l)
            if m: cand = [f"https://assetdelivery.roblox.com/v1/asset/?id={m.group(1)}"]
        for u in cand:
            try: d = get(u); log("probe", u, "->", len(d), d[:80])
            except urllib.error.HTTPError as ex: log("probe", u, "HTTP", ex.code)
            except Exception as ex: log("probe", u, "failed", repr(ex)[:100])
    log("instances", len(tree), "classes", len(cc), "scripts with Source", n, "bytecode", bc)
    log("top classes", cc.most_common(12))
    import shutil
    if os.listdir(SRC): shutil.make_archive(os.path.join(OUT, "src-InExperience"), "gztar", SRC); log("archived baked sources")
    json.dump(PTYPES, open(os.path.join(OUT, "prop-types.json"), "w"), indent=0)
    log("ModuleScript props+types", PTYPES.get("ModuleScript"))
    for pth, nm in (("/content/configs/InExperiencePatchConfig/InExperiencePatchConfig.json", "InExperience"),
                    ("/content/configs/UniversalAppPatchConfig/UniversalAppPatchConfig.json", "UniversalApp"),
                    ("/content/configs/DataModelPatchConfig/DataModelPatchConfig.json", "DataModelPatch")):
        try: cfg = json.loads(CFG[pth]); aid, ver = cfg["AssetId"], cfg["AssetVersion"]
        except Exception as e: log("no cfg", nm, repr(e)[:80]); continue
        for u in (f"https://assetdelivery.roblox.com/v2/assetId/{aid}/version/{ver}", f"https://assetdelivery.roblox.com/v1/asset/?id={aid}&version={ver}"):
            try:
                d = get(u); log("online", nm, u, len(d), d[:120])
                if d[:1] == b"{":
                    loc = json.loads(d).get("locations", [{}])[0].get("location"); log("   location", loc)
                    if not loc: continue
                    d = get(loc); log("   downloaded", len(d), d[:16])
                if MAGIC[:8] in d[:64]:
                    PTYPES.clear(); items = parse_rbxm(d); src = [e for e in items if e["source"] is not None]
                    log("   parsed", nm, "instances", len(items), "with Source", len(src), "props", {c: sorted(v) for c, v in PTYPES.items() if c.endswith("Script")})
                    for e in src:
                        f = os.path.join("/tmp/cg-online", nm, re.sub(r"[^\w./-]", "_", e["path"]) + ".luau"); os.makedirs(os.path.dirname(f), exist_ok=True); open(f, "wb").write(e["source"])
                    break
            except urllib.error.HTTPError as ex: log("online", nm, u, "HTTP", ex.code, ex.read()[:160])
            except Exception as ex: log("online", nm, u, "failed", repr(ex)[:140])
    if os.path.isdir("/tmp/cg-online"):
        for nm in os.listdir("/tmp/cg-online"): shutil.make_archive(os.path.join(OUT, "src-online-" + nm), "gztar", os.path.join("/tmp/cg-online", nm)); log("archived online", nm)
    open(os.path.join(OUT, "report.txt"), "w").write("\n".join(REPORT) + "\n")

if __name__ == "__main__": main()
