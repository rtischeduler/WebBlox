import * as hooks from "./hooks.mjs";
import { startUrlFor, runHtmlHooks, runNavHooks } from "./hooks.mjs";
import { pickWisp, provisionalWisp, markWispBad } from "./wisps.mjs";
import { createWatchdog } from "./health.mjs";
import { parseFlagParams, flagOverrideScript } from "./flags.mjs";
import { explainIsolation, ensureIsolation } from "./isolation.mjs";

const DIST = "dist/sandstone.mjs";
const DEFAULT_BASES = ["https://cdn.jsdelivr.net/gh/lotsacookie/Singuloxy@main/"];
const RAW = "https://raw.githubusercontent.com/lotsacookie/Singuloxy/main/" + DIST;

async function loadSandstone(bases) {
  for (const b of bases) { try { return await import(b + DIST); } catch (e) { console.warn("[webblox] import failed", b); } }
  const code = await (await fetch(RAW)).text();
  return import(URL.createObjectURL(new Blob([code], { type: "text/javascript" })));
}

const pageLocation = () => {
  if (location.search || location.hash) return location;
  try { void window.top.location.href; return window.top.location; } catch { return location; }
};

const startUrl = () => {
  const loc = pageLocation();
  const h = loc.hash.slice(1);
  return /^https?:\/\//i.test(h) ? h : startUrlFor(new URLSearchParams(loc.search).get("placeId"));
};

export async function boot(statusEl, opts = {}) {
  const say = (t) => { if (statusEl) statusEl.textContent = t; };
  const iso = await ensureIsolation();
  if (!iso.ok && !new URLSearchParams(pageLocation().search).has("force")) {
    const msg = explainIsolation(iso.reason, navigator.userAgent);
    console.error("[webblox] " + msg + " (add ?force=1 to try anyway)");
    if (statusEl && iso.url) {
      statusEl.textContent = msg + " ";
      const a = document.createElement("a");
      a.href = iso.url;
      a.target = "_top";
      a.textContent = "Tap to open the full page";
      a.style.cssText = "color:#7cc7ff;display:block;margin-top:12px;font-size:16px";
      statusEl.appendChild(a);
    } else say(msg);
    return;
  }
  say("Loading proxy…");
  const sandstone = await loadSandstone(opts.sandstoneBases || DEFAULT_BASES);
  provisionalWisp(sandstone.network);
  const frame = new sandstone.controller.ProxyFrame();
  Object.assign(frame.iframe.style, { position: "fixed", inset: "0", width: "100%", height: "100%", border: "0", background: "#fff" });
  await frame.wait_for_libcurl();
  const wispOpts = { kstuffBases: opts.kstuffBases, storageBases: opts.storageBases };
  let activeWisp = await pickWisp(sandstone.network, say, wispOpts);
  console.log("[webblox] wisp:", activeWisp);
  const watchdog = createWatchdog({
    current: () => activeWisp,
    markBad: markWispBad,
    switchWisp: async (exclude) => {
      activeWisp = await pickWisp(sandstone.network, say, { ...wispOpts, exclude });
      console.log("[webblox] wisp:", activeWisp);
      return activeWisp;
    },
    relaunch: () => frame.navigate_to(startUrl()),
    log: (m) => console.warn("[webblox] " + m),
  });

  hooks.injectJs(flagOverrideScript(opts.flagOverrides || parseFlagParams(pageLocation().search)));

  const navigate = frame.navigate_to.bind(frame);
  frame.navigate_to = (target, ...rest) => {
    const next = runNavHooks(target);
    return next === false ? Promise.resolve() : navigate(next, ...rest);
  };
  const send = frame.send_page;
  frame.send_page = (page) => send({ ...page, html: runHtmlHooks(page.html, page.url) });

  frame.on_console = (batch) => {
    try { globalThis.__wbConsole && globalThis.__wbConsole.frame(batch); } catch {}
    try { for (const item of batch || []) watchdog.feed(item && item[1]); } catch {}
  };
  frame.on_info = ({ title }) => { if (title) document.title = title; };
  frame.on_progress = (_, text) => say(text || "Loading…");

  document.body.replaceChildren(frame.iframe);
  Object.assign(globalThis, { sandstone, webblox: { frame, ...hooks } });
  await frame.navigate_to(startUrl());
}
