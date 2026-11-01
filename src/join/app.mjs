import { createProxy } from "./proxy.mjs";
import { joinGame, describeJoin, redact } from "./gamejoin.mjs";
import { findServer, loadAvatars } from "./servers.mjs";
import { PlayerList } from "./players.mjs";
import { Transport, Capture } from "./transport.mjs";
import { downloadText } from "../download.mjs";
import { readHostCookie } from "./cookie.mjs";

const $ = (id) => document.getElementById(id);

const store = {
  get(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

const players = new PlayerList();
const blobUrls = [];
let proxy = null;
let capture = new Capture();
let lastJoin = null;
let controller = null;

const say = (text) => {
  $("wb-status").textContent = text;
};

const log = (...args) => {
  const el = $("wb-log");
  el.textContent +=
    args.map((x) => (typeof x === "string" ? x : x instanceof Error ? x.stack || x.message : JSON.stringify(x))).join(" ") + "\n";
  if (el.textContent.length > 80000) el.textContent = el.textContent.slice(-50000);
  el.scrollTop = el.scrollHeight;
};

addEventListener("error", (e) => log("[error]", e.message));
addEventListener("unhandledrejection", (e) => log("[reject]", e.reason));

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of children) node.append(child);
  return node;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const hostForUrl = (host) => (host.includes(":") ? `[${host}]` : host);

const setStep = (name, state, note = "") => {
  const li = document.querySelector(`[data-step="${name}"]`);
  li.dataset.state = state;
  li.querySelector(".note").textContent = note;
};

const resetSteps = () => {
  for (const li of document.querySelectorAll("[data-step]")) {
    li.dataset.state = "idle";
    li.querySelector(".note").textContent = "";
  }
};

const setBusy = (busy) => {
  $("wb-go").disabled = busy;
  $("wb-cancel").hidden = !busy;
};

const renderInfo = (info, script) => {
  const root = $("info");
  root.replaceChildren();
  if (!info) {
    root.append(el("p", { className: "dim", textContent: "Nothing yet." }));
    return;
  }
  const who = [info.user.displayName, info.user.name && `@${info.user.name}`, info.user.id && `(${info.user.id})`]
    .filter(Boolean)
    .join(" ");
  const rows = [
    ["User", who || "—"],
    ["Place", String(info.placeId ?? "—")],
    ["Server (job id)", info.jobId || "—"],
    ["Game server", info.machine ? info.machine.host + (info.machine.port ? ":" + info.machine.port : "") : "—"],
    ["UDMUX endpoints", info.udmux.length ? info.udmux.map((e) => `${e.host}:${e.port}`).join(", ") : "—"],
    ["Certificate hashes", String(info.certHashes.length)],
    ["Transport config keys", info.configKeys.length ? info.configKeys.join(", ") : "—"],
  ];
  const list = el("dl", { className: "kv" });
  for (const [key, value] of rows) list.append(el("dt", { textContent: key }), el("dd", { textContent: value }));
  const details = el(
    "details",
    {},
    el("summary", { textContent: "Join script (secrets redacted)" }),
    el("pre", { textContent: JSON.stringify(redact(script), null, 2) }),
  );
  root.append(list, details);
};

const renderPlayers = (sections) => {
  const root = $("players");
  root.replaceChildren();
  if (!sections.length) {
    root.append(el("p", { className: "dim", textContent: "Join a server to see its players." }));
    return;
  }
  for (const section of sections) {
    root.append(el("h3", { textContent: `${section.label} · ${section.players.length}` }));
    if (section.meta.note) root.append(el("p", { className: "dim", textContent: section.meta.note }));
    const grid = el("div", { className: "plist" });
    section.players.forEach((p, i) => {
      const label = p.displayName || p.name || `Player ${i + 1}`;
      const sub = p.name && p.displayName && p.name !== p.displayName ? "@" + p.name : p.id ? String(p.id) : "";
      const avatar = p.avatarUrl ? el("img", { src: p.avatarUrl, alt: "", width: 48, height: 48 }) : el("span", { className: "ph" });
      grid.append(
        el(
          "div",
          { className: "prow" },
          avatar,
          el(
            "div",
            {},
            el("div", { className: "pname", textContent: label + (p.you ? " (you)" : "") }),
            el("div", { className: "dim", textContent: sub }),
          ),
        ),
      );
    });
    root.append(grid);
  }
};

players.onChange(renderPlayers);

async function fetchBlobUrl(url) {
  try {
    const res = await proxy.request(url, { method: "GET", signal: controller?.signal });
    if (!res.ok) return "";
    const objectUrl = URL.createObjectURL(await res.blob());
    blobUrls.push(objectUrl);
    return objectUrl;
  } catch {
    return "";
  }
}

async function lookupPlayers(jobId, placeId) {
  setStep("server", "run");
  const found = await findServer({
    request: proxy.request,
    placeId,
    jobId,
    signal: controller.signal,
    onPage: (p) => setStep("server", "run", `scanned ${p.scanned}`),
  });
  if (!found.server) {
    const why = found.rateLimited ? "rate limited" : found.error || `not in the first ${found.scanned} public servers`;
    setStep("server", "warn", why);
    setStep("players", "warn", "no server list entry");
    return;
  }
  const server = found.server;
  setStep("server", "ok", `${server.playing}/${server.maxPlayers} players`);
  setStep("players", "run");
  const avatars = await loadAvatars({ request: proxy.request, tokens: server.playerTokens, signal: controller.signal });
  const list = await Promise.all(
    avatars.map(async (a) => ({ token: a.token, avatarUrl: a.imageUrl ? await fetchBlobUrl(a.imageUrl) : "" })),
  );
  players.update("web", list, {
    note: `The server list exposes ${server.playerTokens.length} of ${server.playing} players as anonymous avatars. Names arrive over the replication stream, which is not decoded yet.`,
  });
  setStep("players", list.length ? "ok" : "warn", `${list.length} avatars`);
}

async function probeTransport(info) {
  setStep("transport", "run");
  const endpoint = info.udmux[0];
  const url = $("wb-wt-url").value.trim() || (endpoint ? `https://${hostForUrl(endpoint.host)}:${endpoint.port}/` : "");
  if (!url) {
    setStep("transport", "warn", "no endpoint in join script");
    return;
  }
  const transport = new Transport({ capture, log });
  let frames = 0;
  transport.onData(() => {
    frames++;
  });
  try {
    const result = await transport.connect(url, info.certHashes);
    setStep("transport", "ok", `connected, max datagram ${result.maxDatagramSize}`);
    await sleep(4000);
    setStep("transport", frames ? "ok" : "warn", `${frames} frames received in 4s`);
  } catch (e) {
    setStep("transport", "fail", e.message || String(e));
    log("[transport]", url, e.message || String(e));
  } finally {
    transport.close();
  }
}

async function run() {
  const hostCookie = readHostCookie();
  const cookie = hostCookie || $("wb-cookie").value.trim() || store.get("wb.cookie");
  const placeId = Number($("wb-place").value);
  const jobId = $("wb-job").value.trim();
  if (!cookie) {
    say("Paste your .ROBLOSECURITY cookie first.");
    return;
  }
  if (!Number.isInteger(placeId) || placeId <= 0) {
    say("Enter a numeric place id.");
    return;
  }
  if (!hostCookie) store.set("wb.cookie", cookie);
  store.set("wb.place", String(placeId));
  store.set("wb.job", jobId);
  controller = new AbortController();
  for (const url of blobUrls.splice(0)) URL.revokeObjectURL(url);
  capture = new Capture();
  lastJoin = null;
  players.clear();
  renderInfo(null);
  resetSteps();
  setBusy(true);
  try {
    setStep("proxy", "run");
    proxy ||= await createProxy({ getCookie: () => readHostCookie() || store.get("wb.cookie"), log, say });
    setStep("proxy", "ok", proxy.wisp.replace(/^wss:\/\//, "").replace(/\/$/, ""));
    setStep("join", "run");
    say("Requesting a server…");
    const result = await joinGame({
      request: proxy.request,
      placeId,
      jobId,
      signal: controller.signal,
      onStatus: (s) => {
        say(`Waiting for a server (status ${s.status}${s.message ? ": " + s.message : ""})`);
        log("[join] status", s.status, s.message || "", s.queuePosition ?? "");
      },
    });
    const info = describeJoin(result.script);
    lastJoin = redact(result.script);
    renderInfo(info, result.script);
    players.update("joinscript", [
      { id: info.user.id, name: info.user.name, displayName: info.user.displayName, you: true },
    ]);
    setStep("join", "ok", `status ${result.status}`);
    await lookupPlayers(result.jobId || info.jobId, placeId);
    if ($("wb-direct").checked) await probeTransport(info);
    say("Done.");
  } catch (e) {
    const cancelled = controller.signal.aborted;
    say(cancelled ? "Cancelled." : "Failed: " + (e.message || e));
    if (!cancelled) log("[join]", e);
    for (const li of document.querySelectorAll('[data-step][data-state="run"]')) {
      li.dataset.state = cancelled ? "warn" : "fail";
      li.querySelector(".note").textContent = cancelled ? "cancelled" : e.message || "error";
    }
  } finally {
    setBusy(false);
    controller = null;
  }
}

export function boot() {
  const params = new URLSearchParams(location.search);
  $("wb-place").value = params.get("placeId") || store.get("wb.place");
  $("wb-job").value = params.get("jobId") || store.get("wb.job");
  if (readHostCookie()) {
    $("wb-cookie-field").hidden = true;
    $("wb-cookie-note").hidden = false;
  } else if (store.get("wb.cookie")) {
    $("wb-cookie").placeholder = "Saved on this device — paste to replace";
  }
  const supported = Transport.supported();
  $("wb-wt-support").textContent = supported ? "WebTransport is available in this browser." : "WebTransport is not available in this browser.";
  $("wb-direct").disabled = !supported;
  renderPlayers([]);
  renderInfo(null);
  $("wb-go").onclick = () => run();
  $("wb-cancel").onclick = () => controller?.abort();
  $("wb-copy").onclick = () => navigator.clipboard?.writeText($("wb-log").textContent).catch(() => {});
  $("wb-export").onclick = () =>
    downloadText("webblox-capture.json", JSON.stringify({ version: 1, join: lastJoin, capture: capture.toJSON() }, null, 1));
  say("Ready.");
}
