export const SOURCES = [
  { id: "replication", label: "In-server (replicated)" },
  { id: "web", label: "Server list (web API)" },
  { id: "joinscript", label: "Local player" },
];

export const normalizePlayer = (p) => ({
  id: p.id ?? null,
  name: p.name ?? null,
  displayName: p.displayName ?? p.name ?? null,
  avatarUrl: p.avatarUrl ?? "",
  token: p.token ?? null,
  you: Boolean(p.you),
});

export class PlayerList {
  constructor() {
    this.data = new Map();
    this.listeners = new Set();
  }

  notify() {
    const sections = this.sections();
    for (const fn of this.listeners) fn(sections);
  }

  update(source, players, meta = {}) {
    if (!SOURCES.some((s) => s.id === source)) throw new Error("Unknown player source: " + source);
    this.data.set(source, { players: players.map(normalizePlayer), meta });
    this.notify();
  }

  clear() {
    this.data.clear();
    this.notify();
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  sections() {
    return SOURCES.filter((s) => this.data.get(s.id)?.players.length).map((s) => ({ ...s, ...this.data.get(s.id) }));
  }
}
