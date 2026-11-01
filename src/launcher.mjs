import { ensureIsolation, explainIsolation } from "./isolation.mjs";
import { pickWisp, provisionalWisp } from "./wisps.mjs";
import { isProxied, cookieHeader, engineName, hex, shape } from "./netpatch.mjs";

const $ = (id) => document.getElementById(id);
const say = (t) => { const s = $("wb-status"); if (s) s.textContent = t; };
const logEl = () => $("wb-log");
export const log = (...a) => {
  const el = logEl(); if (!el) return;
  el.textContent += a.map((x) => (typeof x === "string" ? x : x instanceof Error ? x.stack || x.message : JSON.stringify(x))).join(" ") + "\n";
  if (el.textContent.length > 80000) el.textContent = el.textContent.slice(-50000);
  el.scrollTop = el.scrollHeight;
};
for (const m of ["warn", "error"]) { const o = console[m]; console[m] = (...a) => { try { log("[" + m + "]", ...a); } catch {} o.apply(console, a); }; }
addEventListener("error", (e) => log("[error]", e.message, e.filename || "", e.lineno || ""));
addEventListener("unhandledrejection", (e) => log("[reject]", e.reason));

const DIST = "dist/sandstone.mjs";
const BASES = ["https://cdn.jsdelivr.net/gh/lotsacookie/Singuloxy@main/", "https://fastly.jsdelivr.net/gh/lotsacookie/Singuloxy@main/"];
async function loadSandstone(bases = BASES) {
  for (const b of bases) { try { return await import(b + DIST); } catch { log("[launcher] sandstone import failed", b); } }
  const code = await (await fetch("https://raw.githubusercontent.com/lotsacookie/Singuloxy/main/" + DIST)).text();
  return import(URL.createObjectURL(new Blob([code], { type: "text/javascript" })));
}

async function localWasm(nativeFetch) {
  const m = await (await nativeFetch("engine/manifest.json")).json();
  const n = m.wasmGzParts || 1, size = m.files["WebClient.wasm"].size;
  let i = 0, reader = null;
  const gz = new ReadableStream({
    async pull(c) {
      for (;;) {
        if (!reader) {
          if (i >= n) { c.close(); return; }
          const r = await nativeFetch("engine/WebClient.wasm.gz.part" + String(i++).padStart(3, "0"));
          if (!r.ok) throw new Error("wasm part HTTP " + r.status);
          reader = r.body.getReader();
        }
        const { done, value } = await reader.read();
        if (done) { reader = null; continue; }
        c.enqueue(value); return;
      }
    },
  });
  return new Response(gz.pipeThrough(new DecompressionStream("gzip")), { status: 200, headers: { "Content-Type": "application/wasm", "Content-Length": String(size) } });
}

function patchNetwork(libcurl, getCookie, getWisp, cdnBase) {
  const nativeFetch = window.fetch.bind(window);
  const engineBase = new URL("engine/", location.href).href;
  const LOCAL = new Set(["WasmPlayer.js", "WebClient.js", "stub.js", "WasmLoader.js", "WebClient.metadata.json", "audio-processor-fast.js", "engine-base.txt", "manifest.json"]);
  const viaProxy = async (url, init, req) => {
    const h = new Headers(init.headers || req?.headers || {});
    const ck = cookieHeader(getCookie());
    if (ck && !h.has("cookie")) h.set("cookie", ck);
    const headers = {}; h.forEach((v, k) => { headers[k] = v; });
    const method = init.method || req?.method || "GET";
    const r = await libcurl.fetch(url, { method, headers, redirect: init.redirect || "follow", body: init.body ?? undefined, signal: init.signal });
    log("[net]", method, url.slice(0, 110), r.status);
    if (/join-game|authentication-ticket/i.test(url)) { try { log("[join] shape", JSON.stringify(shape(await r.clone().json()))); } catch {} }
    return r;
  };
  window.fetch = async (input, init = {}) => {
    const req = typeof input === "object" && "url" in input ? input : null;
    let url = req ? req.url : new URL(String(input), location.href).href;
    const name = engineName(url, engineBase);
    if (name === "WebClient.wasm") return localWasm(nativeFetch);
    if (name !== null && !LOCAL.has(name)) url = cdnBase + name;
    else if (name !== null) return nativeFetch(input, init);
    if (!isProxied(url)) return nativeFetch(input, init);
    if (name !== null) { try { const r = await nativeFetch(url, { signal: init.signal }); if (r.ok) return r; } catch {} }
    return viaProxy(url, init, req);
  };
  const NativeWS = window.WebSocket;
  const WS = function (url, protocols) {
    const u = String(url);
    if (u.startsWith(getWisp() || "\0") || new URL(u, location.href).origin === location.origin) return new NativeWS(url, protocols);
    const ws = new libcurl.WebSocket(u, protocols);
    log("[ws] connect", u.slice(0, 110));
    let r = 0, s = 0;
    ws.addEventListener("open", () => log("[ws] open"));
    ws.addEventListener("close", (e) => log("[ws] close", e.code));
    ws.addEventListener("message", (e) => { if (r++ < 40) log("[ws] <-", typeof e.data === "string" ? "text " + e.data.slice(0, 100) : hex(e.data)); });
    const send = ws.send.bind(ws);
    ws.send = (d) => { if (s++ < 40) log("[ws] ->", typeof d === "string" ? "text " + d.slice(0, 100) : hex(d)); return send(d); };
    return ws;
  };
  Object.assign(WS, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 }); WS.prototype = NativeWS.prototype;
  window.WebSocket = WS;
  class FetchXHR {
    constructor() { this.readyState = 0; this.status = 0; this.statusText = ""; this.response = null; this.responseText = ""; this.responseType = ""; this.responseURL = ""; this.timeout = 0; this.withCredentials = false; this._h = {}; this._l = {}; this.upload = { addEventListener() {} }; }
    addEventListener(t, f) { (this._l[t] ||= []).push(f); }
    removeEventListener(t, f) { this._l[t] = (this._l[t] || []).filter((x) => x !== f); }
    _emit(t, extra = {}) { const e = { type: t, target: this, ...extra }; try { this["on" + t]?.(e); } catch (x) { console.error(x); } (this._l[t] || []).slice().forEach((f) => { try { f.call(this, e); } catch (x) { console.error(x); } }); }
    open(m, u) { this._m = m; this._u = new URL(u, location.href).href; this.readyState = 1; this._emit("readystatechange"); }
    setRequestHeader(k, v) { this._h[k] = v; }
    overrideMimeType() {}
    getAllResponseHeaders() { return this._rh || ""; }
    getResponseHeader(k) { return this._rhm ? this._rhm.get(k) : null; }
    abort() { this._ac?.abort(); this._emit("abort"); }
    async send(body) {
      this._ac = new AbortController();
      try {
        const r = await window.fetch(this._u, { method: this._m, headers: this._h, body: body ?? undefined, signal: this._ac.signal });
        this.status = r.status; this.statusText = r.statusText; this.responseURL = this._u; this._rhm = r.headers;
        this._rh = [...r.headers].map(([k, v]) => k + ": " + v).join("\r\n") + "\r\n";
        this.readyState = 2; this._emit("readystatechange");
        const buf = await r.arrayBuffer(); const txt = () => new TextDecoder().decode(buf);
        this.response = this.responseType === "arraybuffer" ? buf : this.responseType === "blob" ? new Blob([buf]) : this.responseType === "json" ? JSON.parse(txt()) : txt();
        if (!this.responseType || this.responseType === "text") this.responseText = this.response;
        this.readyState = 4; this._emit("readystatechange");
        this._emit("progress", { loaded: buf.byteLength, total: buf.byteLength, lengthComputable: true });
        this._emit("load"); this._emit("loadend");
      } catch (e) { this.readyState = 4; this._emit(e.name === "AbortError" ? "abort" : "error"); this._emit("loadend"); }
    }
  }
  window.XMLHttpRequest = FetchXHR;
}

async function probeSession(libcurl) {
  try {
    const r = await libcurl.fetch("https://users.roblox.com/v1/users/authenticated", { method: "GET", headers: {}, redirect: "follow" });
    if (!r.ok) return 0;
    const j = await r.json();
    return Number(j && j.id) || 0;
  } catch { return 0; }
}

async function start(opts = {}) {
  const cookie = $("wb-cookie").value.trim() || localStorage.getItem("wb.cookie") || "";
  const place = Number($("wb-place").value) || 0;
  if (!place) { say("Enter a place id."); return; }
  if (cookie) localStorage.setItem("wb.cookie", cookie);
  localStorage.setItem("wb.place", String(place));
  $("wb-form").hidden = true;
  say("Loading proxy…");
  const sandstone = await loadSandstone(opts.sandstoneBases || BASES);
  provisionalWisp(sandstone.network);
  for (let i = 0; i < 300 && !sandstone.libcurl.ready; i++) await new Promise((r) => setTimeout(r, 100));
  if (!sandstone.libcurl.ready) throw new Error("libcurl did not load");
  const wisp = await pickWisp(sandstone.network, say, { kstuffBases: opts.kstuffBases, storageBases: opts.storageBases });
  log("[launcher] wisp", wisp);
  if (!cookie) {
    say("Checking saved Roblox sign-in…");
    const uid = await probeSession(sandstone.libcurl);
    if (!uid) throw new Error("No saved Roblox sign-in found in the proxy. Sign in on roblox.com through it first, or paste a .ROBLOSECURITY cookie.");
    log("[launcher] using the proxy's saved Roblox session, user", uid);
  }
  const cdnBase = (await (await fetch("engine/engine-base.txt")).text()).trim().replace(/\/?$/, "/");
  patchNetwork(sandstone.libcurl, () => localStorage.getItem("wb.cookie") || cookie, () => wisp, cdnBase);
  window.robloxWasmHostConfig = { server: "prod", useCdnBinary: false };
  window.__wasmDevSettings = {
    authCookie: cookie, baseUrl: "www.roblox.com",
    apiProxy: { url: (u) => u, authHeaders: () => ({}) },
    isCookieFromPool: () => false, allocateCookieFromPool: async () => null,
    setAuthCookie(c) { this.authCookie = c; },
  };
  history.replaceState(null, "", "?placeId=" + place);
  $("wb-boot").hidden = true; $("game").hidden = false;
  const s = document.createElement("script");
  s.src = "engine/WasmLoader.js";
  document.body.appendChild(s);
}

export async function boot(opts = {}) {
  $("wb-place").value = new URLSearchParams(location.search).get("placeId") || localStorage.getItem("wb.place") || "";
  const iso = await ensureIsolation();
  if (!iso.ok && !new URLSearchParams(location.search).has("force")) { say(explainIsolation(iso.reason, navigator.userAgent) + " (?force=1 tries anyway)"); return; }
  say("Ready. crossOriginIsolated=" + self.crossOriginIsolated);
  $("wb-go").disabled = false;
  $("wb-go").onclick = () => start(opts).catch((e) => { say("Failed: " + (e.message || e)); log("[launcher]", e); $("wb-form").hidden = false; });
  $("wb-copy").onclick = () => navigator.clipboard?.writeText(logEl().textContent).catch(() => {});
}
