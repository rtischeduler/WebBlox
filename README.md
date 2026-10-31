# WebBlox

A small Roblox web client: `index.html` loads [Singuloxy](https://github.com/lotsacookie/Singuloxy) (from jsdelivr),
picks a wisp server (list from `lotsacookie/kstuff` via jsdelivr + backups), pulls
`https://play.roblox.com/games/start?placeId=187909` and swaps it in as the whole page. Navigation (e.g. the Roblox login) is proxied the same way.

`index.html` is self-contained so it can be fetched and embedded: it asks the GitHub API for the latest commit sha of this repo, Singuloxy and kstuff, then loads everything from jsdelivr pinned to that sha (falling back to `@main` and mirrors). Nothing else needs to be hosted next to it.

Open with `?placeId=123` to load a different game (default `187909`), or use a full start URL: `/#https://www.roblox.com/login`.

Hooks (`src/hooks.mjs`, also on `window.webblox`): `injectCss`, `injectJs`, `injectHead`, `onHtml(fn)`, `onNavigate(fn)`.
Test: `npm test`.
