# Poly Kart

An original low-poly time-trial racer for the AP CS Arcade. Drive a track, take every checkpoint in
order, cross the line and try to beat your own best time.

## Playing

| Key | Action |
|---|---|
| `W` / `Up` | Accelerate |
| `S` / `Down` | Brake, then reverse |
| `A` `D` / `Left` `Right` | Steer |
| `R` / `Enter` | Back to the last checkpoint, clock keeps running |
| `T` / `Backspace` | Start the run over |

On a touch screen, four pads appear along the bottom instead.

## How it is put together

Everything is plain ES modules and one small WebGL renderer. There is no framework and nothing to
install; the arcade build just copies `web/` to the public site.

| File | What it does |
|---|---|
| `src/renderer.js` | A flat-shaded WebGL renderer: one shader, 4x4 matrices, mesh upload |
| `src/mesh.js` | Geometry helpers: triangles, quads, boxes, cylinders |
| `src/track.js` | Turns control points into a road, and answers "what is under the car?" |
| `src/tracks.js` | The track layouts themselves |
| `src/physics.js` | The driving model and the fixed timestep |
| `src/camera.js` | The chase camera |
| `src/run.js` | Clock, checkpoint order, time formatting |
| `src/storage.js` | Best times in `localStorage` |
| `src/car-model.js` | The kart, built from boxes and cylinders |
| `src/input.js` | Keyboard and touch |
| `src/hud.js` | The racing overlay |
| `src/game.js` | The loop that ties it together |
| `src/main.js` | Screens: track list, race, result |

## Tests

```bash
node --test 'games/Poly Kart/web/tests/*.test.mjs'
```

These cover the parts that do not need a browser: time formatting, best-time comparison, checkpoint
ordering, invalid finishes, reset state and the fixed timestep. Driving and rendering are checked in
a real browser.

## Originality

The layouts, geometry, car, colours, wording, HUD and code are original to this project. Reference
recordings supplied by the project owner were used only to study how this kind of time trial
behaves; see `docs/reference/poly-kart-video-analysis.md`. No asset, track, model or line of code
from any other game is reused.

## Browser tests

These need Playwright's WebKit build (`npm i playwright && npx playwright install webkit`) and a
server on the address you pass. Chromium is never launched.

```bash
node games/Poly\ Kart/web/tests/browser-flow.mjs http://localhost:8080/games/poly-kart/
node games/Poly\ Kart/web/tests/browser-stress.mjs http://localhost:8080/games/poly-kart/
node tests/arcade-regression.mjs http://localhost:8080/
```

`browser-flow` starts a race, drives it, completes a valid run and checks the best time survives a
reload. `browser-stress` runs a hundred start-drive-reset-restart cycles and fails if DOM nodes,
meshes or listeners accumulate. `arcade-regression` opens all three games at four screen sizes.
