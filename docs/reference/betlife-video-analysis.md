# BetLife — Reference Video Analysis (master blueprint)

Analysis of two gameplay recordings of a commercial mobile life simulator, made on 2026-09-15, used as the
PRIMARY product/UX reference for the next BetLife web builds. This document describes mechanics, screen
structure and interaction patterns. It deliberately does not reproduce proprietary text, names, artwork
or branding: every quoted item is a short label needed to identify a mechanic, and BetLife will use its
own original names, writing, icons and art.

Evidence labels: `OBSERVED` (directly visible), `INFERRED` (strongly suggested), `NOT OBSERVED`.
Timestamps are `V1 mm:ss` (short recording) and `V2 mm:ss` (long recording).
Frame index with every timestamp: [betlife-video-index.md](betlife-video-index.md).

## Table of contents

1. [Videos and method](#1-videos-and-method)
2. [Timelines](#2-timelines)
3. [Screen inventory](#3-screen-inventory)
4. [Main life screen](#4-main-life-screen)
5. [Age-up loop](#5-age-up-loop)
6. [Life stages](#6-life-stages)
7. [New life flow](#7-new-life-flow)
8. [Birth](#8-birth)
9. [Relationships](#9-relationships)
10. [Education](#10-education)
11. [Jobs and career](#11-jobs-and-career)
12. [Activities](#12-activities)
13. [Assets](#13-assets)
14. [Money and economy](#14-money-and-economy)
15. [Health](#15-health)
16. [Events](#16-events)
17. [Decisions](#17-decisions)
18. [Premium audit](#18-premium-audit)
19. [Menu and settings](#19-menu-and-settings)
20. [Visual language](#20-visual-language)
21. [Interaction patterns](#21-interaction-patterns)
22. [Gap analysis against current BetLife web](#22-gap-analysis-against-current-betlife-web)
23. [Original BetLife equivalents](#23-original-betlife-equivalents)
24. [Content scale](#24-content-scale)
25. [Implementation phases](#25-implementation-phases)
26. [Recommended first implementation batch](#26-recommended-first-implementation-batch)
27. [Content policy notes](#27-content-policy-notes)

---

## 1. Videos and method

| File (in `games/betlife/Betlife videos/`) | Duration | Resolution | Codec | Content |
|---|---|---|---|---|
| `ScreenRecording_09-15-2026 15-46-39_1.MP4` | 0:21.9 | 1170 x 2532 (iPhone portrait) | HEVC + AAC | Cold start: splash, disclaimer, language picker, empty main screen, OS notification prompt |
| `ScreenRecording_09-15-2026 15-47-53_1.MP4` | 12:34.2 | 1170 x 2532 | HEVC + AAC | Two full lives: a boy who dies at 9, then a girl played from birth to a surrender at 51, plus continuation as her son |

Method (OBSERVED end to end, not metadata only):
- Frames extracted with a small AVFoundation script (temporary, kept outside the repository).
- V2 sampled every 10 s (76 frames), then every 4 s across the whole recording (189 frames), then every
  1 s around transitions: birth and first ages, relationships list, Mind & Body submenu, graduation to
  university, job referral and Job screen, vehicle detail, death, surrender. V1 sampled every 1 s.
- About 330 frames reviewed on labelled contact sheets. No frames are committed to Git.
- Recording quirks to ignore: ad banners under the game, three interstitial ads (V2 4:42-4:46,
  6:30, 6:54, 8:38, 9:22-9:58), phone notifications, and the iOS control centre at V2 12:34.

## 2. Timelines

### 2.1 Video 1 (0:22) — cold start

| Time | Screen / action | Important observation |
|---|---|---|
| 0:00 | Splash | Solid red background, app logo centred, publisher logos at the bottom |
| 0:03 | Disclaimer | Two paragraphs: all characters and events are fictional and randomly generated |
| 0:07 | Language dialog | Modal card: globe icon, "Hello! Hola! Olá! Hallo!" band, dropdown (Spanish, French, Portuguese, English), one blue confirm button. Dropdown opened and changed to English at 0:11-0:17 |
| 0:19 | Empty main screen | Red header (menu, logo, premium button), grey strip showing only a placeholder balance, blank journal, grey bottom bar with a single green round "New Life" button in the centre, no stats drawn |
| 0:20 | OS notification permission | System prompt, unrelated to the game |

### 2.2 Video 2 (12:34) — two lives

Life 1: boy, born in Haiti, dies at 9. Life 2: girl, born in the US, surrenders at 51; continued as her son (24).

| Time | Screen / action | Important observation |
|---|---|---|
| 0:02 | Main, age 0 | Journal opens with the birth block (see §8). Strip: name with country flag, "Infant", $0. Nav: Infant, Assets, Age, Relationships, Activities. Header shows a ribbon counter "0" with a countdown "5h12m" and a "Become a …" premium button. Two promo banners sit between journal and nav |
| 0:06 | Age 1 event: vaccination (Mother) | Decision with 3 choices + "Surprise me!" (random pick) |
| 0:13 | Relationships list | Sections: Special (premium ring item, cult item disabled), Parents, Siblings, Pets. Each person row: avatar, name, (role), green relationship bar, chevron |
| 0:15 | Father detail | Name (Age 38), bar, "Edit" row with God Mode badge, Activities: Recruit (cult badge), Spy (disabled). No talk/gift actions at infant age |
| 0:34 | Main, age 2 | Two journal lines under age 2; ages 1 and 2 grouped under headings |
| 0:38 | Activities (infant) | Only a "Premium Activities" section, all rows greyed (Movie Director, Vampire Mode, Outdoor Lifestyle, Luxury Lifestyle with wealth bar, Casino, Black Market, Commune, Racing, Secret Agent, Zoo) |
| 0:46 | Childhood decision: favourite toy taken | 4 choices + Surprise me |
| 0:50 | Info dialog: baby sister born | Avatar band "Sister", Name / Relationship fields, single OK |
| 0:54 | Childhood decision: integrity | 2 choices |
| 0:58 | Education info: primary school starts | Fields School / Type / Level / Years, OK. Achievement toast "School's in Session". Nav item becomes School, status "Primary School Student" |
| 1:02 | Pet detail (cat, age 9) | Relationship bar, Activities: Bathe, Release, Spend Time, Treat |
| 1:10 | New Friend (classmate) | Name / Gender / Age, Looks-Smarts-Craziness bars, Become friends / Reject / Surprise me. Achievement toast "Bosom Buddies" |
| 1:14 | Activities (child, age 7) | Favorites: Mind & Body, Pets. Premium section greyed |
| 1:16 | Pets menu | Animal Shelter, Cat Breeders, Dog Breeders, Horse Ranch (disabled), Pet Store |
| 1:19 | Mind & Body (age 7) | Most rows disabled at this age (Acting Lessons, Diet, Garden, Gym, Library, Martial Arts, Meditate, Memory); enabled: Book, Instruments |
| 1:22 | Instruments | ~20 instruments, each "Take X lessons" with "..." menu |
| 1:38 | Parents gift an instrument | Decision: accept gratefully / act unappreciative; shows Finish and Estimated Value |
| 1:42 | Healthcare: eyesight | Info OK, then eye exam mini-game (find the odd character in a grid, countdown, escape link "I need contacts") |
| 1:50 | Main, age 8 | Journal shows eyesight worsened, exam passed |
| 1:54 | Crime decision ("mischief") then Crime menu | Menu rows: Embezzle (disabled), Grand Theft Auto (disabled), Hack, Hitman, Mischief, Murder (disabled), Pickpocket, Porch Pirate, Shoplift, Train Robbery. Pickpocket dialog with a victim dropdown. Achievement toast |
| 2:06 | Relationships (age 8) | Now Parents, Siblings (2), Pets, Friends |
| 2:14 | Pets submenus | Animal Shelter list (name, breed, age), Pet Store (all items carry the premium badge), premium purchase modal at 2:26 (benefits list, price, bundle with God Mode) |
| 2:34 | Dog Breeders | Breed list, then dogs of that breed with premium badge |
| 2:41 | Death at 9 | Journal line "died after …" with net worth; strip status "Deceased"; stats turn grey; nav becomes Death + New Life; red flash; tombstone screen (ribbon "Unlucky", name, age, epitaph mentioning attendees, Continue, premium "Undo death with the Time Machine!"). Achievement "Complete a Life" |
| 2:54 | Post-death menu | Skull + name, "Start an all-new life or try again as X", buttons: new random life (green), custom life (yellow), link "try again as X" |
| 2:58 | Life 2, age 0 | New birth block; parents remarry at age 1 (stepmother, stepfather appear later) |
| 3:02 | Mother offers a pet cat | Pet stats (Health, Happiness, Smarts, Craziness), Yes / No |
| 3:10 | Classmate steals from teacher | 4 choices incl. "Report him to the principal" |
| 3:14 | Main, age 7 | Elementary at 5; journal groups 2-3 lines per year |
| 3:18 | School decision: field trip | 4 choices (socialize / stay home / goof off / pay attention) |
| 3:22 | Entertainment decision: movie invitation | Movie title and genre fields, 2 choices |
| 3:26 | New Friend (age 12) | Same structure as 1:10 |
| 3:30 | Age 8-13 | Achievement "Made 3 friends"; middle school at 11; father illness then recovery; cat died at 13 |
| 3:34 | Eye exam again | Same mini-game |
| 3:42 | High school info | School / Type / Level / Years: 4. Achievement. Status "High School Student" |
| 3:46 | Personal decision: good vibes | 4 choices |
| 3:50 | Driving test | Road-sign quiz (3 answers); journal: passed, licence, mother bought a car at 16 |
| 4:02 | Love interest (classmate asks out) | Name / Gender / Age / Activity / Clique, Looks-Grades-Popularity bars, Start going out / Reject |
| 4:06 | Age 18 graduation | Decision: Golden diploma (premium), Apply to university, Take some time off. Nav becomes Occupation, status Unemployed |
| 4:12 | University dialog | "Pick your major" dropdown (Engineering), Apply / Never mind; toast "Rejected" for scholarship; journal: accepted, student loan taken. Nav back to School, status University Student |
| 4:18 | Relationship decision (mature) | 4 choices. Out of scope for BetLife (see §27) |
| 4:26 | Age 19 | Journal: boyfriend got a job (other people's lives progress) |
| 4:30 | Fertility decision | Keep / don't keep / premium item / Surprise me. Out of scope |
| 4:34 | Movie Director promo mini-flow | Script dialog (Tone, Theme, actor dropdown, Start filming), on-set decision, then paywall (R$49,90). Second paywall for a fighting mode |
| 4:49 | Proposal decision | Ring / Setting / Years Together fields, Relationship bar, Accept / Not ready. Info "How could I say no?" |
| 4:51 | Age 22 | Graduated engineering; bank -$7,102 (loan); status Unemployed; car breaks (Golden Wrench premium / Repair $1,116 / later) |
| 4:55 | Job referral from father | Title / Career / Employer / Salary fields, Take the job / Not for me |
| 4:56 | Mother buys a mobile home | Address / Size / Age / Monthly Expense, Condition bar, Accept / Turn down. Info "New pad" |
| 4:58 | Welcome-to-job info | Title / Career / Employer / Salary. Achievement "9 to 5". Nav becomes Job |
| 5:00 | Best-friend advice decision | 4 choices |
| 5:06 | Job screen (bottom part) | Human Resources, Resign, Retire, Work Harder |
| 5:10 | Occupation screen | Current job with Performance bar, Schedule with Stress bar, "Just For You" (premium modes, Golden Resume, Golden Diploma), Special Careers list, "All": Education, Freelance Gigs, Job Recruiter, Jobs, Military, Part-Time Jobs, Special Careers |
| 5:14 | Special Careers | Actor, Astronaut, Business, Dealer, Mafia, Model, Music Producer, … all with a premium badge |
| 5:18 | Part-Time Jobs | Hourly listings: title (category) $/hour |
| 5:26 | Jobs | Full-time listings: title (category), yearly salary, "..." menu, sorted by salary |
| 5:42 | Education menu | University, Golden Diploma, Graduate School, Business School, Dental School, Law School, Medical School, … |
| 5:50 | Assets | Finances, Investments (badge), Luxury Lifestyle (wealth bar), expansion packs, Premium Assets (Auction Houses, Casino, Museum, Race Car Garage, Zoo), Collectibles: Belongings, Real Estate: Landlord (badge), Properties, Vehicles: car with Condition bar, Possessions: ring with Condition bar, Misc: Social Media, footer "Go Shopping..." |
| 5:58 | Shopping | Categories: Bicycles, Car Dealers (4), Jewelers (2), Music Stores, Real Estate Brokers (2), Specialty Vehicle Dealers (aircraft x2, marine) |
| 6:06 | Aircraft dealer | Items: name (type) price |
| 6:14 | Real estate broker | Home type (address) price; "Refresh Inventory..." footer |
| 6:22 | Music store | Instruments with prices ($15-$440) |
| 6:26 | Jeweler | Items with carat and price |
| 6:38 | Car dealers | New/Used, body type, price ($5k-$49k) |
| 6:58 | Vehicle detail | "View your 15-year old hatchback"; Abandon, Drive, Garage (badge), Gift, Maintenance, Pay Off (disabled), Repair, Sell, Scrap. Repair dialog then Golden Wrench paywall |
| 7:18 | Social Media | Platforms list + "Inactive Channels"; sign-up dialog |
| 7:30 | Fiancé detail | Age, bar, Edit (God Mode), Activities: Ask for Money, Break Up, Cancel Engagement, Celebrate Anniversary, Compliment, Conversation, … |
| 7:38 | Father / Stepmother detail | Conversation, Doctor, Deal, Gift, Insult, Movie Theater, Recruit (badge), Spend Time, Spy (disabled) |
| 7:46 | Friend detail (tail) | Rumor, Spend Time, Spy, Unfriend, Watch YouTube |
| 7:50 | Relationships list (adult) | Fiancé at top, Parents (incl. step-parents), Friends (incl. best friend), Enemies; footer "Spend Time With All" -> dialog "Relationships: 8" |
| 8:02 | Love menu | Dating rows (celebrity app, date, app, LGBTQ app, hook-ups). Only "date" style rows are in scope |
| 8:06 | Activities (adult) | Favorites, Premium Activities, All (alphabetical, ~35 rows), footer "Surrender..." |
| 8:42 | Identity submenu | Gender, Name Change, Sexuality |
| 8:58 | Plastic Surgery submenu | Out of scope |
| 9:14 | Friend decision at a distillery | 3 choices |
| 9:18 | Pregnancy decision | Out of scope |
| 10:02 | Age 26 | Mother pneumonia; pregnancy line |
| 10:06 | Baby born info | Avatar band "Son", Smarts/Looks bars |
| 10:10 | Promotion info | New Title, New Salary (+34.9%), Career, Employer |
| 10:14 | Supervisor decision: overtime | Current Hours / New Hours fields, 3 choices |
| 10:18 | Ages 27-32 | Raises with percentages, loan paid off, son started school, father died, inheritance $2.66M; bank jumps to $2.68M; Happiness 0% shows a warning icon and a yellow "+ Boost!" button |
| 10:26 | Achievement "Millionaire" | Toast |
| 10:34 | Son ill / cured | Green-bordered info dialogs with OK |
| 10:46 | Friend decision: spying | 3 choices |
| 10:50 | New friend (coworker, 64) | Includes Occupation line |
| 11:06 | Fiancé cheating decision | 4 choices (argue, attack, forgive, break up) |
| 11:26 | Son's college major decision | Dropdown + 2 choices |
| 11:38 | Co-worker attack | Pick move / target dropdowns, then HR investigation. Out of scope (violence) |
| 11:50 | Leisure decision: video game | 4 choices |
| 11:54 | Counseling decision | Relationship bar, 2 choices |
| 11:58 | Fiancé leaving | 4 choices |
| 12:02 | Activities footer "Surrender..." | Confirm dialog (Yes / Cancel) |
| 12:14 | Deceased | Same death presentation; tombstone ribbon "Wasteful"; summary fields Net Worth, Residence, Career, Education, Children, Lovers, Murders; life-summary paragraph |
| 12:18 | Post-death menu | "Continue as Bill (24)" (child), new random, custom, try again |
| 12:26 | Continued as son | Journal: inheritance line; Job decision: professional development focus (4 choices) |

## 3. Screen inventory

Classification key: FREE GAMEPLAY / PREMIUM-CANDIDATE / UNKNOWN / OUT OF SCOPE (content policy, §27).

| # | Screen | Reached from | Header | Information | Main actions | Notes | Class |
|---|---|---|---|---|---|---|---|
| 1 | Splash + disclaimer | App start (V1 0:00) | none | logo, legal text | auto-advance | BetLife web: optional 1-2 s splash | FREE |
| 2 | Language picker | first run (V1 0:07) | band with greeting | dropdown | confirm | Nice-to-have for BetLife (EN/PT) | FREE |
| 3 | Empty main | before first life (V1 0:19) | red header | placeholder strip | New Life button | Equivalent to BetLife start menu | FREE |
| 4 | Main life | after birth; every Back/close (V2 0:02, 3:14, 10:18) | red header: menu, logo, ribbon counter, premium | strip, journal, banners, nav, stats | Age, nav items | See §4 | FREE (premium button excluded) |
| 5 | Event decision modal | Age / actions (V2 0:06 and ~30 more) | category band, optional avatar | title, text, optional fields/bars/dropdown | 2-4 blue options + Surprise me | Blocks game | FREE |
| 6 | Info modal | after outcomes (V2 0:50, 4:50, 4:57, 10:10) | avatar band or none | title, text, optional fields | OK / none | Blue border variant for outcomes, green for health | FREE |
| 7 | Relationships list | nav (V2 0:13, 2:06, 7:50) | close X, title | sectioned people rows with bars | tap row; footer "Spend Time With All" | Sections vary with life | FREE |
| 8 | Person detail | list row (V2 0:15, 7:30, 7:38, 7:46) | back, role title | name (age), bar, Edit row (God Mode) | activity rows (see §9) | Some rows disabled by age/context | FREE, Edit = PREMIUM-CANDIDATE |
| 9 | Pet detail | list row (V2 1:02) | back, "CAT" | name (age), bar | Bathe, Release, Spend Time, Treat | | FREE |
| 10 | Activities | nav (V2 0:38, 1:14, 8:06) | close X | Favorites / Premium / All | rows -> submenu or modal; footer Surrender | Age-gated rows greyed | FREE (premium modes excluded) |
| 11 | Mind & Body | Activities (V2 1:19) | back | rows | Book, Instruments, Gym, Meditate, Library, … | Most disabled at 7 | FREE |
| 12 | Instruments | Mind & Body (V2 1:22) | back | ~20 rows | "..." action per instrument | Journal + parents gift | FREE |
| 13 | Pets menu | Activities (V2 1:16) | close | 5 rows | Shelter, breeders, store | | FREE (store badge ignored) |
| 14 | Animal Shelter / Pet Store / Breeders | Pets (V2 2:14-2:38) | back | animal rows: name (breed) age | "..." adopt/buy | Store items premium in reference | FREE |
| 15 | Crime menu | Activities (V2 1:58) | close | ~10 rows | modal with dropdown | Mostly OUT OF SCOPE; keep only harmless "mischief" | OUT OF SCOPE |
| 16 | Tombstone / death | on death or surrender (V2 2:43, 12:16) | none | ribbon, name, age, epitaph, summary | Continue; premium undo | | FREE, undo = PREMIUM-CANDIDATE |
| 17 | Post-death menu | Continue (V2 2:54, 12:18) | none | skull + name | continue as child, new random, custom, retry | | FREE |
| 18 | Occupation / Job | nav (V2 5:06, 5:10, 5:22) | close | current job + performance, schedule + stress, sections | Work Harder, Resign, Retire, HR; Jobs, Part-Time, Military, Recruiter, Special, Education, Freelance | | FREE (special careers FREE too) |
| 19 | Jobs list | Occupation (V2 5:26) | back | title (category) salary | "..." apply | Sorted by salary | FREE |
| 20 | Part-Time Jobs | Occupation (V2 5:18) | back | title (category) $/hour | "..." | | FREE |
| 21 | Special Careers | Occupation (V2 5:14) | back | rows with badge | | FREE in BetLife | FREE |
| 22 | Education menu | Occupation (V2 5:42) | back | University, grad schools | "..." | | FREE (Golden Diploma = PREMIUM-CANDIDATE) |
| 23 | Assets | nav (V2 5:50, 6:58, 7:14) | close | sectioned rows, condition bars | rows; footer Go Shopping | | FREE (expansion packs excluded) |
| 24 | Shopping | Assets footer (V2 5:58) | close | dealer categories | rows | | FREE |
| 25 | Dealer / broker / store lists | Shopping (V2 6:06-6:46) | back | items with price | "..." buy; real estate "Refresh Inventory" | | FREE |
| 26 | Vehicle detail | Assets row (V2 6:58) | back, body type | description row | Abandon, Drive, Garage, Gift, Maintenance, Pay Off, Repair, Sell, Scrap | | FREE (Garage badge ignored, Golden Wrench = PREMIUM-CANDIDATE) |
| 27 | Social Media | Assets row (V2 7:18) | back | platform rows | sign-up dialog | Original platform names for BetLife | FREE (P3) |
| 28 | Love menu | Activities (V2 8:02) | back | rows | date / apps | Only dating in scope | FREE (partial) |
| 29 | Identity | Activities (V2 8:42) | back | Gender, Name Change, Sexuality | | Name change in scope | FREE (partial) |
| 30 | Eye exam mini-game | healthcare event (V2 1:46, 3:34) | band Healthcare | letter grid, timer | tap odd letter; escape link | | FREE |
| 31 | Driving test quiz | licence event (V2 3:50) | band License | road sign | 3 answers | | FREE |
| 32 | Premium paywall modals | premium rows (V2 2:26, 4:42, 7:06) | none | art, benefits, price | Get it now / restore | Not built | excluded |
| 33 | Surrender confirm | Activities footer (V2 12:13) | avatar band "You" | question | Yes / Cancel | Native-style confirm | FREE |
| 34 | Achievement toasts | milestones (V2 0:58, 1:10, 3:30, 4:56, 10:26) | top pill | icon, name, description | none | Also a banner variant at the very top | FREE (P2) |

## 4. Main life screen

OBSERVED layout, top to bottom (V2 0:02, 3:14, 10:18, 12:14):

1. Header (red): hamburger menu (left), logo (centre-left), ribbon/achievement counter with a countdown
   timer next to it (INFERRED: free premium timer or daily reward), premium "Become a …" pill (right).
2. Character strip (pale grey): round avatar (emoji-like face; changes with age and sex: baby, child,
   adult, elderly grey hair at 51), country flag, name (underlined, tappable, small pistol/info glyph next
   to it), second line with status icon + status text (Infant, Primary School Student, Middle School Student,
   High School Student, Unemployed, University Student, job title, Deceased). Right side: bank balance
   in bold, negative shown as "-$7,102" in red, label "Bank Balance".
3. Journal (white): "Age: N years" headings in bold blue, one line per event in grey, no cards, no
   markers, paragraphs separated by a blank line. Always scrolled to the newest year. New year appended at
   the bottom. Text uses first person ("I …"). Death line ends the journal; after death the whole
   journal stays visible and the strip reads Deceased.
4. Promo banners (two small pills above the nav) and after age 18 a yellow "Pray" pill. Not needed.
5. Bottom navigation (blue): five slots. Left slot follows life stage/occupation: Infant -> School ->
   Occupation (unemployed adult) -> Job (employed) -> School again during university -> Death (dead).
   Second slot Assets; centre a big green round "+ Age" button with a small red "- Age" circle attached
   at its lower right (INFERRED: premium rewind); fourth Relationships; fifth Activities. Each item is an
   icon in a small teal circle above a white label. On the dead screen the bar collapses to Death and a
   "New Life" button that replaces Age.
6. Stats (white): four rows Happiness, Health, Smarts, Looks; label, emoji, green bar, percentage in a
   grey pill. Low stats show a red warning triangle before the label and a yellow "+ Boost!" button over
   the bar (V2 10:22, 11:18, 11:42). Bars turn grey when dead (V2 2:41). Emoji face for happiness changes
   with the value (laughing at 100, neutral at 48, crying at 0).

Changes across phases: only the strip status, avatar, and the first nav item change; layout is constant
from newborn to old age (V2 0:02 vs 12:02). At the moment of death the header turns dark red with a
dripping-blood edge (V2 12:14) and everything greys.

## 5. Age-up loop

What one press of Age does (OBSERVED V2 0:06-0:34, 3:14-4:14, 10:02-10:22):

- Immediate: a short dark overlay with the logo and a thumbs-up / thumbs-down pair (rating prompt) while
  the year is processed (V2 0:06, 3:34, 4:08). Then dialogs appear one at a time.
- Age +1 and a new "Age: N years" heading in the journal.
- Journal additions per year: typically 1 to 4 lines. Lines come from: automatic world events (family
  illness, a parent's promotion or retirement, world news), the results of the year's decisions,
  milestone lines (started school, graduated, hired, promoted with the new salary, raise with a
  percentage, licence, inheritance), other people's progress (boyfriend got a job / promoted, son started
  school), and pet events.
- Random events: 0-2 per year; some are info-only (OK), some are decisions. Milestones (school starts,
  graduation, university acceptance, baby born, promotion) show as info or decision modals and take
  priority; the year can still add a random decision after them (V2 4:06 graduation then 4:12 university).
- Education: enrolment info at 5/6, transitions at 11 and 14, graduation decision at 18, university
  major dialog, degree at 22.
- Career: hired (referral event), promotions with a percentage, yearly raises, supervisor events,
  coworker friendships.
- Relationships: friends made through events, family illnesses and deaths, parents' remarriages,
  proposals, breakups, children born and growing (their milestones appear in the journal).
- Money: salary and loan effects are reflected in the balance (student loan -$7,102 at 22, -$14,204 the
  next year, then +$2,824 after the first salary year; inheritance jumps). Salary numbers are shown in
  dialogs, not as journal accounting lines.
- Stats: happiness moves strongly with events (0% after a breakup, 100% after good years); health slowly
  declines in the 40s (100 -> 68 by 40, 59-69 in the 40s); looks decline slowly with age (55 -> 38);
  smarts rise with study and fall a little with age.
- Unlocks by year: nav item and activity rows enable with age (§6).
- The Age button is disabled while a modal is open (modals are full-screen overlays); "Surprise me!"
  lets the player randomise a decision instead of choosing.

## 6. Life stages

| Age/range | Stage label (strip / nav) | Available systems (OBSERVED) | New unlocks |
|---|---|---|---|
| 0-4 | Infant / nav "Infant" | Relationships (parents, siblings, pets), Assets (empty), Activities visible but greyed | Decisions about behaviour (vaccination, tantrum, toys) |
| 5-10 | Primary/Elementary School Student / nav "School" | School, friends, pets (adopt/store), Mind & Body: Book, Instruments; Crime "mischief" (INFERRED age-gated) | Classmate events, gifts from parents, eye exam |
| 11-13 | Middle School Student | Same as above; more Mind & Body rows likely enabled (INFERRED) | Friend groups, achievements |
| 14-17 | High School Student | Driving test at 16, dating from 17 (classmate asks out), part-time jobs (INFERRED, not opened) | Car gifted by parent, licence |
| 18 | Graduate | Graduation decision: university / time off / premium diploma; nav "Occupation" | Student loan, scholarship rejection toast |
| 18-22 | University Student / nav "School" | University events, relationships, proposal | Degree at 22 |
| 22+ | Unemployed / Job title / nav "Job" | Full job board, part-time, military, special careers, freelance, assets, shopping, social media, full activities list | Promotions, raises, children, inheritance |
| 45-51 | Adult | Health decline, family deaths | Surrender available (all ages INFERRED) |
| Death | Deceased / nav "Death" | Tombstone, continue as child | |

## 7. New life flow

OBSERVED:
- First run: empty main screen with a single round "New Life" button (V1 0:19). Pressing it opens the
  life directly (V2 starts already at age 0; the tap itself was not captured).
- After death: post-death menu with three options and a retry link (V2 2:54, 12:18): "Start a new random
  life" (green), "Start a custom life" (yellow), "try again as <name>" (link), and, when the character has
  a child, "Continue as <child> (<age>)" (blue, first).
- Custom life form: NOT OBSERVED (never opened).
- Random life: immediately shows the main screen at age 0 with the birth block.
- Administrative powers: "Edit" rows on every person (God Mode badge), "Undo death" (Time Machine),
  "+ Boost!" on low stats, Golden Diploma / Golden Resume / Golden Wrench / Golden Pacifier items.
  All are PREMIUM-CANDIDATE in BetLife; none are part of normal character creation.

## 8. Birth

Birth block structure (OBSERVED V2 0:02 and 2:58), written as first-person lines under "Age: 0 years":
1. Sex and birthplace (city, country) plus a one-clause circumstance (planned/accidental, a joke).
2. Birthday (month day) and zodiac sign.
3. Full name.
4. Mother: name, occupation, age. 5. Father: name, occupation, age.
6. Optional: older sibling with age; family pet with name.
Initial stats are random (88/89/67/15 and 52/80/57/54 observed); money $0; occupation Infant; nav shows
Infant. Early years (1-2) add family lines (a parent's illness, remarriage, cradling, tantrum outcome).

## 9. Relationships

Relationship types OBSERVED: Mother, Father, Stepmother, Stepfather, Sister (older and younger, born during
the life), Friend, Best Friend, Classmate (in event dialogs), Enemy (section header), Boyfriend, Fiancé,
Coworker (in event), Supervisor (in event), Son. Pets: Cat, Dog (cats/dogs/birds/fish/reptiles/rodents in
store lists). NOT OBSERVED: spouse screen, children list actions, exes list.

List screen (V2 0:13, 2:06, 7:50): sections in order Special (premium), Fiancé, Parents, Siblings, Pets,
Friends, Enemies. Row: avatar, "Name (Role)", "Relationship" label + green bar, chevron. Footer:
"Spend Time With All" bulk action with a count.

Detail screen: header title is the role; first row is the person: name (age), bar, "..." menu; then an
Edit row (God Mode); then "Activities" section with rows (each opens a modal or acts immediately):
- Parents/step-parents (adult player, V2 7:38-7:42): Conversation, Doctor (take them), Deal (sell
  something), Gift, Insult, Movie Theater, Recruit (cult, badge), Spend Time, Spy (disabled).
- Parent while player is an infant (V2 0:15): only Recruit and Spy — INFERRED: talk/gift actions unlock
  with age.
- Friend (V2 7:46, tail of list): Rumor, Spend Time, Spy, Unfriend, Watch YouTube (top of list not seen;
  INFERRED: Compliment, Conversation, Gift, Insult, Movie Theater similar to family).
- Fiancé (V2 7:30): Ask for Money, Break Up, Cancel Engagement, Celebrate Anniversary, Compliment,
  Conversation, … (rest cut by ad).
- Pet (V2 1:02): Bathe, Release, Spend Time, Treat.
Meters: single "Relationship" bar per person; friends start around 55-70%, family 85-95%; the bar drops
for people not interacted with (stepmother at ~20%). Age shown for every person; occupation shown in
event dialogs and coworker intro; family members age and can die (inheritance event, V2 10:22).
Dating: classmate asks the player out at 17 with a card (activity, clique, three bars); proposal at 21
with ring details and years together; engagement status; cheating and counseling events; breakup event
with four responses. Children: born via event (V2 10:06), grow up in the journal (school, university
major decision, job), and can be continued after death.

## 10. Education

OBSERVED path: primary/elementary school at 5-6 (info dialog with School, Type, Level, Years) ->
middle school at 11 -> high school at 14 (dialog, 4 years) -> graduation at 18 (decision) ->
university with major dropdown (accepted, scholarship rejected toast, student loan) -> degree at 22.
Education menu (V2 5:42) lists University, Graduate School and several professional schools.
School actions: NOT OBSERVED (the School nav item was never opened). School-related events instead:
field trip choices, classmate trouble, talent show, exams, new friends, mom on campus joke.
Performance/grades: a "Grades" bar appears on a classmate card (V2 4:02); the player's own grade bar was
NOT OBSERVED. Dropping out: NOT OBSERVED. Teachers appear by name in events (V2 3:18); interacting with
teachers is listed as a premium benefit (V2 2:26) — BetLife: FREE if ever built, low priority.

## 11. Jobs and career

- Job board (V2 5:26): rows "Title (Category)" with yearly salary, sorted by salary, ~20+ entries,
  "..." to apply. Application/interview: NOT OBSERVED (the hire came through a referral event).
- Part-time jobs (V2 5:18): hourly wage rows. Military, Job Recruiter, Freelance Gigs: VISIBLE only.
- Special careers (V2 5:14): themed careers with badges. BetLife: FREE GAMEPLAY, future content.
- Employment: welcome dialog with Title / Career / Employer / Salary; strip shows the title; nav shows
  Job. Occupation screen shows Performance bar and Schedule with a Stress bar (V2 5:10, 5:46).
- Job actions (V2 5:06): Work Harder, Resign, Retire, Human Resources; supervisor/coworker events
  (overtime request, coworker friend, coworker conflict, HR investigation). Promotion dialog with
  new title and salary percentage (V2 10:10); yearly raises with percentages in the journal (6.47%,
  4.05%). Firing: NOT OBSERVED. Retirement: VISIBLE only.

## 12. Activities

Top-level list (adult, V2 8:06-9:10), alphabetical inside "All". VISIBLE unless marked OPENED.

| Row | Purpose | Sub-structure | Age gate seen | Premium in reference | BetLife class |
|---|---|---|---|---|---|
| Accessories | cosmetics | submenu | – | no | FREE (P3) |
| Adoption | adopt a child | modal | – | no | FREE (P2, family) |
| Crime (OPENED V2 1:58) | ~10 crimes | modal with target dropdown | enabled at 8 | no | OUT OF SCOPE except harmless mischief |
| Doctor | healthcare | submenu | – | no | FREE (exists) |
| Emigrate | move country | modal | – | no | FREE (P3) |
| Fertility | clinic | submenu | – | no | OUT OF SCOPE |
| Fight Betting | gambling on fights | modal | – | no | OUT OF SCOPE (gambling) |
| Gamble | casino | submenu | – | no | OUT OF SCOPE |
| Horse Races | betting | modal | – | no | OUT OF SCOPE |
| Identity (OPENED 8:42) | Gender, Name Change, Sexuality | submenu | – | no | Name change FREE (P3) |
| Lawsuit | sue | modal | – | no | P3 |
| Licenses | driving etc. | submenu | 16+ | no | FREE (P1, ties to cars) |
| Loan | borrow | modal | adult | no | FREE (P2) |
| Lottery | tickets | modal | – | no | OUT OF SCOPE |
| Love (OPENED 8:02) | dating | submenu | teen+ | some rows | FREE: "Date" only |
| Mind & Body (OPENED 1:19) | self-improvement | Acting Lessons, Book, Diet, Garden, Gym, Instruments (OPENED), Library, Martial Arts, Meditate, Memory, … | most locked at 7 | no | FREE (exists partly) |
| Movie Theater | leisure | modal | – | no | FREE (P2 recreation) |
| Nightlife | clubbing | modal | adult | no | OUT OF SCOPE |
| Pets (OPENED 1:16, 2:14) | adopt/buy pets | Shelter, Cat/Dog Breeders, Horse Ranch, Pet Store | child+ | store/breeders badge | FREE |
| Plastic Surgery (OPENED 8:58) | appearance | submenu | adult | no | OUT OF SCOPE |
| Race track | racing | submenu | – | expansion | FREE (P3) |
| Rehab | addictions | submenu | – | no | OUT OF SCOPE |
| Salon & Spa | self-care | submenu | – | premium benefit | FREE (P3) |
| Shopping | store | modal | – | no | FREE (exists) |
| Social Media (OPENED 7:18) | platforms | submenu | teen+ | no | FREE (P3) |
| Sweepstakes | prize entry | modal | – | no | P3 |
| Time Machine | undo | modal | – | premium | PREMIUM-CANDIDATE |
| Vacation | trips | submenu | – | no | FREE (P2 recreation) |
| Will & Testament | legacy | modal | adult | no | FREE (P3) |
| Zoo Trip | leisure | modal | – | no | FREE (P2 recreation) |
| Premium section: Movie Director, Vampire Mode, Outdoor Lifestyle, Luxury Lifestyle, Casino, Black Market, Commune, Racing, Secret Agent, Zoo | expansion modes | paywalls | – | yes | Not planned; a future "Outdoor" style activity pack would be FREE |
| Footer: Surrender... (OPENED 12:02) | end the life | confirm | – | no | FREE (as "Give up this life") |

Observed activity effects: instrument lessons lead to a parents' gift event and journal lines; eye exam
comes from a healthcare event; pickpocket produced a journal line ("tried unsuccessfully"); Spend Time
With All is a one-tap bulk relationship action. Costs: shown on shop items and repairs only.

## 13. Assets

OBSERVED (V2 5:50-7:14): categories Finances, Investments, Luxury Lifestyle (wealth bar), Collectibles
(Belongings), Real Estate (Landlord, Properties), Vehicles (each with a Condition bar), Possessions
(jewelry with condition), Misc (Social Media). Purchase flow: Shopping -> dealer -> item "..." (the buy
dialog itself was NOT OBSERVED). Items carry a type in parentheses and a price; real estate shows an
address and a "Refresh Inventory" action. Vehicle ownership actions: Abandon, Drive, Gift, Maintenance,
Pay Off (loan, disabled when none), Repair (cost shown, e.g. $1,116), Sell, Scrap, Garage (premium).
Condition degrades and triggers a repair decision (V2 4:52). Value: a possession shows carat/value; net
worth is reported in the death journal line and the tombstone. Housing: mobile home gifted by the mother
with address, size, age, monthly expense and condition (V2 4:56); a landlord mode and property list exist
(VISIBLE). Financing: student loan and "Pay Off" imply vehicle loans (INFERRED).

## 14. Money and economy

- Bank balance shown in the strip at all times; negative balances are allowed (student loan drove it to
  -$14,204). Money starts at $0 at birth.
- Salaries: full-time listings $23k-$52k; part-time $10-$11/hour; first salary $32,165; promotion to
  $43,390 (+34.9%); raises 6.47% and 4.05%.
- Prices: instruments $15-$440; jewelry $590-$10,000; used/new cars $5k-$49k; homes $24k-$117k; aircraft
  $109k-$18.8M; repair $1,116; mobile home monthly expense $16.
- Windfalls: inheritance $2,659,371 on a parent's death; "Millionaire" achievement.
- Recurring expenses: monthly expense on a home (OBSERVED on the gift card); tuition via student loan;
  healthcare costs NOT OBSERVED. No formulas are visible; BetLife keeps its own simple model.

## 15. Health

Health stat with heart icon. Health-related content OBSERVED: vaccination at 1 (behaviour decision),
eyesight worsening -> eye exam mini-game (pass/fail leads to contacts), family illnesses announced by
journal lines and info dialogs (polyps, whooping cough, lice, diarrhea, dementia, pneumonia, depression,
flatulence — some comedic), recovery lines ("no longer suffering"), a child's illness and cure dialogs,
health decline in the 40s. Doctor submenu was VISIBLE, not opened. Gym/Diet/Meditate rows exist in Mind &
Body. Mental health: "diagnosed with depression" line and "Cured of depression" line; counseling event.
BetLife keeps this light and non-graphic: checkups, colds, glasses, family illness with recovery.

## 16. Events

Categories OBSERVED (band labels on modals): Childhood, Family, Parents, Education, School, Healthcare,
License, Personal, Entertainment, Friend, Job, Leisure, Conflict, Car, Social, Fertility, Crime,
Movie Director. Observed frequency: roughly one modal per year at school age, one to two in adult life.

Original summaries of the event patterns (not the reference wording):
- Childhood behaviour tests with 2-4 reactions (getting a vaccine, a toy taken, breaking something).
- School social events (field trip conduct, classmate misbehaviour, invitations, talent show).
- Friendship offers (card with name, gender, age, three trait bars; accept/reject).
- Parent gifts (instrument, car, home) with accept/decline.
- Health checks (eye exam mini-game, illness info with OK).
- Licence quiz (road sign meaning).
- Milestones: school start, graduation choice, university major, hired, promotion, baby born.
- Romance: asked out, proposal, cheating discovered, counseling, partner leaving.
- Work: referral offer, overtime request, coworker friend, professional development focus, conflict.
- Leisure: a friend introduces a game (4 responses), movie invitation.
- World news lines (wars, leaders) as flavour; family life lines (a sibling starts school, a parent
  retires).
- Info-only outcomes with a witty title ("New pad", "A stepping stone", "No going back").

## 17. Decisions

| Type | Trigger | Modal structure | Options | Feedback | Blocks Age |
|---|---|---|---|---|---|
| Behaviour / social | random yearly | band label, icon+title, text, "What will you do?" | 2-4 blue buttons + "Surprise me!" | journal line next render, stat change not shown | yes |
| Person offer (friend, date, proposal, referral, home gift) | random / milestone | avatar+name+role band, fact box (Name, Age, …), optional bars | 2-3 buttons | often an info modal ("How could I say no?") then journal | yes |
| Milestone choice (graduation, major) | age transition | Education band | 3 buttons or dropdown + 2 buttons | toast for rejection, journal | yes |
| Info | outcome | title + text (+ fact box) | OK / Continue | journal | yes |
| Mini-game (eye exam, driving quiz) | healthcare / licence event | grid or image + timer | tap answer / escape link | pass/fail journal line | yes |
| Confirm (surrender, quit) | user action | native-style card | Yes / Cancel | | yes |
| Menu action modal (pickpocket, attack) | activity row | dropdown(s) + one button | 1 button | journal | yes |
Consequences are never shown as numbers in the modal; the player learns them from the journal and the
stat bars (e.g. happiness 100 -> 0 after the breakup at V2 11:10).

## 18. Premium audit

| Reference feature | Reference shows premium? | BetLife classification | Reason |
|---|---|---|---|
| Special careers (actor, astronaut, business, model, music, politician, …) | yes (badge) | FREE GAMEPLAY | normal career content |
| Pet store, breeders, exotic pets | yes | FREE GAMEPLAY | normal pet content |
| Salon & Spa | yes (benefit list) | FREE GAMEPLAY | normal activity |
| Talking to teachers and bosses | yes (benefit list) | FREE GAMEPLAY | normal relationship content |
| Unlimited generations (continue as child) | yes | FREE GAMEPLAY | core progression |
| Dark mode | yes | FREE (settings, P3) | UI preference |
| Expansion modes (director, vampire, casino, racing, secret agent, zoo, landlord, black market, cult) | yes | not planned; if ever built, FREE | content packs |
| Investments, auction houses, museum, race car garage | yes | FREE GAMEPLAY (P3) | asset content |
| Golden diploma / golden resume | yes | PREMIUM-CANDIDATE | skips normal progression (cheat-like) |
| Golden wrench (all vehicles perfect forever) | yes | PREMIUM-CANDIDATE | removes maintenance rules |
| Golden pacifier | yes | PREMIUM-CANDIDATE | forces an outcome |
| Edit person (God Mode) | yes | PREMIUM-CANDIDATE | admin edit of attributes |
| Time Machine / undo death / "- Age" | yes | PREMIUM-CANDIDATE | rewinds the simulation |
| "+ Boost!" on low stats | yes (INFERRED premium) | PREMIUM-CANDIDATE | artificial stat change |
| Aura ring / special items | yes | PREMIUM-CANDIDATE | passive cheat |
| Remove ads | yes | not applicable | BetLife has no ads |
| Custom life creation | no | FREE GAMEPLAY | normal customization (BetLife already has it) |

## 19. Menu and settings

The hamburger menu was NOT OBSERVED (never opened). Post-death menu OBSERVED (§7). Achievements exist as
toasts and a counter ("Achievements obtained: 1 of 40" toast at V2 1:20) — FREE (P2). Ribbons
("Unlucky", "Wasteful") are awarded at death and counted in the header — FREE (P2). Language picker
OBSERVED (V1). Cemetery, statistics, challenges, marketplace, settings: NOT OBSERVED.

## 20. Visual language

- Colour hierarchy: warm red header and dialog bands; navy/blue nav bar, blue list headers (secondary
  screens use a blue title bar with a white circular back/close button and uppercase display title); white
  content; grey section header strips inside lists; green for money-positive, Age, bars and OK buttons;
  blue action buttons in modals; yellow for boosts/premium pills; red for negative balance and warnings.
- Typography: heavy uppercase display font for screen titles and tombstones; bold sans for names and
  row titles; regular grey for descriptions; journal body is regular grey with bold blue year headings.
- Header ~56 px; strip ~60 px; nav ~80 px with the Age button overhanging by ~25 px (matches BetLife).
- List rows: ~72 px, emoji-style icon left (no badge circle), bold title, grey subtitle, right side
  either a chevron (opens a screen) or "..." (opens a modal / acts), thin divider. Disabled rows are
  greyed. Sections are grey strips with centred white text (Favorites, Premium, All, Parents, Friends…).
- Person rows add a "Relationship" mini bar; asset rows add "Condition" bars; job rows add salary.
- Modals: white card with rounded corners and a thick coloured border (red for events, blue for outcome
  info, green for health/family info), a diagonal-gradient band at the top with the category or the
  person's avatar + name + role, an icon + bold title, centred text, optional fact box (grey rows with
  bold keys), optional bars, stacked blue buttons with slight shadow, "Surprise me!" link with a dice
  icon. Dark overlay behind. Some modals have a red X at the top-left (dismissable).
- Buttons: full-width pill/rounded, bold white text; primary colour varies by role (blue choice, green
  OK/continue, yellow custom life).
- Icons: emoji-like pictograms everywhere; nav icons white glyphs inside small teal circles.
- Stat meters: thick green bars with a percentage pill; grey when dead; orange segment for a lower
  value (V2 4:46 Looks bar shows orange start — INFERRED boost visual).
- Scrolling: journal scrolls; lists scroll under a fixed blue title bar; footers (Go Shopping, Refresh
  Inventory, Surrender, Spend Time With All) are teal full-width bars at the end of the list.
- Density: no cards, no whitespace padding between rows; information is packed.
- What makes it feel like a dense mobile life sim: one continuous column, every row is an action,
  colour-coded bands tell you what kind of moment you are in, and every consequence lands in the journal.

## 21. Interaction patterns

- Bottom nav item -> top-level list screen (close X returns to Main).
- List row with chevron -> sub-list or detail screen (back arrow returns one level).
- List row with "..." -> modal action (or immediate journal event) without leaving the list.
- Age -> processing overlay -> milestone dialogs -> random decision -> journal grows.
- Decision -> outcome info modal -> journal line.
- Toast for achievements; banner for bigger ones.
- Bulk action footer at the end of a list.
- Disabled rows communicate age gates instead of hiding options.
- Post-death: dedicated screen -> post-death menu -> new life (no return to the dead life).

## 22. Gap analysis against current BetLife web

Current web BetLife (inspected, not modified): `web/games/betlife/` — main screen, start menu with random
or custom life, birth at 0 with parents, kindergarten at 6 through university, 7 jobs, 37 events (13
decisions), Library/Mind & Body/Recreation/Doctor/Shopping, relationships (parents + friends, 3
actions), assets (bicycle, car), 6 actions per year, localStorage save.

| System | Reference | Current BetLife | Gap | Priority |
|---|---|---|---|---|
| Death / end of life | death by event or surrender, tombstone with summary, post-death menu, continue as child | none; life runs forever | no ending, no legacy | P0 |
| Yearly rhythm | 1-4 journal lines per year, milestones + random event, other people's lives progress | 1 event per year, milestones only for self | thin years; world feels static | P0 |
| Info/outcome modals | frequent small info cards (school starts, baby born, promotion, gifts) | only feedback after actions | milestones are silent journal lines | P0 |
| Siblings & family life | sisters born, parents remarry, parents age/retire/die, inheritance | 2 parents only, no family events | family depth | P1 |
| Pets | adopt/buy, pet detail actions, pet events, pet death | none | replayability | P1 |
| Dating / partner / children | asked out, proposal, engagement, cheating, breakup, birth, child progression | none | major life arc missing | P1 |
| Education screens | school info dialogs per level, university menu, majors dropdown | dialogs exist for major; no school-level info modals; no per-school events | polish + events | P1 |
| Career depth | promotions with %, raises, supervisor/coworker events, stress, resign/retire | hire, work harder, quit | progression | P1 |
| Job board | 20+ jobs with categories, part-time, special careers | 7 jobs | content | P2 |
| Activities breadth | ~35 rows, submenus (instruments, pets, vacation, licences) | 5 categories | content | P2 |
| Age gating of rows | greyed rows by age | age checks with dialogs | visual affordance | P2 |
| Assets | condition, repair, sell, homes, jewelry, aircraft | bicycle, car, net worth | depth | P2 |
| Licences / driving | driving test quiz at 16 | none | small fun mechanic | P2 |
| Achievements / ribbons | toasts, counter, death ribbons | none | replayability | P2 |
| Mini-games | eye exam, driving quiz | none | variety | P3 |
| Social media, identity, emigrate, will | visible | none | optional | P3 |
| Visual: list rows with "..." vs chevron, section strips, coloured modal bands, fact boxes | yes | rows with chevrons; single modal style | polish | P2 |
| Stats behaviour | happiness swings, health/looks decline with age, warning + emoji faces | mild settle, health -1 after 45 | polish | P2 |

## 23. Original BetLife equivalents

| Reference mechanic | BetLife implementation |
|---|---|
| Achievement ribbons at death | "Life Badges" (original names, e.g. Steady Hand, Bookworm) |
| Tombstone screen | "Life Summary" card with an original epitaph generator |
| Continue as child | "Carry On As <child>" |
| Surprise me! | "Flip a Coin" random choice |
| Golden diploma / resume / wrench | not built; if ever: "Admin Tools" (PREMIUM-CANDIDATE) |
| God Mode edit | "Life Editor" (PREMIUM-CANDIDATE) |
| Time Machine | "Rewind" (PREMIUM-CANDIDATE) |
| Bitizen premium | no equivalent |
| Special careers | "Dream Careers" (free) |
| Movie Director etc. expansion modes | not planned |
| Spend Time With All | "Family Day" bulk action |
| Eye exam mini-game | "Vision Check" find-the-odd-one grid |
| Driving test | "Road Signs Quiz" with original signs |
| Animal Shelter / Pet Store | "Rescue Center" / "Pet Shop" with original animal names |
| Named fictional schools/companies | BetLife already generates original names (Maple Grove, Harborview, Pixel Harbor…) |
| Journal in first person ("I …") | keep BetLife's second person ("You …") — already distinct and consistent |

## 24. Content scale (estimates from the recordings)

- Major screens: ~34 distinct (inventory above), of which ~20 in scope.
- Submenus: ~15 (Mind & Body, Instruments, Pets x4, Crime, Love, Identity, Plastic Surgery, Social
  Media, Shopping x9 stores, Education, Special/Part-time/Jobs, Job actions).
- Activity categories: 35 top-level rows + 10 premium rows; in scope for BetLife: ~18.
- Relationship actions: ~11 per family member (adult), ~9 per friend, ~10 per fiancé, 4 per pet.
- Education actions: NOT OBSERVED directly (menu with 7 school types).
- Career actions: 4 on the job screen + 7 occupation rows + listings (20+ jobs, 10+ part-time,
  8+ special careers).
- Asset categories: 7 sections; 9 store types; vehicle actions 9.
- Decision patterns: 7 (behaviour, person offer, milestone, info, mini-game, confirm, dropdown action).
- Events seen: ~45 distinct moments across ~60 simulated years (roughly 1 per year plus milestones).

## 25. Implementation phases

### BetLife Web v1.1 — Life arc and yearly rhythm
End of life (death by age/health/rare events, surrender, life summary, post-life menu with retry/random/
custom/continue as child), richer year processing (2-4 lines, family and world flavour lines, other
people progressing), milestone info cards, siblings and parent life cycle (remarriage, ageing, death,
inheritance), achievements/badges counter. (§22 P0 + family P1)

### v1.2 — Relationships and family depth
Pets (shelter/shop, detail actions, pet events), dating from 17, partner/fiancé/spouse with proposal,
breakup, counseling-style events, children with birth cards and child milestones, relationship action
menus per role, "Family Day" bulk action, enemies section.

### v1.3 — Career, education and economy depth
Promotions with percentages, raises, stress, supervisor/coworker events, resign/retire, HR, part-time
jobs at 16, 20+ job listings with categories, dream careers, school info cards per level, university
menu with more paths, student loan with repayment, monthly home expenses, negative balance rules.

### v1.4 — Activities and assets expansion
Mind & Body submenu (instruments with lessons, gym, diet, garden, meditation, library), vacation, movie
theater, zoo trip, licences (road-sign quiz), vision check mini-game, vehicle detail (condition, repair,
maintenance, sell, gift), jewelry and homes, social media (original platforms), name change, emigrate.

### v1.5 — Visual and UX parity
Row types (chevron vs "..."), grey section strips, disabled age-gated rows, coloured modal bands with
avatar + role, fact boxes and trait bars in dialogs, achievement toasts, outcome info cards with witty
titles, happiness emoji faces and warning state, dark mode toggle, language picker (EN/PT).

## 26. Recommended first implementation batch (v1.1)

Systems: (1) end of life + life summary + post-life menu; (2) yearly rhythm: milestone info cards and 1-3
extra journal lines per year from family/world/other-people pools; (3) parents' life cycle and siblings;
(4) achievements/badges counter.

Screens: Life Summary (tombstone-equivalent card: name, age, badge, summary fields net worth / residence
/ career / education / children, epitaph, Continue); Post-life menu (Continue as child if any, New random
life, New custom life, Try again with same profile); Milestone info modal variant (avatar band + fact box
+ OK); Achievements list (menu row) with toasts.

Model changes: `state.alive`, `state.deathCause`, `state.badges[]`; relationships gain `age`, `alive`,
`job`, and family roles Sister/Brother (born via events), Stepmother/Stepfather; a `familyEvents` pool and
a `worldEvents` pool in `events.js` with `kind: 'info'` entries that show an OK card; `AgeProcessor`
ordering: education -> career/money -> family life cycle -> health/death check -> milestones queue ->
random event; death probability from health and age (no illnesses yet).

UI changes: modal queue that can show several cards after one Age press (info then decision), status
"Deceased" state on the main screen (grey stats, nav replaced by Life Summary + New Life), achievements
toast component, journal lines coloured by kind (existing).

Acceptance tests (Node harness + browser): a seeded life reaches death between 60 and 100 with ≥1 line
per year; surrender from the menu requires confirmation and ends the life; life summary shows correct
counts; post-life menu options work and "try again" reproduces the same profile; parents age each year,
can die after 65 with an inheritance line and a family info card; a sibling can be born before age 8 and
appears in Relationships; achievements unlock once (first friend, graduation, first job, millionaire) and
persist in the save; saves from v1.0 still load or are discarded safely; no console errors; mobile and
desktop layouts unchanged.

## 27. Content policy notes

Recorded content that BetLife will NOT reproduce (school project): sexual content and virginity events,
pregnancy/abortion decisions, hook-ups, plastic surgery, drug dealing, murder/hitman/attacks, gambling,
nightlife/alcohol, cult recruitment, spying, insults as core mechanics. BetLife keeps family, friends,
dating (age-appropriate), marriage and children as life milestones without explicit content.
