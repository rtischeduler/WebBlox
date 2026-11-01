# WebBlox

A small Roblox web client: `index.html` loads [Singuloxy](https://github.com/lotsacookie/Singuloxy) (from jsdelivr),
picks a wisp server (list from `lotsacookie/kstuff` via jsdelivr + backups), pulls
`https://play.roblox.com/games/start?placeId=10879318443` and swaps it in as the whole page. Navigation (e.g. the Roblox login) is proxied the same way.

`index.html` is self-contained so it can be fetched and embedded: it asks the GitHub API for the latest commit sha of this repo, Singuloxy and kstuff, then loads everything from jsdelivr pinned to that sha (falling back to `@main` and mirrors). Nothing else needs to be hosted next to it.

Open with `?placeId=123` to load a different game (default `10879318443`), or use a full start URL: `/#https://www.roblox.com/login`.

Hooks (`src/hooks.mjs`, also on `window.webblox`): `injectCss`, `injectJs`, `injectHead`, `onHtml(fn)`, `onNavigate(fn)`.
Test: `npm test`.

## Cross-origin isolation (required for the game)
The Roblox client needs `crossOriginIsolated`. `src/isolation.mjs` (loaded fresh by `main.mjs`, so a stale or pasted `index.html` still gets it) works through these cases in order:

1. Already isolated (host sends `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy`): starts straight away.
2. Loaded in a same-origin `srcdoc` frame (e.g. kstuff): installs `coi-sw.js` on the host page's origin, reloads the host once with `?wbcoi=1` (isolated only for that load), and the frame inherits the isolation. Needs `host/coi-sw.js` copied to the root of the host site. If that file is missing it falls back to 3.
3. Loaded as inline HTML / `srcdoc` / `data:` / `file:` (no real origin), or inside a frame (e.g. a game site's iframe): navigates the whole WebView to `https://rtischeduler.github.io/WebBlox/`. Set `window.WEBBLOX_HOST = "https://your.host/"` before the page script to use another host.
4. Real https origin, top-level: registers `coi-sw.js` (picks `credentialless` or `require-corp` by browser support) and reloads up to 3 times.
5. Anything else: shows why it cannot run, with a tap-to-open link to the full page, instead of crashing. `?force=1` tries anyway.

For WebViews with no service worker support, serve the page from a host that sends the headers itself:
`worker/coi-proxy.js` (Cloudflare Worker in front of GitHub Pages, set `UPSTREAM` to change the source), `_headers` (Cloudflare Pages), `netlify.toml`, `vercel.json`.
Check `crossOriginIsolated` in the console. A WebView that does not implement isolation cannot run the game whatever the headers are.
