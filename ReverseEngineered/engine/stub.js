/* eslint-disable */
"use strict";
(() => {
  // server-endpoints.ts
  var apiBaseUrls = {
    prod: {
      clientSettingsHost: "clientsettings.roblox.com",
      settingsFlagsHost: "clientsettingscdn.roblox.com",
      setupCdnBase: "https://setup.rbxcdn.com",
      websiteHost: "www.roblox.com"
    },
    st1: {
      clientSettingsHost: "clientsettings.sitetest1.robloxlabs.com",
      settingsFlagsHost: "clientsettingscdn.sitetest1.robloxlabs.com",
      setupCdnBase: "https://s3.amazonaws.com/setup.sitetest1.robloxlabs.com",
      websiteHost: "www.sitetest1.robloxlabs.com"
    },
    st2: {
      clientSettingsHost: "clientsettings.sitetest2.robloxlabs.com",
      settingsFlagsHost: "clientsettingscdn.sitetest2.robloxlabs.com",
      setupCdnBase: "https://s3.amazonaws.com/setup.sitetest2.robloxlabs.com",
      websiteHost: "www.sitetest2.robloxlabs.com"
    },
    st3: {
      clientSettingsHost: "clientsettings.sitetest3.robloxlabs.com",
      settingsFlagsHost: "clientsettingscdn.sitetest3.robloxlabs.com",
      setupCdnBase: "https://s3.amazonaws.com/setup.sitetest3.robloxlabs.com",
      websiteHost: "www.sitetest3.robloxlabs.com"
    }
  };

  // stub.ts
  var ALLOWED_ENGINE_PREFIXES = Object.values(apiBaseUrls).map((endpoint) => `${endpoint.setupCdnBase}/webclient/`);
  var src = new URLSearchParams(self.location.search).get("src");
  if (!src)
    throw new Error("[stub] missing src parameter");
  var engineScriptUrl = new URL(src).href;
  if (!ALLOWED_ENGINE_PREFIXES.some((prefix) => engineScriptUrl.startsWith(prefix)))
    throw new Error(`[stub] refusing to load engine script from ${engineScriptUrl}`);
  // WebBlox: report WebTransport use (see src/wt-tap.mjs) over a BroadcastChannel the launcher listens to.
  try {
    const Native = self.WebTransport;
    if (Native && !Native.__wbTap) {
      const bc = new BroadcastChannel("webblox-wt");
      const emit = (e) => { try { bc.postMessage({ ...e, worker: self.name || "worker" }); } catch (_) {} };
      const Tap = function (url, options) {
        const t0 = Date.now(), u = String(url);
        emit({ ev: "new", url: u, hashes: ((options && options.serverCertificateHashes) || []).length });
        const wt = new Native(url, options);
        wt.ready.then(() => emit({ ev: "ready", url: u, ms: Date.now() - t0 }), (e) => emit({ ev: "ready-failed", url: u, ms: Date.now() - t0, error: String((e && e.message) || e) }));
        wt.closed.then((i) => emit({ ev: "closed", url: u, ms: Date.now() - t0, code: i && i.closeCode, reason: (i && i.reason) || "" }), (e) => emit({ ev: "closed-error", url: u, ms: Date.now() - t0, error: String((e && e.message) || e) }));
        return wt;
      };
      Tap.prototype = Native.prototype; Tap.__wbTap = true;
      self.WebTransport = Tap;
    }
  } catch (_) {}
  importScripts(engineScriptUrl);
})();
