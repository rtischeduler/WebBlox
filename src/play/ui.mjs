// Pure helpers for the in-game look.

// Roblox colours chat names from a fixed 8-colour palette picked by hashing the name.
// The palette is the classic one; the hash is a close approximation, not verified against the engine.
export const NAME_COLORS = [
  "#c4281c", "#0d69ac", "#27462d", "#6b327c", "#da8541", "#f5cd30", "#e8bac8", "#d7c59a",
];

export const nameColor = (name) => {
  const s = String(name ?? "");
  let v = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const rev = s.length - i - 1;
    v += rev % 2 === 1 ? -c : c; // alternate sign by position from the end
  }
  return NAME_COLORS[((v % 8) + 8) % 8];
};

// Flatten PlayerList sections into one list, you first, without double-counting the local player.
export const flattenPlayers = (sections) => {
  const out = [];
  const you = sections.flatMap((s) => s.players).find((p) => p.you);
  if (you) out.push(you);
  for (const s of sections) for (const p of s.players) if (!p.you) out.push(p);
  return out.map((p, i) => ({ ...p, label: p.displayName || p.name || `Player ${i + (you ? 0 : 1)}` }));
};

export const MENU_TABS = ["Players", "Settings", "Help"];
