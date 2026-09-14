# AP-CS-Arcade
A collaborative AP Computer Science arcade project featuring four unique games, each designed and developed by a different team member, all integrated into one unified arcade experience.

## Repository layout

```text
AP-CS-Arcade/
├── arcade/     Central arcade launcher (home screen, starts the games).
├── games/      One directory per game. Each game is developed inside its own folder.
│   ├── betlife/    BetLife - life-simulation game (Java 17 + Swing)
│   ├── game-2/     Reserved, not yet specified
│   ├── game-3/     Reserved, not yet specified
│   └── game-4/     Reserved, not yet specified
├── shared/     Code that is genuinely shared by several games or by the games and the arcade.
└── docs/       Project-level documentation and screenshots.
```

## Run the Arcade
Requires Java 17 (`java` and `javac` on the PATH).

Mac/Linux:

```bash
./run-arcade.sh
```

Windows:

```text
run-arcade.bat
```

The script compiles everything into `out/` and opens the Arcade. BetLife is playable now;
the other three games show Coming Soon.

## Technology
- Java 17
- Java Swing for the user interface
- No build tool and no external dependencies: each game compiles with plain `javac`.

## Games
| Game | Directory | Status |
|------|-----------|--------|
| BetLife | `games/betlife` | v1.0 playable. See [games/betlife/README.md](games/betlife/README.md) and [INTEGRATION.md](games/betlife/INTEGRATION.md). |
| Game 2 | `games/game-2` | Not started |
| Game 3 | `games/game-3` | Not started |
| Game 4 | `games/game-4` | Not started |

Each game must remain runnable on its own. The `arcade/` application will later launch them from a single menu.
