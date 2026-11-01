import { createProxy } from "../join/proxy.mjs";
import { joinGame, describeJoin, randomTrackerId } from "../join/gamejoin.mjs";
import { findServer, loadAvatars } from "../join/servers.mjs";
import { PlayerList } from "../join/players.mjs";
import { Capture } from "../join/transport.mjs";
import { ChatClient, ChatLog } from "../join/chat.mjs";
import { Session } from "../join/session.mjs";
import { readHostCookie, readBrowserTrackerId } from "../join/cookie.mjs";
import { nameColor, flattenPlayers, MENU_TABS } from "./ui.mjs";

const $ = (id) => document.getElementById(id);
const store = {
  get: (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
const el = (tag, props = {}, ...kids) => {
  const { dataset, ...rest } = props;
  const n = Object.assign(document.createElement(tag), rest);
  if (dataset) Object.assign(n.dataset, dataset);
  n.append(...kids);
  return n;
};
const hostForUrl = (h) => (h.includes(":") ? `[${h}]` : h);

const players = new PlayerList();
const chatLog = new ChatLog();
const chat = new ChatClient({ log: chatLog });
const capture = new Capture();
const state = { proxy: null, session: null, controller: null, info: null, tab: "Players", blobUrls: [] };
const debug = [];
const log = (...a) => { debug.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ")); if (debug.length > 400) debug.shift(); };

/* ---------- chat ---------- */
const renderChat = (lines) => {
  const root = $("chat-log");
  const stick = root.scrollTop + root.clientHeight >= root.scrollHeight - 20;
  root.replaceChildren(...lines.map((l) => {
    if (l.kind === "system") return el("div", { className: "cl system", textContent: l.text });
    return el("div", { className: "cl" }, el("span", { className: "who", textContent: `[${l.speaker}]: `, style: `color:${nameColor(l.speaker)}` }), l.text);
  }));
  if (stick) root.scrollTop = root.scrollHeight;
};
chatLog.onChange((_, lines) => renderChat(lines));

const syncChatInput = () => {
  const can = chat.canSend && state.session?.state === "connected";
  const input = $("chat-input");
  input.disabled = !can;
  input.placeholder = can ? "To chat click here or press / key" : "Chat isn't connected yet";
};

$("chat-form").onsubmit = async (ev) => {
  ev.preventDefault();
  try {
    await chat.send($("chat-input").value, { self: store.get("wb.me") || "You" });
    $("chat-input").value = "";
  } catch (e) {
    chatLog.system(e.message || String(e));
  }
};
$("chat-input").onfocus = () => $("chat").classList.add("focus");
$("chat-input").onblur = () => $("chat").classList.remove("focus");

/* ---------- player list ---------- */
players.onChange((sections) => {
  const list = flattenPlayers(sections);
  $("pcount").textContent = list.length || "";
  $("prows").replaceChildren(...list.map((p) => el("div", { className: "pr" + (p.you ? " you" : "") },
    p.avatarUrl ? el("img", { src: p.avatarUrl, alt: "", width: 28, height: 28 }) : el("span", { className: "ph" }),
    el("span", { className: "n", textContent: p.label }))));
  if (state.tab === "Players" && !$("esc").hidden) renderTab();
});

/* ---------- top bar toggles ---------- */
const toggle = (btn, target) => {
  const on = btn.getAttribute("aria-pressed") !== "true";
  btn.setAttribute("aria-pressed", String(on));
  target.hidden = !on;
};
$("b-chat").onclick = () => toggle($("b-chat"), $("chat"));
$("b-plist").onclick = () => toggle($("b-plist"), $("plist"));

/* ---------- escape menu ---------- */
const renderTab = () => {
  for (const b of $("tabs").children) b.setAttribute("aria-selected", String(b.dataset.tab === state.tab));
  const body = $("tabbody");
  body.replaceChildren();
  if (state.tab === "Players") {
    const list = flattenPlayers(players.sections());
    body.append(...(list.length ? list.map((p) => el("div", { className: "pr" + (p.you ? " you" : "") }, p.avatarUrl ? el("img", { src: p.avatarUrl, alt: "" }) : el("span", { className: "ph" }), el("span", { className: "n", textContent: p.label }))) : [el("p", { textContent: "No players yet." })]));
  } else if (state.tab === "Settings") {
    const s = state.session;
    const rows = [
      ["Connection", s ? s.state : "not connected"],
      ["Server (job id)", state.info?.jobId || "—"],
      ["Game server", state.info?.machine ? state.info.machine.host : "—"],
      ["Chat", chat.status],
    ];
    const dl = el("dl", { className: "kv" });
    for (const [k, v] of rows) dl.append(el("dt", { textContent: k }), el("dd", { textContent: v }));
    body.append(dl, el("button", { className: "btn", style: "margin-top:14px;flex:none", textContent: "Download capture", onclick: downloadCapture }));
  } else {
    body.append(el("p", { textContent: "Esc: menu  ·  /: chat  ·  Tab: player list. The 3D view is not rendered yet; this screen is the interface only." }));
  }
};
$("tabs").replaceChildren(...MENU_TABS.map((t) => el("button", { role: "tab", dataset: { tab: t }, textContent: t, onclick: () => { state.tab = t; renderTab(); } })));

const openMenu = (open) => {
  $("esc").hidden = !open;
  if (open) renderTab();
};
$("b-menu").onclick = () => openMenu($("esc").hidden);
$("m-resume").onclick = () => openMenu(false);
$("m-leave").onclick = () => ($("confirm").hidden = false);
$("c-cancel").onclick = () => ($("confirm").hidden = true);
$("c-leave").onclick = async () => {
  $("confirm").hidden = true;
  openMenu(false);
  await leave();
};

addEventListener("keydown", (e) => {
  const typing = e.target instanceof HTMLInputElement;
  if (e.key === "Escape") {
    if (!$("confirm").hidden) $("confirm").hidden = true;
    else if (!$("loading").hidden) return;
    else openMenu($("esc").hidden);
  } else if (e.key === "/" && !typing && !$("topbar").hidden) {
    if (!$("chat-input").disabled) { e.preventDefault(); $("chat").hidden = false; $("chat-input").focus(); }
  } else if (e.key === "Tab" && !typing && !$("topbar").hidden) {
    e.preventDefault();
    toggle($("b-plist"), $("plist"));
  }
});
addEventListener("pagehide", () => { if (state.session?.live) state.session.transport?.close(); });

function downloadCapture() {
  const blob = new Blob([JSON.stringify({ version: 1, capture: capture.toJSON(), log: debug }, null, 1)], { type: "application/json" });
  const a = el("a", { href: URL.createObjectURL(blob), download: "webblox-capture.json" });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- join / leave ---------- */
const showLoading = (busy, text = "") => {
  $("l-form").hidden = busy;
  $("l-busy").hidden = !busy;
  $("l-status").textContent = text;
};
const say = (t) => ($("l-status").textContent = t);

const enterGame = () => {
  $("loading").hidden = true;
  $("topbar").hidden = false;
  $("chat").hidden = $("b-chat").getAttribute("aria-pressed") !== "true";
  $("plist").hidden = $("b-plist").getAttribute("aria-pressed") !== "true";
};

const exitToLoading = (note) => {
  $("topbar").hidden = true;
  $("chat").hidden = true;
  $("plist").hidden = true;
  openMenu(false);
  $("loading").hidden = false;
  $("l-note").textContent = note;
  showLoading(false);
};

async function fetchBlobUrl(url) {
  try {
    const res = await state.proxy.request(url, { method: "GET", signal: state.controller?.signal });
    if (!res.ok) return "";
    const u = URL.createObjectURL(await res.blob());
    state.blobUrls.push(u);
    return u;
  } catch { return ""; }
}

async function lookupPlayers(jobId, placeId) {
  say("Finding players…");
  const found = await findServer({ request: state.proxy.request, placeId, jobId, signal: state.controller.signal });
  if (!found.server) return;
  const avatars = await loadAvatars({ request: state.proxy.request, tokens: found.server.playerTokens, signal: state.controller.signal });
  const list = await Promise.all(avatars.map(async (a) => ({ token: a.token, avatarUrl: a.imageUrl ? await fetchBlobUrl(a.imageUrl) : "" })));
  players.update("web", list);
}

async function play(ev) {
  ev?.preventDefault();
  const hostCookie = readHostCookie();
  const cookie = hostCookie || $("l-cookie").value.trim() || store.get("wb.cookie");
  const placeId = Number($("l-place").value);
  const jobId = $("l-job").value.trim();
  if (!cookie) return void ($("l-note").textContent = "Paste your .ROBLOSECURITY cookie first.");
  if (!Number.isInteger(placeId) || placeId <= 0) return void ($("l-note").textContent = "Enter a numeric place id.");
  if (!hostCookie) store.set("wb.cookie", cookie);
  store.set("wb.place", String(placeId));
  store.set("wb.job", jobId);
  state.controller = new AbortController();
  chatLog.clear();
  players.clear();
  showLoading(true, "Starting…");
  try {
    state.proxy ||= await createProxy({ getCookie: () => readHostCookie() || store.get("wb.cookie"), log, say });
    say("Joining…");
    let tracker = readBrowserTrackerId() || Number(store.get("wb.tracker")) || 0;
    if (!tracker) { tracker = randomTrackerId(); store.set("wb.tracker", String(tracker)); }
    const result = await joinGame({
      request: state.proxy.request, placeId, jobId, browserTrackerId: tracker, signal: state.controller.signal,
      onStatus: (s) => say(`Waiting for a server (status ${s.status})`),
    });
    const info = describeJoin(result.script);
    state.info = info;
    store.set("wb.me", info.user.displayName || info.user.name || "");
    players.update("joinscript", [{ id: info.user.id, name: info.user.name, displayName: info.user.displayName, you: true }]);
    enterGame();
    chatLog.system(`Joined ${info.user.displayName || info.user.name || "as guest"}.`);
    lookupPlayers(result.jobId || info.jobId, placeId).catch((e) => log("[players]", e.message));
    await startSession(info);
  } catch (e) {
    const cancelled = state.controller?.signal.aborted;
    exitToLoading(cancelled ? "Cancelled." : "Could not join: " + (e.message || e));
  } finally {
    state.controller = null;
  }
}

async function startSession(info) {
  const endpoint = info.udmux[0];
  const url = endpoint ? `https://${hostForUrl(endpoint.host)}:${endpoint.port}/` : "";
  if (!url) return void chatLog.system("The join script has no game server endpoint.");
  const session = new Session({ chat, capture, log });
  state.session = session;
  session.onState((s) => { syncChatInput(); if (s === "left") exitToLoading("You left the game."); });
  syncChatInput();
  try { await session.join(url, info.certHashes); } catch (e) { log("[transport]", e.message); }
}

async function leave() {
  if (state.session?.live) await state.session.leave();
  else exitToLoading("You left the game.");
  state.session = null;
  players.clear();
  for (const u of state.blobUrls.splice(0)) URL.revokeObjectURL(u);
}

export function boot() {
  const params = new URLSearchParams(location.search);
  $("l-place").value = params.get("placeId") || store.get("wb.place");
  $("l-job").value = params.get("jobId") || store.get("wb.job");
  if (readHostCookie()) $("l-cookie-field").hidden = true;
  $("l-form").onsubmit = play;
  $("l-cancel").onclick = () => state.controller?.abort();
  const canvas = $("game"), fit = () => { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; };
  fit(); addEventListener("resize", fit);
  renderChat([]);
}
