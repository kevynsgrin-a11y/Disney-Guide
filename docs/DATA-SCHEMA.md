# Data Schema — Evergreen Theme Park Guide (Site 1)

Every page on this site is generated from JSON in `data/`. **Prose lives in the data, not in
templates.** Templates are dumb; data is rich.

Per park, there are four authored files:

```
data/parks/<park-slug>/park.json          park meta, lands, first-timer guide, accessibility, tips
data/parks/<park-slug>/attractions.json   every attraction in the park
data/parks/<park-slug>/dining.json        every table-service / quick-service / notable snack location
data/parks/<park-slug>/food.json          curated must-try food items (drives the Food Tracker tool)
data/parks/<park-slug>/map.json           schematic map geometry (authored separately)
```

Park slugs (exactly these, no others):

| Slug | Park | Resort slug | Resort name |
|---|---|---|---|
| `magic-kingdom` | Magic Kingdom | `walt-disney-world` | Walt Disney World |
| `epcot` | EPCOT | `walt-disney-world` | Walt Disney World |
| `hollywood-studios` | Disney's Hollywood Studios | `walt-disney-world` | Walt Disney World |
| `animal-kingdom` | Disney's Animal Kingdom | `walt-disney-world` | Walt Disney World |
| `disneyland-park` | Disneyland Park | `disneyland` | Disneyland Resort |
| `california-adventure` | Disney California Adventure | `disneyland` | Disneyland Resort |

---

## Universal rules

1. **Evergreen only.** No seasonal parties, festivals, overlays, refurb news, or current-day
   Lightning Lane prices. Those belong to Site 2. Where a ride has a seasonal overlay, describe the
   permanent version and set `hasSeasonalOverlay: true`.
2. **Every price and every volatile fact carries `lastVerified` (`"YYYY-MM"`).** Current date is
   **2026-07**. Use `"2026-07"` unless you have a specific earlier verification month.
3. **Never reproduce Disney's copy.** Write original descriptions. Do not quote marketing copy, ride
   scripts, song lyrics, or menu descriptions verbatim.
4. **No character art references.** You may name characters factually ("you meet Mickey Mouse here").
   Never describe an image asset of a character. All `image` fields must be `null` in this phase.
5. **Slugs** are lowercase kebab-case, ASCII only, stable forever. Never renumber or rename a slug or
   food `id` once written — the Food Tracker's share URLs depend on stable ids.
6. **Prose arrays** (`description`, `experience`, `intro`) are arrays of plain-text paragraphs.
   A tiny subset of inline markdown is supported: `**bold**`, `*italic*`, `` `code` ``, and
   `[text](/path)` links. No headings, no HTML, no lists inside paragraphs.
7. **Write like an experienced, opinionated guide** — specific, concrete, useful. Say which side of
   the boat to sit on. Say when a queue is worth it. Avoid marketing adjectives ("magical",
   "unforgettable", "immersive" used as filler). Second person is fine.
8. **Accuracy over completeness.** If unsure of a number, omit the field rather than invent it.
   Height requirements, ride systems, and land assignments must be correct.

---

## `park.json`

```jsonc
{
  "slug": "magic-kingdom",
  "name": "Magic Kingdom",                  // exact park name, no "Park" unless official
  "shortName": "Magic Kingdom",
  "resort": "walt-disney-world",
  "resortName": "Walt Disney World",
  "opened": "1971-10-01",                   // ISO date
  "sizeAcres": 107,
  "location": "Bay Lake, Florida",
  "coordinates": { "lat": 28.4177, "lng": -81.5812 },

  "tagline": "…",                           // ≤ 90 chars, used in cards
  "summary": "…",                           // 1–2 sentences, used in meta descriptions & cards
  "intro": ["para", "para", "para"],        // 3–5 paragraphs for the park hub page

  "bestFor": ["First-timers", "Toddlers and preschoolers", "Classic dark rides"],
  "notIdealFor": ["Thrill-seekers chasing big coasters", "Adults-only drinking days"],

  "stats": {
    "attractionCount": 0,                   // fill in to match attractions.json
    "ridesWithHeightRequirements": 7,
    "tallestRequirement": 48,               // inches
    "typicalFullDayHours": "10–12 hours",
    "minimumDaysRecommended": 1.5
  },

  "lands": [
    {
      "slug": "tomorrowland",
      "name": "Tomorrowland",
      "order": 6,                           // clockwise walking order from the entrance, 1-based
      "opened": 1971,
      "summary": "…",                       // 1 sentence
      "description": ["para", "para"],      // 2–4 paragraphs for the land page
      "vibe": "…",                          // ≤ 120 chars: the feeling of standing there
      "anchorAttraction": "space-mountain", // slug of the land's headliner
      "highlights": ["…", "…", "…"],        // 3–5 bullet strings
      "eatHere": ["cosmic-rays-starlight-cafe"], // dining slugs worth calling out
      "tips": ["…", "…"]                    // 2–4 land-specific tips
    }
  ],

  "firstTimer": {
    "intro": ["para", "para"],
    "beforeYouGo": [ { "title": "…", "body": "…" } ],   // 4–7 items
    "morningPlan": [ { "time": "Rope drop", "body": "…" } ],  // 5–8 items, chronological
    "middayPlan": [ { "time": "…", "body": "…" } ],
    "eveningPlan": [ { "time": "…", "body": "…" } ],
    "rookieMistakes": ["…"],                // 5–8 strings
    "ifYouOnlyHaveOneDay": ["…"]            // 6–10 ordered strings — a literal do-this list
  },

  "accessibility": {
    "intro": ["para", "para"],
    "wheelchairRental": { "available": true, "location": "…", "priceNote": "…", "lastVerified": "2026-07" },
    "ecvRental": { "available": true, "location": "…", "priceNote": "…", "lastVerified": "2026-07" },
    "strollerRental": { "available": true, "location": "…", "priceNote": "…", "lastVerified": "2026-07" },
    "companionRestrooms": ["…"],            // locations
    "quietSpaces": [ { "name": "…", "where": "…", "note": "…" } ],  // 2–5 break spots
    "serviceAnimalRelief": ["…"],
    "sensoryNotes": ["…"],                  // 3–6 strings: which attractions are loud/dark/strobing
    "mobilityNotes": ["…"],                 // 3–6 strings: transfers, steep queues, cobblestones
    "visionHearingNotes": ["…"]             // 3–6 strings
  },

  "tips": [ { "title": "…", "body": "…" } ], // 6–10 genuinely non-obvious park-wide tips

  "faqs": [ { "q": "…", "a": "…" } ],        // 8–12 park-level FAQs, answers 2–4 sentences

  "gettingThere": {
    "parking": "…",
    "transportation": ["…"],                 // strings, one per mode
    "entranceNote": "…"
  },

  "lastVerified": "2026-07"
}
```

---

## `attractions.json`

```jsonc
{
  "park": "magic-kingdom",
  "attractions": [
    {
      "slug": "space-mountain",
      "name": "Space Mountain",
      "land": "tomorrowland",                 // must match a land slug in park.json
      "type": "roller-coaster",               // see enum below
      "opened": 1975,
      "status": "open",                       // open | closed | under-construction | seasonal
      "closedNote": null,                     // required non-null when status !== "open"

      "heightIn": 44,                         // integer inches, or null if no requirement
      "heightNote": null,                     // e.g. "32in to ride, 54in to drive alone"

      "durationMinutes": 2.5,
      "capacityPerHour": 2000,                // omit if unknown
      "lightningLane": "multi-pass",          // multi-pass | single-pass | none
      "singleRider": false,
      "riderSwitch": true,
      "virtualQueue": false,

      "intensity": 4,                         // 1 (gentle) – 5 (extreme)
      "scary": {
        "score": 3,                           // 1 (not scary) – 5 (genuinely frightening)
        "darkness": 5,                        // 1–5
        "drops": 2,
        "speed": 4,
        "loudness": 4,
        "startles": 2,                        // jump-scares / sudden effects
        "notes": "…"                          // 2–4 sentences: who this actually scares and why
      },
      "motionSickness": "moderate",           // none | low | moderate | high
      "getsWet": "none",                      // none | light | soaked
      "indoorOutdoor": "indoor",              // indoor | outdoor | mixed
      "airConditioned": true,
      "goesUpsideDown": false,
      "goesBackwards": false,
      "hasSeasonalOverlay": false,
      "photoPass": true,

      "accessibility": {
        "transfer": "must-transfer",          // wheelchair-accessible | ecv-transfer | must-transfer
        "audioDescription": true,
        "handheldCaptioning": false,
        "assistiveListening": false,
        "signLanguage": false,
        "serviceAnimals": false,
        "notes": "…"                          // 1–3 sentences, concrete
      },

      "tier": "headliner",                    // headliner | major | minor
      "standalonePage": true,                 // true only for headliner + high-search major rides

      "summary": "…",                         // 1 sentence, ≤ 160 chars — used in lists & meta
      "description": ["para", "para"],        // 2–3 paragraphs: what it is, history, why it matters
      "experience": ["para", "para"],         // 2–3 paragraphs: beat-by-beat what riding is like
      "tips": ["…", "…", "…"],                // 3–6 concrete, specific tips
      "bestTime": "…",                        // ≤ 140 chars
      "typicalWait": "…",                     // ≤ 140 chars, describe ranges not live numbers
      "faqs": [ { "q": "…", "a": "…" } ],     // 3–6 for standalone pages; 0 otherwise
      "relatedSlugs": ["tron-lightcycle-run"],// 2–4 other attractions in this park

      "image": null,
      "lastVerified": "2026-07"
    }
  ]
}
```

**`type` enum:** `roller-coaster`, `dark-ride`, `water-ride`, `simulator`, `spinner`,
`show`, `stage-show`, `film`, `parade`, `fireworks`, `walkthrough`, `transportation`,
`play-area`, `character-meet`, `animal-experience`, `interactive-game`, `train`, `boat-ride`.

**`tier` guidance.** `headliner` = the rides people plan the day around (≈4–8/park).
`major` = well-known, meaningful wait, worth a page if search demand exists (≈8–14/park).
`minor` = everything else — these get rich rows in the land page and ride list, no standalone page.

**`standalonePage` guidance.** Set `true` for all `headliner` rides plus `major` rides with clear
search demand ("is X scary", "X height requirement"). Target **14–20 standalone pages per park**.
Everything else `false`. Thin pages are the enemy — a `false` attraction still needs a good
`summary`, `description`, `tips`, and complete factual fields; it simply renders inside the land
page and ride list instead of on its own URL.

**Coverage target: every attraction the park operates**, including shows, parades, transportation,
and play areas. Expect 35–60 entries per park. Permanently-closed-for-construction attractions get
`status: "closed"` with a factual `closedNote` and are still listed (they are high-search terms) —
but keep `standalonePage: false` unless the closure itself is a major search topic.

---

## `dining.json`

```jsonc
{
  "park": "magic-kingdom",
  "dining": [
    {
      "slug": "be-our-guest-restaurant",
      "name": "Be Our Guest Restaurant",
      "land": "fantasyland",
      "service": "table-service",         // table-service | quick-service | snack-cart | lounge | bakery | food-truck
      "cuisine": "French-inspired American",
      "priceTier": "$$$$",                // $ (<$15) | $$ ($15–34) | $$$ ($35–59) | $$$$ ($60+) per adult
      "priceNote": "Prix fixe, about $67 per adult for dinner",
      "priceVerified": "2026-07",
      "mealPeriods": ["lunch", "dinner"], // breakfast | brunch | lunch | dinner | all-day | snacks
      "reservations": "essential",        // essential | recommended | walk-up-ok | not-accepted
      "mobileOrder": false,
      "diningPlan": true,
      "dietary": ["vegetarian", "vegan", "gluten-free"],  // subset; also "allergy-friendly-menu"
      "alcohol": true,
      "airConditioned": true,
      "indoorSeating": true,
      "outdoorSeating": false,
      "characterDining": false,

      "standalonePage": true,             // true for table-service + notable quick-service
      "summary": "…",                     // 1 sentence ≤ 160 chars
      "description": ["para", "para"],    // 2–3 paragraphs
      "signatureItems": ["…", "…", "…"],  // 3–6 dish names (names only, no copied menu prose)
      "goodFor": ["special-occasion", "families", "date-night"], // see enum below
      "tips": ["…", "…"],                 // 2–5
      "verdict": "…",                     // 1–2 sentences: is it worth it, honestly
      "faqs": [ { "q": "…", "a": "…" } ], // 2–4 on standalone pages
      "image": null,
      "lastVerified": "2026-07"
    }
  ]
}
```

**`goodFor` enum:** `families`, `toddlers`, `picky-eaters`, `date-night`, `special-occasion`,
`quick-bite`, `big-appetites`, `groups`, `solo`, `air-conditioned-break`, `vegetarian`,
`late-night`, `budget`, `splurge`, `view`.

**Coverage target:** every table-service restaurant, every quick-service location, and every
named snack stand/cart that people search for. Expect 20–40 entries per park.
`standalonePage: true` for roughly 8–16 per park (all table-service + the best quick-service).

---

## `food.json` — the Food Tracker dataset

This is the highest-value dataset on the site. It drives `/tools/food-tracker/`, each park's
`/best-snacks/` page, and a lot of long-tail search.

```jsonc
{
  "park": "magic-kingdom",
  "items": [
    {
      "id": "mk-dole-whip",              // "<park-prefix>-<item-slug>", NEVER change once written
      "name": "Dole Whip",
      "restaurant": "Aloha Isle",
      "restaurantSlug": "aloha-isle",    // must match a dining.json slug, or null
      "land": "adventureland",
      "price": 6.49,                     // number in USD, or null if genuinely unknown
      "priceVerified": "2026-07",
      "category": "sweet",               // sweet | savory | snack | drink | breakfast | treat-cart
      "dietaryTags": ["vegan", "gluten-free"],  // may be []
      "iconic": true,                    // is this a "you have to try it" landmark item
      "mustTry": 5,                      // 1–5 editorial priority; 5 = do not leave without it
      "shareable": true,
      "portable": true,                  // can you walk and eat it
      "seasonal": false,                 // must be false in this dataset (seasonal → Site 2)
      "description": "…",                // 1–2 sentences, what it actually is
      "verdict": "…",                    // 1–2 sentences, honest: worth it / overrated / skip
      "image": null
    }
  ]
}
```

**Park id prefixes:** `mk-`, `ep-`, `hs-`, `ak-`, `dl-`, `dca-`.

**Coverage target: 30–45 items per park.** Weight toward things people actually search for and
queue for. Include at least 4 items with `mustTry: 5`, a range of price points, at least 5 vegan or
gluten-free tagged items, and a mix of `sweet`/`savory`/`drink`. Include honest "overrated" verdicts
where warranted — that is the editorial voice that earns trust.

---

## Verified reference data (use these, do not contradict them)

These facts were verified as of **July 2026**. If your knowledge conflicts, these win.

### Height requirements — Walt Disney World

| Park | Attraction | Height |
|---|---|---|
| Magic Kingdom | Tomorrowland Speedway | 32in (54in to drive alone) |
| Magic Kingdom | The Barnstormer | 35in |
| Magic Kingdom | Seven Dwarfs Mine Train | 38in |
| Magic Kingdom | Big Thunder Mountain Railroad | **38in** (reduced from 40in, May 3 2026) |
| Magic Kingdom | Tiana's Bayou Adventure | 40in |
| Magic Kingdom | Space Mountain | 44in |
| Magic Kingdom | TRON Lightcycle / Run | 48in |
| EPCOT | Soarin' Around the World | 40in |
| EPCOT | Test Track | 40in |
| EPCOT | Mission: SPACE | 40in (Green) / 44in (Orange) |
| EPCOT | Guardians of the Galaxy: Cosmic Rewind | 42in |
| Hollywood Studios | Alien Swirling Saucers | 32in |
| Hollywood Studios | Slinky Dog Dash | 38in |
| Hollywood Studios | Millennium Falcon: Smugglers Run | 38in |
| Hollywood Studios | Star Tours | 40in |
| Hollywood Studios | Star Wars: Rise of the Resistance | 40in |
| Hollywood Studios | The Twilight Zone Tower of Terror | 40in |
| Hollywood Studios | Rock 'n' Roller Coaster Starring The Muppets | 48in |
| Animal Kingdom | Kali River Rapids | 38in |
| Animal Kingdom | Avatar Flight of Passage | 44in |
| Animal Kingdom | Expedition Everest | 44in |

### Height requirements — Disneyland Resort

| Park | Attraction | Height |
|---|---|---|
| Disneyland Park | Autopia | 32in (54in to drive alone) |
| Disneyland Park | Gadget's Go Coaster | 35in |
| Disneyland Park | Big Thunder Mountain Railroad | 40in |
| Disneyland Park | Space Mountain | 40in |
| Disneyland Park | Tiana's Bayou Adventure | 40in |
| Disneyland Park | Star Wars: Rise of the Resistance | 40in |
| Disneyland Park | Millennium Falcon: Smugglers Run | 40in |
| Disneyland Park | Matterhorn Bobsleds | 42in |
| Disneyland Park | Indiana Jones Adventure | 46in |
| California Adventure | Jumpin' Jellyfish | 40in |
| California Adventure | Silly Symphony Swings | 40in (48in for solo/tandem variation) |
| California Adventure | Inside Out Emotional Whirlwind | 40in |
| California Adventure | Guardians of the Galaxy – Mission: BREAKOUT! | 40in |
| California Adventure | Radiator Springs Racers | 40in |
| California Adventure | Goofy's Sky School | 42in |
| California Adventure | Grizzly River Run | 42in |
| California Adventure | Golden Zephyr | 42in |
| California Adventure | Redwood Creek Challenge Trail (zip line) | 42–63in, under 13 |
| California Adventure | Incredicoaster | 48in |

Both resorts measure with a fixed stick, shoes on, hats off; borderline guests receive an all-day
colored wristband so they are not re-measured.

### 2026 attraction status — must be reflected

**Open / changed:**
- **Test Track** (EPCOT) — reopened July 22 2025 as the third version, GM sponsor, 40in, ~5 min,
  Lightning Lane **Multi Pass** (not Single Pass).
- **Big Thunder Mountain Railroad** (Magic Kingdom) — reopened May 3 2026, height reduced to 38in.
- **Rock 'n' Roller Coaster Starring The Muppets** (Hollywood Studios) — rethemed from Aerosmith,
  opened to all guests May 26 2026, 48in, no virtual queue.
- **Buzz Lightyear's Space Ranger Spin** (Magic Kingdom) — reopened 2026 with updates.

**Permanently closed (list with `status: "closed"` and a factual note):**
- **DINOSAUR** and **Restaurantosaurus** (Animal Kingdom) — closed February 2 2026 for Tropical Americas.
- **Rivers of America / Tom Sawyer Island / Liberty Belle Riverboat** (Magic Kingdom) — closed 2025
  for Piston Peak and Villains Land.
- **Muppet\*Vision 3D** and Muppets Courtyard (Hollywood Studios) — closed 2025 for Monstropolis.
- **Monsters, Inc. Mike & Sulley to the Rescue!** (California Adventure) — closing early 2026 for the
  Avatar project.
- **Disneyland Monorail** — closed for refurbishment since March 30 2026.

**Under construction (mention in park intro / land pages; `status: "under-construction"` only if it
is a named future attraction worth listing):**
- Tropical Americas (Animal Kingdom) — Encanto ride-through + Indiana Jones adventure + carousel;
  Disney says 2027.
- Piston Peak National Park (Magic Kingdom, Frontierland) — later this decade.
- Villains Land (Magic Kingdom) — announced 2024, vertical construction from 2026, no official date.
- Monstropolis (Hollywood Studios) — no official date.
- Avengers Campus expansion (California Adventure) — Avengers Infinity Defense + Stark Flight Lab,
  projected 2027–2028.
- Avatar experience (California Adventure) — early development, no official date.

**Always flag unofficial dates as estimates.** Only Tropical Americas ("2027") has a Disney-stated
window; everything else is speculative and must be worded as such.

### Lightning Lane (evergreen mechanics only — no live prices)

- **Walt Disney World:** Lightning Lane **Multi Pass** (replaced Genie+ July 2024; date- and
  park-based dynamic pricing, roughly $15–$45/person/day depending on park and date; includes
  PhotoPass downloads; 40+ attractions), **Single Pass** (à la carte top headliners, roughly
  $12–$25/ride), **Premier Pass** (all-in, no return windows, sells out).
  On-site hotel guests (plus Swan, Dolphin, Swan Reserve, Shades of Green) buy for the whole trip
  from 7 days out at 7 AM ET; off-site guests up to 3 days out. Magic Kingdom is the only WDW park
  where you can hold two Single Passes.
- **Disneyland Resort:** Multi Pass from $34/person/day covering 15+ attractions; from January 5
  2026 Disneyland Resort hotel guests get one bonus Multi Pass per person per stay. Premier Pass
  covers **both** parks in one purchase (roughly $300–$400 in 2026, higher on holiday dates),
  purchasable up to 7 days in advance in the app, limited quantities.
- **Virtual queue:** as of mid-2026 **no** attraction at either resort permanently uses a virtual
  queue. Guardians of the Galaxy: Cosmic Rewind, TRON, and Tiana's Bayou Adventure all dropped
  theirs. Virtual queues now appear only temporarily for new-ride openings. Set
  `virtualQueue: false` everywhere unless a specific attraction genuinely uses one.

**Always express prices as ranges with "as of July 2026" framing. Never state a single current price
as if it were fixed.**

### Verified snack prices (2026)

| Item | Price | Where |
|---|---|---|
| Mickey pretzel | $8.50 | WDW carts |
| Churro | $5.50 | WDW carts |
| Turkey leg | $11.75 (EPCOT Fife & Drum $13.25) | WDW |
| Turkey leg | $12.99 | Disneyland |
| Dole Whip cup | $6.49 (float $7.29) | Disneyland |
| Mickey Premium Ice Cream Bar | ~$5.75–6.00 | Both resorts |
| Corn dog, Little Red Wagon | ~$11.29–14.79 | Disneyland |
| Corn dog, Corn Dog Castle | $11.29 | California Adventure |
| Matterhorn Macaroon | ~$3.49 | Jolly Holiday, Disneyland |
| Ronto Wrap | $14.49 | Disneyland |
| Ronto Wrap | $13.99 | Hollywood Studios |
| Chili Cone Queso | $11.49 | Cozy Cone, California Adventure |

Where sources conflict, prefer the number above and stamp `priceVerified: "2026-07"`.

---

## Validation

`node scripts/validate.mjs` enforces this schema. It must exit 0 before any commit.
It checks required fields, enum values, slug uniqueness, cross-file referential integrity
(attraction `land` → park land slug; food `restaurantSlug` → dining slug; `relatedSlugs` →
attraction slugs), prose length floors, and `lastVerified` format.
