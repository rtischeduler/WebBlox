// Engine flag overrides. WasmPlayer.js merges window.__wasmDevSettings.getFlagOverrides() into the
// preloaded flags before handing them to the engine, so injecting this before the page scripts is enough.
// Values are strings exactly like the clientsettings JSON ("True"/"False"/"123").
export const DEFAULT_FLAG_OVERRIDES = {
  // Suspected cause of "Failed to open send channel Chat!": the base client gates startup on the send channel opening.
  FFlagBaseClientGateOnSendChannel: "False",
};

const NAME_RE = /^[A-Za-z0-9_]{1,120}$/;
const VALUE_RE = /^[A-Za-z0-9_.\-]{0,60}$/;

// ?flag=Name=Value (repeatable). An empty value removes a default override.
export function parseFlagParams(search = "", base = DEFAULT_FLAG_OVERRIDES) {
  const out = { ...base };
  for (const raw of new URLSearchParams(search).getAll("flag")) {
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
