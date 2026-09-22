# Poly Kart audit, 2026-09-22

Written after opening https://ap-cs-arcade.vercel.app/games/poly-kart/ in Chromium and playing it
at 1440x900, 1366x768 and 390x844. Screenshots of every state are in `before/`.

## 1. What reference material exists

A full search of the repository found:

| Looked for | Found |
|---|---|
| An older Java Poly Kart | none. `arcade/src/arcade/` is the arcade shell and `games/betlife/src/` is BetLife. Poly Kart has no Java version |
| Mockups, design docs, assignment requirements | none |
| Screenshots of an intended Poly Kart | none |
| Reference video | **yes**: three recordings in `games/Poly Kart/reference videos/`, gitignored, supplied by the project owner |
| Prior analysis | `docs/reference/poly-kart-video-analysis.md`, written from those recordings |

So the primary source of truth is the owner's own three recordings, and nothing else.

## 2. What those recordings actually show

Reviewed again, end to end. They demonstrate a **time trial**:

- One car alone on the track. No opponents anywhere in 12 minutes of footage.
- No laps. A run is start line to finish line, once.
- No race position, no kart selection, no countdown.
- Roads are narrow ribbons floating above water, with no grass and mostly no barriers.
- The clock runs continuously, checkpoints are counted `n/N`, and finishing shows a personal best.

## 3. The conflict in this brief, stated plainly

This audit asks for laps, CPU opponents, race position, kart selection, grass and trees. None of
those appear in the reference recordings, and adding them would change Poly Kart from the time trial
the recordings show into a lap racer.

The brief also says the reference material is the primary source of truth and that a completely
different racing game must not be invented. Those two instructions point opposite ways.

**Decision taken:** keep the time-trial structure, because that is what the reference shows and what
the earlier passes were explicitly told to reproduce. Fix the things that are genuinely wrong, which
are overwhelmingly visual. Laps, opponents and race position are recorded below as NOT IN REFERENCE
rather than quietly invented. Say the word and they can be added, but that is a genre change and
should be a deliberate decision, not a side effect of a fidelity pass.

The countdown is the one exception: it is not in the recordings, but it was asked for directly, it
does not change the genre, and a stationary start reads better with one. It is being added and the
deviation is noted here.

## 4. State-by-state audit

Verdicts are CLOSE MATCH / PARTIAL / INCORRECT / MISSING / NOT IN REFERENCE.

| State | What the player gets now | Verdict |
|---|---|---|
| Loading screen | none | NOT IN REFERENCE |
| Main menu | title, mark, two tracks with best times, controls list | PARTIAL: enormous dead space top and bottom, track outlines are tiny illegible squiggles, no kart preview |
| Kart selection | none | NOT IN REFERENCE |
| Track selection | two tracks with a top-down outline and a best time | CLOSE MATCH |
| Starting sequence | car placed, clock at zero, player free to drive immediately | PARTIAL: no countdown, nothing signals the run has begun |
| Race start view | kart on the line under a gantry | PARTIAL: the gantry bar is a plain slab that cuts across the sky |
| Normal racing | road ribbon, kerbs, centre line, water, grey blocks | INCORRECT: the world reads as a technology demo. Scenery is undetailed grey slabs, there is no ground, no grass, no trees, no signs, no landmarks |
| Corner | banked turns with kerbs | CLOSE MATCH |
| Off track | the kart runs straight off the edge and falls into the water | INCORRECT: no barrier, no run-off, no warning, no slowdown the player can perceive |
| Collisions | barriers exist only on two short walled sections | PARTIAL |
| Checkpoints | ordered, counted, cannot be skipped | CLOSE MATCH |
| Laps | none | NOT IN REFERENCE |
| Opponents | none | NOT IN REFERENCE |
| Race position | none | NOT IN REFERENCE |
| HUD | bottom strip: counter, best, time, gap, speed | PARTIAL: correct information, but it reads as a generic web bar. Flash messages are thin centred caps that look like a website toast |
| Finish | personal best panel with time, improvement, try again | CLOSE MATCH |
| Restart / back to arcade | both work, no leaks over 100 cycles | CLOSE MATCH |
| Mobile 390x844 | plays, no overflow | INCORRECT: the top 40 percent of the screen is empty sky, the kart is tiny and the road shrinks to a thread |

## 5. The five biggest visible problems, in order

1. **The world looks unfinished.** Grey slabs on a blue plane. No ground, no vegetation, no trackside
   objects, no landmarks to read corners against.
2. **The road has no edges you can trust.** Falling off is silent and instant, with no barrier, no
   run-off and no feedback.
3. **The camera does not adapt to the viewport.** A tall phone screen gets a wall of sky.
4. **The HUD is a web bar, not an arcade HUD.**
5. **The menu is mostly empty space** with track maps too small to read.

## 6. What is worth keeping

The checkpoint ordering, the clock, best-time storage, the fixed timestep, the reset behaviour, the
renderer fallbacks and the arcade integration are all sound and tested. None of that is being
rewritten. The work is art direction, track furniture, camera framing, HUD and the start sequence.

---

## 7. After the rebuild

Same states, same viewports, captured from the same build that is now deployed. Paired images are
in `comparisons/`, the full sets in `before/` and `after/`.

| State | Before | After | Verdict now |
|---|---|---|---|
| Main menu | one narrow column, most of the screen empty, track maps illegible | two columns, kart preview, track plans with the start marked and checkpoint counts | CLOSE MATCH |
| Starting sequence | player free to drive immediately, nothing marks the start | lights count 3, 2, 1, GO with the throttle locked until GO; restarting runs them again | CLOSE MATCH |
| Race start view | plain slab across the sky | raised gantry with a chequered board and a chequered line on the road | CLOSE MATCH |
| Normal racing | grey slabs on a blue plane | islands with beaches, woods, a harbour town with roofs and windows, hills ringing the horizon, guard rails down both edges | CLOSE MATCH |
| Off track | ran silently off the edge and fell | the rail holds the kart on the road, and leaving it says so | CLOSE MATCH |
| Collisions | only two short walled sections | every stretch has a barrier, and hitting one scrubs speed and says "Barrier" | CLOSE MATCH |
| HUD | one generic bar along the bottom | clock top centre, checkpoint progress top left, speed bottom right, centre of the screen clear | CLOSE MATCH |
| Checkpoints | ordered and unskippable | unchanged, plus "Final checkpoint" on the last one | CLOSE MATCH |
| Finish | personal best panel | unchanged | CLOSE MATCH |
| Mobile 390x844 | top 40 percent empty sky, kart tiny | camera narrows and closes in on tall screens; kart large, road fills the frame | CLOSE MATCH |
| Laps | none | none | NOT IN REFERENCE |
| Opponents | none | none | NOT IN REFERENCE |
| Race position | none | none | NOT IN REFERENCE |
| Kart selection | none | none | NOT IN REFERENCE |
| Loading screen | none | none | NOT IN REFERENCE |

## 8. Driving faults found by actually driving

Three real bugs, none of which any test caught, all found by driving whole laps:

1. **Banked corners were read as jumps.** The old ground model compared the kart's height with the
   banked surface under it. Leaning into a corner changes that height without the road going
   anywhere, so the kart launched off every fast bank, and an airborne kart ignored barriers. It now
   follows the vertical profile of the centre line, so only a real crest or ramp lifts it.
2. **Crests threw the kart off the map.** Taken flat out, the Harbour crest launched it far enough
   to land off the track. The launch is capped, and the crest itself is gentler.
3. **Resetting after a fall near the finish bricked the run.** The lookup that decides what is under
   the kart only searches near its last answer. Respawning at the start put the kart outside that
   window, so it could never find the road again and fell for ever. Poses now carry their own index.

A further fault was found in the barrier itself: it sat *outside* the off-road threshold, so the
kart lost drive and steering a moment before the rail could have caught it. The rail now sits just
inside, where the drawn barrier is.

Before these fixes an autopilot could not finish Harbour Loop at all in three minutes, spending 163
seconds off the road and falling 86 times. It now finishes both tracks with no falls and no time off
the road.

| Track | Lap | Top speed | Time off road | Falls | Barrier contacts |
|---|---|---|---|---|---|
| Harbour Loop | 21.9 s | 307 km/h | 0.0 s | 0 | 52 |
| Dune Run | 23.5 s | 295 km/h | 0.0 s | 0 | 55 |
