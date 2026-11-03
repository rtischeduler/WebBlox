import test from "node:test";
import assert from "node:assert/strict";
import { buildWtUrl, describeJoin } from "../src/join/gamejoin.mjs";

test("builds the engine-shaped WebTransport URL from GameFqdn, port and capabilities", () => {
  const w = buildWtUrl({ GameFqdn: "a1.example.roblox.com", NetStackPort: 443, NetStackTokenValue: "t", ServerConnections: [{ ServerCapabilities: "abc+/=" }] });
  assert.equal(w.url, "https://a1.example.roblox.com:443/wt?X-Rbx-Capabilities=abc%2B%2F%3D&X-Rbx-Close-Reason=utf8-v1");
  assert.deepEqual(w.missing, []);
});

test("without GameFqdn it refuses to guess an IP URL and says what is missing", () => {
  const w = buildWtUrl({ UdMuxIp: "1.2.3.4", UdMuxPort: 1234 });
  assert.equal(w.url, "");
  assert.deepEqual(w.missing, ["GameFqdn", "NetStackPort"]);
  assert.equal(describeJoin({ GameFqdn: "h.x", NetStackPort: 9 }).wt.url, "https://h.x:9/wt?X-Rbx-Close-Reason=utf8-v1");
});

test("reads the real keys: top-level NetStackPort, lowercase gameFqdn, nested objects", () => {
  const w = buildWtUrl({ netstackport: "4433", Nested: { gameFqdn: "x.roblox.com" } });
  assert.equal(w.url, "https://x.roblox.com:4433/wt?X-Rbx-Close-Reason=utf8-v1");
});
