// Injection / interception layer. Pure functions so they are easy to test.
export const DEFAULT_PLACE_ID = "187909";
export const START_BASE = "https://play.roblox.com/games/start";
// Digits only, so a stray query param can't change the target URL.
export const startUrlFor = (placeId) => `${START_BASE}?placeId=${/^\d{1,20}$/.test(placeId || "") ? placeId : DEFAULT_PLACE_ID}`;

const htmlHooks = [];
const navHooks = [];
const injections = { head: [], css: [], js: [] };

// fn(html, url) -> html (may return the same string)
export const onHtml = (fn) => htmlHooks.push(fn);
// fn(url) -> string (rewrite) | false (cancel) | undefined (leave)
export const onNavigate = (fn) => navHooks.push(fn);
export const injectCss = (css) => injections.css.push(css);
export const injectJs = (js) => injections.js.push(js);
export const injectHead = (html) => injections.head.push(html);

export function buildInjection() {
  let out = injections.head.join("");
  if (injections.css.length) out += `<style data-webblox>${injections.css.join("\n")}</style>`;
  if (injections.js.length) {
    // keep a stray </script> in injected code from closing the tag early
    out += `<script data-webblox>${injections.js.join(";\n").replace(/<\/script/gi, "<\\/script")}</script>`;
  }
  return out;
}

// Put injected markup right after <head>, falling back to the top of the document.
export function injectIntoHtml(html, extra = buildInjection()) {
  if (!extra) return html;
  const m = /<head[^>]*>/i.exec(html);
  if (m) return html.slice(0, m.index + m[0].length) + extra + html.slice(m.index + m[0].length);
  return extra + html;
}

export function runHtmlHooks(html, url) {
  let out = injectIntoHtml(html);
  for (const fn of htmlHooks) {
    try { const r = fn(out, url); if (typeof r === "string") out = r; } catch (e) { console.warn("[webblox] html hook", e); }
  }
  return out;
}

export function runNavHooks(url) {
  let cur = url;
  for (const fn of navHooks) {
    try {
      const r = fn(cur);
      if (r === false) return false;
      if (typeof r === "string") cur = r;
    } catch (e) { console.warn("[webblox] nav hook", e); }
  }
  return cur;
}

export function resetHooks() {
  htmlHooks.length = navHooks.length = 0;
  injections.head.length = injections.css.length = injections.js.length = 0;
}
