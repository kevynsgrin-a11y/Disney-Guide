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

## Changing the domain

The brand is currently **Studio Ready Guide** at `studioreadyguide.com`. Changing it is a small,
contained edit — all of it inside `data/universal/site.json`:

| Field | Current |
| --- | --- |
| `brand.name` | Studio Ready Guide |
| `brand.shortName` | Studio Ready |
| `brand.domain` | studioreadyguide.com |
| `brand.origin` | https://studioreadyguide.com |
| `brand.logoMark` | SR |
| `meta.defaultTitleSuffix` | Studio Ready Guide |
| `meta.publisherName` | Studio Ready Guide |
| `author.name` | The Studio Ready Guide editorial team |
| `legal.copyrightHolder` | Studio Ready Guide |
| `legal.disclaimer` / `legal.shortDisclaimer` | both open with the brand name |

Nothing outside that file hard-codes the brand, so the change is one file and a rebuild.

The reason the build went to `studioreadyguide.com` rather than `hollywoodrideguide.com`: three of
the four US Universal parks are in Orlando, including Epic Universe, and a domain naming Hollywood
would describe the smallest of them while the Orlando content — which is most of the site — sits
under a name that contradicts it. `studioreadyguide.com` also keeps the "… Ready Guide" family
shared with `ridereadyguide.com`. Either domain works; this is a naming judgement, not a technical
constraint.

---

## Onboarding reference

`docs/NEW-OPERATOR.md` describes the eight-step path for adding an operator to the network. This
document covers only what is specific to Universal.
