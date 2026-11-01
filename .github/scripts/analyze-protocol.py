import re, sys, os, gzip, glob
out = "analysis"; os.makedirs(out, exist_ok=True)
d = b"".join(open(p, "rb").read() for p in sorted(glob.glob("engine/WebClient.wasm.gz.part*")))
d = gzip.decompress(d)
print("wasm bytes", len(d))
ANCHORS = [b"join-game", b"MachineAddress", b"UdmuxEndpoints", b"ClientTicket", b"authentication-ticket", b"wss://", b"ws://", b"RakNet", b"RbxTransport", b"ProtocolSync", b"NetworkSettings", b"SayMessageRequest", b"TextChatService", b"ServerConnectionAddress", b"joinScriptUrl", b"GameJoinResponse"]
S = re.compile(rb"[\x20-\x7e]{4,200}")
def window(i, w=450):
    return [m.group(0).decode() for m in S.finditer(d[max(0, i - w): i + w])]
for a in ANCHORS:
    hits = [m.start() for m in re.finditer(re.escape(a), d)][:12]
    lines = [f"# {a.decode()}  hits={len(hits)}"]
    for h in hits:
        lines.append(f"## @{h}")
        lines.extend(window(h))
    txt = "\n".join(lines)[:60000]
    open(f"{out}/{re.sub(r'[^A-Za-z0-9]+', '_', a.decode())}.txt", "w").write(txt + "\n")
# compact index of short summary
with open(f"{out}/SUMMARY.txt", "w") as f:
    for a in ANCHORS:
        f.write(f"{a.decode()}: {len(re.findall(re.escape(a), d))}\n")
    f.write("raknet-ish ids: " + ", ".join(sorted(set(m.group(0).decode() for m in re.finditer(rb"ID_[A-Z0-9_]{4,40}", d)))[:120]) + "\n")
    f.write("json keys near join: " + ", ".join(sorted(set(m.group(0).decode() for m in re.finditer(rb"(?:ServerConnection|JoinScript|Udmux|Machine|Session|Ticket|Place|Job|Server)[A-Za-z]{0,30}", d)))[:150]) + "\n")
