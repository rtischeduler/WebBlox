// Chat model for the join page.
//
// What is real today: local system lines (joined, left, connection closed, errors) and the plumbing for chat.
// What is NOT real today: reading other players' messages or sending your own. Roblox chat travels inside the
// encrypted replication stream (RNA channels -> RUPP -> session keys -> Replicator), which is not decoded
// (docs/join-notes.md, open questions 3-5). `ChatClient` therefore takes a `decode` and an `encode`
// function; with none installed it says so instead of pretending, and `canSend` is false.

export const MAX_LENGTH = 200;
export const MAX_LINES = 500;

export class ChatLog {
  constructor({ max = MAX_LINES, now = () => Date.now() } = {}) {
    this.max = max;
    this.now = now;
    this.lines = [];
    this.seq = 0;
    this.listeners = new Set();
  }

  add(kind, text, speaker = null) {
    const line = { id: ++this.seq, kind, speaker, text: String(text), at: this.now() };
    this.lines.push(line);
    if (this.lines.length > this.max) this.lines.splice(0, this.lines.length - this.max);
    for (const fn of this.listeners) fn(line, this.lines);
    return line;
  }

  system(text) {
    return this.add("system", text);
  }

  message(speaker, text) {
    return this.add("chat", text, speaker);
  }

  clear() {
    this.lines = [];
    for (const fn of this.listeners) fn(null, this.lines);
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const cleanOutgoing = (text) => {
  const t = String(text ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  if (!t) throw new Error("Type a message first.");
  if ([...t].length > MAX_LENGTH) throw new Error(`Messages are limited to ${MAX_LENGTH} characters.`);
  return t;
};

export class ChatClient {
  constructor({ log = new ChatLog(), decode = null, encode = null } = {}) {
    this.log = log;
    this.decode = decode; // (frame {kind, stream, bytes}) -> [{ speaker, text }] | null
    this.encode = encode; // (text) -> async send; owns writing to the transport
    this.detach = null;
  }

  get canRead() {
    return typeof this.decode === "function";
  }

  get canSend() {
    return typeof this.encode === "function";
  }

  get status() {
    if (this.canRead && this.canSend) return "Chat is live.";
    return "Chat messages cannot be read or sent yet: the replication stream is not decoded. Connection events still show here.";
  }

  attach(transport) {
    this.detach?.();
    const off = transport.onData((frame) => {
      if (!this.canRead) return;
      let out;
      try {
        out = this.decode(frame);
      } catch (e) {
        this.log.system("Chat decode error: " + (e?.message || e));
        return;
      }
      for (const m of out || []) if (m && m.text) this.log.message(m.speaker ?? "?", m.text);
    });
    this.detach = off;
    return off;
  }

  async send(text, { self = "You" } = {}) {
    const clean = cleanOutgoing(text);
    if (!this.canSend) throw new Error("Sending is not available: the replication protocol is not decoded yet.");
    await this.encode(clean);
    this.log.message(self, clean);
    return clean;
  }
}
