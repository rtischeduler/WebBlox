# WebBlox

A small Roblox web client: `index.html` loads [Singuloxy](https://github.com/lotsacookie/Singuloxy) (from jsdelivr),
picks a wisp server (list from `lotsacookie/kstuff` via jsdelivr + backups), pulls
`https://play.roblox.com/games/start` and swaps it in as the whole page. Navigation (e.g. the Roblox login) is proxied the same way.

Serve over HTTP(S) (modules don't load from `file://`): `npx serve .`  Optional start URL: `/#https://www.roblox.com/login`.

Hooks (`src/hooks.mjs`, also on `window.webblox`): `injectCss`, `injectJs`, `injectHead`, `onHtml(fn)`, `onNavigate(fn)`.
Test: `npm test`.
