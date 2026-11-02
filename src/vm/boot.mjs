// Starts the Luau VM + Roblox runtime next to the loaded CoreGui patch. Dynamic import so a VM failure never breaks the join page.
export async function bootVM(coregui, { log = () => {}, patch = "InExperience", flags, canvas, player, maxWaitMs = 45000 } = {}) {
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
  // The real entry point: the patch's StarterScript starts UIBlox, TopBar, PlayerList, Chat, menus and every CoreScript
  // (through ScriptContext:AddCoreScriptLocal). It runs as a thread; failures are listed, not fatal.
  const started = {};
  try { const [st, msg] = runtime.tryRequire(tree.root + "/CoreScripts/StarterScript"); started.StarterScript = st === "err" ? String(msg).slice(0, 160) : st; }
  catch (e) { started.StarterScript = "error " + (e?.message || e); }
  log("[vm] StarterScript:", started.StarterScript);
  const painter = canvas ? gui.attachCanvasGui(canvas, runtime, { status: () => "CoreGui VM running — CoreScripts: " + runtime.coreStatus() + (runtime.errors(1) ? "\n" + runtime.errors(1).slice(0, 300) : "") }) : null;
  log("[vm] Luau + Roblox runtime ready in", Math.round(performance.now() - t0), "ms");
  // ready: resolves once something has actually been drawn, or after maxWaitMs so a broken CoreScript never traps the loading screen.
  const ready = new Promise((resolve) => {
    const t0 = performance.now();
    const tick = setInterval(() => {
      let n = 0; try { n = runtime.drawCount(); } catch {}
      const waited = performance.now() - t0;
      if (n > 0 || waited > maxWaitMs) { clearInterval(tick); log("[vm] CoreGui ready:", n > 0 ? n + " draw commands" : "gave up after " + Math.round(waited) + " ms; " + runtime.coreStatus()); resolve({ drawn: n > 0, status: runtime.coreStatus(), errors: runtime.errors(5) }); }
    }, 300);
  });
  return { vm, runtime, loader: runtime, painter, started, ready };
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
