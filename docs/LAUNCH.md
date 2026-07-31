# Launch plan

What is built, what a human has to do before this goes live, and what to build next — with the
decision points that should change the plan rather than a fixed roadmap.

---

## 1. Blockers — nothing ships until these are done

| # | Task | Why it blocks |
|---|---|---|
| 1 | **Register the domain and set `data/site.json → brand.domain` and `brand.origin`.** | Every canonical URL, `og:url`, sitemap entry, JSON-LD `@id`, and the `llms.txt` index derive from that one value. Shipping on a placeholder origin poisons the canonical tags on day one, which is expensive to unwind. |
| 2 | **Have an IP attorney review `/privacy/`, `/terms/`, `/affiliate-disclosure/`, and the image policy.** | The disclaimers here are written carefully and they are not legal advice. Disney enforces aggressively — Jenner & Block sent Character.AI a cease-and-desist in September 2025 — and enforcement clusters on character IP, counterfeit goods, and implied affiliation. This site avoids all three by construction, but that judgement should be a lawyer's, not ours. |
| 3 | **Put a real correction route on `/contact/`.** | The site promises on `/about/` and `/editorial-policy/` that corrections are welcomed and acted on. Publishing that with no way to report an error is a promise the site cannot keep. |
| 4 | **Wire a consent management platform before any advertising or analytics script ships.** | Personalised advertising can constitute "sharing" under the CPRA, which requires a *Do Not Sell or Share* control. GDPR requires consent before non-essential cookies. Both ad networks provide a CMP; use it, then flip `site.analytics.enabled`. |
| 5 | **Verify the brand name is free.** | `data/site.json → brand` is the single place the name lives, so changing it is one edit — but only before anyone links to you. Avoid anything containing *Disney*, *Magic Kingdom*, *Mickey*, *Imagineer*, or a park or character name. |

---

## 2. Deploy

Cloudflare Pages, build command `npm run build`, output directory `dist`, Node 20+. `dist/_headers`
and `dist/_redirects` are already written in Pages format.

Then, on the live domain:

- Submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Confirm `/robots.txt`, `/llms.txt`, `/manifest.webmanifest`, and `/sw.js` all serve.
- Run the Rich Results Test against one attraction page, one park hub, and one guide.
- Check Core Web Vitals on a mid-range Android over 4G, not on your laptop.
- Install the site to a phone home screen, turn off the network, and confirm the food tracker and a
  park map still open. That is the differentiator; verify it works before you claim it.

---

## 3. What to build next, in order

**Now → 8 weeks.** The dataset is the product; deepen it before adding surface area.

- Photography. Every `image` field is `null` on purpose. Self-shot photography is the single biggest
  remaining quality gap and the best E-E-A-T signal available. Use your own; never use anything
  whose primary subject is a copyrighted character.
- A real author identity on `/about/` with genuine trip history. An "editorial team" byline is a
  placeholder, and it is the weakest thing on the site.
- AdSense to start; apply to Mediavine Journey once traffic supports it. Reserve fixed slot
  dimensions before the first ad renders — retrofitting that after CLS regresses is miserable.
- Affiliate accounts: Undercover Tourist for Walt Disney World, Get Away Today for Disneyland,
  Amazon for the packing guide. Keep them on pages where a purchase is the next step and off the
  height charts, where the intent is a fact rather than a product.

**8 → 16 weeks.** Fill the coverage gaps the current dataset leaves.

- More standalone attraction pages where search demand justifies them, promoting from `major` tier.
- Water parks and Disney Springs — but only once the core six are genuinely maintained. A seventh
  half-maintained park is worth less than six accurate ones.
- Reader-submitted corrections, moderated. It scales verification and it is the cheapest trust
  signal available.

**Post-traffic, only if the numbers justify it.**

- MapLibre GL + PMTiles on R2 for pan-and-zoom tiles. Inline SVG currently wins on Core Web Vitals,
  print, and offline — all three of which this audience actually needs. Do not trade those away for
  a nicer demo.
- Optional cloud sync for the food tracker, keyed to an anonymous client-generated code. It adds
  cross-device continuity, and it also adds privacy-policy scope, storage cost, and abuse handling.
  Ship it when users ask, not before.

---

## 4. Decision points

These should change the plan. Watch them rather than following a roadmap.

**If informational pages underperform.** They probably will. AI Overviews have measurably suppressed
informational click-through, and zero-click is the majority case for US search. The response is not
more informational pages — it is to lean harder into the two things an AI answer cannot reproduce:
the interactive tools, and commercial-intent comparison content that converts. The height charts and
ride pages still earn their place as citation surface and as the substrate the tools are built on.

**If display RPM comes in low.** Hold hosting spend flat. This site costs almost nothing to run
precisely because it is static with no dependencies; keep it that way until revenue justifies
otherwise.

**If a construction project gets a firm opening date within 6–12 months.** Pre-build its evergreen
page set so it publishes the day it opens. Tropical Americas is the only project with a
Disney-stated window; everything else on the site is correctly worded as an estimate and should stay
that way until Disney says otherwise.

**If maintenance slips past ~5 hours a week.** Cut scope rather than let verification dates go
stale. A smaller site whose dates are true is worth more than a larger one whose dates are
decoration — the dates are the whole trust proposition.

---

## 5. What this repository deliberately does not do

- No seasonal content. Not an oversight — see `README.md` and `docs/MAINTENANCE.md`.
- No live menu mirroring. Hundreds of menu items change across the US resorts every month; a
  complete live menu database is either an enormous manual operation or quietly wrong. The site
  maintains curated, dated items and slow-moving restaurant profiles instead.
- No character imagery, official map reproductions, logos, or fonts. Nominative use only.
- No paid placement, sponsored posts, or link insertions, on any page, at any price.
