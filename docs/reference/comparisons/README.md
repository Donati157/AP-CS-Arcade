# BetLife visual comparisons (2.3)

Each sheet is REFERENCE (left, a frame from the recordings in `games/betlife/Betlife videos/`, cropped to the app area)
beside BETLIFE 2.3 (right, captured headless at an exact 390×844 viewport, 1.5×, from `?seed=7&age=…` fixtures).
`school.jpg` and `menu.jpg` have no reference frame: those screens were NOT OBSERVED IN REFERENCE.

Regenerate: `node games/betlife/web/tests/screenshot.mjs <out> http://localhost:8080/games/betlife/ main="seed=7&age=27#main" …`
then `REF_FRAMES=<frames dir> python3 games/betlife/web/tests/compare.py <sheets> <out> "BETLIFE"`.
Reference frames are extracted locally from the videos (not committed).
