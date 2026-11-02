// Starts the Luau VM + Roblox runtime next to the loaded CoreGui patch. Dynamic import so a VM failure never breaks the join page.
export async function bootVM(coregui, { log = () => {}, patch = "InExperience", flags, canvas, player } = {}) {
  const p = coregui?.patches?.[patch];
  if (!p) throw new Error(`no ${patch} patch loaded`);
  const [{ createVM }, { createRuntime }, { treeFromPatch }, gui] = await Promise.all([import("./luau.mjs"), import("./runtime.mjs"), import("./require.mjs"), import("./canvasgui.mjs")]);
  const t0 = performance.now();
  const vm = await createVM({ locateFile: (f) => new URL("../../engine/luau/" + f, import.meta.url).href });
  const tree = treeFromPatch(p);
  const ctx = canvas?.getContext?.("2d");
  const runtime = await createRuntime(vm, tree, { flags, log: (lv, m) => log(`[lua ${lv}]`, m), measure: ctx ? gui.makeMeasure(ctx) : undefined });
  runtime.mount();
  const me = player || {}; runtime.addPlayer(me.id ?? 1, me.name ?? "Player", me.displayName ?? me.name ?? "Player", true);
  // Real CoreGui entry points, best effort: require what the patch ships for the in-game UI and report what happened.
  const started = {};
  for (const want of ["TopBarApp", "PlayerList", "PlayerListMaster", "Chat", "InGameMenu", "TopBar"]) {
    const path = findModule(tree, tree.root, want, 5);
    if (!path) continue;
    try { const [ok, msg] = runtime.tryRequire(path); started[want] = ok ? "ok" : String(msg).slice(0, 120); } catch (e) { started[want] = "error " + (e?.message || e); }
  }
  log("[vm] CoreGui entry modules:", JSON.stringify(started));
  const painter = canvas ? gui.attachCanvasGui(canvas, runtime) : null;
  log("[vm] Luau + Roblox runtime ready in", Math.round(performance.now() - t0), "ms");
  return { vm, runtime, loader: runtime, painter, started };
}

// bounded breadth-first search for a module by name in the patch tree
function findModule(tree, root, name, depth) {
  let level = [root];
  for (let d = 0; d < depth && level.length; d++) {
    const next = [];
    for (const p of level) for (const k of tree.children(p) || []) {
      const child = p + "/" + k.name;
      if (k.name === name && k.class === "ModuleScript") return child;
      next.push(child);
    }
    level = next;
  }
  return null;
}
