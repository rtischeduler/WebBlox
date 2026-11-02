// Starts the Luau VM + Roblox runtime next to the loaded CoreGui patch. Dynamic import so a VM failure never breaks the join page.
export async function bootVM(coregui, { log = () => {}, patch = "InExperience", flags } = {}) {
  const p = coregui?.patches?.[patch];
  if (!p) throw new Error(`no ${patch} patch loaded`);
  const [{ createVM }, { createRuntime }, { treeFromPatch }] = await Promise.all([import("./luau.mjs"), import("./runtime.mjs"), import("./require.mjs")]);
  const t0 = performance.now();
  const vm = await createVM({ locateFile: (f) => new URL("../../engine/luau/" + f, import.meta.url).href });
  const tree = treeFromPatch(p);
  const runtime = await createRuntime(vm, tree, { flags, log: (lv, m) => log(`[lua ${lv}]`, m) });
  runtime.mount();
  log("[vm] Luau + Roblox runtime ready in", Math.round(performance.now() - t0), "ms");
  return { vm, runtime, loader: runtime };
}
