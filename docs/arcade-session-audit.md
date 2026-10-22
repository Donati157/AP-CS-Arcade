# Arcade session audit

The rule: **leaving a game ends that game's session.** Re-entering from the arcade starts at the
game's own first screen, not where the player stopped.

This is analysis only. Nothing was changed.

## How the arcade actually embeds a game

`scripts/build-web-games.mjs` generates one shell page per playable game at
`web/games/<id>/index.html`. The shell is a header with `← Back to Arcade` (a plain link to `../../`)
and an `<iframe src="game/<entry>">` filling the rest. The game and the shell are the **same
origin**, so the shell can read and write the game's storage directly.

Leaving therefore destroys the iframe's window and every variable in it. What survives is
`localStorage`, because it is per-origin and outlives navigation. That is the whole of the problem.

## Where state persists today

| Game | Key | What it holds | Session or record? |
|---|---|---|---|
| **BetLife** | `betlife.web.save` | **the entire life in progress**, written after every action | **session — this is the one that breaks the rule** |
| BetLife | `betlife.web.setup` | first-run flag | preference |
| BetLife | `betlife.web.language` | chosen language | preference |
| Poly Kart | `poly-kart.best-times.v1` | best time per track | record |
| Poly Kart | `poly-kart.ghosts.v1` | the ghost of each best run | record |
| Flappy Bruh | `LS_SEEN_DEATH`, `LS_SEEN_GROUND_DEATH` | one-off tip flags | preference |
| Gravity Bird | — | none | — |

**Only BetLife resumes a session.** Poly Kart already opens at its track list every time; its best
times are records of past runs, not a run in progress, and the rule does not ask for them to go.
Flappy Bruh's two keys only stop a tip being shown twice.

## The exact lines

`games/betlife/web/betlife.js`

```
21:  let state = G.loadGame();
22:  let screen = state ? 'main' : 'start';
47:  if (state) G.saveGame(state);      // inside render(), so every action writes
```

Line 21 restores the life at module load. Line 22 then **skips the title screen**, because a
restored state sends the player straight to `main`. Line 47 keeps it current.

`games/betlife/web/game/save.js` holds `STORAGE_KEY = 'betlife.web.save'` and the three functions.
`clearSavedGame()` already exists and is already called on death and when continuing as a child.

## The minimal change

The clean place is **the shell, not the game**, because the rule is the arcade's and applies to
every game.

1. Each `game.json` gains one optional field — the storage prefix that belongs to a *session*:

   ```json
   "web": { "entry": "index.html", "sessionStorageKeys": ["betlife.web.save"] }
   ```

2. `shellPage()` in `scripts/build-web-games.mjs` emits, before the iframe is created, a few lines
   that remove exactly those keys. Entering a game from the arcade then always begins clean.

3. Nothing in BetLife changes. `loadGame()` still returns `null` on a fresh entry, `screen` still
   falls back to `'start'`, and the title screen appears — which is the behaviour asked for.

Two consequences worth naming before it is built:

- **A mid-session reload would also wipe the life**, because a reload re-runs the shell. If that is
  not wanted, the shell can set a `sessionStorage` marker and skip the wipe when the marker is
  already present, clearing it on `pagehide`. That is a few more lines and one more thing to get
  wrong; it is worth deciding deliberately rather than by accident.
- **Opening the game's own URL directly**, outside the shell, would not wipe. That is only a concern
  for development.

The alternative — moving the save to `sessionStorage` — does **not** work here: the arcade navigates
within one tab, so `sessionStorage` survives `Back to Arcade` and the life would come back anyway.

## Note on BetLife's depth

None of this touches what BetLife does while it is being played. The state has to keep working
normally inside a session; the only change is that a session ends when the player leaves. Saving
during play stays exactly as it is, as insurance against a reload — it simply stops outliving the
visit.
