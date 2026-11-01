import { mkdirSync, writeFileSync, readFileSync, createWriteStream, statSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { engineBaseForUpload, versionUrl } from "./loader-map.mjs";
import { readWasmInfo, formatWasmInfo, jsHints } from "./wasm-info.mjs";

const out = process.argv[2] || "engine";
const override = (process.argv[3] || "").trim();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const FILES = ["WebClient.js", "WasmPlayer.js", "WebFlags.json", "WebClient.metadata.json", "audio-processor-fast.js", "WebClient.wasm"];
const PART = 45 * 1024 * 1024;
const headers = { "User-Agent": UA, Accept: "*/*", Origin: "https://play.roblox.com", Referer: "https://play.roblox.com/" };

async function resolveBase() {
  if (override) return override.replace(/\/$/, "");
  const r = await fetch(versionUrl(), { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!r.ok) throw new Error("client-version HTTP " + r.status);
  const j = await r.json();
  if (!j.clientVersionUpload) throw new Error("no clientVersionUpload in " + JSON.stringify(j));
  console.log("version", j.version, j.clientVersionUpload);
  return engineBaseForUpload(j.clientVersionUpload);
}

async function download(url, file) {
  const r = await fetch(url, { headers, redirect: "follow" });
  console.log(r.status, url, r.headers.get("content-length") || "");
  if (!r.ok || !r.body) return null;
  await pipeline(Readable.fromWeb(r.body), createWriteStream(file));
  const buf = statSync(file).size;
  const hash = createHash("sha256");
  hash.update(readFileSync(file));
  return { size: buf, sha256: hash.digest("hex") };
}

mkdirSync(out, { recursive: true });
const base = await resolveBase();
writeFileSync(join(out, "engine-base.txt"), base + "\n");
const manifest = { base, files: {} };

for (const name of FILES) {
  const file = join(out, name);
  try {
    const res = await download(`${base}/${name}`, file);
    manifest.files[name] = res || { missing: true };
    if (!res) rmSync(file, { force: true });
  } catch (e) {
    console.log("failed", name, e.message || e);
    manifest.files[name] = { error: String(e.message || e) };
  }
}

const hints = [];
for (const name of ["WebClient.js", "WasmPlayer.js"]) {
  try { hints.push(...jsHints(readFileSync(join(out, name), "utf8"), name)); } catch {}
}
writeFileSync(join(out, "js-hints.txt"), hints.join("\n\n") + "\n");

try {
  const buf = readFileSync(join(out, "WebClient.wasm"));
  writeFileSync(join(out, "wasm-info.txt"), formatWasmInfo(readWasmInfo(buf), base));
  const all = readWasmInfo(buf);
  writeFileSync(join(out, "wasm-imports.txt"), all.imports.map((i) => `${i.kind}\t${i.module}.${i.name}`).join("\n") + "\n");
  writeFileSync(join(out, "wasm-exports.txt"), all.exports.map((e) => `${e.kind}\t${e.name}`).join("\n") + "\n");
} catch (e) {
  writeFileSync(join(out, "wasm-info.txt"), "wasm analysis failed: " + (e.message || e) + "\n");
}

try {
  execFileSync("gzip", ["-9", "-f", join(out, "WebClient.wasm")]);
  const gz = readFileSync(join(out, "WebClient.wasm.gz"));
  let n = 0;
  for (let off = 0; off < gz.length; off += PART) writeFileSync(join(out, `WebClient.wasm.gz.part${String(n++).padStart(3, "0")}`), gz.subarray(off, off + PART));
  rmSync(join(out, "WebClient.wasm.gz"), { force: true });
  manifest.wasmGzParts = n;
} catch (e) {
  console.log("wasm split failed", e.message || e);
}

writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(join(out, "README.md"), "Engine snapshot. Rebuild the wasm with: cat WebClient.wasm.gz.part* | gunzip > WebClient.wasm\n");
console.log(readdirSync(out).join("\n"));
