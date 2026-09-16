# BetLife 2.0 rebuild notes

How the web BetLife was rebuilt against the reference recordings in `games/betlife/Betlife videos/`
(see [betlife-video-analysis.md](betlife-video-analysis.md) for the full analysis). This file records the
measured differences before and after the rebuild, the simulation design, and what still differs.
Every name, event, icon and picture in BetLife is original; only the product/UX system was studied.

## 1. Reference geometry (V2 frames, iPhone 390 x 844 points)

Measured on frames extracted at V2 0:02, 3:14, 10:18 and 12:14 (1170 x 2532 px, 3 px = 1 pt):

| Region | Reference | BetLife 1.0 web (before) | BetLife 2.0 web (after) |
|---|---|---|---|
| Header | 52 pt, menu circle, logo left, pill right | 56 px, logo centred | 52 px, menu circle, logo left, stage pill |
| Character strip | 45 pt, avatar 36, blue name, status with icon, balance right | 60 px, name in teal | 46 px, avatar 34, blue name, status icon, green/red balance |
| Journal | ~43 % of the screen, blue "Age: N years", grey 11.5 pt lines | 62 % (with bullets, 16 px text, coloured lines) | ~63 % of the play area, no bullets, 12.5 px grey lines, blue headings |
| Bottom navigation | 83 pt, five slots, teal circles 27 pt, first slot orange | 76 px, white rings, all alike | 84 px, teal circles 30 px, orange first slot |
| Age button | 93 pt, overhangs the bar by ~8 pt, white ring | 96 px, 24 px above the bar | 94 px, 7 px overhang, white ring plus green rim |
| Stats | 93 pt, right-aligned bold labels, emoji, 17 pt bars, % inside | 85 px, thin 9 px bars, % outside in grey | 112 px, right-aligned labels, icons, 17 px bars, bold % inside |
| Secondary screens | strip stays, blue title bar 52 pt, rows 70 pt, grey section strips, teal footer | red header, rows 58 px, no strips | strip stays, blue title bar 52 px, rows 60 px, grey strips, teal footer |
| Modals | thick coloured border, band label, icon title, fact box, stacked blue buttons, random link | plain white card | 5 px tone border, gradient band, icon title, fact box, stacked buttons, "Flip a coin" |
| Death | dark header, grey stats, nav becomes Death + New Life, summary card | none | dark header, grey stats, Summary + New Life, life-summary dialog and screen |

## 2. Simulation design (games/betlife/web/game)

- `rng.js`: seeded mulberry32 whose state lives on the saved game (`rngState`), so a reload continues
  the same sequence and tests replay a life from a seed.
- `stats.js`: the single stat pipeline. `changeStat` clamps 0-100, halves gains above 80, limits gains
  above 90 to +1, and logs every change with a reason (`betlife.statLog()` in the console).
- `year.js`: the yearly order: age +1 → education → career → belongings and money → other people →
  stat settlement → random events → end-of-life check → labels. Nothing runs twice.
- `events/engine.js`: eligibility from stage, age, needs and person; per-event cooldowns, families,
  `once` and `max`; category weighting that avoids the last three categories; no filler event.
- `career.js`: ladders with tenure, performance drift, raises (2-7 %, cost-of-living above 1.3x, capped
  at 2x the listed salary), promotions, warnings and dismissal, retirement prompts from 65, pushes from
  70, certain by 78, pension at 45 % of the final salary scaled by years worked.
- `mortality.js`: yearly probability from age (doubling every ~7.5 years after 30) scaled by Health
  (100 halves it, 0 quadruples it). No fixed maximum age.
- `people.js`: everyone ages, closeness fades without contact, relatives retire and pass away
  (with inheritance), pets have lifespans, partners can propose, marry and have children.
- `economy.js`: progressive tax, rent or home bills plus a lifestyle share of income, child costs,
  tuition via student loan, 5 % interest on debt.
- `save.js`: versioned saves; version-1 saves migrate (player, journal, education, family) and anything
  unreadable falls back to the main menu instead of crashing.

## 3. Content counts (from `node --test 'games/betlife/web/tests/*.test.mjs'` and `node games/betlife/web/tests/report.mjs`)

- 280 plain events and 64 decision scenarios (344 definitions), 40 event families, 135 once-only milestones,
  209 repeatable events; 322 of 344 fired at least once across 100 simulated lives (the rest need rare
  states such as children graduating or a life reaching 100).
- Eligible pool at representative ages: 2 → 20, 7 → 52, 12 → 49, 16 → 58, 18 → 36, university → 51,
  25 employed → 79, 35 employed → 74, 50 → 68, 70 → 29.

## 4. Remaining differences from the recordings

- The reference draws people with emoji-style faces; BetLife uses one CSS avatar that changes with age
  and gender, and a single-colour SVG icon set.
- The reference shows two promo banners above the navigation and a premium pill in the header; BetLife
  has neither, so the journal is taller.
- The reference includes systems that are out of scope for a school project (crime, gambling, plastic
  surgery, mature relationship content) and premium systems (edit mode, time machine, boosts). BetLife
  lists a disabled "Life Editor" row as a premium candidate and builds none of them.
- Reference journal lines are first person ("I ..."); BetLife keeps second person ("You ...").
- Mini-games (eye exam, driving quiz) are replaced by one-step outcomes (eye exam activity, driving
  test with a Smarts-based pass chance).
- Row height is 60 px against ~70 pt in the reference; the reference list font is slightly larger.
