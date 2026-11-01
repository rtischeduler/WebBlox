// Draws what has actually been loaded from the real CoreGui patch onto the game canvas.
// This is NOT the CoreGui UI itself: that is Luau bytecode (React-Lua) which needs a Luau VM plus the
// engine's GUI classes to run. Until that exists the canvas shows the real patch identity and real strings.
const FONT = "14px 'Source Sans Pro', system-ui, sans-serif";

export function coreGuiLines(cg, state = {}) {
  const lines = [{ t: "CoreGui", big: true }];
  if (state.error) return lines.concat({ t: "Failed: " + state.error, bad: true });
  if (!cg) return lines.concat({ t: state.progress || "Loading…", dim: true });
  lines.push({ t: `client ${cg.engine.upload || "(bundled snapshot)"}${cg.engine.latest ? "" : "  — latest lookup failed"}`, dim: true });
  for (const s of cg.summary()) lines.push({ t: `${s.name} ${s.asset}: ${s.modules} modules, ${s.instances} instances${s.cached ? " (cached)" : ""}` });
  for (const [n, e] of Object.entries(cg.errors)) lines.push({ t: `${n}: ${e}`, bad: true });
  const pick = (label, re) => {
    const mods = cg.modulesMatching(re);
    const text = cg.uiText(re, undefined, 5);
    lines.push({ t: `${label}: ${mods.length} modules`, head: true });
    for (const s of text) lines.push({ t: "“" + s + "”", dim: true });
  };
  pick("Chat", /\/Chat\//);
  pick("PlayerList", /\/PlayerList\//);
  pick("TopBar", /\/TopBar/);
  pick("Escape menu", /\/(InGameMenu|Settings)\//);
  return lines;
}

export function paintCoreGui(canvas, cg, state) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = (canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr)));
  const h = (canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr)));
  const g = canvas.getContext("2d"); g.scale(dpr, dpr);
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  let y = 64; const x = 24;
  for (const l of coreGuiLines(cg, state)) {
    g.font = l.big ? "600 22px 'Builder Sans', system-ui, sans-serif" : l.head ? "600 15px 'Builder Sans', system-ui, sans-serif" : FONT;
    g.fillStyle = l.bad ? "#ff6b6b" : l.dim ? "#8d8f93" : "#f7f7f8";
    y += l.big ? 6 : l.head ? 10 : 0;
    g.fillText(l.t.slice(0, 140), x, y); y += l.big ? 28 : 20;
    if (y > h / dpr - 16) break;
  }
}
