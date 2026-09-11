# Launching the CoasterReady operator (coasterready.com)

`data/operators.json` marks `coasterguide` as `status: "draft"`. This document is what has to be
true before that word changes, and why each item is on the list. It follows the structure of
`docs/LAUNCH-UNIVERSAL.md`, which is the worked example.

Everything here is a **human** gate. None of it can be discharged by another model pass, because
the thing being checked is whether the dataset agrees with reality.

---

## Why this document exists

The Universal launch doc explains the honesty problem in full; this one inherits it and multiplies
it. CoasterReady's reference tables and its dataset were both produced from the same model's
knowledge, so agreement between them is evidence of **consistency**, not of **correctness**. A
green `npm run check` on coasterguide means the data is well-formed, internally consistent, free
of seasonal leakage, and does not contradict what the model believed when it wrote the tables —
twice, independently.

And it multiplies: this operator covers **four different park companies** — Six Flags
Entertainment, Cedar Fair (Knott's Berry Farm), Merlin Entertainments (LEGOLAND), and United
Parks & Resorts (SeaWorld) — each publishing its own figures in its own app, each with its own
ride-restriction policies, closure-reporting habits and pricing practices. The verification lift
is roughly four times what either sister site required, over ten parks in five regions.

One structural honesty note specific to this operator: **the resorts are geographic, not
corporate.** A "resort" here is a trip-planning region (Southern California, Orlando, Texas, New
Jersey, Chicago), not a park company. That choice keeps the monthly weather pages honest — a
climate row spanning Valencia and Jackson, New Jersey would be a fabrication — but it means
nothing on this site implies shared ticketing, products or ownership between parks grouped under
one region. The queue-vocabulary design depends on this and is covered in gate 1b.

---

## The gates

### 0. Unresolved source conflicts — start here

`CONFLICTS` in `scripts/reference/coasterguide.mjs` is **empty**. The tables were written blind,
before the dataset, and no disagreement surfaced between the two draws. That is weak evidence of
correctness (both draws come from the same knowledge), not a clean bill of health — see the
intro. If verification against the parks' own published figures surfaces a disagreement, record
it as a CONFLICTS row rather than editing either side silently.

### 1. Heights — blocking, and multiplied by four companies

Thirty-five heights are asserted across eight parks, and the discipline was: **assert only what
would be staked on**. Every other attraction carries no `heightIn` and renders "not stated,"
which sends the reader to the operator — the instructed behaviour, not an omission.

- [ ] Verify every asserted height against each park's own published figure — the park's site or
      app, not an aggregator. The Six Flags rows deserve the most suspicion: the company has
      adjusted minimums occasionally, and four of the eight parks with asserted heights are
      Six Flags properties.
- [ ] **Legoland parks: zero heights asserted, on purpose.** Their minimums are
      age-and-supervision based, frequently unstated as stick figures, and this site refuses to
      guess. Verify whether any Legoland attraction here should carry a figure at all, and if so,
      add it to the dataset and the reference table together.
- [ ] The same-name-different-ride traps: **Superman** appears here as a flying coaster
      (Great Adventure, Great America — 54") and a shuttle tower (Magic Mountain — 48");
      **Batman: The Ride** appears at three parks; **Goliath** is a hyper at Magic Mountain and a
      hybrid at Great America; **Manta** is a flying coaster in Orlando and a family launch in
      San Diego; **the Dragon** exists at both Legolands. Each is a different installation with
      its own minimum. Confirm each independently.
- [ ] Closed attractions carrying asserted heights (Kingda Ka, 48"): confirm the figure for the
      record, since the checker asserts it even against a closed listing.

Heights that cannot be confirmed should be **removed**, not guessed — the rule is identical to
the sister sites'.

### 1b. Line-skip coverage — blocking

This operator's version of the Express Pass problem is **vocabulary across four companies**. The
dataset uses operator-neutral tiers (`multi-pass` / `single-pass` / `none`) rendered through
generic labels ("Covered by a line-skip pass"), with each company's real product name — THE FLASH
Pass (Six Flags), Fast Lane (Knott's), Quick Queue (SeaWorld) — living only in prose, where it is
used correctly. The line-skip guide asserts this structure, and the fact checker forbids every
other company's vocabulary on the site.

- [ ] Verify per-attraction `lightningLane` values against each company's published
      line-skip-eligible list. `QUEUE_ASSIGNMENT` in the reference tables is **empty on
      purpose**: this author would not stake a build on any specific attraction's inclusion, and
      the guide's pricing claims are all range-framed and dated.
- [ ] Confirm the Legoland claim in the guide — that neither US Legoland sells a comparable
      product — against the parks' current upcharge lists.
- [ ] Confirm the guide's "as of July 2026" price ranges against the four companies' ticketing
      pages. Every figure is a range by design; a single fixed price anywhere on that page is a
      fact-check failure waiting to fire.

### 1c. Attraction and venue names — blocking

Six Flags has rethemed, renamed and retired rides across its parks since the 2024 merger, and
this dataset's Six Flags names are the most likely to have drifted.

- [ ] **Great Adventure specifically:** Kingda Ka and Zumanjaro closed permanently after the 2024
      season and are recorded as such — verify nothing else on that park's list has closed
      (the post-Kingda-Ka site redevelopment is active). The dataset deliberately omits several
      rides whose status could not be confidently stated; coverage gaps at this park are expected
      and honest.
- [ ] **Knott's:** Montezooma's Revenge is recorded `indefinite` amid the Fiesta Village
      redevelopment. Verify the current status — its return has been expected and delayed across
      multiple seasons.
- [ ] **Land names** at all Six Flags parks and the three SeaWorld parks. The SeaWorld pages
      say plainly that their zones are approximate clusters (those parks do not publish hard
      land maps). The Six Flags land assignments here are reasonable-but-unverified; confirm the
      big ones (X2's area at Magic Mountain, the Giant's section at Over Texas) against current
      park maps.
- [ ] The three Six Flags dining names (`JB's Smokehouse`, `Primo's Pizzeria`) are chain-wide
      brandings that may not operate at every park listed. Verify per park or replace with the
      park's actual signature locations.

### 2. Closures — blocking

`MUST_BE_CLOSED` asserts the two Great Adventure retirements — the highest-confidence closures on
this site, and among the most-reported park stories of the decade. Verify them once more anyway;
a checker that asserts a closure the park has reversed is worse than no checker.

- [ ] Confirm Kingda Ka and Zumanjaro remain closed/removed, with the dataset notes accurate.
- [ ] Sweep each park's current attraction list for closures this dataset missed entirely —
      several Six Flags rides were **omitted rather than listed-and-guessed**, and the honest
      gap-filling is to add them with verified status.
- [ ] Confirm nothing in `MUST_BE_OPEN` (four at Magic Mountain, two or three elsewhere) has
      closed since authoring.

### 3. Prices — blocking before any advertising

- [ ] Every price claim in the line-skip guide is a range with an "as of July 2026" frame.
      Verify the four product ranges against the companies' own pricing pages.
- [ ] The seasonal events' `rangeUsd` bands (Scary Farm, three Howl-O-Screams) describe the
      2025-season pattern. Confirm the 2026 season's real spread sits **inside** the reference
      bands once announced — the seasonal fact checker enforces containment, but the bands
      themselves need a human's confirm.
- [ ] All food prices in the dataset are `null` by design (unverified). Either verify a small
      set per park or leave them null — they render honestly as unstated.
- [ ] No `prices/` tree exists for this operator yet (a deliberate omission — see gate 7). Build
      it before launch: park tickets per region at minimum, using the same range-plus-asOf
      discipline.

### 4. Seasonal events — blocking for the Halloween pages

All nine events are authored at `confidence: "expected"` with multi-year pattern windows, because
**no 2026 date, line-up or price has been verified by this site.** The announcements typically
land in late August and September.

- [ ] On announcement, verify each event's 2026 dates against the park's event page and record
      editions with `confidence: "confirmed"` and a source note — the schema supports this
      upgrade directly.
- [ ] Verify the window shapes: Fright Fest weekends mid-September through Halloween; Scary
      Farm's 22–36 night band; the Howl-O-Scream night bands; Brick-or-Treat's weekend format.
- [ ] Verify the **event-to-park assignments** in `scripts/reference/coasterguide-seasonal.mjs`
      (§7.1-equivalent): each Howl-O-Scream at its own SeaWorld, each Fright Fest at its own Six
      Flags, Scary Farm at Knott's, Brick-or-Treat at Legoland California. Wrong-park assignment
      is the single most common error in this content area.
- [ ] Brick-or-Treat's `model: "add-on"` framing (included daytime, ticketed party nights) needs
      verification against the current season's format — Legoland has adjusted this structure
      before.

### 5. Trademark and imagery — blocking

The same constraints as the sister sites, against **four** rights holders, and one structural
note:

- [ ] The brand ("CoasterReady", logo mark "CR", the violet/cyan identity) carries no operator
      trademark. The disclaimer in `site.json` names all four companies. Confirm it renders on
      every page as the Disney one does.
- [ ] No character art, no official maps, photography only with provenance. The operator's
      `photos` block is **empty** — the site renders its gradient hero, which is the intended
      degraded state until real assets land (see `docs/ASSET-RUNBOOK.md`).
- [ ] Park names in URL paths (`/six-flags/`, `/texas/seaworld-san-antonio/`) are nominative
      use in content paths, consistent with the sites' legal posture. The brand and domain never
      carry an operator mark.
- [ ] PEANUTS at Knott's and NINJAGO at Legoland are referenced factually in prose only — no
      depiction. Confirm no page drifts from that line.

### 6. FTC disclosure — blocking before any affiliate link goes live

The affiliate-disclosure page now renders its partner list **from `site.json` data** (a
generalisation fixed while building this operator — `src/pages/legal.mjs` no longer hardcodes
the Disney affiliate set). CoasterReady declares two relationships (tickets reseller, gear).

- [ ] Confirm the disclosure renders above the first affiliate link on every page carrying one,
      as on the sister sites.
- [ ] Confirm the two declared partners are real relationships before launch, or reduce the
      list to zero — an empty list renders an honest page; a fictional one does not.

### 7. Operational

- [x] **Domain purchased: `coasterready.com`** (2026-09-11, via Cloudflare). The brand renamed to
      **CoasterReady** in `data/coasterguide/site.json` — `brand.origin` is
      `https://coasterready.com`, and every canonical URL, sitemap entry, Open Graph URL and the
      corrections address derive from it, per the one-file rename discipline. The operator slug
      stays `coasterguide`; it is the build target and dist directory, not the brand.
- [ ] **Provision the mailboxes on the domain before launch** — Cloudflare Email Routing for
      `corrections@coasterready.com` and the contact address the footer prints. A corrections
      address that bounces is worse than none (see LAUNCH-UNIVERSAL.md for the reasoning).
- [ ] Deploy is one Cloudflare Pages project (build `npm run build`, output `dist/coasterguide`,
      Node 20+) when the content gates clear. Draft status does not block creating the project,
      but nothing should be publicly announced while the placeholder-hardened gates above remain.
- [ ] Analytics stays `enabled: false` until a consent mechanism exists and the privacy policy
      describes what is collected.
- [ ] The seasonal `prices/` tree does not exist yet (this is the honest gap — the about page
      links it conditionally now). Author it before flipping the status flag.
- [ ] Known shared-template debt, inherited and partially fixed: the about/coverage copy in
      `src/pages/legal.mjs` still speaks Disney-flavored lines ("the EPCOT and California
      Adventure festivals") on the universal and coasterguide builds. It renders truthfully
      enough not to fail any gate, but a per-operator copy pass belongs on this list.

---

## The domain

**coasterready.com** — purchased 2026-09-11 via Cloudflare. The working brand "Coaster Guide"
was renamed to **CoasterReady** in the same move: the family reads RideReadyGuide → Hollywood Ride
Guide → CoasterReady, and the app-style name suits the tools-forward identity in
`docs/PRODUCT-AND-DESIGN-COASTERREADY.md`. If stricter family parallelism is ever wanted
("Coaster Ready Guide"), it is the same one-file rename — no content file references the brand.
The operator slug stays `coasterguide` (build target and dist directory, not the brand).

The name itself was chosen trademark-clean (no operator mark in the brand), per the same
reasoning as Hollywood Ride Guide.

---

## Coverage honesty

The dataset is deliberately a **first pass, not a complete one**: 8–13 attractions per park
against a documented target of 38+; 2–3 dining locations against 22+; the validator reports ~90
warnings saying exactly this. The headliners are covered at real depth; the long tail is not
yet. Closing the coverage gap is continuation work, not a launch gate in itself — but the gap
is real, documented in every build, and should be closed before the site claims the authority
of its sisters. The heights, names and closures above matter more than volume.
