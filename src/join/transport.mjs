const bytesOf = (c) =>
  c instanceof Uint8Array
    ? c
    : c instanceof ArrayBuffer
      ? new Uint8Array(c)
      : ArrayBuffer.isView(c)
        ? new Uint8Array(c.buffer, c.byteOffset, c.byteLength)
        : new Uint8Array(0);

export const toB64 = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

export const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export class Capture {
  constructor({ limit = 524288, perEntry = 4096, now = () => performance.now() } = {}) {
    this.limit = limit;
    this.perEntry = perEntry;
    this.now = now;
    this.entries = [];
    this.used = 0;
    this.dropped = 0;
    this.t0 = now();
  }

  stamp() {
    return Math.round(this.now() - this.t0);
  }

  event(kind, detail = {}) {
    this.entries.push({ t: this.stamp(), kind, ...detail });
  }

  record(dir, kind, stream, chunk) {
    const bytes = bytesOf(chunk);
    const keep = Math.min(bytes.length, this.perEntry);
    if (this.used + keep > this.limit) {
      this.dropped++;
      return;
    }
    this.used += keep;
    this.entries.push({
      t: this.stamp(),
      kind,
      dir,
      stream,
      len: bytes.length,
      truncated: bytes.length > keep,
      data: toB64(bytes.subarray(0, keep)),
    });
  }

  toJSON() {
    return { version: 1, dropped: this.dropped, entries: this.entries };
  }
}

export class Transport {
  constructor({ WebTransport = globalThis.WebTransport, capture = new Capture(), log = () => {} } = {}) {
    this.WebTransport = WebTransport;
    this.capture = capture;
    this.log = log;
    this.wt = null;
    this.datagramWriter = null;
    this.writers = new Map();
    this.handlers = new Set();
    this.nextStream = 1;
    this.closed = false;
    this.closeInfo = null;
    this.closeHandlers = new Set();
    this.initiatedClose = false;
  }

  onClose(fn) {
    this.closeHandlers.add(fn);
    return () => this.closeHandlers.delete(fn);
  }

  settleClose(info) {
    if (this.closeInfo) return;
    this.closed = true;
    this.closeInfo = { by: this.initiatedClose ? "client" : "server", ...info };
    this.capture.event("closed", this.closeInfo);
    for (const fn of this.closeHandlers) {
      try {
        fn(this.closeInfo);
      } catch (e) {
        this.log("[transport] close handler error", e);
      }
    }
  }

  static supported(WT = globalThis.WebTransport) {
    return typeof WT === "function";
  }

  onData(fn) {
    this.handlers.add(fn);
    return () => this.handlers.delete(fn);
  }

  emit(kind, stream, chunk) {
    const bytes = bytesOf(chunk);
    this.capture.record("in", kind, stream, bytes);
    for (const fn of this.handlers) {
      try {
        fn({ kind, stream, bytes });
      } catch (e) {
        this.log("[transport] handler error", e);
      }
    }
  }

  async connect(url, hashes = [], { timeoutMs = 8000 } = {}) {
    if (!Transport.supported(this.WebTransport)) throw new Error("WebTransport is not supported in this browser");
    const options = hashes.length
      ? { serverCertificateHashes: hashes.map((h) => ({ algorithm: "sha-256", value: fromB64(h) })) }
      : undefined;
    this.capture.event("connect", { url, hashes });
    const wt = options ? new this.WebTransport(url, options) : new this.WebTransport(url);
    this.wt = wt;
    wt.ready.catch(() => {});
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("WebTransport connect timed out")), timeoutMs);
    });
    try {
      await Promise.race([wt.ready, timeout]);
    } catch (e) {
      this.capture.event("connect-failed", { error: String(e?.message || e) });
      try {
        wt.close();
      } catch {}
      this.wt = null;
      throw e;
    } finally {
      clearTimeout(timer);
    }
    const maxDatagramSize = wt.datagrams?.maxDatagramSize ?? 0;
    this.capture.event("ready", { maxDatagramSize });
    wt.closed.then(
      (info) => this.settleClose({ closeCode: info?.closeCode ?? null, reason: info?.reason ?? "" }),
      (err) => this.settleClose({ error: String(err?.message || err) }),
    );
    this.datagramWriter = wt.datagrams?.writable ? wt.datagrams.writable.getWriter() : null;
    this.readLoop(wt.datagrams?.readable, "datagram", 0);
    this.acceptLoop(wt.incomingUnidirectionalStreams, false);
    this.acceptLoop(wt.incomingBidirectionalStreams, true);
    return { maxDatagramSize };
  }

  async readLoop(readable, kind, stream) {
    if (!readable) return;
    const reader = readable.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          if (kind === "stream") this.capture.event("stream-fin", { stream });
          return;
        }
        this.emit(kind, stream, value);
      }
    } catch (e) {
      if (!this.closed) this.capture.event("read-error", { kind, stream, error: String(e?.message || e) });
    }
  }

  async acceptLoop(incoming, bidirectional) {
    if (!incoming) return;
    const reader = incoming.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return;
        const stream = this.nextStream++;
        this.capture.event("stream-in", { stream, bidirectional });
        if (bidirectional) {
          this.writers.set(stream, value.writable.getWriter());
          this.readLoop(value.readable, "stream", stream);
        } else {
          this.readLoop(value, "stream", stream);
        }
      }
    } catch (e) {
      if (!this.closed) this.capture.event("accept-error", { bidirectional, error: String(e?.message || e) });
    }
  }

  async sendDatagram(bytes) {
    if (!this.datagramWriter) throw new Error("Datagrams are not available");
    this.capture.record("out", "datagram", 0, bytes);
    await this.datagramWriter.write(bytes);
  }

  async openStream({ bidirectional = true } = {}) {
    if (!this.wt) throw new Error("Not connected");
    const stream = this.nextStream++;
    let writable;
    if (bidirectional) {
      const s = await this.wt.createBidirectionalStream();
      writable = s.writable;
      this.readLoop(s.readable, "stream", stream);
    } else {
      writable = await this.wt.createUnidirectionalStream();
    }
    this.writers.set(stream, writable.getWriter());
    this.capture.event("stream-out", { stream, bidirectional });
    return stream;
  }

  async writeStream(stream, bytes) {
    const writer = this.writers.get(stream);
    if (!writer) throw new Error("Unknown stream " + stream);
    this.capture.record("out", "stream", stream, bytes);
    await writer.write(bytes);
  }

  async finishStream(stream) {
    const writer = this.writers.get(stream);
    if (!writer) return;
    this.writers.delete(stream);
    await writer.close();
  }

  // How the real engine leaves (WebClient.js rbx_wasm_rna_send_connection_close_js / _close_js):
  // it flags the connection closed, then calls WebTransport.close({ closeCode: 0, reason: "" }) and drops
  // the connection from its table. Per-stream shutdowns are writer.close() (write side) and reader.cancel()
  // (read side). Whatever a "leave" message looks like on the wire is written by the wasm *before* this call
  // and is not decoded yet, so this only reproduces the transport half of leaving.
  close() {
    this.initiatedClose = true;
    this.closed = true;
    try {
      this.wt?.close({ closeCode: 0, reason: "" });
    } catch {}
  }

  // Graceful leave: finish our write sides, then close the session and wait (bounded) for the browser to confirm.
  async leave({ waitMs = 2000 } = {}) {
    if (!this.wt || this.closeInfo) return this.closeInfo;
    this.initiatedClose = true;
    this.capture.event("leave");
    const writers = [...this.writers.values()];
    this.writers.clear();
    await Promise.all(writers.map((w) => Promise.resolve(w.close()).catch(() => {})));
    this.close();
    let timer;
    await Promise.race([
      this.wt.closed.catch(() => {}),
      new Promise((resolve) => {
        timer = setTimeout(resolve, waitMs);
      }),
    ]);
    clearTimeout(timer);
    this.settleClose({ closeCode: 0, reason: "" });
    return this.closeInfo;
  }
}
