import test from "node:test";
import assert from "node:assert/strict";
import { ChatLog, ChatClient, cleanOutgoing, MAX_LENGTH } from "../src/join/chat.mjs";
import { Session } from "../src/join/session.mjs";
import { Transport, Capture } from "../src/join/transport.mjs";

const wait = (ms = 15) => new Promise((r) => setTimeout(r, ms));

const makeFake = ({ ready = "ok" } = {}) => {
  const h = { closeArgs: null, writerClosed: 0 };
  class FakeWT {
    constructor() {
      h.wt = this;
      this.datagrams = {
        maxDatagramSize: 1200,
        readable: new ReadableStream({ start: (c) => (h.datagramIn = c) }),
        writable: new WritableStream(),
      };
      this.incomingUnidirectionalStreams = new ReadableStream({});
      this.incomingBidirectionalStreams = new ReadableStream({});
      this.ready = ready === "ok" ? Promise.resolve() : new Promise((_, rej) => (h.failReady = rej));
      this.closed = new Promise((res, rej) => ((h.finishClosed = res), (h.failClosed = rej)));
    }
    async createBidirectionalStream() {
      return {
        readable: new ReadableStream({}),
        writable: new WritableStream({ close: () => h.writerClosed++ }),
      };
    }
    close(args) {
      h.closeArgs = args;
      h.failReady?.(new Error("closed"));
      h.finishClosed({ closeCode: args?.closeCode ?? 0, reason: args?.reason ?? "" });
    }
  }
  return { FakeWT, h };
};

test("ChatLog caps lines and notifies", () => {
  const log = new ChatLog({ max: 3, now: () => 1 });
  const seen = [];
  log.onChange((l) => seen.push(l?.text));
  for (const t of ["a", "b", "c", "d"]) log.system(t);
  assert.deepEqual(log.lines.map((l) => l.text), ["b", "c", "d"]);
  assert.deepEqual(seen, ["a", "b", "c", "d"]);
});

test("cleanOutgoing trims, strips control characters and enforces the limit", () => {
  assert.equal(cleanOutgoing("  hi\nthere  "), "hi there");
  assert.throws(() => cleanOutgoing("   "), /Type a message/);
  assert.throws(() => cleanOutgoing("x".repeat(MAX_LENGTH + 1)), /limited/);
});

test("ChatClient is honest when the protocol is not decoded", async () => {
  const chat = new ChatClient();
  assert.equal(chat.canSend, false);
  assert.match(chat.status, /not decoded/);
  await assert.rejects(chat.send("hello"), /not decoded/);
  assert.equal(chat.log.lines.length, 0, "nothing is shown as sent");
});

test("ChatClient uses an installed decoder and encoder", async () => {
  const sent = [];
  const chat = new ChatClient({
    decode: ({ bytes }) => [{ speaker: "Bob", text: new TextDecoder().decode(bytes) }],
    encode: async (t) => sent.push(t),
  });
  const { FakeWT, h } = makeFake();
  const t = new Transport({ WebTransport: FakeWT });
  chat.attach(t);
  await t.connect("https://h:1/");
  h.datagramIn.enqueue(new TextEncoder().encode("yo"));
  await wait();
  await chat.send("hi");
  assert.deepEqual(chat.log.lines.map((l) => [l.kind, l.speaker, l.text]), [["chat", "Bob", "yo"], ["chat", "You", "hi"]]);
  assert.deepEqual(sent, ["hi"]);
});

test("a throwing decoder is reported, not fatal", async () => {
  const chat = new ChatClient({ decode: () => { throw new Error("bad frame"); } });
  const { FakeWT, h } = makeFake();
  const t = new Transport({ WebTransport: FakeWT });
  chat.attach(t);
  await t.connect("https://h:1/");
  h.datagramIn.enqueue(new Uint8Array([1]));
  await wait();
  assert.match(chat.log.lines[0].text, /decode error: bad frame/);
});

test("leave closes the way the engine does: closeCode 0, empty reason, write sides finished first", async () => {
  const { FakeWT, h } = makeFake();
  const t = new Transport({ WebTransport: FakeWT });
  await t.connect("https://h:1/");
  await t.openStream({ bidirectional: true });
  const info = await t.leave();
  assert.deepEqual(h.closeArgs, { closeCode: 0, reason: "" });
  assert.equal(h.writerClosed, 1);
  assert.equal(info.by, "client");
});

test("Session stays connected until leave, then reports left", async () => {
  const { FakeWT } = makeFake();
  const session = new Session({ WebTransport: FakeWT });
  const states = [];
  session.onState((s) => states.push(s));
  await session.join("https://h:1/");
  await wait(40);
  assert.equal(session.state, "connected");
  assert.equal(session.live, true);
  await session.leave();
  assert.equal(session.state, "left");
  assert.equal(session.live, false);
  assert.deepEqual(states, ["connecting", "connected", "leaving", "left"]);
  const text = session.chat.log.lines.map((l) => l.text).join("\n");
  assert.match(text, /You left the server/);
});

test("a server-side close is reported as dropped, not as a successful stay", async () => {
  const { FakeWT, h } = makeFake();
  const session = new Session({ WebTransport: FakeWT });
  await session.join("https://h:1/");
  h.finishClosed({ closeCode: 7, reason: "timeout" });
  await wait();
  assert.equal(session.state, "dropped");
  assert.match(session.chat.log.lines.at(-1).text, /server closed the connection .*code 7, timeout/);
  assert.equal(await session.leave(), null, "leave after a drop is a no-op");
});

test("leaving while still connecting cancels cleanly", async () => {
  const { FakeWT } = makeFake({ ready: "never" });
  const session = new Session({ WebTransport: FakeWT });
  const joined = session.join("https://h:1/").catch((e) => e);
  await wait();
  await session.leave();
  await joined;
  assert.equal(session.state, "left");
});

test("a failed connect ends in failed and can be retried", async () => {
  const { FakeWT, h } = makeFake({ ready: "never" });
  const session = new Session({ WebTransport: FakeWT });
  const p = session.join("https://h:1/", [], { timeoutMs: 20 });
  await assert.rejects(p, /timed out/);
  assert.equal(session.state, "failed");
  assert.equal(session.live, false);
});
