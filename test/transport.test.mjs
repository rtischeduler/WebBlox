import test from "node:test";
import assert from "node:assert/strict";
import { Capture, Transport, fromB64, toB64 } from "../src/join/transport.mjs";

const wait = (ms = 15) => new Promise((resolve) => setTimeout(resolve, ms));

const makeFake = ({ ready = "ok" } = {}) => {
  const handle = { sent: [], opened: [] };
  class FakeWT {
    constructor(url, options) {
      handle.url = url;
      handle.options = options;
      handle.wt = this;
      this.datagrams = {
        maxDatagramSize: 1200,
        readable: new ReadableStream({ start: (c) => (handle.datagramIn = c) }),
        writable: new WritableStream({ write: (chunk) => handle.sent.push(chunk) }),
      };
      this.incomingUnidirectionalStreams = new ReadableStream({ start: (c) => (handle.uniIn = c) });
      this.incomingBidirectionalStreams = new ReadableStream({ start: (c) => (handle.bidiIn = c) });
      this.ready = ready === "ok" ? Promise.resolve() : ready === "fail" ? Promise.reject(new Error("refused")) : new Promise(() => {});
      this.closed = new Promise((resolve) => (handle.finishClosed = resolve));
    }
    async createBidirectionalStream() {
      const out = [];
      handle.opened.push(out);
      return {
        readable: new ReadableStream({ start: (c) => (handle.bidiReadable = c) }),
        writable: new WritableStream({ write: (chunk) => out.push(chunk), close: () => (out.closed = true) }),
      };
    }
    async createUnidirectionalStream() {
      const out = [];
      handle.opened.push(out);
      return new WritableStream({ write: (chunk) => out.push(chunk) });
    }
    close() {
      handle.finishClosed({ closeCode: 0, reason: "" });
    }
  }
  return { FakeWT, handle };
};

test("base64 helpers round trip", () => {
  const bytes = new Uint8Array([0, 1, 2, 250, 255]);
  assert.deepEqual(fromB64(toB64(bytes)), bytes);
});

test("Capture truncates entries and stops at its limit", () => {
  const cap = new Capture({ limit: 10, perEntry: 4, now: () => 0 });
  cap.record("in", "datagram", 0, new Uint8Array([1, 2, 3, 4, 5, 6]));
  cap.record("in", "datagram", 0, new Uint8Array([7, 8, 9, 10]));
  cap.record("in", "datagram", 0, new Uint8Array([11, 12, 13, 14]));
  cap.record("in", "datagram", 0, new Uint8Array([15, 16, 17, 18]));
  assert.equal(cap.entries.length, 2);
  assert.equal(cap.entries[0].len, 6);
  assert.equal(cap.entries[0].truncated, true);
  assert.equal(cap.entries[1].truncated, false);
  assert.equal(cap.dropped, 2);
  assert.equal(cap.toJSON().version, 1);
});

test("connect passes cert hashes and records datagrams and streams", async () => {
  const { FakeWT, handle } = makeFake();
  const capture = new Capture();
  const transport = new Transport({ WebTransport: FakeWT, capture });
  const got = [];
  transport.onData((d) => got.push([d.kind, d.stream, [...d.bytes]]));
  const hash = toB64(new Uint8Array(32).fill(7));
  const result = await transport.connect("https://1.2.3.4:4444/", [hash]);
  assert.equal(result.maxDatagramSize, 1200);
  assert.equal(handle.options.serverCertificateHashes[0].algorithm, "sha-256");
  assert.equal(handle.options.serverCertificateHashes[0].value.length, 32);

  handle.datagramIn.enqueue(new Uint8Array([9, 9]));
  handle.uniIn.enqueue(new ReadableStream({ start: (c) => { c.enqueue(new Uint8Array([1, 2, 3])); c.close(); } }));
  await wait();

  assert.deepEqual(got, [["datagram", 0, [9, 9]], ["stream", 1, [1, 2, 3]]]);
  const kinds = capture.entries.map((e) => e.kind);
  assert.ok(kinds.includes("connect") && kinds.includes("ready") && kinds.includes("stream-in") && kinds.includes("stream-fin"));
  transport.close();
  await wait();
  assert.ok(capture.entries.some((e) => e.kind === "closed"));
});

test("connect without hashes omits options", async () => {
  const { FakeWT, handle } = makeFake();
  await new Transport({ WebTransport: FakeWT }).connect("https://h:1/");
  assert.equal(handle.options, undefined);
});

test("sendDatagram and opened streams write and record outgoing data", async () => {
  const { FakeWT, handle } = makeFake();
  const capture = new Capture();
  const transport = new Transport({ WebTransport: FakeWT, capture });
  await transport.connect("https://h:1/");
  await transport.sendDatagram(new Uint8Array([4, 5]));
  assert.deepEqual([...handle.sent[0]], [4, 5]);

  const id = await transport.openStream({ bidirectional: true });
  await transport.writeStream(id, new Uint8Array([6]));
  await transport.finishStream(id);
  assert.deepEqual([...handle.opened[0][0]], [6]);
  assert.equal(handle.opened[0].closed, true);

  const uni = await transport.openStream({ bidirectional: false });
  await transport.writeStream(uni, new Uint8Array([8]));
  assert.deepEqual([...handle.opened[1][0]], [8]);

  const outgoing = capture.entries.filter((e) => e.dir === "out");
  assert.equal(outgoing.length, 3);
  await assert.rejects(transport.writeStream(99, new Uint8Array([1])), /Unknown stream/);
});

test("incoming bidirectional streams can be answered", async () => {
  const { FakeWT, handle } = makeFake();
  const transport = new Transport({ WebTransport: FakeWT });
  const got = [];
  transport.onData((d) => got.push([...d.bytes]));
  await transport.connect("https://h:1/");
  const written = [];
  handle.bidiIn.enqueue({
    readable: new ReadableStream({ start: (c) => { c.enqueue(new Uint8Array([5])); c.close(); } }),
    writable: new WritableStream({ write: (chunk) => written.push(chunk) }),
  });
  await wait();
  assert.deepEqual(got, [[5]]);
  await transport.writeStream(1, new Uint8Array([2]));
  assert.deepEqual([...written[0]], [2]);
});

test("a rejected or stalled connection fails and is recorded", async () => {
  const failed = makeFake({ ready: "fail" });
  const capture = new Capture();
  await assert.rejects(new Transport({ WebTransport: failed.FakeWT, capture }).connect("https://h:1/"), /refused/);
  assert.ok(capture.entries.some((e) => e.kind === "connect-failed" && /refused/.test(e.error)));

  const stalled = makeFake({ ready: "never" });
  await assert.rejects(
    new Transport({ WebTransport: stalled.FakeWT }).connect("https://h:1/", [], { timeoutMs: 20 }),
    /timed out/,
  );
});

test("connect explains missing WebTransport support", async () => {
  assert.equal(Transport.supported(undefined), false);
  await assert.rejects(new Transport({ WebTransport: undefined }).connect("https://h:1/"), /not supported/);
});
