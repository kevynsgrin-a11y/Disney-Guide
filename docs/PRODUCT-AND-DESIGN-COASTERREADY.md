# Network feature plan + CoasterReady visual redesign

**Date:** 2026-09-11 · **Inputs:** competitor analysis (audits/2026-09-11-competitor-analysis/), the shared generator's current capabilities, per-subset competitor sets.

---

## Part 1 — Unique features per site

The organizing insight from the competitor analysis: **no competitor spans park subsets.** UT and OI cover Disney+Universal+SeaWorld but serve regional parks badly; WDWInfo is Disney-only; TouringPlans is Disney(+some Universal) with a subscription data tool. So one shared engine deployed per site is something none of them can follow across the network — that's the concurrent play. Per-site uniqueness is judged against each subset's real competitors:

- Disney subset competitors: TouringPlans (Lines app, subscription), WDWInfo, AllEars, UT, WDW Prep School
- Universal subset competitors: **Orlando Informer (dominant)**, UT
- Regional/coaster subset competitors: **effectively nobody** — UT covers the parks thinly for tickets; niche sites (Coaster-101, RCDB, Theme Park Insider) have no tools at all

### The concurrent spine (all three sites): Rider Profiles — the Height Passport

A persistent family profile (children's names, heights, measurement date) stored in `localStorage` — no accounts, no server, consistent with the zero-dependency, privacy-first architecture. Once a profile exists:

- Every ride list on the site re-labels itself for *your* family: "ridable now," "near miss," "not yet"
- **Growth projection**: with height + date, average growth curves turn "not yet" into "eligible by ~March" — the single most emotionally resonant fact a planning site can deliver, and nobody in any subset has it
- Near-miss watch ("Emma is 1.5in from Space Mountain") surfaces on the homepage of each site
- Export/print sheet that works on park WiFi offline — extends the existing offline food-tracker pattern

**Why concurrent:** the engine is one build, three deployments; the cross-site moat is that competitors are structurally single-subset. **Uniqueness: unique everywhere.** Not even TouringPlans' subscription product tracks a child's growth against eligibility.

### RideReadyGuide (Disney) — 2 site-unique features on top of the spine

**1. Day Blueprint generator** — *[unique execution, parity-plus vs TouringPlans]*
Eight questions (party, heights, early-riser?, must-dos, avoid-list) → a personalized rope-drop-to-close ordered plan generated from our authored `morningPlan/middayPlan/eveningPlan` park data with per-stop reasoning, printable and offline-capable. TouringPlans sells optimized touring plans behind a subscription and a dated app; WDW Prep School publishes static one-size articles. A free, freshness-stamped, explainable generator — every step says *why* it's ordered that way — is a different product, and our dataset is already 80% of the input.

**2. Lightning Lane decision math** — *[parity-plus vs TouringPlans, unique as a free plain-English tool]*
Not a wait-prediction engine (TouringPlans owns that with live data; we shouldn't fight it). Instead the honest arithmetic layer: party size × pass tier × our authored "which rides it actually helps at this park" → a buy/skip verdict with the reasoning printed, prices as dated ranges per our freshness contract. Nobody offers the *decision* framed this way; everyone offers noise.

### Hollywood Ride Guide (Universal) — 2 site-unique features on top of the spine

**1. Express Pass ROI calculator** — *[unique; OI and UT publish prices, nobody computes the return]*
Orlando Informer dominates Universal editorially but has zero interactive tools. Input: party size, trip dates (season band), must-ride list from our dataset → output: projected standby hours saved vs tier cost, the break-even party size, and the "which rides must be covered to justify it" list — all range-framed with as-of stamps per the honesty architecture. This is the site's queue-vocabulary expertise turned into a tool.

**2. Haunt Night Planner (HHN, both coasts)** — *[unique]*
Pick your night → an ordered house route built from historical wait-curve patterns (houses peak in the first hour and last two; the marquee maze holds longest), show times interleaved, line-skip math if the night is a peak Saturday, and a "calmest nights to buy" ranking. OI has deep HHN *guides*; no one has a planner. Confidence-banded like every dated claim we publish.

### CoasterReady (regional parks) — 2 site-unique features on top of the spine

**1. The Coaster Career Ladder** — *[unique; nothing like it exists in the subset]*
The Height Passport expressed as a career: a child's first coaster (Goldrusher, the Dragon) logged per park, then the ladder of what unlocks at 42 / 48 / 54 inches **at all ten parks** — "when you hit 48: El Toro, Twisted Colossus, Iron Rattler, HangTime unlock" — with growth-projected unlock dates and a printable "career card" per kid. Regional parks are exactly where families ladder up over years, and no competitor serves this subset with *any* tool. This is the network's most shareable artifact: parents will screenshot it.

**2. Road-Trip Combiner with school-calendar crowd bands** — *[unique for this subset; parity-plus vs UT's calendar]*
The ten parks cluster into real trips (SoCal 4-park week, Texas I-35 double, NJ+Chicago northeast loop). The combiner assembles a multi-park itinerary with drive times and operating-calendar conflicts, and overlays **school-district crowd bands** — regional park crowds are school-calendar crowds, and "DFW spring break is the first two weeks of March" is the fact that decides the trip. UT has a date-grid calendar; nobody has district-aware honest bands for regional parks.

**Feature summary table**

| Feature | RRG (Disney) | HRG (Universal) | CoasterReady | Competitive status |
|---|---|---|---|---|
| Rider Profiles / Height Passport | ✅ | ✅ | ✅ | Unique everywhere (concurrent spine) |
| Day Blueprint generator | ✅ | — | — | Parity-plus vs TouringPlans |
| Lightning Lane decision math | ✅ | — | — | Unique as free explainable tool |
| Express Pass ROI calculator | — | ✅ | — | Unique |
| Haunt Night Planner | — | ✅ | — | Unique |
| Coaster Career Ladder | — | — | ✅ | Unique, subset has no tools at all |
| Road-Trip Combiner + school bands | — | — | ✅ | Unique for regional parks |

---

## Part 2 — CoasterReady visual redesign plan

### What the audit taught, applied

**Keep doing (validated by competitors' failures):**
- Dark editorial register — every big competitor is white/navy/orange retail; being the only dark site in the category is free differentiation (benchmark looks-score gap: 78 vs their 27–62)
- Strict two-hue + semantic palette (violet/cyan + status colors) — UT's five-hue chaos is the cautionary tale
- Small nav (6 items), sticky header, real search — OI is missing two of those three
- Accessibility gates — OI proves it's achievable; UT proves the ceiling collapses without it
- OI's reading column (~75–90ch) is the one competitor craft worth matching — audit our prose measure against it

**Never import:** ad-tile interleaving, mega-menus, urgency badges, five accent colors, "store not publication" energy.

### The design thesis: "engineered steel, night midway"

The Disney site is a storybook (serif); Universal is a movie marquee (serif, gold); **CoasterReady should be the engineer's drawing of a ride at night** — industrial type, blueprint motifs, data-forward cards, neon-on-dark. Concretely, six moves, all inside the zero-dependency token system:

**1. Display face swap: serif → industrial grotesque.**
The `--font-display` token already exists per operator. Keep the system body face; set CoasterReady's display to a self-hosted OFL heavy grotesque (Archivo Black or Space Grotesk Bold) — big, wide, steel-plated headings. Instantly makes the third site feel like a different publication, not a re-skin. (The per-operator font override is the same mechanism as the palette; one token.)

**2. The track-line motif — the site's signature.**
A thin cyan "track line" that runs through the design: under section headings as a ruled line with a small lift-hill tick, down park-card edges, connecting the Career Ladder steps. Drawn as one reusable SVG pattern + CSS borders (bytes ≈ 2KB). This is the "wow without weight" motif none of the competitors have — their ceiling is flat cards and stock photos.

**3. Park cards → ride-spec plates.**
Rebuild park cards as engineer's spec sheets: mono numerals (tabular-nums already on), a data rail (coaster count / tallest drop / height ladder 42-48-54 / intensity median), the track-line divider, photo as a small inset plate rather than full-bleed. Data-forward is the identity; every competitor is photo-forward. The homepage becomes a wall of scannable spec plates — looks like nothing else in the space.

**4. Hero: the night midway, CSS-only.**
Deepen the violet ground with three layers, all cheap: (a) a **marquee bulb strip** — chasing dots along the hero's top edge, pure CSS animation, static under `prefers-reduced-motion`; (b) a **coaster horizon** — one continuous line-art track silhouette (SVG stroke, animated draw-on via stroke-dashoffset on load); (c) the existing radial-glow sky. Total budget < 10KB. This ports the two best ideas from the Bolt comp (marquee hovers, silhouette) into the real template system, dropped into components rather than bolted on.

**5. Height-ladder ruler as a core component.**
The 42/48/54 ladder rendered as a literal vertical ruler on every park page and inside the Career Ladder tool — ticks, labels, the child's current-height marker when a Rider Profile exists. One component, three uses (park page, tool, print sheet). It visualizes the site's most important number and becomes the screenshotted artifact.

**6. Function polish from the audit's findings.**
- Search: keep the command-palette dialog, brand it as the "Dispatch Board" with cyan focus glow — OI's missing-search lesson
- Mobile: tap-target CTAs ≥48px, the marquee strip reduced to a static dotted rule, spec-plate cards stack to a single data rail (UT's mobile competence is the bar; beat it with the ruler)
- Prose: enforce the 75–90 character measure in the prose component (OI parity)
- Ads/affiliates: one contextual box per page, above-the-fold disclosure intact — the WDWInfo 12-iframe fate is what we never become

### Execution order (each step ships independently)

1. Display-face token override + typography scale pass (small, reversible)
2. Track-line motif + spec-plate park cards (the identity shift)
3. Hero midway treatment (marquee strip + horizon line)
4. Height-ladder ruler component (shared with the Career Ladder feature)
5. Rider Profile spine (feature work, but the ruler visual depends on it)

All five live behind the existing operator.css/palette mechanism and shared templates — no framework, no runtime dependency, every WCAG AA pair still pinned by the parametrized test suite.
