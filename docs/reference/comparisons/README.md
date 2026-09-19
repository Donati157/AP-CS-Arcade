# BetLife visual comparisons (2.6.1)

> Sheets regenerated for 2.6.1. Left panel is a frame from the reference recording, right panel is a WebKit capture of production (https://ap-cs-arcade.vercel.app). No Chromium was used to produce any image here.

Each sheet is REFERENCE (left, a frame from the recordings in `games/betlife/Betlife videos/`, cropped to the app area)
beside PRODUCTION 2.5 (right, captured headless from https://ap-cs-arcade.vercel.app at an exact 390×844 viewport, 1.5×, from `?seed=7&age=…` fixtures).
`school.jpg` and `menu.jpg` have no reference frame: those screens were NOT OBSERVED IN REFERENCE.
New in 2.4: splash, disclaimer, language, lovecard, personcard (accept/reject), banner, socialmedia, enemies, death (ribbon stone).

Regenerate: `node games/betlife/web/tests/screenshot.mjs <out> http://localhost:8080/games/betlife/ main="seed=7&age=27#main" …`
then `REF_FRAMES=<frames dir> python3 games/betlife/web/tests/compare.py <sheets> <out> "BETLIFE"`.
Reference frames are extracted locally from the videos (not committed).
