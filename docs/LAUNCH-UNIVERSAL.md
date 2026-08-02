# Launching the Universal operator

`data/operators.json` marks Universal `status: "draft"`. This document is what has to be true before
that word changes, and why each item is on the list.

Everything here is a **human** gate. None of it can be discharged by another model pass, because the
thing being checked is whether the dataset agrees with reality, and another pass would only tell you
whether it agrees with itself.

---

## Why this document exists

The Disney operator has a property Universal does not: its reference tables in
`scripts/reference/disney.mjs` came from a separate research pass than its dataset. When those two
disagree, it means one of two independent sources is wrong, and a human has to work out which. That
is a real check.

Universal's tables and Universal's dataset were both produced from the same model's knowledge. They
were authored blind — the tables were written before any park data existed and before the authoring
agents reported, so a disagreement is still worth investigating — but agreement between them is
evidence of **consistency**, not of **correctness**.

A green `npm run check` on Universal means: the data is well-formed, internally consistent, free of
seasonal leakage, and does not contradict what the model believed when it wrote the tables. It does
not mean a 47-inch child will be admitted to Hagrid's Magical Creatures Motorbike Adventure.

That distinction is the whole reason for the draft flag.

---

## The gates

### 0. Unresolved source conflicts — blocking, and start here

`CONFLICTS` in `scripts/reference/universal.mjs` records every place the reference table and the
dataset disagree. These are the highest-value items on this list, because they are the only ones a
machine has already told you are wrong somewhere.

`node scripts/factcheck.mjs universal` prints them in full. As of writing:

| Park | Attraction | Field | Table says | Data says |
| --- | --- | --- | --- | --- |
| Islands of Adventure | Skull Island: Reign of Kong | `heightIn` | 34 | 36 |
| Epic Universe | Yoshi's Adventure | `heightIn` | 34 | *(none stated)* |

Two inches is exactly the width of a bad day at a height stick. Resolve each against the operator's
own published figure and **delete the row** — the fact checker reports a row that no longer matches
as stale, and `test/operators.test.mjs` refuses to let the operator go live while the list is
non-empty. The list is a way to record a disagreement honestly, not a way to make one go away.

Three earlier disagreements have already been settled and are recorded here as worked examples of
what to look for:

- **`transformers` matched a character meet-and-greet.** The table's needle was too broad, so it
  asserted a 40in requirement against a walk-up photo op. The needle, not the data, was wrong.
- **Woody Woodpecker's Nuthouse Coaster was not in the dataset.** It was rethemed as Trolls
  Trollercoaster with DreamWorks Land. Both sources independently put the coaster at 36in, so the
  number was corroborated and only the name had moved.
- **"Magical" appeared as filler thirteen times in one file.** Twelve were Hagrid's Magical Creatures
  Motorbike Adventure. Fixed by scrubbing proper names before the sweep rather than by relaxing the
  rule — see `PROPER_NAMES`.

### 1. Heights — blocking

The highest-stakes numbers on the site. A wrong height is not an inaccuracy; it is a family driving
to a park for a ride their child cannot board.

- [ ] Every `heightIn` in `data/universal/parks/*/attractions.json` checked against the operator's
      own published figure — the park's official site or app, not an aggregator.
- [ ] Confirm the deliberate Orlando/Hollywood divergences. Flight of the Hippogriff is recorded at
      36 in Orlando and 39 in Hollywood. Two parks, one ride name, two numbers. If that is wrong in
      either direction, it is wrong in the way that strands someone at a gate.
- [ ] Epic Universe in full. It opened in May 2025, there is no long tail of corroborating coverage,
      and `scripts/reference/universal.mjs` asserts only four of its heights on purpose. The rest of
      the park is unasserted, which means the fact checker is currently silent about it.
- [ ] Anything an authoring agent flagged as low-confidence. Each park agent returned a ranked list;
      those rankings are the priority order for this gate, not a formality.

Heights that could not be confirmed should be **removed**, not guessed. An absent height renders as
"not stated" and sends the reader to the operator. A wrong one sends them to the park.

### 1b. Express Pass and single-rider coverage — blocking

Reported by the authoring agents as their single largest unknown, above heights, and it is not
something the fact checker can catch: `lightningLane` and `singleRider` are plausible on their face
whatever value they hold, so a wrong one fails silently and costs a reader either money or hours.

- [ ] **Which attractions actually accept Universal Express.** Every `lightningLane` value in the
      Universal dataset is an authoring judgement rather than a verified list. Epic Universe is the
      worst case — 15 of its 21 attractions are set `multi-pass` on inference alone. Check each
      against Universal's published Express list per park.
- [ ] **`singleRider` is `false` on every Epic Universe attraction**, set conservatively because none
      could be verified. Universal's single-rider lines are one of its genuine advantages over
      Disney, so a blanket false understates the product and costs readers real queue time. Confirm
      per attraction.
- [ ] Confirm Hagrid's still does not accept Express. `QUEUE_ASSIGNMENT` asserts this, and it is the
      claim most likely to sell someone a pass on a promise the park will not honour.

### 1c. Attraction and venue names — blocking

Names are load-bearing here in a way they are not on the Disney site, because Epic Universe is new
enough that several were authored from description rather than from a confirmed name.

- [ ] Verify these specifically, all flagged low-confidence at Epic Universe: `Astronomica` (the hub
      feature exists; the name is uncertain), `Viking Training Camp`, `De Lacey's Cottage`,
      `Spit Fyre Grill`, `de Lacus Cocktail Bar`, `Pizza Moon`, `Hooligan's Grog & Gruel`.
- [ ] **`Café L'air De La Sirène` is placed in Ministry of Magic and may belong to Celestial Park.**
      If it moves, four food items move with it.
- [ ] Menu item names outside Toadstool Cafe and Butterbeer are descriptive rather than proper nouns
      ("Smoked brisket plate"), on purpose. Replace with real names or leave them descriptive — do not
      invent proper nouns.

### 2. Closures — blocking

`MUST_BE_CLOSED` in `scripts/reference/universal.mjs` is **empty**. That is deliberate and it is a
hole, not a clean bill of health: no 2025/26 Universal closure was known with enough confidence to
assert, and a guessed closure is worse than none — it fails the build for a ride that is running,
which teaches everyone to ignore the checker.

- [ ] Establish what actually closed permanently in 2025 and 2026 at each of the four parks.
- [ ] Fill in `MUST_BE_CLOSED`, and confirm every entry carries a `closedNote` in the dataset.
- [ ] Confirm nothing in `MUST_BE_OPEN` has closed since the tables were written.

### 3. Prices — blocking before any advertising

- [ ] Express Pass price framing. `QUEUE_CLAIMS` requires the guide to carry an "as of July 2026"
      qualifier and to name the **Premier** hotel tier. Verify both the qualifier and the underlying
      claim: Express Pass is included at three of the ten hotels, and "it comes with an on-site
      stay" is the single most expensive thing a reader could believe here.
- [ ] Butterbeer, cold and frozen, at both resorts. `SNACK_PRICES` pins these as *notes* rather than
      failures, so a mismatch will not block a build — it has to be read.
- [ ] **Every food price in the dataset is a plausible band, not a confirmed figure.** The authoring
      agents said so explicitly. Butterbeer is the most defensible; the Epic Universe lounge and
      speciality-drink prices are the least. These render as numbers next to a "verified July 2026"
      stamp, which is a stronger claim than the data supports until this is done.
- [ ] Halloween Horror Nights bands in `scripts/reference/universal-seasonal.mjs`. They are
      deliberately wide (Orlando $70–200) because Universal prices by date aggressively. Confirm the
      real spread sits inside them rather than merely overlapping.

### 4. Virtual queues — blocking

`VIRTUAL_QUEUE_ALLOWED` lists only `hagrid`. Universal genuinely runs a Virtual Line product, unlike
Disney, so an empty list would be wrong — but a broad one would defeat the check entirely.

- [ ] Establish which attractions use Virtual Line as standing policy in 2026, especially at Epic
      Universe, and expand the list to exactly those.

### 5. Trademark and imagery — blocking

The same constraints that govern the Disney site, against a different rights holder:

- [ ] No reproduction of Universal's official park maps. Maps must be derived from OpenStreetMap or
      aerial imagery. Tracing an official map produces a derivative of protected artwork; deriving
      your own does not.
- [ ] No character art or character imagery of any kind. Character **names** may be referenced
      factually in prose — that is nominative fair use — but nothing may be depicted.
- [ ] Photography self-shot, Creative Commons, or licensed, with provenance recorded.
- [ ] The unaffiliated disclaimer in `data/universal/site.json` names **NBCUniversal** and
      **Universal Destinations & Experiences**. Confirm it appears on every page, as it does on the
      Disney site.
- [ ] The domain carries no operator trademark. Nominative fair use covers page content and URL
      paths; it does not cover a domain, because a domain is a source identifier.

### 6. FTC disclosure — blocking before any affiliate link goes live

- [ ] Affiliate disclosure clear, conspicuous, and **above the first affiliate link on the page** —
      not only in the footer. This is the same rule the Disney site follows and it is not satisfied
      by a site-wide policy page.

### 7. Operational

- [ ] `brand.origin` in `data/universal/site.json` matches the purchased domain exactly, including
      scheme and absence of trailing slash. Everything canonical, every sitemap URL, and every
      absolute Open Graph URL is built from this one field.
- [ ] Corrections and contact addresses provisioned on the domain and reachable before launch. A
      corrections address printed on a page that bounces is worse than no address.
- [ ] Analytics stays `enabled: false` until a consent mechanism exists and the privacy policy
      describes what is collected.

---

## The domain

The brand is **Hollywood Ride Guide** at `hollywoodrideguide.com`, which is the domain you chose.

Recorded for the file, since it was raised and settled rather than overlooked: the build initially
went to `studioreadyguide.com` on the reasoning that three of the four US Universal parks are in
Orlando, including Epic Universe, so a domain naming Hollywood describes the smallest park while most
of the site's content sits under a name that contradicts it. You picked `hollywoodrideguide.com`
anyway, which is a naming judgement and yours to make. Nothing technical rests on it.

The practical consequence is worth knowing: most of this site is about Orlando, so the Orlando pages
carry the weight of a name that points at California. Titles and copy on those pages should lean on
the park names rather than the brand, which is how they read now.

Changing it again is one file — every brand string lives in `data/universal/site.json`:

| Field | Current |
| --- | --- |
| `brand.name` | Hollywood Ride Guide |
| `brand.shortName` | Hollywood Ride |
| `brand.domain` | hollywoodrideguide.com |
| `brand.origin` | https://hollywoodrideguide.com |
| `brand.logoMark` | HR |
| `meta.defaultTitleSuffix` · `meta.publisherName` | Hollywood Ride Guide |
| `author.name` | The Hollywood Ride Guide editorial team |
| `legal.copyrightHolder` | Hollywood Ride Guide |
| `legal.disclaimer` | opens with the brand name |

No content file references the brand — that was checked, not assumed — so a rename is that table and a
rebuild.

---

## Onboarding reference

`docs/NEW-OPERATOR.md` describes the eight-step path for adding an operator to the network. This
document covers only what is specific to Universal.
