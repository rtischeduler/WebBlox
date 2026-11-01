import struct, importlib.util, sys, os
sys.argv = ["x", "/tmp/cg-test"]
spec = importlib.util.spec_from_file_location("ec", os.path.join(os.path.dirname(__file__), "..", ".github/scripts/extract-coregui.py"))
ec = importlib.util.module_from_spec(spec); spec.loader.exec_module(ec)

def il(vals):  # interleave zigzag int32
    z = [((v << 1) ^ (v >> 31)) & 0xFFFFFFFF for v in vals]
    return b"".join(bytes((x >> s) & 255 for x in z) for s in (24, 16, 8, 0))
def dl(vals): return [vals[0]] + [b - a for a, b in zip(vals, vals[1:])]
def chunk(n, d): return n + struct.pack("<III", 0, len(d), 0) + d
def s(x): return struct.pack("<I", len(x)) + x

def test_lz4():
    assert ec.lz4_block(bytes([0x1f, 97, 1, 0, 0]), 20) == b"a" * 20  # literal 'a' + overlap match
def test_rbxm():
    inst = struct.pack("<i", 0) + s(b"LocalScript") + b"\0" + struct.pack("<i", 1) + il([0])
    nm = struct.pack("<i", 0) + s(b"Name") + b"\1" + s(b"Main")
    src = struct.pack("<i", 0) + s(b"Source") + b"\1" + s(b"print('hi')")
    prnt = b"\0" + struct.pack("<i", 1) + il([0]) + il([-1])
    data = ec.MAGIC + struct.pack("<hii", 0, 1, 1) + b"\0" * 8 + chunk(b"INST", inst) + chunk(b"PROP", nm) + chunk(b"PROP", src) + chunk(b"PRNT", prnt) + chunk(b"END\0", b"</roblox>")
    r = ec.parse_rbxm(b"junk" + data)
    assert r[0]["path"] == "Main" and r[0]["class"] == "LocalScript" and r[0]["source"] == b"print('hi')"
if __name__ == "__main__": test_lz4(); test_rbxm(); print("ok")
