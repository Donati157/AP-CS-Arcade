# Adding your game to the AP CS Arcade

The public arcade at https://ap-cs-arcade.vercel.app is a static website. It does not look at
GitHub while it runs. Instead, every time `main` changes, Vercel runs one build script:

```
node scripts/build-web-games.mjs
```

That script reads a small **manifest file** (`game.json`) from every game folder, checks it,
copies each playable game's browser files into `web/games/<id>/`, and writes `web/games.json`,
which the home page uses to draw its four cards. So publishing your game means:
**commit your browser files + a correct `game.json`, and it appears on the arcade.**

## 1. Your directory

Each game lives in its own folder inside `games/`:

```
games/
  betlife/        slot 1
  Flappy Bruh/    slot 2
  <your game>/    slot 3 or 4
```

Only touch your own folder. The folder name can be anything readable; the URL comes from the
manifest `id`, not from the folder name.

## 2. The manifest: `games/<your game>/game.json`

```json
{
  "id": "poly-kart",
  "name": "Poly Kart",
  "slot": 3,
  "developer": "Your name",
  "status": "development",
  "description": "One sentence shown on the arcade card.",
  "web": {
    "enabled": true,
    "dir": "web",
    "entry": "index.html",
    "embed": true
  }
}
```

| Field         | Meaning                                                                                       |
|---------------|-----------------------------------------------------------------------------------------------|
| `id`          | Lowercase slug (`a-z`, `0-9`, dashes). Becomes the URL `/games/<id>/`. Must be unique.        |
| `name`        | Title shown on the card. Required.                                                            |
| `slot`        | Card position 1 to 4. Each slot belongs to one game.                                          |
| `developer`   | Who made it (shown in docs, not on the card).                                                 |
| `status`      | `planning`, `development` or `playable`. Only `playable` publishes the game.                  |
| `description` | Short text on the card when the game is playable.                                             |
| `web.enabled` | `true` when the game runs in a browser. Java-only games keep `false` and status `development`.|
| `web.dir`     | Folder inside your game folder that holds the browser files (`"."` = the game folder itself). |
| `web.entry`   | The HTML file that starts the game, relative to `web.dir`. Usually `index.html`.              |
| `web.embed`   | `true`: the arcade wraps your page in a top bar with "← Back to Arcade" (recommended). `false`: your page already has the arcade bar (BetLife does this). |

## 3. Where the browser files go

Put everything the browser needs (HTML, CSS, JS, images, sounds) inside `web.dir`. Use relative
paths only (`./img/bird.png`, not `/img/bird.png`), because the game is served from
`/games/<id>/game/` in production. `game.json` and `README.md` are not copied.

A single self-contained `index.html` is perfectly fine; that is what Flappy Bruh does.

## 4. Marking your game playable

Change `"status": "playable"` when your game can be played start to finish in a browser.
The build refuses to publish if the entry file is missing, so `status` and files must agree.

## 5. Test locally before you push

```
node scripts/build-web-games.mjs --check     # validates every game.json, writes nothing
node scripts/build-web-games.mjs             # builds web/games/ and web/games.json
cd web && python3 -m http.server 8080        # then open http://localhost:8080
```

Check: your card shows on the home page, PLAY opens `/games/<id>/`, the game works with mouse,
touch and keyboard, "← Back to Arcade" returns home, and the browser console has no errors.
Also shrink the window to phone width to make sure nothing overflows sideways.

The validator explains problems in plain language, for example:

```
✖ 1 problem(s) found in game manifests:
  - games/Poly Kart/game.json: duplicate slot 2 (also used by games/Flappy Bruh/game.json). Each game needs its own slot.
```

## 6. What happens after merge

1. You push (or your pull request is merged) to `main`.
2. Vercel builds the site with `node scripts/build-web-games.mjs` (see `vercel.json`).
3. If a manifest is invalid the build fails and the previous version stays online. Run
   `--check` locally to avoid that.
4. About a minute later https://ap-cs-arcade.vercel.app shows your card, and your game is at
   `https://ap-cs-arcade.vercel.app/games/<id>/`.

## 7. What NOT to modify

- Other students' game folders.
- `web/games/` and `web/games.json`: generated, gitignored, overwritten on every build.
- `web/index.html`, `web/scripts/arcade.js`, `web/styles/arcade.css`, `scripts/`, `vercel.json`:
  the shared arcade layer. Ask before changing it; a bug there takes every game offline.

## 8. Worked example: Flappy Bruh

`games/Flappy Bruh/` contains Walter's single-file game `index.html` and this manifest:

```json
{
  "id": "flappy-bruh",
  "name": "Flappy Bruh",
  "slot": 2,
  "developer": "Walter",
  "status": "playable",
  "description": "Guide the bird through the pipes while the world flips, tilts and turns upside down.",
  "web": { "enabled": true, "dir": ".", "entry": "index.html", "embed": true }
}
```

The build copies the game to `web/games/flappy-bruh/game/index.html` untouched and generates
`web/games/flappy-bruh/index.html`, an arcade page with the "← Back to Arcade" bar and the game in
an iframe that keeps keyboard focus. Nothing in Walter's code was changed to make this work.
