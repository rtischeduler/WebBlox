// Starts the Luau VM next to the loaded CoreGui patch. Dynamic import so a VM failure never breaks the join page.
export async function bootVM(coregui, { log = () => {}, patch = "InExperience" } = {}) {
  const p = coregui?.patches?.[patch];
  if (!p) throw new Error(`no ${patch} patch loaded`);
  const [{ createVM }, { createLoader, treeFromPatch }] = await Promise.all([import("./luau.mjs"), import("./require.mjs")]);
  const t0 = performance.now();
  const vm = await createVM({ locateFile: (f) => new URL("../../engine/luau/" + f, import.meta.url).href });
  const loader = createLoader(vm, treeFromPatch(p));
  log("[vm] Luau ready in", Math.round(performance.now() - t0), "ms");
  return { vm, loader };
}
