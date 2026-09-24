# Poly Kart

An original low-poly kart racer for the AP CS Arcade. Three laps, five karts, four rivals that
actually race. Take every checkpoint on each lap or the lap does not count.

## Playing

| Key | Action |
|---|---|
| `W` / `Up` | Accelerate |
| `S` / `Down` | Brake, then reverse |
| `A` `D` / `Left` `Right` | Steer |
| `R` / `Enter` | Back to the last checkpoint, the race keeps running |
| `T` / `Backspace` | Restart the race from the grid |

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
| `src/run.js` | Clock, laps, checkpoint order, race position, time formatting |
| `src/racers.js` | The grid, the rivals' driving policy and kart-to-kart contact |
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

These cover the parts that do not need a browser: time formatting, lap and checkpoint ordering,
race position, reset state, circuit geometry, the fixed timestep, and a set of deliberate attempts
to cheat the lap rules (`tests/exploits.test.mjs`). Driving and rendering are checked in a browser.

## The race

Three laps of a closed circuit. Four rivals share the player's physics exactly; only the input
differs. Each rival aims at a point up the road on its own line and picks a speed from the tightest
bend within braking distance and the grip the tyres actually have, so they lift before a corner
rather than arriving flat out. Position comes from distance covered round the circuit, not from
who is nearest the line.

The player starts at the back of the grid, because starting on pole with nobody ahead is a
procession.

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

## Renderers

Poly Kart draws with WebGL when the browser provides it, trying WebGL 2 first and then WebGL 1,
relaxing the context attributes at each step. The shaders are GLSL ES 1.00, which both versions
accept, so there is only one set to maintain.

When a browser refuses every kind of WebGL context, the same 3D scene is drawn by
`src/software-renderer.js` on a 2D canvas: same track, same car, same physics, same camera, with the
triangles projected, culled, depth-sorted and filled in JavaScript. It is the real game, drawn a
slower way, and it runs at 60 frames per second on the two tracks here. A "software mode" badge
appears next to the track name so the coarser look is explained.

Only when neither a 3D nor a 2D canvas can be had does the game show a failure screen, and that
screen names the stage that failed and shows the details rather than blaming your graphics settings.

Add `?debug=1` to the address to see a live renderer read-out: context type, WebGL and GLSL
versions, vendor and renderer strings, maximum texture size, antialiasing, link status and whether
the context is software.

## Cross-browser tests

```bash
node games/Poly\ Kart/web/tests/cross-browser.mjs http://localhost:8080/games/poly-kart/ chromium,webkit,firefox
node games/Poly\ Kart/web/tests/hostile-environments.mjs http://localhost:8080/games/poly-kart/
```

`cross-browser` checks the things that actually matter at five screen sizes: a canvas exists, the
renderer got a context, the failure panel is not **painted**, a frame was drawn, and the car moves.
It checks computed style rather than the `hidden` attribute, because a panel marked hidden can still
be painted if a class sets its `display`, which is the bug that shipped in the first release.
