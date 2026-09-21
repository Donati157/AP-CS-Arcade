# Poly Kart — reference video analysis

Poly Kart is an original game. The recordings supplied by the project owner are used only to
understand how this kind of time-trial racer behaves: driving feel, camera, track presentation, UI
hierarchy and run flow. No code, geometry, texture, model, audio, track file, name or logo from the
reference is reused.

## 0. The recordings

The owner said the videos were in `games/Poly Kart/`. They were not there; they were found in
`~/Downloads/PolyKart/` and hard-linked into `games/Poly Kart/reference videos/`, which is
gitignored, so nothing large enters the repository or the public build.

| File | Length | Resolution | What it shows |
|---|---|---|---|
| `pk1.mov` | 4:11 | 2878x1798 | Settings screens, the track browser, a track leaderboard, then repeated runs on a 2-checkpoint winter track including a long stuck-against-a-wall sequence and a fall off the track |
| `pk2.mov` | 1:25 | 2878x1798 | Continuous running on the same winter track, two finishes, both showing the personal-best presentation |
| `pk3.mov` | 7:10 | 2878x1798 | Track browser with several season groups, then first runs on 4-checkpoint and 5-checkpoint tracks with no previous record, several personal bests, a corkscrew tunnel and a long tunnel section |

Frames were sampled every two seconds (384 frames) and reviewed as contact sheets covering all three
recordings end to end.

## 1. Feature table

Everything in the OBSERVED column was read off specific frames. INFERRED is written as such.

| Feature | Video / time | Observed behaviour | Poly Kart target |
|---|---|---|---|
| Run start | pk1 ~0:52, pk3 ~5:52 | Car sits still on the road behind a coloured line across the track. Timer reads `00:00.000`, speed `0`, checkpoint counter `0/n` | Same: stationary start behind a start line, clock at zero until the player accelerates |
| Checkpoint counter | pk1, pk2, pk3 throughout | Bottom-left, `0/2`, `1/2`, `2/2`; pk3 uses `0/4`..`4/4` and `0/5`..`5/5` | Same counter, per-track checkpoint count |
| Timer | all | Centre of the bottom bar in `MM:SS.mmm`, counting up continuously, three decimals | Same format and precision |
| Record / difference | pk1, pk2 | Bottom bar shows three columns: `Record`, `Current`, `Difference`. Difference is green when ahead, red when behind. With no record the record column shows `----` and difference is blank (pk3) | Same three columns, same colour rule, same empty state |
| Speed | all | Bottom-right, integer `km/h`. Observed values from `0` up to `462` | Same readout; our top speed is tuned to feel comparable, not copied |
| Finish | pk2 ~1:02, pk3 several | Timer stops. A gold `NEW PERSONAL BEST` banner appears with the track name, the final time and the improvement in green. One frame also shows a world ranking. A line reads `Press T / Backspace to try again and improve your time` | Banner with our own wording and artwork, track name, final time, improvement. No online ranking: we have no server |
| Reset prompt | pk1 ~1:30 onward | When the car is stopped against scenery the screen shows `Press R / Enter to return to the last checkpoint.` and `Press T / Backspace to start over` | Same two-level reset, our own wording |
| Timer while stuck | pk1 1:30-2:35 | The clock keeps running the whole time the car is stuck; the difference climbs into the red | Same: the clock never pauses mid-run |
| Manual reset | pk1 | Reset returns the car to the start with the clock back to `00:00.000` and the counter back to `0/n` | Same for start-over; checkpoint reset keeps the clock running |
| Falling off | pk1 ~2:05, ~4:05 | The car leaves the road and falls; the camera follows it down. Recovery is by pressing reset, not automatic in the frames sampled | We respawn automatically once the car falls below the track, at the last checkpoint, and say so on screen |
| Camera | all | Chase camera a short distance behind and slightly above the car, looking slightly down, lagging behind in corners and swinging round to follow. Stays behind the car when it leaves the ground and while it tumbles | Same behaviour, implemented from scratch with our own smoothing constants |
| Field of view | all | Wide; the road edges reach the sides of the frame close to the car | Around 70 degrees vertical |
| Airborne | pk1, pk2, pk3 | The car jumps off crests and lands; it tumbles freely when it leaves the track. Some frames show it rotating in the air | Jumps and free rotation in the air, with limited air steering |
| Wall driving | pk1 ~3:05, pk2 | The car runs along steeply banked and near-vertical surfaces at high speed | Banked corners. Full wall riding is NOT reproduced |
| Track surface | all | Narrow ribbon of road floating above water, no guard rails on most sections, painted chevrons and stripes on some walls | Same readable ribbon, high contrast against the surroundings |
| Track furniture | all | Ramps, crests, tunnels, a corkscrew tunnel (pk3 ~7:00), banked curves, pillars, blocks and slab buildings | Ramps, crests, banked curves and a tunnel. No corkscrew in the first track |
| Environment | pk1/pk2 winter, pk3 also a desert group | Flat-shaded low-poly blocks, a large water plane, mountains on the horizon, soft sky with clouds, one soft shadow under the car | Original flat-shaded low-poly world, one ground plane, distant blocks, a blob shadow |
| Track browser | pk1 ~0:40, pk3 ~0:30 | Tabs for official, community and custom tracks; tracks grouped by season; each tile shows a top-down outline and the personal best or `No record` | A simple original track list with a top-down outline and the best time. No community or custom tracks |
| Track screen | pk1 ~0:45 | Track name, version, author, personal best, opponents, a `Watch` button and a large `Play` button | Track name, best time and a large start button. No ghosts, no opponents |
| Settings | pk1 ~0:10-0:30 | Timer and speedometer placement, vibration, steering side, shadows, clouds, particles, skidmarks, fog, render scale, pixel density, anti-aliasing, several volume sliders | A short original settings panel: render quality and sound only |
| In-run menu | all | Top-left `Exit`, `Watch`, `Next Track` with the track name and author underneath | Top-left `Exit` and `Restart` with the track name. No ghost watching |
| Ghost / opponents | pk1 menus | Settings and the track screen refer to ghost cars and opponents | NOT OBSERVED in play in these recordings and NOT implemented |

## 2. Run flow observed

```
TRACK LIST  ->  TRACK SCREEN (best time, Play)
            ->  COUNTDOWNLESS START (car still, clock at zero)
            ->  DRIVE  ->  CHECKPOINT n/N  ->  ...
            ->  FINISH LINE  ->  clock stops  ->  PERSONAL BEST banner (only when improved)
            ->  "try again" prompt  ->  restart, or back to the track list
```

Two side branches were observed:

```
STUCK   ->  on-screen prompt  ->  reset to last checkpoint (clock keeps running)
                              ->  or start over (clock resets)
FALL    ->  car leaves the road and drops away  ->  player resets
```

## 3. Numbers read off the frames

These are measurements of the reference, used to set our own targets. They are not copied values.

| Quantity | Reference | Poly Kart |
|---|---|---|
| Checkpoints per track | 2, 4 and 5 across three tracks | 4 on the first track |
| Winning times | 19.3 s and 25.5 s on short tracks, 69.2 s on a long one | Target 45-75 s |
| Cruising speed on straights | 180-260 km/h | Similar readout |
| Peak speed downhill | 400-462 km/h | Capped lower; see the driving model |
| Speed in tight corners | 40-150 km/h | Similar |
| Timer precision | milliseconds, three digits | Same |

## 4. What is deliberately not reproduced

- Any track layout, model, texture, colour scheme, logo, wording or sound from the reference.
- Community and custom track sharing, track import, the online leaderboard and world ranking.
- Ghost cars, opponents and replay watching.
- The full settings matrix; Poly Kart ships a much shorter panel.
- Wall riding on vertical surfaces.

## 5. Reference frames

Frames were extracted to a scratch folder for review and are deliberately **not** committed. They
are footage of someone else's game; keeping the written analysis here is enough, and it avoids
putting proprietary imagery in a public repository. The extraction step is reproducible: a small
AVFoundation tool sampled every second video frame at 900 px wide.
