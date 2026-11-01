export const DEFAULT_FLAG_OVERRIDES = {
  FFlagBaseClientGateOnSendChannel: "False",
  FLogGameJoinUtil: "7",
};

export const DEBUG_NET_FLAGS = {
  DFLogRbxTransportRnaExpConnection: "7",
  DFLogRbxTransportRtcIo: "7",
  FLogNetwork: "7",
  DFLogHttpTraceLight: "7",
  DFLogNetworkAudit: "7",
};

const NAME_RE = /^[A-Za-z0-9_]{1,120}$/;
const VALUE_RE = /^[A-Za-z0-9_.\-]{0,60}$/;

export function parseFlagParams(search = "", base = DEFAULT_FLAG_OVERRIDES) {
  const out = { ...base };
  const params = new URLSearchParams(search);
  if (params.has("debugnet")) Object.assign(out, DEBUG_NET_FLAGS);
  for (const raw of params.getAll("flag")) {
    const i = raw.indexOf("=");
    if (i < 1) continue;
    const name = raw.slice(0, i), value = raw.slice(i + 1);
    if (!NAME_RE.test(name) || !VALUE_RE.test(value)) continue;
    if (value === "") delete out[name]; else out[name] = value;
  }
  return out;
}

export function flagOverrideScript(overrides) {
  const json = JSON.stringify(overrides || {}).replace(/</g, "\\u003c");
  return `(function(){var o=${json};var d=window.__wasmDevSettings=window.__wasmDevSettings||{};var prev=d.getFlagOverrides;d.getFlagOverrides=function(){var p={};try{if(prev)p=prev()||{};}catch(e){}return Object.assign({},p,o);};console.warn("[webblox] flag overrides:",Object.keys(o).join(", ")||"none");})()`;
}
