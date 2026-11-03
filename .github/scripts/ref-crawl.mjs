import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

const start = process.argv[2] || "https://play.roblox.com/games/start";
const out_dir = process.argv[3] || "Ref";
const MAX_FETCHES = 2500;
const MAX_DEPTH = 6;
const MAX_TEXT = 8 * 1024 * 1024;
const PART_SIZE = 40 * 1024 * 1024;
const WORKERS = 8;
const HOSTS = /(^|\.)(roblox\.com|rbxcdn\.com)$/i;
const DENY = /^(devforum|devforum-uploads|create|help|en\.help|corp|blog|about|prod\.docsiteassets|assets\.create)(\.|-)|docsiteassets|devforum/i;
const TEXTUAL = /(javascript|json|html|css|xml|text\/)/i;
const BINARY_EXT = /\.(wasm|data|bin|png|jpe?g|gif|webp|svg|woff2?|ttf|ico|mp3|ogg|zip|br|gz)(\?|#|$)/i;
const FULL_EXT = /\.(wasm|data|bin)(\?|#|$)/i;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const ENGINE = /https:\/\/setup\.rbxcdn\.com\/webclient\/version-[A-Za-z0-9]+-RobloxWebClient/;
const ENGINE_FILES = ["WasmPlayer.js", "WebClient.js", "WebClient.wasm", "WebFlags.json", "WebClient.metadata.json"];
const WEBCLIENT_FILES = ["WasmLoader.js", "stub.js"];
const BINARY_TYPE = "WebClientApp";
const versionUrl = `https://clientsettings.roblox.com/v2/client-version/${BINARY_TYPE}`;
const channelUrl = `https://clientsettings.roblox.com/v2/user-channel?binaryType=${BINARY_TYPE}`;
const flagsUrl = `https://clientsettingscdn.roblox.com/v2/settings/application/${BINARY_TYPE}`;
const engineBaseFor = (upload) => `https://setup.rbxcdn.com/webclient/${upload}-RobloxWebClient`;

const seen = new Set();
const discovered = new Map();
const rows = [];
const binaries = [];
const savedText = [];
const savedWasm = [];
const queue = [{ url: start, depth: 0, from: "" }];
const asset_bases = new Set();
let fetched = 0;
let active = 0;
let engine_base = null;

const note = (url, from) => { if (!discovered.has(url)) discovered.set(url, from); };

function extract(text, base) {
  const found = new Set();
  for (const match of text.matchAll(/https?:\/\/[A-Za-z0-9.\-]+(?::\d+)?(?:\/[^\s"'`<>\\)(]*)?/g)) found.add(match[0].replace(/[,;.]+$/, ""));
  for (const match of text.matchAll(/\/[0-9a-f]{40}\/assets/g)) {
    try { asset_bases.add(new URL(base).origin + match[0]); } catch {}
  }
  for (const root of asset_bases) for (const name of WEBCLIENT_FILES) found.add(`${root}/webclient/${name}`);
  const versions = text.match(/version-[a-f0-9]{16}/g);
  if (versions && !engine_base) engine_base = `https://setup.rbxcdn.com/webclient/${versions[0]}-RobloxWebClient`;
  if (engine_base) for (const name of ENGINE_FILES) found.add(`${engine_base}/${name}`);
  const relative = /["'`]((?:\.{0,2}\/)?[A-Za-z0-9_\-.\/@%+]+\.(?:js|mjs|json|wasm|css|data|html|txt|map|bin|br))(?:\?[^"'`]*)?["'`]/g;
  for (const match of text.matchAll(relative)) {
    if (match[1].startsWith("/")) for (const root of asset_bases) found.add(root + match[1]);
    const candidates = [base];
    if (engine_base) candidates.push(engine_base + "/");
    for (const root of candidates) {
      try { found.add(new URL(match[1], root).href); } catch {}
    }
  }
  for (const match of text.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    try { found.add(new URL(match[1], base).href); } catch {}
  }
  return [...found];
}

function save_path(url) {
  const parsed = new URL(url);
  let path = parsed.pathname.endsWith("/") ? parsed.pathname + "index" : parsed.pathname;
  path = path.replace(/[^A-Za-z0-9._\-\/]/g, "_").slice(-160);
  if (parsed.search) path += "__" + createHash("sha1").update(parsed.search).digest("hex").slice(0, 8);
  return join(out_dir, "files", parsed.hostname, path);
}

function saveBinary(url, buffer) {
  const file = save_path(url) + ".gz";
  mkdirSync(dirname(file), { recursive: true });
  const gz = gzipSync(buffer, { level: 9 });
  const parts = Math.max(1, Math.ceil(gz.length / PART_SIZE));
  for (let i = 0; i < parts; i++) writeFileSync(`${file}.part${String(i).padStart(3, "0")}`, gz.subarray(i * PART_SIZE, (i + 1) * PART_SIZE));
  binaries.push([url, buffer.length, createHash("sha256").update(buffer).digest("hex"), gz.length, parts, file.slice(out_dir.length + 1)].join("\t"));
  if (/\.wasm(\?|#|$)/i.test(url)) savedWasm.push({ url, buffer });
}

async function visit(item) {
  const { url, depth, from } = item;
  if (seen.has(url)) return;
  seen.add(url);
  let parsed;
  try { parsed = new URL(url); } catch { return; }
  if (!HOSTS.test(parsed.hostname) || DENY.test(parsed.hostname) || !/^https?:$/.test(parsed.protocol)) {
    rows.push([depth, "skipped", "", "", url, from]);
    return;
  }
  if (fetched >= MAX_FETCHES) {
    rows.push([depth, "limit", "", "", url, from]);
    return;
  }
  fetched++;

  const binary = BINARY_EXT.test(url);
  const full = FULL_EXT.test(url) && /rbxcdn\.com$/i.test(parsed.hostname);
  const headers = { "User-Agent": UA, "Accept": "*/*", "Accept-Language": "en-US,en;q=0.9" };
  if (/rbxcdn\.com$/i.test(parsed.hostname)) {
    headers["Origin"] = "https://play.roblox.com";
    headers["Referer"] = "https://play.roblox.com/";
  }
  if (binary && !full) headers["Range"] = "bytes=0-1023";

  let response;
  try {
    response = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(full ? 600000 : 60000) });
  } catch (error) {
    rows.push([depth, "error", "", String(error?.cause?.code || error?.message || error), url, from]);
    return;
  }

  const type = (response.headers.get("content-type") || "").split(";")[0].trim();
  const range = response.headers.get("content-range") || response.headers.get("content-length") || "";
  const server = response.headers.get("server") || "";
  rows.push([depth, response.status, type, `${range} ${server}`.trim(), url, from]);

  if (full) {
    if (response.status >= 200 && response.status < 300) {
      try { saveBinary(url, Buffer.from(await response.arrayBuffer())); }
      catch (error) { rows.push([depth, "save-error", "", String(error?.message || error), url, from]); }
    } else {
      try { await response.body?.cancel(); } catch {}
    }
    return;
  }

  if (binary || !TEXTUAL.test(type)) {
    try { await response.body?.cancel(); } catch {}
    return;
  }

  let text = "";
  try { text = await response.text(); } catch { return; }
  if (!(response.status >= 200 && response.status < 300)) return;

  try {
    const file = save_path(url);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) : text);
    savedText.push({ url, file });
    if (depth === 0) writeFileSync(join(out_dir, "page.html"), text);
  } catch {}

  if (!engine_base) {
    const match = ENGINE.exec(text) || ENGINE.exec(url);
    if (match) engine_base = match[0];
  }

  if (depth >= MAX_DEPTH) return;
  for (const found of extract(text, response.url || url)) {
    note(found, url);
    if (!seen.has(found)) queue.push({ url: found, depth: depth + 1, from: url });
  }
}

async function worker() {
  while (true) {
    const item = queue.shift();
    if (!item) {
      if (active === 0) return;
      await new Promise((resolve) => setTimeout(resolve, 200));
      continue;
    }
    active++;
    try { await visit(item); } finally { active--; }
  }
}

async function resolve_loader() {
  let upload = null;
  try {
    const response = await fetch(versionUrl, { headers: { "User-Agent": UA, "Accept": "application/json" } });
    if (response.ok) upload = (await response.json()).clientVersionUpload || null;
    console.log(`client-version ${response.status} upload=${upload}`);
  } catch (error) {
    console.log(`client-version failed: ${error?.message || error}`);
  }
  if (upload) engine_base = engineBaseFor(upload);
  const seeds = [versionUrl, channelUrl, flagsUrl];
  if (upload) seeds.push(...ENGINE_FILES.map((name) => `${engine_base}/${name}`));
  for (const url of seeds) {
    note(url, "loader");
    queue.push({ url, depth: 1, from: "loader" });
  }
}

function leb(buf, pos) {
  let result = 0, shift = 0, byte;
  do {
    byte = buf[pos.i++];
    result += (byte & 0x7f) * 2 ** shift;
    shift += 7;
  } while (byte & 0x80);
  return result;
}

function wasmMemories(buf) {
  const out = [];
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x0061736d) return out;
  const pos = { i: 8 };
  const name = () => {
    const n = leb(buf, pos);
    const s = buf.toString("utf8", pos.i, pos.i + n);
    pos.i += n;
    return s;
  };
  const limits = () => {
    const flags = leb(buf, pos);
    const min = leb(buf, pos);
    const max = flags & 1 ? leb(buf, pos) : null;
    return { flags, min, max, shared: !!(flags & 2), memory64: !!(flags & 4) };
  };
  while (pos.i < buf.length) {
    const id = buf[pos.i++];
    const size = leb(buf, pos);
    const end = pos.i + size;
    if (id === 2) {
      const count = leb(buf, pos);
      for (let k = 0; k < count; k++) {
        const module = name();
        const field = name();
        const kind = buf[pos.i++];
        if (kind === 0) leb(buf, pos);
        else if (kind === 1) { pos.i++; limits(); }
        else if (kind === 2) out.push({ where: "import", module, field, ...limits() });
        else if (kind === 3) pos.i += 2;
        else if (kind === 4) { pos.i++; leb(buf, pos); }
      }
    } else if (id === 5) {
      const count = leb(buf, pos);
      for (let k = 0; k < count; k++) out.push({ where: "defined", module: "", field: "", ...limits() });
    }
    pos.i = end;
  }
  return out;
}

const JS_PATTERN = /SharedArrayBuffer|Atomics\.|crossOriginIsolated|new\s+WebAssembly\.Memory|shared\s*:\s*(?:true|!0|1)|pthread|PThread|allocateUnusedWorker|buffer\.slice|HEAP8\.buffer|\.buffer\b.*(?:Worker|postMessage)/;

function sabReport() {
  const lines = [];
  lines.push("== wasm memories ==");
  if (!savedWasm.length) lines.push("no wasm downloaded");
  for (const { url, buffer } of savedWasm) {
    lines.push(url + " (" + buffer.length + " bytes)");
    try {
      for (const m of wasmMemories(buffer)) lines.push(`  ${m.where} ${m.module}.${m.field} min=${m.min} max=${m.max} shared=${m.shared} memory64=${m.memory64} flags=${m.flags}`);
    } catch (error) { lines.push("  parse failed: " + (error?.message || error)); }
  }
  lines.push("", "== javascript hits ==");
  let total = 0;
  for (const { url, file } of savedText) {
    if (!/\.m?js(\?|#|$)|\.html?(\?|#|$)|\/start/i.test(url) && !/\.m?js$/.test(file)) continue;
    let text;
    try { text = readFileSync(file, "utf8"); } catch { continue; }
    const hits = [];
    const split = text.split("\n");
    for (let n = 0; n < split.length; n++) {
      const line = split[n];
      if (line.length > 20000) {
        for (const m of line.matchAll(new RegExp(JS_PATTERN.source, "g"))) {
          hits.push(`  ${n + 1}:${m.index}  ${line.slice(Math.max(0, m.index - 80), m.index + 140).replace(/\s+/g, " ")}`);
          if (hits.length >= 200) break;
        }
      } else if (JS_PATTERN.test(line)) {
        hits.push(`  ${n + 1}  ${line.trim().slice(0, 220)}`);
      }
      if (hits.length >= 200) break;
    }
    if (hits.length) {
      total += hits.length;
      lines.push(url, ...hits);
    }
  }
  lines.push("", `total js hits: ${total}`);
  writeFileSync(join(out_dir, "sab-report.txt"), lines.join("\n") + "\n");
}

mkdirSync(out_dir, { recursive: true });
note(start, "");
await resolve_loader();
await Promise.all(Array.from({ length: WORKERS }, () => worker()));

rows.sort((a, b) => String(a[4]).localeCompare(String(b[4])));
const header = ["depth", "status", "content_type", "size_or_server", "url", "found_in"].join("\t");
writeFileSync(join(out_dir, "index.tsv"), [header, ...rows.map((row) => row.join("\t"))].join("\n") + "\n");
writeFileSync(join(out_dir, "urls.txt"), [...discovered.keys()].sort().join("\n") + "\n");
writeFileSync(join(out_dir, "engine-base.txt"), (engine_base || "not found") + "\n");
writeFileSync(join(out_dir, "binaries.tsv"), ["url\tbytes\tsha256\tgz_bytes\tparts\tpath", ...binaries].join("\n") + "\n");
sabReport();
console.log(`fetched ${fetched}, discovered ${discovered.size}, binaries ${binaries.length}, engine base ${engine_base || "not found"}`);
