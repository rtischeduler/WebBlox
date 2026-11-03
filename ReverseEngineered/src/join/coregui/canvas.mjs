// The game canvas belongs to the real CoreGui. Until a Luau VM runs it, the canvas stays black and shows
// only one dim status line (progress or failure) so a missing UI is explained, not faked.
export function coreGuiLines(cg, state = {}) {
  if (state.error) return [{ t: "CoreGui failed: " + state.error, bad: true }];
  if (!cg) return [{ t: state.progress || "Loading CoreGui…", dim: true }];
  const bad = Object.entries(cg.errors).map(([n, e]) => ({ t: `CoreGui ${n}: ${e}`, bad: true }));
  if (bad.length) return bad;
  const s = cg.summary().map((p) => p.asset).join(", ");
  return [{ t: `CoreGui loaded (${s}${cg.engine.latest ? "" : "; latest lookup failed, bundled snapshot"}) — waiting for a Luau VM to run it`, dim: true }];
}

export function paintCoreGui(canvas, cg, state) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = (canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr)));
  const h = (canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr)));
  const g = canvas.getContext("2d"); g.scale(dpr, dpr);
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  g.font = "13px 'Source Sans Pro', system-ui, sans-serif";
  let y = h / dpr - 16 - 18 * (coreGuiLines(cg, state).length - 1);
  for (const l of coreGuiLines(cg, state)) { g.fillStyle = l.bad ? "#ff6b6b" : "#6d6f73"; g.fillText(l.t.slice(0, 160), 16, y); y += 18; }
}
