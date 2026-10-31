// Endpoint map taken from WasmLoader.js (server-endpoints.ts / engine-version-resolution.ts)
export const BINARY_TYPE = "WebClientApp";
export const SERVERS = {
  prod: { clientSettingsHost: "clientsettings.roblox.com", settingsFlagsHost: "clientsettingscdn.roblox.com", setupCdnBase: "https://setup.rbxcdn.com", websiteHost: "www.roblox.com" },
};
export const ENGINE_FILES = ["WasmPlayer.js", "WebClient.js", "WebClient.wasm", "WebFlags.json", "WebClient.metadata.json"];

export const engineBaseForUpload = (upload, server = "prod") => `${SERVERS[server].setupCdnBase}/webclient/${upload}-RobloxWebClient`;
export const versionUrl = (server = "prod") => `https://${SERVERS[server].clientSettingsHost}/v2/client-version/${BINARY_TYPE}`;
export const channelUrl = (server = "prod") => `https://${SERVERS[server].clientSettingsHost}/v2/user-channel?binaryType=${BINARY_TYPE}`;

export const flagsUrl = (server = "prod") => `https://${SERVERS[server].settingsFlagsHost}/v2/settings/application/${BINARY_TYPE}`;

export function loaderSeeds(upload, server = "prod") {
  const seeds = [versionUrl(server), channelUrl(server), flagsUrl(server)];
  if (upload) seeds.push(...ENGINE_FILES.map((f) => `${engineBaseForUpload(upload, server)}/${f}`));
  return seeds;
}
