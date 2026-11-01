import re, sys, os, gzip
out = sys.argv[1]; wasm = sys.argv[2]
os.makedirs(out, exist_ok=True)
d = open(wasm, "rb").read()
PR = re.compile(rb"[\x20-\x7e]{5,400}")
def clean(b): return bytes(c if 32 <= c < 127 else 46 for c in b).decode()
allstr = [m.group(0).decode() for m in PR.finditer(d)]
open(os.path.join(out, "all-strings.txt.gz"), "wb").write(gzip.compress("\n".join(allstr).encode(), 9))
def w(name, lines, cap=150000):
    t = "\n".join(lines); open(os.path.join(out, name), "w").write(t[:cap] + "\n")
urls = sorted({s for s in allstr if re.search(r"https?://|wss?://|^/v[0-9]/|\.roblox\.com|\.rbxcdn\.com", s)})
w("endpoints.txt", urls)
KEYS = [b"join-game", b"authentication-ticket", b"MachineAddress", b"UdmuxEndpoints", b"ClientTicket", b"GameJoinResponse", b"GameJoinApiResponse", b"joinScript", b"JoinScript", b"RbxTransport", b"RakNet", b"x-csrf-token", b"Roblox-Place-Id", b"ChatMessage", b"TextChatService", b"SendAsync"]
ctx = []
for k in KEYS:
    pos = [m.start() for m in re.finditer(re.escape(k), d)][:4]
    for p in pos:
        seg = [m.group(0).decode() for m in PR.finditer(d[max(0, p - 1500):p + 1500])]
        ctx.append("##### %s @%d\n%s\n" % (k.decode(), p, "\n".join(seg)))
w("join-context.txt", ctx, 250000)
NET = re.compile(r"(?i)(websocket|transport|raknet|packet|replicat|handshake|ticket|serverconnect|disconnect|reconnect|chat)")
w("network-strings.txt", sorted({s for s in allstr if NET.search(s) and len(s) < 160}), 200000)
js = open(os.path.join(os.path.dirname(wasm), "WebClient.js"), errors="ignore").read() if os.path.exists(os.path.join(os.path.dirname(wasm), "WebClient.js")) else ""
w("js-websocket-glue.txt", [m.group(0) for m in re.finditer(r".{0,160}(WebSocket|xhr|fetch).{0,240}", js)][:60], 60000)
print("done", {f: os.path.getsize(os.path.join(out, f)) for f in sorted(os.listdir(out))})
