# BetLife video fidelity audit (2026-09-17)

Both recordings in `games/betlife/Betlife videos/` were re-inspected end to end for this audit:
V1 (0:22) on frames every 2 s, V2 (12:34) on frames every 6 s (126 frames on labelled contact sheets),
plus the full-size frames listed in [betlife-video-index.md](betlife-video-index.md). Only the
product/UX system was studied; every name, event line, icon and picture in BetLife is original.

Legend: OBSERVED = seen in a recording · CURRENT = BetLife web 2.1 · FUTURE = possible later work
(never claimed to come from the videos).

## 1. Reference screen map (OBSERVED)

```
Cold start (V1)  splash → disclaimer → language picker → empty main with one New Life button
Main Life        header (menu, logo, ribbon counter, premium pill) · strip · journal · banners · nav · stats
  ├─ Infant/School/Occupation/Job (first nav slot follows the life)
  │    Job: Human Resources, Resign, Retire, Work Harder
  │    Occupation: You (job + Performance, Schedule + Stress), Just For You (premium), Special Careers,
  │                All: Education, Freelance Gigs, Job Recruiter, Jobs, Military, Part-Time Jobs, Special Careers
  │      Jobs: "Title (Category) $salary" sorted by salary, "…" to apply
  │      Part-Time Jobs: hourly listings · Military: Army/Air Force/Navy/Marines/Coast Guard
  │      Education: University, Golden Diploma, Graduate/Business/Dental/Law/Medical School
  ├─ Assets: premium sections, Collectibles (Belongings), Real Estate (Landlord, Properties),
  │          Vehicles (Condition bar), Possessions (Condition bar), Misc (Social Media), footer Go Shopping
  │      Shopping: Bicycles, Car Dealers (3), Jewelers (2), Music Stores, Real Estate Brokers (2), Specialty Vehicle Dealers
  │        store list: "Name (Type) $price" · real estate "Type (address) $price", footer Refresh Inventory
  │      Vehicle detail: Abandon, Drive, Garage, Gift, Maintenance, Pay Off, Repair, Sell, Scrap
  ├─ Relationships: Special (premium), Love, Parents (incl. step-parents), Siblings, Pets, Friends, Enemies,
  │                 footer Spend Time With All
  │      Person: "Name (Age)" + Relationship bar, Edit (God Mode), Activities:
  │        parent: Conversation, Doctor, Deal, Gift, Insult, Movie Theater, Recruit, Spend Time, Spy
  │        friend: Ask Out, Compliment, Concert, Conversation, Deal, Gift, … Spend Time, Unfriend
  │        fiancé: Ask for Money, Break Up, Cancel Engagement, Celebrate Anniversary, Compliment, Conversation …
  │        pet: Bathe, Release, Spend Time, Treat
  └─ Activities: Favorites (Love, Mind & Body, Pets, Salon & Spa), Premium Activities, All (alphabetical):
         Accessories›, Adoption…, Crime›, Doctor›, Emigrate…, Fertility›, Fight Betting…, Gamble›, Horse Races…,
         Identity›, Lawsuit…, Licenses›, Loan…, Lottery…, Love›, Mind & Body›, Movie Theater›, Nightlife…, Pets…,
         Plastic Surgery›, Race track, Rehab, Salon & Spa›, Shopping, Social Media, Sweepstakes, Time Machine,
         Vacation, Will & Testament, Zoo Trip; footer Surrender…
         Mind & Body: Acting Lessons, Book, Diet, Garden, Gym, Instruments (list of ~20), Library, Martial Arts, Meditate, Memory
         Salon & Spa: Dye Job, Hair Stylist, Massage, Nail Salon, Tanning Salon, Waxing Salon
         Love: Celebrity App, Date, Dating App, Gay App, Hook Up, Threesome · Identity: Gender, Name Change, Sexuality
         Pets: Animal Shelter, Cat Breeders, Dog Breeders, Exotic, Horse Ranch, Pet Store
Dialogs          decision (red border, band, icon title, 2–4 blue buttons, Surprise me!), info (blue/green border, OK),
                 person cards (avatar band: name + role, fact box, trait bars), mini-games (eye exam, driving quiz)
End of life      red flash → journal death line with net worth → tombstone (ribbon, name, age, summary, epitaph, Continue)
                 → post-life menu: Continue as child, Start a new random life, Start a custom life, try again as <name>
Menu             hamburger NOT OBSERVED (never opened)
```

## 2. Feature table

| Reference feature (OBSERVED) | BetLife web 2.1 | Match | Important differences |
|---|---|---|---|
| Main life screen layout | header, strip, journal, nav with Age, stats | MATCH | no promo banners, no premium pill; a stage pill instead of a ribbon counter |
| First nav slot follows life (Infant → School → Occupation/Job → Death) | same, plus Retired | MATCH | |
| Journal: "Age: N years", 1–6 grey lines, other people's progress, news | same; family, friends, coworkers, pets progress; no world-news lines | PARTIAL | second person instead of first person; no world news |
| Stats: bold labels, emoji, thick bars, %, warning + Boost, faces change | same with SVG icons; Boost shown as a premium-candidate marker | MATCH | emoji faces replaced by two icon states |
| Age button with attached "− Age" | same, rewind marked premium candidate | MATCH | |
| Decision dialogs (band, icon, buttons, Surprise me) | same ("Flip a coin") | MATCH | no numeric consequences shown, same as reference |
| Info dialogs blue/green, person cards with fact box | same, incl. new friend, love interest, baby, promotion, in memory | MATCH | trait bars on people cards not modelled |
| Job screen: HR, Resign, Retire, Work Harder | Work Harder, Take It Easy, Ask for a Raise, Resign, Retire, Job Listings | PARTIAL | no Human Resources |
| Occupation: Freelance Gigs, Job Recruiter, Jobs, Military, Part-Time, Special Careers, Education | Freelance Gigs, Job Recruiter, Jobs, Part-Time Jobs, University, Trade School, Career History | PARTIAL | Military and Special Careers are FUTURE; professional schools FUTURE |
| Jobs list "Title (Category) $salary" sorted by salary | same, grouped by category | MATCH | |
| Assets sections with condition bars, Go Shopping footer | Finances, Real Estate, Vehicles, Possessions, footer | MATCH | Social Media, Landlord, Collectibles FUTURE |
| Shopping grouped by store category, item "Name (Type) $" | Bicycles, Car Dealers (2), Electronics, Jewelers (2), Music Stores, Real Estate Brokers | MATCH | no aircraft/marine dealers; no Refresh Inventory |
| Vehicle detail actions (9) | Repair, Sell (+ condition, value) | PARTIAL | Abandon, Drive, Gift, Maintenance, Scrap FUTURE |
| Relationships sections + Spend Time With All | Partner, Parents, Siblings, Children, Friends, Coworkers, Pets + footer | MATCH | step-parents, enemies FUTURE |
| Person actions (7–11 per role) | family 9, friend 9, partner 12, child 10, pet 4 | MATCH | Deal, Insult, Spy, Recruit replaced by Argue/Advice (school-appropriate) |
| Activities: Favorites + All alphabetical, › vs … | Favorites (Love, Mind & Body, Pets, Salon & Spa) + All (19 rows) | MATCH | out-of-scope rows (Crime, Gamble, Nightlife, Plastic Surgery, Fertility…) omitted |
| Mind & Body list (10) | 11 rows | MATCH | instruments is one action (needs an owned instrument) |
| Salon & Spa (6) | 5 | MATCH | |
| Love (6) | Date, Dating App | PARTIAL | adult-only rows omitted by content policy |
| Pets: shelter / breeders / store | 5 species to adopt | PARTIAL | one list instead of five sources |
| Identity: Name Change | Name Change | PARTIAL | gender/sexuality FUTURE |
| Licenses: driving test quiz | driving test (Smarts-based) | PARTIAL | no road-sign quiz |
| Eye exam mini-game | eye exam action | PARTIAL | no grid mini-game |
| Loan, Emigrate, Adoption, Vacation, Will, Zoo Trip | all present | MATCH | |
| End of life: death line with net worth, tombstone summary, post-life menu with try again | same | MATCH | no "Continue as child" (FUTURE), no ribbons |
| Language picker, splash, achievements toasts | not built | MISSING | FUTURE |
| Premium: God Mode edit, Time Machine, Boost, Golden items | classified as premium candidates, none built | MATCH (by rule) | |

## 3. Option counts (approximate, from the recordings)

| Screen | Reference options | BetLife 2.1 |
|---|---|---|
| Activities top level | 30 rows + 10 premium | 23 rows (4 favorites + 19 all) |
| Mind & Body | 10 | 11 |
| Salon & Spa | 6 | 5 |
| Occupation | 7 rows + special careers | 6 rows + history |
| Job screen | 4 | 6 |
| Jobs list | ~20 | 25 full-time paths, 4 part-time |
| Assets sections | 7 | 4 |
| Shopping stores | 10 | 8 |
| Person (parent) | 9 | 9 |
| Person (friend) | ~9 | 9 |
| Person (partner) | ~10 | 12 |
| Post-life menu | 4 | 3 |

## 4. Final video parity matrix (BetLife web 2.2, 2026-09-17)

Compared on interaction, information density and screen structure, not on button names alone.

| Feature / screen | Reference (OBSERVED) | BetLife 2.2 | Verdict | Remaining difference |
|---|---|---|---|---|
| Main life screen | header, strip, journal, 5-slot nav with Age, 4 stat bars | same hierarchy and proportions; badge counter in header | MATCH | no promo banners; icons instead of emoji faces |
| Journal | "Age: N years", 1–6 grey lines, other people's milestones, news, pets | same, incl. family/friends/coworkers/pets progress and fictional news lines | MATCH | second person ("You") instead of first person |
| Stats | bold labels, emoji, thick bars, % inside, warning + Boost | same; Boost is a premium-candidate marker | MATCH | two icon states instead of graded emoji |
| Age button + "− Age" | green circle, red rewind attached | same; rewind is a premium-candidate marker | MATCH | |
| Decision dialogs | red border, band, icon title, 2–4 blue buttons, Surprise me | same ("Flip a coin") | MATCH | |
| Info / person cards | blue or green border, avatar band, fact box, trait bars | same; new friend, love interest, baby, promotion, in memory, step-parent | MATCH | trait bars shown on the person screen, not on the card |
| Mini-games | eye exam grid with timer, road-sign driving quiz | eye exam grid with 8 s timer, sign quiz with three answers | MATCH | one question instead of several |
| Achievements | toast + banner, counter in header | badge banner + header counter + Life Badges screen (21 badges) | MATCH | no death ribbons |
| Occupation | You (job + performance, schedule + stress), Freelance, Recruiter, Jobs, Military, Part-Time, Special Careers, Education | same rows: Freelance Gigs, Job Recruiter, Jobs, Part-Time Jobs, Military, Dream Careers, University, Trade School, Graduate/Law/Medical/Business school, History | MATCH | professional schools are 4 (reference lists 7) |
| Job screen | Human Resources, Resign, Retire, Work Harder (+ performance, stress) | Human Resources (4 requests), Work Harder, Take It Easy, Ask for a Raise, Resign, Retire, Schedule with Stress bar | MATCH | |
| Jobs / Military / Special | lists with title (category) and salary, "…" apply | Jobs grouped by category; Military 5 branches with ranks; Dream Careers 6 paths with stat requirements | MATCH | reference special careers are premium-gated; ours are free |
| Assets | sections, condition bars, Go Shopping footer | Finances (screen), Housing, Real Estate, Vehicles, Possessions, footer | MATCH | Social Media, Landlord, Collectibles, Investments not built |
| Vehicle detail | Abandon, Drive, Garage, Gift, Maintenance, Pay Off, Repair, Sell, Scrap | Drive, Maintenance, Repair, Gift (choose a person), Sell, Scrap; homes: Renovate, Sell | MATCH | no Abandon/Garage/Pay Off (no vehicle loans) |
| Shopping | store categories, "Name (Type) $price", real-estate addresses | same, 9 stores | MATCH | no aircraft/marine dealers, no Refresh Inventory |
| Relationships list | Love, Parents (incl. step-parents), Siblings, Pets, Friends, Enemies, Spend Time With All | Partner, Parents incl. step-parents, Siblings, Children, Friends, Coworkers, Pets, footer | MATCH | no Enemies section |
| Person detail | "Name (Age)", bar, Edit (God Mode), 9–11 activities | "Name (Age)", bar, facts, trait bars, 9–13 activities incl. Movie Theater, Concert, Ask Out, Doctor | MATCH | Deal, Insult, Spy, Recruit replaced by school-appropriate actions; Edit omitted (premium candidate) |
| Pets | Animal Shelter, Cat/Dog Breeders, Exotic, Horse Ranch, Pet Store with "Name (Breed) age" lists | Rescue Center, Cattery, Kennels, Pet Shop with "Name (Breed) · age · fee" lists, changing yearly; pet detail Bathe/Play/Treat/Walk/Rehome | MATCH | no exotic pets or horses |
| Activities | Favorites + All (30 rows), › vs …, footer Surrender | Favorites + All (23 rows), › vs …, paid actions confirm first | MATCH | out-of-scope rows omitted; no Surrender |
| Mind & Body / Salon / Love / Identity / Licenses | submenus; Licenses runs the road-sign quiz | same submenus; the Licenses driving test runs the same road-sign quiz as the teen event | MATCH | Instruments is one action; Love has 2 rows |
| School screen (teen) | school rows plus part-time work access | You, Grades, Actions, Work (Freelance Gigs, Part-Time Jobs from 14/16) | MATCH | |
| Spouse actions | includes starting a family | Start a Family (spouse, ages 20–45, up to 4 children), Celebrate Anniversary, Propose, Get Married | MATCH | no adult-only rows |
| Education menu | University, Graduate, Business, Dental, Law, Medical schools | University, Trade School, Graduate, Law, Medical, Business | PARTIAL | no dental school |
| Post-life | tombstone → Continue as child, random, custom, try again | summary card → Continue as child (each living child), random, custom, try again | MATCH | no ribbons on the summary |
| Cold start | splash, disclaimer, language picker | main menu | MISSING | not built |
| Premium systems | edit mode, time machine, boosts, golden items | classified as premium candidates, none built | omitted by rule | |
| Crime, gambling, nightlife, plastic surgery, fertility, mature content | present in reference | omitted | omitted by policy | |

### 4.1 Playthrough and simulation notes (2.2)

- Real-click playthrough on the local build at 390×844: birth → kindergarten (School screen, Study Harder) → parents' detail with trait bars → Library → eye exam (timed out, glasses) → part-time cashier at 16 (from the new Work section) → "What's Next?" → university (Computer Science) → Junior Developer at 22 → Work Harder / Ask for a Raise / HR flexible hours → dating app → partner → Propose → Get Married → driving test → used sedan → Drive / Maintenance → fired at 41 after warnings (passive play) → Job Recruiter → Retire at 63 (pension) → death at 76 → post-life menu (Continue as Arjun (43) / random / custom / try again) → New Random Life reset. Bulk aging between phases used the same handler the Age button calls.
- Fixed on the way: `freelanceGig`, `jobRecruiter`, `changeName` and `adoptFromSource` threw a ReferenceError in 2.1 (missing `changeMoney` import); badge banners no longer swallow navigation taps; the Love favourite showed "Opens at age 18" when the real reason was an existing partner.
- Tuning: childhood happiness baseline +10 (teens +5); a classmate friend joins at kindergarten and middle school (friends by 18: median 1 → 3 over 40 simulated lives); passive performance drift −4..+1 instead of −6..−1; lifestyle spending grows with savings (final net worth median $2.5M → $1.2M over 40 lives).
