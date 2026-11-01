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
    with urllib.request.urlopen(req, timeout=60) as r: return r.read()

def walk_json(o, found):
    if isinstance(o, dict):
        if "assetId" in o and "assetVersion" in o: found.add((int(o["assetId"]), int(o["assetVersion"])))
        for v in o.values(): walk_json(v, found)
    elif isinstance(o, list):
        for v in o: walk_json(v, found)
    elif isinstance(o, str) and o[:1] in "[{":
        try: walk_json(json.loads(o), found)
        except Exception: pass

def main():
    cands = set()
    if len(sys.argv) > 3: cands.add((int(sys.argv[2]), int(sys.argv[3])))
    try:
        flags = json.loads(get("https://clientsettingscdn.roblox.com/v2/settings/application/WebClientApp"))
        st = flags.get("applicationSettings", {})
        hit = {k: v for k, v in st.items() if re.search(r"patch|ota|corescript|luauforge|coregui", k, re.I)}
        json.dump(hit, open(os.path.join(OUT, "flags-matching.json"), "w"), indent=1)
        log("flags total", len(st), "matching", len(hit))
        walk_json(hit, cands)
    except Exception as e: log("flags fetch failed:", e)
    # OTA version endpoint + config-asset-mapping lookup (names taken from the wasm strings)
    scal = []
    def scalars(o):
        if isinstance(o, dict):
            for v in o.values(): scalars(v)
        elif isinstance(o, list):
            for v in o: scalars(v)
        elif isinstance(o, (str, int)) and not isinstance(o, bool) and len(str(o)) < 80: scal.append(str(o))
    VS = ["version-75f1039cb4964863", "0.745.0.7451145"]
    try:
        cv = json.loads(get("https://clientsettings.roblox.com/v2/client-version/WebClientApp"))
        VS = [cv.get("clientVersionUpload"), cv.get("version")] + VS; log("client-version", cv)
    except Exception as e: log("client-version failed", repr(e)[:100])
    urls = []
    for host in ("clientsettings.roblox.com", "clientsettingscdn.roblox.com"):
        for bt in ("WebClientApp", "WindowsPlayer"):
            base = f"https://{host}/v2/ota-version/{bt}"
            urls += [base] + [f"{base}?{q}={v}" for v in dict.fromkeys(x for x in VS if x) for q in ("version", "clientVersion", "channelName")]
    for url in urls[:16]:
        try:
            body = get(url); log("GET", url, "->", body[:600].decode("utf8", "replace"))
            j = json.loads(body); walk_json(j, cands); scalars(j)
        except urllib.error.HTTPError as e:
            log("GET", url, "HTTP", e.code, e.read()[:200].decode("utf8", "replace"))
        except Exception as e: log("GET", url, "failed:", repr(e)[:200])
    for sc in list(dict.fromkeys(scal))[:8]:
        for repo in (0, 1, 2):
            u = f"https://apis.rbxcdn.com/config-asset-mapping-api/v1/get-asset-id?resourceId={sc}&resourceType=1&repositoryType={repo}"
            try:
                body = get(u); log("GET", u, "->", body[:300].decode("utf8", "replace"))
                j = json.loads(body); walk_json(j, cands)
                for k in ("assetId", "AssetId", "id"):
                    if isinstance(j, dict) and str(j.get(k, "")).isdigit(): cands.add((int(j[k]), 0))
            except Exception as e: log("GET", u, "failed:", repr(e)[:120])
    log("candidate patch assets:", sorted(cands))
    tree = []
    for aid, ver in sorted(cands):
        try:
            meta = json.loads(get(f"https://assetdelivery.roblox.com/v2/assetId/{aid}" + (f"/version/{ver}" if ver else "")))
            loc = meta["locations"][0]["location"]
            data = get(loc); log(f"asset {aid} v{ver}: {len(data)} bytes, head={data[:16]!r}")
            tree += parse_rbxm(data)
        except urllib.error.HTTPError as e: log(f"asset {aid} v{ver} HTTP {e.code} (may need a .ROBLOSECURITY cookie)")
        except Exception as e: log(f"asset {aid} v{ver} failed: {e!r}")
    n = 0
    for e in tree:
        if e["source"] is not None:
            f = os.path.join(OUT, "src", re.sub(r"[^\w./-]", "_", e["path"]) + ".luau")
            os.makedirs(os.path.dirname(f), exist_ok=True); open(f, "wb").write(e["source"]); n += 1
    json.dump([{k: v for k, v in e.items() if k != "source"} for e in tree], open(os.path.join(OUT, "tree.json"), "w"), indent=0)
    log("instances", len(tree), "scripts with Source", n)
    open(os.path.join(OUT, "report.txt"), "w").write("\n".join(REPORT) + "\n")

if __name__ == "__main__": main()
