# AP-CS-Arcade
A collaborative AP Computer Science arcade project featuring four unique games, each designed and developed by a different team member, all integrated into one unified arcade experience.

## Repository layout

```text
AP-CS-Arcade/
├── arcade/     Central arcade launcher (home screen, starts the games).
├── games/      One directory per game. Each game is developed inside its own folder.
│   ├── betlife/       BetLife - life simulation (Java 17 + Swing, plus a browser version in web/)
│   ├── Flappy Bruh/   Flappy Bruh - HTML5 Canvas arcade game
│   ├── Poly Kart/     Reserved, not yet specified
│   └── Gravity Bird/  Reserved, not yet specified
├── shared/     Code that is genuinely shared by several games or by the games and the arcade.
└── docs/       Project-level documentation and screenshots.
```

## Desktop
Requires Java 17 (`java` and `javac` on the PATH).

Mac/Linux:

```bash
./run-arcade.sh
```

Windows:

```text
run-arcade.bat
```

The script compiles everything into `out/` and opens the Arcade. BetLife is playable on the desktop;
Flappy Bruh is a browser game (play it in the web arcade) and the other two slots show Coming Soon.

## Web
`web/` is the browser arcade: a static site (HTML, CSS, ES modules, no framework) that hosts the
home page and every game with a browser version (BetLife, Flappy Bruh). Game files live next to each
game under `games/`; `node scripts/build-web-games.mjs` validates the manifests and copies them into
`web/games/` (generated, not committed). Vercel runs that command on every push to `main` and serves
`web/` (see `vercel.json`).

Public test build: **https://ap-cs-arcade.vercel.app**

Run it locally:

```bash
node scripts/build-web-games.mjs && cd web && python3 -m http.server 8080
```

## Technology
- Java 17
- Java Swing for the user interface
- No build tool and no external dependencies: each game compiles with plain `javac`.

## Games
| Slot | Game | Directory | Status |
|------|------|-----------|--------|
| 1 | BetLife | `games/betlife` | Playable (desktop v1.0 + web). See [games/betlife/README.md](games/betlife/README.md). |
| 2 | Flappy Bruh | `games/Flappy Bruh` | Playable (web). See [games/Flappy Bruh/README.md](games/Flappy%20Bruh/README.md). |
| 3 | TBD | `games/Poly Kart` | Coming Soon |
| 4 | TBD | `games/Gravity Bird` | Coming Soon |

Each game folder carries a `game.json` manifest; `scripts/build-web-games.mjs` turns those into the
public arcade. To publish a game, read [docs/GAME_INTEGRATION.md](docs/GAME_INTEGRATION.md).

Each game must remain runnable on its own. The `arcade/` application will later launch them from a single menu.
