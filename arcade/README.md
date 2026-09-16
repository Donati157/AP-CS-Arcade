# Arcade

The central launcher of the AP CS Arcade: one window with a card per game.
Picking BetLife hides the arcade and starts the game through `betlife.BetLifeLauncher.launchFromArcade`;
when the player leaves BetLife the arcade window comes back. Flappy Bruh is a browser game (see the web arcade), and slots 3 and 4 are shown as Coming Soon.

Source: `arcade/src/arcade/` (`Main`, `ArcadeFrame`, `ArcadeHomePanel`, `GameCard`).

Run from the repository root with `./run-arcade.sh` (Mac/Linux) or `run-arcade.bat` (Windows).
