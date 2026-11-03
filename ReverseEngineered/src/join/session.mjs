import { Transport, Capture } from "./transport.mjs";
import { ChatClient } from "./chat.mjs";

export const STATES = ["idle", "connecting", "connected", "leaving", "left", "dropped", "failed"];
const LIVE = new Set(["connecting", "connected", "leaving"]);

const fmtSecs = (ms) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

// One game-server session: open the transport, keep it open until the person leaves or the server closes it,
// and report which of those happened. It does NOT speak the game protocol, so a real server will most likely
// close the connection on its own soon after connecting (nothing answers its handshake/keepalive). That outcome is
// reported as "dropped by the server", never as a successful stay.
export class Session {
  constructor({ chat = new ChatClient(), capture = new Capture(), log = () => {}, WebTransport, now = () => Date.now() } = {}) {
    this.chat = chat;
    this.capture = capture;
    this.log = log;
    this.WebTransport = WebTransport;
    this.now = now;
    this.state = "idle";
    this.transport = null;
    this.startedAt = 0;
    this.connectedAt = 0;
    this.listeners = new Set();
  }

  get live() {
    return LIVE.has(this.state);
  }

  onState(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  set(state, detail = {}) {
    this.state = state;
    for (const fn of this.listeners) fn(state, detail);
  }

  async join(url, hashes = [], opts = {}) {
    if (this.live) throw new Error("Already in a session. Leave first.");
    const transport = new Transport({ WebTransport: this.WebTransport ?? globalThis.WebTransport, capture: this.capture, log: this.log });
    this.transport = transport;
    this.startedAt = this.now();
    this.set("connecting", { url });
    this.chat.log.system(`Connecting to ${url}…`);
    this.chat.attach(transport);
    transport.onClose((info) => this.handleClosed(info));
    try {
      const result = await transport.connect(url, hashes, opts);
      if (this.state === "leaving" || this.state === "left") return result; // left while connecting
      this.connectedAt = this.now();
      this.set("connected", result);
      this.chat.log.system("Connected to the game server transport. " + this.chat.status);
      return result;
    } catch (e) {
      if (this.state !== "leaving" && this.state !== "left") {
        this.set("failed", { error: e.message || String(e) });
        this.chat.log.system("Could not connect: " + (e.message || e));
      }
      throw e;
    }
  }

  handleClosed(info) {
    if (this.state === "left" || this.state === "dropped" || this.state === "failed") return;
    const stayed = fmtSecs(this.now() - (this.connectedAt || this.startedAt));
    if (this.state === "leaving" || info.by === "client") {
      this.set("left", { ...info, stayed });
      this.chat.log.system(`You left the server (connected ${stayed}).`);
      return;
    }
    const why = info.error ? `error: ${info.error}` : `code ${info.closeCode ?? "?"}${info.reason ? ", " + info.reason : ""}`;
    this.set("dropped", { ...info, stayed });
    this.chat.log.system(`The server closed the connection after ${stayed} (${why}).`);
  }

  async leave() {
    if (!this.live) return null;
    const wasConnecting = this.state === "connecting";
    this.set("leaving");
    this.chat.log.system(wasConnecting ? "Cancelling…" : "Leaving…");
    this.chat.detach?.();
    this.chat.detach = null;
    const info = await this.transport.leave();
    if (this.state === "leaving") this.handleClosed({ by: "client", ...(info || {}) });
    return info;
  }
}
