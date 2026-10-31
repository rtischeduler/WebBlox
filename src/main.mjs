import * as hooks from "./hooks.mjs";
import { START_URL, runHtmlHooks, runNavHooks } from "./hooks.mjs";
import { pickWisp } from "./wisps.mjs";

// Singuloxy build, jsdelivr first. raw.githubusercontent serves text/plain, so it is imported via a blob.
const SRC = "lotsacookie/Singuloxy";
const DIST = "dist/sandstone.mjs";
const CDNS = [
  `https://cdn.jsdelivr.net/gh/${SRC}@main/${DIST}`,
  `https://fastly.jsdelivr.net/gh/${SRC}@main/${DIST}`,
  `https://cdn.statically.io/gh/${SRC}/main/${DIST}`,
];
const RAW = `https://raw.githubusercontent.com/${SRC}/main/${DIST}`;

async function loadSandstone() {
  for (const u of CDNS) { try { return await import(u); } catch (e) { console.warn("[webblox] import failed", u); } }
  const code = await (await fetch(RAW)).text();
  return import(URL.createObjectURL(new Blob([code], { type: "text/javascript" })));
}

const startUrl = () => {
  const h = location.hash.slice(1);
  return /^https?:\/\//i.test(h) ? h : START_URL;
};

export async function boot(statusEl) {
  const say = (t) => { if (statusEl) statusEl.textContent = t; };
  say("Loading proxy…");
  const sandstone = await loadSandstone();
  const frame = new sandstone.controller.ProxyFrame();
  frame.iframe.className = "wb-frame";
  await frame.wait_for_libcurl();
  console.log("[webblox] wisp:", await pickWisp(sandstone.network, say));

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
