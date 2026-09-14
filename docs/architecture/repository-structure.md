# Repository structure

The repository is organized around ownership boundaries: every game is developed inside its own
directory under `games/`, the future arcade lives in `arcade/`, and only proven-shared code goes in `shared/`.

```text
AP-CS-Arcade/
├── arcade/                  future central arcade application
├── games/
│   ├── betlife/             BetLife (Java 17 Swing)
│   │   ├── src/betlife/     Java sources, package "betlife"
│   │   │   ├── Main.java    thin standalone entry point
│   │   │   ├── game/        game state and game logic
│   │   │   ├── model/       plain data classes (Player, LifeEvent, ...)
│   │   │   └── ui/          Swing screens and reusable components
│   │   └── assets/          images, icons, fonts (BetLife-owned assets only)
│   ├── game-2/  game-3/  game-4/   reserved for the other team members
├── shared/                  code used by several games or by the arcade
└── docs/
    ├── architecture/        project-level design notes
    └── screenshots/         reference and progress screenshots
```

## Rules
- A game never places files at the repository root or inside another game's directory.
- Each game stays runnable on its own (`Main` class inside the game).
- Game entry points are kept thin so the arcade can later launch a game without a `main()` method.
- Build output (`*.class`, `out/`) is ignored by Git and never committed.
