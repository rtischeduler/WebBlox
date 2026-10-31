import * as hooks from "./hooks.mjs";
import { START_URL, runHtmlHooks, runNavHooks } from "./hooks.mjs";
import { pickWisp } from "./wisps.mjs";

// Singuloxy build: pinned jsdelivr bases from index.html first, raw.githubusercontent (text/plain, so via blob) last.
const DIST = "dist/sandstone.mjs";
const DEFAULT_BASES = ["https://cdn.jsdelivr.net/gh/lotsacookie/Singuloxy@main/"];
const RAW = "https://raw.githubusercontent.com/lotsacookie/Singuloxy/main/" + DIST;

async function loadSandstone(bases) {
  for (const b of bases) { try { return await import(b + DIST); } catch (e) { console.warn("[webblox] import failed", b); } }
  const code = await (await fetch(RAW)).text();
  return import(URL.createObjectURL(new Blob([code], { type: "text/javascript" })));
}

const startUrl = () => {
  const h = location.hash.slice(1);
  return /^https?:\/\//i.test(h) ? h : START_URL;
};

export async function boot(statusEl, opts = {}) {
  const say = (t) => { if (statusEl) statusEl.textContent = t; };
  say("Loading proxy…");
  const sandstone = await loadSandstone(opts.sandstoneBases || DEFAULT_BASES);
  const frame = new sandstone.controller.ProxyFrame();
  Object.assign(frame.iframe.style, { position: "fixed", inset: "0", width: "100%", height: "100%", border: "0", background: "#fff" });
  await frame.wait_for_libcurl();
  console.log("[webblox] wisp:", await pickWisp(sandstone.network, say, { kstuffBases: opts.kstuffBases, storageBases: opts.storageBases }));

  // Interception 1: every navigation (including in-page links and the Roblox login redirect) goes through here.
  const navigate = frame.navigate_to.bind(frame);
  frame.navigate_to = (target, ...rest) => {
    const next = runNavHooks(target);
    return next === false ? Promise.resolve() : navigate(next, ...rest);
  };
  // Interception 2: the fetched HTML passes through here right before it replaces the frame's document.
  const send = frame.send_page;
  frame.send_page = (page) => send({ ...page, html: runHtmlHooks(page.html, page.url) });

  frame.on_info = ({ title }) => { if (title) document.title = title; };
  frame.on_progress = (_, text) => say(text || "Loading…");

  // Replace our whole DOM with the proxied page's frame.
  document.body.replaceChildren(frame.iframe);
  Object.assign(globalThis, { sandstone, webblox: { frame, ...hooks } });
  await frame.navigate_to(startUrl());
}
