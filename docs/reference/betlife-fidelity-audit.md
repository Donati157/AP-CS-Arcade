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

## 5. Visual rebuild 2.3 (2026-09-18): rewatch, measurements and a new parity matrix

Both recordings were re-extracted at 1 s (V1) and 2 s (V2) and read end to end on 13 contact sheets before any code changed.
Reference geometry was measured on 585×1266 frames (1.5 px/pt); BetLife was captured headless at an exact 390×844 viewport
at 1.5× and measured the same way. Paired sheets live in [comparisons/](comparisons/).

### 5.1 Why 2.2 still looked different

- Fonts: 2.2 used the system UI font at 12.5–13.5 px; the reference uses a rounded humanist face at 14–17 pt with condensed uppercase titles.
- Icons: 2.2 drew thin line icons inside pale circles; the reference shows full-colour pictograms about 32 pt wide with no circle.
- Rows: 2.2 rows were 66 px with 16 px titles in link blue and grey subtitles; the reference rows are 68–70 pt with 17 pt bold blue titles, blue subtitles and thick blue chevrons.
- Journal: 2.2 lines were 12.5 px with 1.42 line height and 11 px year gaps; the reference is 13.5–14 pt, 1.13 line height, 14 pt gaps, so 2.2 showed fewer lines and looked airy.
- Stats: 2.2 bars were 17 px with rounded ends and the percentage printed over the green; the reference bars are 15 pt, square, and the number sits on the light track end.
- Modals: 2.2 cards were 340 px wide with 5 px borders, 16 px radius and 44 px buttons; the reference is about 308 pt wide, 3 pt border, 10 pt radius, 39 pt buttons with 12 pt gaps and a 34 pt category band.
- Structure: Job actions lived under Occupation; the cold start showed a menu list instead of an empty life frame; the tombstone was a bordered card.

### 5.2 Main Life screen measurements (pt at 390 wide)

| Element | Reference | BetLife 2.2 | BetLife 2.3 |
|---|---|---|---|
| Header height | 47 | 52 | 47 |
| Character strip height | 45 | 46 | 45 |
| Journal top | 92 | 98 | 92 |
| Year heading | 15 bold blue | 13.5 | 14.5 bold blue |
| Entry text / line height | 14 / 1.13 | 12.5 / 1.42 | 13.5 / 1.13 |
| Bottom nav height | 78 | 84 | 78 |
| Nav ring / label | 33 / 12 | 30 / 10 | 33 / 10.5 |
| Age button diameter | 90 | 94 | 90 |
| Age button overlap above nav | 7 | 7 | 8 |
| Rewind button | 37 | 34 | 37 |
| Stat label | 14 bold blue | 12.5 | 14 bold blue |
| Stat bar height / pitch | 15 / 20.5 | 17 / 21 | 15 / 21 |
| Stat icon | emoji 16 | line icon 15 | emoji 16 |

### 5.3 Secondary screen measurements

| Element | Reference | BetLife 2.3 |
|---|---|---|
| Title bar height / title | 47 / condensed 22 uppercase | 47 / condensed 22 uppercase |
| Close/back button | 30 circle, 14 from left | 30 circle, 14 from left |
| Section header | 20 tall grey, 14 bold white | 20 tall grey, 14 bold white |
| Row height | 68–70 | 68 (72 with a bar) |
| Row icon | ~32 pictogram, 12 from left | 31 emoji, 12 from left |
| Row title / subtitle | 17 bold blue / 13 blue | 17 bold blue / 13 blue |
| Chevron | thick blue, 22 | thick blue, 22 |
| Relationship bar | 128 × 10 | 128 × 10 |
| Decision card width / border / radius | ~308 / 3 red / 10 | 308 / 3 red / 10 |
| Category band | 34, gradient to red | 34, gradient to red |
| Card button height / gap / radius | 39 / 12 / 5 | 39 / 12 / 5 |
| Post-life buttons | pill 50, green then yellow, text link | pill 50, blue child row, green, yellow, text link |
| Tombstone | grey stone, uppercase condensed name, grass, pill Continue | grey stone, uppercase condensed name, grass strip, pill Continue |

### 5.4 Navigation and interaction changes

| Flow | Reference | BetLife 2.2 | BetLife 2.3 |
|---|---|---|---|
| Cold start | empty frame → New Life (one tap) | menu list → New Life → Random/Custom dialog → birth card | empty frame → New Life (one tap, birth block in the journal) |
| Job actions | Occupation → job row → Job (HR, Resign, Retire, Work Harder) | nav Job → actions mixed with facts | nav Job → Occupation (You + All) → job row → Job |
| Occupation menu | You, All: Education, Freelance, Recruiter, Jobs, Military, Part-Time, Special | 6 sections with info rows | You, All: Career History, Education, Freelance Gigs, Job Recruiter, Jobs, Military, Part-Time Jobs, Special Careers |
| Education | Occupation → Education → schools | Occupation section | Occupation → Education → University, Trade School, four schools |
| Activities → Mind & Body → Library → result | 4 steps | 4 steps | 4 steps |
| Relationships → person → action → result | 4 steps | 4 steps | 4 steps |
| Assets → Go Shopping → dealer → item → confirm → buy | 6 steps | 6 steps | 6 steps |
| Age with a badge banner showing | n/a | tap ignored until the banner closed | banner closes and the year advances |

### 5.5 Parity matrix (rebuilt from screenshots)

CLOSE MATCH means the paired sheet in comparisons/ shows the same hierarchy, proportions and density; PARTIAL means a visible
difference remains; MISSING means the reference screen has no counterpart.

| Screen / feature | Sheet | Geometry | Typography | Density | Interaction | Status | Remaining difference |
|---|---|---|---|---|---|---|---|
| Main Life | main.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | no promo banners, no premium pill; badge counter instead of ribbon counter |
| Main Life (child) | main_child.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | second person voice |
| Activities | activities.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | no Premium Activities section; disabled rows carry an italic reason |
| Activities submenu (Mind & Body) | mindbody.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | different item set (school-appropriate) |
| Relationships | relationships.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | no Enemies section; footer is teal |
| Person detail | person.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | no Edit row (premium candidate); actions differ by policy |
| Occupation | occupation.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | no Just For You premium block |
| Job | job.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | header row with performance bar added; Take It Easy and Ask for a Raise extra |
| Jobs list | jobs.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | unqualified jobs greyed instead of hidden |
| School | school.jpg | – | – | – | – | NOT OBSERVED IN REFERENCE | built on the row system |
| Assets | assets.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | no Landlord/Properties/Social Media rows |
| Shopping | shopping.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | fewer dealers; Bank Balance row on top |
| Store list (cars) | shop_cars.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | four cars vs a long list |
| Vehicle detail | vehicle.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | no Abandon, Garage, Pay Off |
| Decision modal | decision.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | "Flip a coin" wording |
| Info modal | info.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | no achievement toast above |
| Person card (traits) | personcard.jpg | ✓ | ✓ | ✓ | PARTIAL | PARTIAL | reference offers accept/reject; ours is OK only; Kindness instead of Craziness |
| Tombstone | death.jpg | ✓ | ✓ | ✓ | ✓ | PARTIAL | flat CSS stone, no ribbon, no skull artwork beyond an emoji |
| Post-life menu | postlife.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | extra Continue-as-child row |
| Cold start / New Life | newlife.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | no splash, disclaimer or language picker |
| Pets sources | pets.jpg | ✓ | ✓ | ✓ | ✓ | CLOSE MATCH | four sources vs five; no horse ranch |
| Menu | menu.jpg | – | – | – | – | NOT OBSERVED IN REFERENCE | |
| Achievement toast | – | | | | | MISSING | badge banner exists but styled differently (top pill card) |
| Splash / disclaimer / language | – | | | | | MISSING | not built |

## 6. Parity pass 2.4 (2026-09-18): rebuilt PARTIAL and MISSING items from the recordings

Rewatched again from the start (V1 every second, V2 every two seconds). Fresh mismatch checklist and what changed:

| Checklist item (reference) | 2.3 state | 2.4 |
|---|---|---|
| Cold start: red splash with logo mark and publisher line → disclaimer screen → language card (globe band, prompt, big icon, dropdown, blue button) → empty life frame | MISSING | built: splash (1.7 s), disclaimer (tap or 3.5 s), language card with English/Spanish/French/Portuguese, remembered once |
| Header: logo mark before the brand, ribbon counter in the middle, two-line pill on the right | logo missing, pill single line | logo mark, 🏅 counter, "Become a / PLAYER+" pill (premium candidate) |
| Character strip: flag before the underlined name, status pictogram (🍎 student, 📊 job) | no flag, briefcase icon | flag from the country of residence, 🍎/📊/🍼 status icons, 42 pt avatar, 16 pt name |
| New friend card: avatar band "Name · Friend/Classmate", 🤗 New Friend, facts, Looks/Smarts/Craziness bars with an axis line, "Become friends with him/her" / "Reject him/her", Surprise me | info card with OK, Looks/Smarts/Kindness | decision card with the same structure; rejecting removes the person |
| Love interest card: ❤️ Love Interest, Activity and Clique facts, Looks/Grades/Popularity, "Start going out with him/her" / "Reject him/her" | info card | decision card with the same facts and trait set |
| Achievement toast: full-width white strip over the header with a trophy pattern, 🏆, uppercase condensed title, subtitle | pill banner | rebuilt as the strip; slides in, closes on tap or after 3 s, never blocks Age |
| Tombstone: ragged stone with mottling, corner ribbon with an icon and one word, skull, uppercase name, "AGED N YEARS", epitaph, grass with rocks and a flower, pill Continue, yellow undo link | flat stone | rebuilt (ribbon words: Unlucky, Wealthy, Ancient, Family, Hard Worker, Scholar, Long Life, Ordinary); the undo link is a premium-candidate toast |
| Post-life: ☠️ + name 24 pt, blue "Continue as Child (age)" with a lighter age, green, yellow, link | 20 pt title, tighter gaps | 24 pt title, reference spacing, lighter age |
| Relationships: Enemies section, Late Pets section ("Died N years ago", skull, dots), 🕰️ "Spend Time With All..." footer | none | school rival event creates an enemy (Make Peace / Confront / Ignore); dead pets listed; footer text and icon |
| Assets: Misc. → Social Media (channels, "Sign up for X", Inactive Channels) | none | Social Media with four original platforms, followers, Post and Delete Account |
| Vehicle: Abandon row | none | Abandon (Garage needs the racing pack and Pay Off needs loans: not built) |
| Jobs: every row active; rejection on apply | unqualified rows greyed | rows active; "Application Rejected" card on apply |
| Death nav slot "Death" with a tombstone ring | "Summary" with a candle | "Death" with 🪦 |

Still intentionally absent (premium or content policy): Edit/God Mode row, Landlord, Golden items, Premium Activities, Just For You, Garage, Pay Off, the "Complete a Life" challenge capsule.
Still different: journal voice stays second person; icons are colour emoji rather than the reference's own artwork; the stone is CSS, not an illustration.

## 7. Parity pass 2.5 (2026-09-18): pictograms, tombstone artwork, capsule, splash, header audit

Fresh mismatch list after re-reading the recordings against the 2.4 production captures at 2.5× (header, strip,
journal, rows, bottom bar, cards), and what changed. Comparison sheets in [comparisons/](comparisons/) are now
REFERENCE | PRODUCTION captures, not local builds.

| # | Mismatch found on the rewatch | 2.5 fix |
|---|---|---|
| 1 | Row and card icons were OS emoji: inconsistent weight, wrong shapes, platform-dependent | New `pictograms.js`: ~190 original flat vector glyphs (filled colour shapes, ~35 pt in rows), used by every row, card title, stat, strip and header; no emoji left in the UI |
| 2 | People were emoji faces; the reference draws individual heads | Drawn avatars per person (skin, hair, shirt, glasses, beard, grey hair after 60, baby/child variants), deterministic from the name, in rows, cards, strip and person screens |
| 3 | Country flag was an emoji | SVG flags for the 16 birthplaces |
| 4 | Header: uppercase display wordmark with a white outline, drawn logo mark, star-with-speed-lines counter | Logo mark (white disc, red figure), wordmark 27 pt condensed uppercase with a 2 pt drop shadow, speed-line star counter 26 pt, two-line pill |
| 5 | Strip: name 17 pt, avatar 42 | Name 18 pt bold underlined blue, avatar 44 pt drawn head bleeding left like the reference, status glyph 15 pt, occupation 14 pt |
| 6 | Journal: 14.5/13.5 pt, 12 pt inset | Year 15 pt bold blue, lines 14 pt at 1.15, 15 pt year gap, 15 pt left inset, #555 text |
| 7 | Stat and relationship bars had no axis line | 2 pt dark axis at the left of every track |
| 8 | Nav ring glyphs were thin strokes | White filled glyphs in the rings; Assets uses the money-bag; Age button "+" drawn at 4.5 pt stroke |
| 9 | Tombstone was CSS gradients | SVG artwork: ragged silhouette with turbulence texture and cracks, red corner ribbon with word and icon, skull and crossbones, 22 grass blades, rocks, flower; name/age/epitaph overlaid |
| 10 | No "Complete a Life" capsule | Capsule above the stone: green icon disc, small grey title, bold subtitle, pill shape, slide-in |
| 11 | Splash used a seedling and one-line credit | White cell-with-tail mark 250 pt, logo + uppercase wordmark, two-part credit "AP CS Arcade | student project" (original, no publisher logos) |
| 12 | Reference-only rows were omitted | Kept with original wording and grey pack badges: Reconnect (Special), Rewind and Life Editor (Premium Activities), Career Match (Just For You), Landlord, Garage, Pay Off, Edit |
| 13 | Job screen had a header row and seven rows | Four rows like the reference (Human Resources, Resign, Retire, Work Harder); raise and take-it-easy moved under Human Resources |
| 14 | Assets started with Finances/Housing | Real Estate (Landlord, Properties) → Vehicles → Possessions → Misc. (Social Media); Finances moved to the menu |
| 15 | Shops greyed out unaffordable or unlicensed items and showed a bank row | Every item listed and tappable; refusal is a red card ("Not So Fast"), like the reference's post-tap refusal |
| 16 | Love favourite greyed once you had a partner | Never greyed after 18 |
| 17 | Post-life title used an emoji skull | Drawn skull glyph, 24 pt name |

### 7.1 Header and strip pixel audit (390 pt frame, measured in the browser)

| Element | Reference | 2.5 |
|---|---|---|
| Menu ring | 28 circle at x 12, y 10 | 28 circle at x 12, y 10 |
| Logo mark | 32 disc at x 52 | 32 disc at x 52 |
| Wordmark | condensed uppercase ~27 pt, yellow, dark drop shadow | condensed uppercase 27 pt, yellow, 2 pt shadow |
| Counter | star with speed lines + 26 pt number, centred | same, x 206–288 |
| Pill | two lines, 80 × 34, right 12 | 80 × 34, right 12 |
| Avatar | ~44 drawn head, bleeds left, top 47 | 44 drawn head at x 8, top 47 |
| Flag | 17 × 13 at x 60 | 17 × 13 at x 60 |
| Name | 18 bold blue underlined, baseline ~66 | 18 bold blue underlined, box 51–71 |
| Status line | glyph 15 + 14 pt blue at y 71 | glyph 15 + 14 pt blue at y 71 |
| Money | 19 bold green, right 12; "Bank Balance" 13 blue | same |
| Blues | name/status #1657a8, title bar #0b4a8f | same tokens |

### 7.2 Still not identical after 2.5

- The pictograms are original drawings; they share size, colour treatment and placement with the reference but are not the same pictures (for example the reference's plumber is water drops, ours is a wrench).
- The tombstone is vector art drawn for this project; the silhouette, ribbon, skull, grass and rocks follow the reference layout but the illustration style differs.
- The splash mark and credit line are original; the reference shows publisher logos.
- Premium and pack badges are grey text labels, not the reference's illustrated badges.
- Journal voice stays second person (original writing rule).
- Advertising banners and the red close button of the reference's ad layer are not reproduced.

## 8. Pass 2.6 — WebKit-only tooling and a measured stats/nav/title pass

Every capture, flow test and smoke test in this pass ran on WebKit. See section 8.4.

### 8.1 Mismatch checklist built before coding

Rewatched both recordings, re-picked frames, then compared reference frames with WebKit captures of the local build at 390 x 844 (585 px wide, 1.5x). Only differences that survived pixel measurement are listed.

| # | Screen | Reference | Before 2.6 | Fixed |
|---|---|---|---|---|
| 1 | Main, stat bars | bar 16.0 pt tall | 12.7 pt | yes |
| 2 | Main, stat rows | pitch 20.7 pt | 20.7 pt (kept) | n/a |
| 3 | Main, stats block | 31.3 pt of white between nav and first bar | 12.7 pt | yes |
| 4 | Main, stat bars | green starts at 113.3 pt | 122.0 pt | yes |
| 5 | Main, stat labels | ink 53.3 pt wide, 10.7 pt tall | 70.0 / 13.3 pt | yes |
| 6 | Main, percentages | ink 24.7 pt wide, 8.7 pt tall | 30.0 / 10.7 pt | yes |
| 7 | Main, rewind button | 32.7 pt across, centre 6.0 pt below the nav, 32.3 pt right of the Age centre | 30.7 pt, 27.7 pt above the nav, 42.0 pt right | yes |
| 8 | Nav bar | 78.0 pt tall | 77.0 pt | yes |
| 9 | Every secondary screen, title | "JOB" ink 32.0 pt wide, cap 14.7 pt | 34.7 / 16.0 pt | yes |
| 10 | Every secondary screen, back button | circled chevron | circled arrow | yes |
| 11 | Section bars | 20.7-21.3 pt tall | 20.0 pt | yes |
| 12 | Rows with an age note | every row 70.0 pt | note rows 74.0 pt | yes |
| 13 | Row right affordance | three dots spread wider | tighter cluster | yes |

### 8.2 Measured after the fixes

| Item | Reference | 2.6 |
|---|---|---|
| Nav height | 78.0 pt | 77.3 pt |
| Stat bar height | 16.0 pt | 16.0 pt |
| Stat row pitch | 20.7 pt | 20.7 pt |
| Nav bottom to first bar | 31.3 pt | 32.0 pt |
| Green bar left edge | 113.3 pt | 113.3 pt |
| Stat label ink | 53.3 x 10.7 pt | 54.7 x 10.7 pt |
| Percentage ink | 24.7 x 8.7 pt | 24.7 x 8.7 pt |
| Rewind diameter | 32.7 pt | 32.7 pt |
| Rewind centre vs nav bottom | +6.0 pt | +6.7 pt |
| Rewind centre vs Age centre | +32.3 pt | +32.3 pt |
| Title bar height | 47.3 pt | 46.7 pt |
| "JOB" title ink | 32.0 pt | 32.0 pt |
| "RELATIONSHIPS" title ink | 140.0 pt | 133.3 pt |
| Relationship row height | 70.0-70.7 pt | 70.0 pt |
| Row avatar | 35.3 pt, inset 12.7 pt | 36.0 pt, inset 12.0 pt |

### 8.3 Still not identical after 2.6

- Condensed title face. Our stack resolves to Avenir Next Condensed, whose narrow letters are tighter than the reference face. Tracking is set so short titles match exactly and "RELATIONSHIPS" lands 4.8 percent narrow. Matching both at once needs the reference's actual typeface.
- Everything listed in section 7.2 still holds: original pictograms, original tombstone and splash art, text badges instead of illustrated ones, second-person journal voice, and no advertising layer.
- The reference's person and relationship screens carry an ad banner between rows. We render the rows continuously instead.

### 8.4 Browser compliance

- Engine used: WebKit only. Captures run through a native WKWebView tool (`games/betlife/web/tests/wkshot.swift`); interaction and smoke tests run through Playwright's WebKit build.
- Removed: `games/betlife/web/tests/screenshot.mjs`, which drove Chromium over the DevTools protocol, is deleted. `tests/screenshot-all.sh` now calls the WKWebView tool.
- No test, capture, flow run or production check in this pass launched Chromium, Chrome, Chrome Headless, Puppeteer or `chromium.launch()`.
