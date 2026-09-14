# BetLife arcade integration

BetLife is a self-contained Java 17 Swing game. The arcade only needs the classes under
`games/betlife/src` on its classpath and one call into `betlife.BetLifeLauncher`.

## Launch standalone

```bash
cd games/betlife
./run.sh
```

or, after compiling with `javac -d out $(find src -name '*.java')`:

```bash
java -cp out betlife.Main
```

## Launch from the arcade

```java
import betlife.BetLifeLauncher;

// Somewhere in the arcade, when the player picks BetLife:
arcadeFrame.setVisible(false);
BetLifeLauncher.launchFromArcade(() -> arcadeFrame.setVisible(true));
```

`launchFromArcade` opens the BetLife window on the Swing event thread and returns immediately.
`BetLifeLauncher.VERSION` holds the game version (`"1.0.0"`).

## Return callback

The player leaves BetLife through the header menu ("Return to Arcade") or by closing the window.
Either way the BetLife window is disposed and the callback passed to `launchFromArcade` runs
exactly once, on the Swing event thread. BetLife never calls `System.exit`, so the arcade's JVM
and windows keep running.

In standalone mode the same menu row reads "Exit BetLife" and simply closes the window; the JVM
ends on its own when no windows remain.

## Dependencies

- Java 17
- Standard library only (Swing / AWT). No build tool, no external jars.

## Assets

Everything BetLife draws is painted in code. `games/betlife/assets/` (images, icons, fonts) is
reserved for future files; nothing needs to be copied for the game to run.

## Constraints

- Start one BetLife session at a time. Each launch creates a fresh game; a second concurrent
  launch would open a second independent window, which is not intended.
- BetLife does not depend on any arcade class. Keep the dependency direction
  Arcade -> BetLifeLauncher.
