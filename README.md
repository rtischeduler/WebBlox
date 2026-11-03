# WebBlox

`index.html` loads [Singuloxy](https://github.com/lotsacookie/Singuloxy) (from jsdelivr), picks a wisp server (list from `lotsacookie/kstuff` via jsdelivr plus backups), pulls `https://play.roblox.com/games/start?placeId=10879318443` and swaps it in as the whole page. Roblox serves its own WebAssembly client on that page, and everything it requests, including navigation such as the login, goes through the proxy.

`index.html` is self-contained so it can be fetched and embedded: it asks the GitHub API for the latest commit sha of this repo, Singuloxy, kstuff and TongSherbet/storage, then loads everything from jsdelivr pinned to that sha (falling back to `@main` and mirrors).

Open with `?placeId=123` to load a different game (default `10879318443`), or use a full start URL: `/#https://www.roblox.com/login`. Add `?force=1` to start even when cross-origin isolation is missing.

Hooks (`src/hooks.mjs`, also on `window.webblox`): `injectCss`, `injectJs`, `injectHead`, `onHtml(fn)`, `onNavigate(fn)`.

Test: `npm test`.

## Files
- `index.html`: the only page. Contains the on-screen console and the loader.
- `src/main.mjs`: boots isolation, Singuloxy, the wisp and the proxied page.
- `src/wisps.mjs`: wisp discovery and validation.
- `src/health.mjs`: watches the engine log and switches wisp or relaunches when the connection fails.
- `src/flags.mjs`: engine flag overrides for the wasm build (`?flag=Name=value` params, `?debugnet`).
- `src/hooks.mjs`: injection and navigation hooks.
- `src/isolation.mjs`, `coi-sw.js`, `host/coi-sw.js`: cross-origin isolation.
- `_headers`, `netlify.toml`, `vercel.json`, `worker/coi-proxy.js`: header-sending hosts.

## Cross-origin isolation (required for the game)
The Roblox wasm client needs `crossOriginIsolated`. `src/isolation.mjs` (loaded fresh by `main.mjs`, so a stale or pasted `index.html` still gets it) works through these cases in order:

1. Already isolated (host sends `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy`): starts straight away.
2. Loaded in a same-origin `srcdoc` frame (e.g. kstuff): installs `coi-sw.js` on the host page's origin, reloads the host once with `?wbcoi=1` (isolated only for that load), and the frame inherits the isolation. Needs `host/coi-sw.js` copied to the root of the host site. If that file is missing it falls back to 3.
3. Loaded as inline HTML / `srcdoc` / `data:` / `file:` (no real origin), or inside a frame (e.g. a game site's iframe): navigates the whole WebView to `https://rtischeduler.github.io/WebBlox/`. Set `window.WEBBLOX_HOST = "https://your.host/"` before the page script to use another host.
4. Real https origin, top-level: registers `coi-sw.js` (picks `credentialless` or `require-corp` by browser support) and reloads up to 3 times.
5. Anything else: shows why it cannot run, with a tap-to-open link to the full page, instead of crashing.

For WebViews with no service worker support, serve the page from a host that sends the headers itself: `worker/coi-proxy.js` (Cloudflare Worker in front of GitHub Pages, set `UPSTREAM` to change the source), `_headers` (Cloudflare Pages), `netlify.toml`, `vercel.json`. Check `crossOriginIsolated` in the console. A WebView that does not implement isolation cannot run the game whatever the headers are.
