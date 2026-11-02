// Reports every WebTransport the engine opens (url, cert-hash count, ready/closed outcome). The same logic is
// inlined in engine/stub.js so pthread workers, where the engine really connects, are covered too.
export function installWtTap(scope, emit) {
  const Native = scope.WebTransport;
  if (!Native || Native.__wbTap) return false;
  const Tap = function (url, options) {
    const t0 = Date.now();
    const u = String(url);
    emit({ ev: "new", url: u, hashes: (options?.serverCertificateHashes || []).length });
    const wt = new Native(url, options);
    wt.ready?.then(() => emit({ ev: "ready", url: u, ms: Date.now() - t0 }), (e) => emit({ ev: "ready-failed", url: u, ms: Date.now() - t0, error: String(e?.message || e) }));
    wt.closed?.then((i) => emit({ ev: "closed", url: u, ms: Date.now() - t0, code: i?.closeCode ?? null, reason: i?.reason ?? "" }), (e) => emit({ ev: "closed-error", url: u, ms: Date.now() - t0, error: String(e?.message || e) }));
    return wt;
  };
  Tap.prototype = Native.prototype;
  Tap.__wbTap = true;
  scope.WebTransport = Tap;
  return true;
}
