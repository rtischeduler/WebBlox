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

## Launcher (`launcher.html`)
Runs the engine top-level (no proxy iframe). `src/launcher.mjs` isolates the page (same `ensureIsolation`), loads Singuloxy, then patches `fetch`, `XMLHttpRequest` and `WebSocket` so Roblox traffic goes through its libcurl/wisp, with your `.ROBLOSECURITY` added as a Cookie header. The wasm is unpacked in the browser from `engine/WebClient.wasm.gz.part*`; other engine files come from `engine/` or the CDN. Join/websocket traffic is logged (values redacted for join responses) so the protocol can be mapped. The game connection itself is WebTransport, which this logging does not see (see `docs/join-notes.md`). Test: `node --test test/netpatch.test.mjs`.

## Join launcher (`join.html`)
The engine-free path for the rewrite. It does not need cross-origin isolation, the wasm or any service worker, so it runs on any static host and in WebViews that cannot isolate.

`src/join/app.mjs` loads Singuloxy, gets a CSRF token, posts to `gamejoin.roblox.com` (`/v1/join-game`, or `/v1/join-game-instance` when you give a server id) and polls until the server is ready. It then:

- shows the join script with tickets and session data redacted, and pulls out the UDMUX endpoints and certificate hashes;
- looks the server up in the public server list and shows its players as avatars (the list only exposes anonymous player tokens, so names are not available yet), plus you from the join script;
- optionally opens the game WebTransport connection and records everything the server sends into a capture you can download.

Every request goes through the proxy except that one WebTransport connection: it is HTTP/3 over UDP, which a wisp proxy cannot carry, so it is off by default and goes straight from the browser to the game server. The cookie is only ever attached to requests for Roblox hosts.

Sign-in: if the page already has a `.ROBLOSECURITY` cookie that script can read (same origin as `join.html`, not `HttpOnly`), it is used automatically, re-read on every request, and the paste box is hidden. A URL-encoded value is decoded. Set `window.WEBBLOX_COOKIE_NAME` before the page script if your endpoint uses another cookie name. Without that cookie the page falls back to the paste box.

Open with `?placeId=123` and optionally `&jobId=...`. Modules: `gamejoin.mjs` (join, polling, join script parsing, redaction), `requester.mjs` (proxy fetch with cookie and CSRF handling), `servers.mjs` (server list and avatars), `players.mjs` (player list by source, with a slot for replicated players), `transport.mjs` (WebTransport wrapper that records traffic), `proxy.mjs` (Singuloxy loading).
Test: `node --test test/gamejoin.test.mjs test/servers.test.mjs test/players.test.mjs test/requester.test.mjs test/transport.test.mjs`.

## In-game screen (inside `join.html`)
Pressing Join opens a full-screen game layer over the launcher: the real Roblox loading screen, then an in-game interface over a black canvas.

- **Loading screen.** The markup and CSS are copied from `play.roblox.com/games/start` (`Client/files/play.roblox.com/`), with asset URLs made absolute (fonts and icons load from play.roblox.com; the cancel button has an inline fallback). `src/join/loading.mjs` is a port of the engine's own `LoadingScreen` class from `engine/WasmPlayer.js`: same requests (`economy` asset details for title, creator and verified badge, `apis` place-to-universe, `thumbnails` icon 256x256 and background 768x432 with the 250/500/1000/2000 ms Pending retries), same status priorities, same error panel titles (`Join Error`, `Teleport Failed`, `Error`) and `(Error Code: n)` line, same 600 ms exit fade. Requests go through the proxy; images are fetched through it too. The cancel button appears after 5 s, as in the original. Leave on the error panel returns to the launcher instead of closing the tab.
- **HUD.** HTML/CSS recreation (the engine's CoreGui is Lua drawn into its canvas, not markup): top bar, chat window with Roblox-style name colours, player list, Esc menu (Players / Settings / Help, Resume, Leave with confirmation). Keys: `Esc` menu, `/` chat, `Tab` player list. The canvas stays black until a renderer exists; chat stays disabled until the replication stream is decoded (`docs/join-notes.md`).
- Leave closes the game transport the way the engine does (`Transport.leave()`).

Modules: `loading.mjs`, `hud.mjs`, `session.mjs`, `chat.mjs`. Tests: `node --test test/loading.test.mjs test/hud.test.mjs test/session.test.mjs`.
