# Lovable prompts — visual overhaul

Verbatim prompts for a front-end visual overhaul, to be pasted into Lovable by hand. Read the two
sections before the prompts first — both change what you should ask for.

---

## Read first: how this actually has to work

**Lovable cannot edit this repository.** It builds React + TypeScript + Tailwind + shadcn/ui apps in
its own cloud sandbox. This site is a zero-dependency static generator: no runtime dependencies by
design, HTML produced from JSON through tagged template literals, one hand-written 1,219-line
stylesheet, no build step. If Lovable is pointed at "make the site look better," it will produce a
beautiful React app that shares nothing with this codebase — no 379 pages, no data, no gates.

So the prompts below ask Lovable for something it is genuinely good at and that ports cleanly: a
**single self-contained HTML + CSS design comp** that reuses this site's existing class names and CSS
custom properties. What comes back is then mostly a stylesheet swap on my side, not a translation.

Every prompt therefore says, explicitly, *no React, no Tailwind, no build step*. Do not remove those
lines — they are the difference between output I can use in an afternoon and output I would have to
rewrite from scratch.

**Budget.** Lovable charges per message, not per line. Four dense prompts cost far less than twenty
small ones, which is why these are long. Before Batch 1, paste the Setup block into Lovable's
**Knowledge** panel — that is free, persists across messages, and means the constraints do not have
to be repeated in every prompt. That single step is the biggest saver here.

Rough expectation: Batches 1–3 are layout and CSS and should land comfortably inside the $10 target.
Batch 4 is image generation, which is the expensive one — see the note there before running it.

---

## Read second: two risks worth a decision before you spend anything

### 1. AI photography versus what this site sells

The site's entire proposition is verified honesty. Freshness stamps on every dated claim. "Prices we
have checked ourselves, with the month we checked them." Heights omitted rather than guessed, with a
note saying so. An editorial policy page that explains at length why it will not publish an
unannounced date.

Putting AI-generated photographs of smiling families at the top of that is a real tension. If a
reader clocks the hero as synthetic — and people are getting fast at this — the damage lands on the
one asset the site actually has. It reads as "this site fabricates things," which is exactly the
accusation the whole freshness system exists to pre-empt.

Three ways through, in order of how well they hold up:

1. **Atmospheric, not documentary.** Fireworks, motion-blurred carousel lights, a silhouetted
   coaster train against dusk, the glow of a food stall at night. No identifiable faces presented as
   real guests. Nobody feels lied to by an abstract firework.
2. **Label it.** A quiet, permanent image credit — "Illustrative imagery, AI-generated" — in the
   footer and on the about page. Cheap, and consistent with a site that already tells you what it
   does not know.
3. **Licensed stock of real people.** Costs money, carries no synthetic-media risk at all, and is
   what a Fortune 500 build would actually do.

The prompts below are written for option 1 with option 2 attached, because that combination keeps
the joy you asked for without spending the site's credibility on it. Say the word and I will rewrite
Batch 4 for documentary-style people instead.

### 2. Performance, which the site currently advertises

The home page says the tools are "built to work on park WiFi," the service worker precaches 28 URLs,
and the whole site builds to pages that load fast on a bad connection. Large hero photography is the
single fastest way to make that claim false.

So the prompts carry a hard budget: **hero image ≤ 120 KB in AVIF**, everything below the fold lazy
loaded, every image responsive with `srcset`, and a blurred placeholder so nothing reflows. A
"Fortune 500 visual overhaul" prompt that omits this reliably returns a 4 MB hero.

### 3. Colour, and the trap in the brief

The current palette is deliberately forest green and amber — the CSS comment says "deliberately not
Disney-adjacent." You have asked for big colourful fireworks and a lit pink castle.

Both can be true, and the resolution is the one any serious studio would reach for: **the UI chrome
stays restrained and the photography carries all the colour.** Buttons, tables, cards, type — quiet,
editorial, high-contrast. Then a full-bleed firework image hits like a firework, because everything
around it is calm.

The failure mode is theming the interface itself in carnival colours. That reads as cheap, it fights
every data table on the site, and it would undo the credibility the restraint is buying. The prompts
are explicit about this.

---

## Setup — paste this into Lovable's Knowledge panel, not the chat

This costs nothing and applies to every subsequent message.

```
PROJECT: Design comps for "Ride Ready Guide", an independent, unofficial theme-park planning site.

OUTPUT FORMAT — THIS IS THE MOST IMPORTANT CONSTRAINT
- Produce a SINGLE self-contained .html file per batch: plain semantic HTML plus one <style> block.
- NO React. NO TypeScript. NO Tailwind. NO shadcn. NO build step. NO npm packages. NO JS frameworks.
- Vanilla JS only where interaction is genuinely required, and keep it under 30 lines.
- The target codebase is a zero-dependency static site generator that emits hand-written HTML and
  one hand-written stylesheet. Anything framework-shaped is unusable and will be thrown away.

REUSE THE EXISTING DESIGN SYSTEM
- Use the CSS custom properties and class names given in each prompt EXACTLY as written. Do not
  rename them, do not prefix them, do not convert them to utility classes.
- Style existing classes; add new ones only when a genuinely new element is introduced.

BRAND POSITIONING
- Independent, unofficial, evidence-led. The site's value is that it tells the truth about theme
  parks, including unflattering truths, and dates every claim.
- Tone: confident editorial, closer to a serious travel magazine or a well-made financial product
  than to a holiday brochure. Restraint reads as authority here.
- The UI chrome stays calm — quiet colour, strong typographic hierarchy, generous whitespace.
  Photography carries ALL of the colour and energy. Never theme the interface itself in bright
  carnival colours.

INTELLECTUAL PROPERTY — HARD RULES, NO EXCEPTIONS
- This site is NOT affiliated with Disney, Universal, or any park operator.
- NEVER depict, imitate, or evoke: Mickey Mouse or any Disney character; the three-circle "Mickey
  head" silhouette in ANY form, including balloons, pretzels, ice-cream bars, waffles, straws,
  antenna toppers, or topiary; Sleeping Beauty Castle or Cinderella Castle or any close variant;
  Disney or Universal logos, wordmarks, fonts, ride vehicles, monorails, or costumed characters;
  Disney cast-member costume design or name-tag styling; Harry Potter, Star Wars, Marvel, Nintendo,
  or any other licensed property.
- Castles must be architecturally distinct from any real theme-park castle: different silhouette,
  different turret count and arrangement, drawn from real European architectural traditions.
- No recognisable real people and no celebrity likenesses.
- Park staff, when depicted, wear plain unbranded uniforms — solid colours, no logos, no name tags.

PERFORMANCE BUDGET — NON-NEGOTIABLE
- Hero image: 120 KB maximum, AVIF with a WebP fallback.
- Every image: responsive srcset, explicit width/height to prevent layout shift, and
  loading="lazy" plus decoding="async" on everything below the fold.
- No web fonts. The site uses the system font stack on purpose.
- No icon libraries. Inline SVG only, drawn by hand.
- Total CSS added must stay under 400 lines.

ACCESSIBILITY — NON-NEGOTIABLE
- WCAG 2.2 AA contrast minimum on every text/background pair, in BOTH light and dark themes.
- Visible focus rings on every interactive element. Never remove outlines without replacing them.
- All motion wrapped in @media (prefers-reduced-motion: no-preference).
- Text over photography must sit on a scrim or gradient that guarantees contrast — never raw text
  on a raw photo.
- Decorative images get alt="". Meaningful images get real descriptions.
```

---

## Batch 1 — Foundation and hero

Paste verbatim.

```
Build a single self-contained HTML file called `comp-1-hero.html` showing a redesigned home-page
masthead, hero, and footer for Ride Ready Guide. Follow the Knowledge panel constraints exactly —
plain HTML plus one <style> block, no React, no Tailwind, no build step.

USE THESE EXACT CSS CUSTOM PROPERTIES (they already exist in the codebase — reuse, do not redefine
the palette):

  --paper --surface --surface-2 --surface-3
  --ink --ink-2 --muted --line --line-strong
  --brand (#0f3d2e) --brand-2 (#17604a) --brand-3 (#2a8a6b) --brand-soft
  --accent (#a9660f) --accent-2 (#d08c28) --accent-soft
  --danger --warn --good  (each with a matching --*-soft)
  --focus
  --radius-xs --radius-sm --radius --radius-lg --radius-xl
  --shadow-sm --shadow --shadow-lg
  --space-1 … --space-9
  --shell (1180px) --shell-narrow (760px) --shell-wide (1440px) --gutter
  --font-sans --font-display --font-mono
  --step--1 --step-0 --step-1 --step-2 --step-3 --step-4 --step-5   (fluid clamp() type scale)

USE THESE EXACT CLASS NAMES:

  Masthead:  .site-header  .site-header__inner  .brandmark  .brandmark__mark  .brandmark__text
             .brandmark__name  .brandmark__tag  .primary-nav  .header-actions  .icon-button
             .nav-toggle  .nav-toggle__bars  .skip-link
  Hero:      .hero  .hero__inner  .hero__body  .hero__aside  .hero__eyebrow  .hero__title
             .hero__lede  .hero__meta  .hero__meta-label  .hero__meta-value  .hero__actions
  Buttons:   .btn  .btn--primary  .btn--ghost  .btn--small
  Stats:     .stat-row  .stat-row__value  .stat-row__label
  Footer:    .site-footer  .site-footer__grid  .site-footer__col  .site-footer__tagline
             .site-footer__legal  .site-footer__note  .copyright  .disclaimer
  Layout:    .shell  .shell--narrow  .shell--wide  .band  .band--tint  .band--brand

WHAT TO DESIGN

1. MASTHEAD. Sticky, slim, quiet. A wordmark lockup where `.brandmark__mark` is a small hand-drawn
   inline SVG monogram (2 letters, geometric, no characters, no castles). Primary nav, a search
   button, and a light/dark theme toggle. On scroll past 80px it gains a hairline bottom border and
   a backdrop blur — nothing more dramatic. Mobile: a proper hamburger to a full-height drawer.

2. THE HERO — this is the centrepiece. Full-bleed cinematic photography with an editorial text block
   over it. Requirements:
   - Image sits in a `<picture>` with AVIF + WebP sources and a `srcset`, `width`/`height` set,
     `fetchpriority="high"`, and a blurred low-quality placeholder behind it so nothing reflows.
   - A layered scrim — a dark linear gradient from the bottom plus a subtle radial vignette — tuned
     so the headline holds AA contrast over the brightest part of the photograph. Show me the
     contrast maths in a CSS comment.
   - Text block left-aligned, max-width 20ch on the headline, using --step-5 for the h1 and
     --step-2 for the lede. Eyebrow in --accent, uppercase, letterspaced.
   - `.hero__meta` renders 3 stat pairs along a hairline rule beneath the lede.
   - Two buttons: one solid `.btn--primary`, one `.btn--ghost` that is legible over photography.
   - Placeholder image for now: a dark neutral gradient with a centred note reading
     "HERO — fireworks over a fairground, see Batch 4". Do not generate images in this batch.
   - Height: min(78vh, 720px) on desktop, comfortable on mobile, never a full 100vh lock.

3. A "TRUST STRIP" immediately below the hero. A single quiet horizontal band, `.band--tint`,
   carrying four short proof points with tiny inline SVG icons: independent and unofficial; every
   fact carries the month it was checked; no affiliate-driven rankings; works offline in the park.
   This band is the credibility anchor — keep it understated and typographic, not a card grid.

4. FOOTER. Four-column link grid collapsing to two then one. Beneath it: the unaffiliated
   disclaimer in `.disclaimer` (small, muted, but genuinely readable — not grey-on-grey), the
   copyright line, and a one-line image credit reading "Illustrative imagery, AI-generated."

TYPOGRAPHY DIRECTION
System font stack only. Establish real hierarchy through weight, size, colour and space rather than
through decoration. Headline weight 700–800 with tight tracking (-0.02em) and a line-height near
1.05. Body at 1.65 line-height, max 68ch. This should read like a magazine that respects the reader.

MOTION
Restrained and purposeful. A slow 8-second Ken Burns drift on the hero image, buttons that lift 1px
on press, nav that fades on scroll. All of it inside
@media (prefers-reduced-motion: no-preference).

DELIVER
The complete file, both light and dark themes working via `prefers-color-scheme` AND a
`[data-theme]` attribute override, responsive from 320px to 1920px. At the end of the file, add an
HTML comment listing every new CSS class you introduced and why it was needed.
```

---

## Batch 2 — Content components

Run after Batch 1 lands. Paste verbatim.

```
Now build `comp-2-components.html` — a single self-contained page showing the redesigned content
components, in the same visual language as comp-1-hero.html. Same rules: plain HTML plus one <style>
block, no React, no Tailwind, no build step, reuse the same custom properties.

Style these EXACT existing classes. This is a restyle, not a rename:

  Cards:      .card  .card--feature  .card-grid  .card__eyebrow  .card__title  .card__summary
              .card__badges  .card__meta
  Links:      .link-grid  .link-tile  .link-tile--external  .link-tile__title  .link-tile__summary
              .link-tile__chev
  Sections:   .band  .band--tint  .band--brand  .band--tight  .band__head  .band__intro  .kicker
  Tables:     .data-table  .data-table--dense  .compare-table  .table-wrap
  Pills:      .pill  .pill--height  .pill--ll  .pill--closed  .pill--must  .pill--diet
              .pill--price  .pill--good  .pill--warn  .pill--danger  .pill--muted
  Height:     .hbadge  .hbadge--any  .hbadge--short  .hbadge--mid  .hbadge--tall
  Callouts:   .callout  .callout--tip  .callout--warning  .callout--money  .callout--legal
              .callout__icon  .callout__title  .callout__body
  Freshness:  .freshness  .freshness--good  .freshness--warn  .freshness--stale  .freshness--danger
              .freshness__dot  .freshness__lead  .freshness__meta  .freshness__note
  Food:       .food-card  .food-grid  .food-card__head  .food-card__name  .food-card__price
              .food-card__desc  .food-card__verdict  .food-card__where  .food-card__tags
  Verdicts:   .verdict  .verdict-box  .verdict__cols  .verdict__col--yes  .verdict__col--no
              .proscons  .proscons__pro  .proscons__con  .give-take
  Ranking:    .rank-list  .rank-item  .rank-item__num  .rank-item__name  .rank-item__headline
  Prose:      .prose  .prose--lede  .faq  .faq__item  .faq__title  .faq__answer  .toc
  Grades:     .grade  .grade--great  .grade--good  .grade--mixed  .grade--poor  .grade--lg
  Meters:     .meter  .meter__track  .meter__fill  .meter__head  .meter__value  .meter-grid

KEY DESIGN NOTES

- CARDS carry an optional 16:9 image at the top with rounded top corners, lazy-loaded, with a
  gradient placeholder. A card without an image must look equally deliberate, not broken.
- THE FRESHNESS RIBBON is the site's signature element and deserves the most care. It states when a
  fact was checked and how confident we are: confirmed / expected / historical, plus a stale state
  when a page is past its review date. Four visually distinct states that stay distinguishable
  without colour alone — pair each with a different dot treatment (filled, ring, half, hollow) so it
  survives greyscale and colour-blindness. This must feel like a precision instrument, not a badge.
- DATA TABLES are used heavily and must be genuinely excellent: sticky headers, zebra striping at
  very low contrast, tabular numerals via font-variant-numeric, right-aligned numbers, and
  horizontal scroll inside `.table-wrap` with a fade edge indicating more content. They must stay
  readable at 320px.
- HEIGHT BADGES encode inches. Four bands, ordered, legible at a glance, and never colour-only.
- CALLOUTS get a hand-drawn inline SVG icon each, 20px, currentColor, stroke-based.
- FOOD CARDS show a price, a verdict, and dietary tags. Price is the most prominent element after
  the name — people scan for it.

Show every component in BOTH light and dark themes on the same page, in a two-column comparison so
the pairs can be checked side by side. Include one deliberately long-text example of each to prove
nothing breaks on overflow.

At the end, add an HTML comment listing new classes introduced and why.
```

---

## Batch 3 — Interactive tools

Run after Batch 2. Paste verbatim.

```
Now build `comp-3-tools.html` — the visual layer for the three interactive tools. Same rules as
before: plain HTML plus one <style> block, no React, no Tailwind, no build step, same custom
properties. Vanilla JS only, under 30 lines total, and only where interaction genuinely needs it.

The real tools already have working JavaScript that I am keeping. You are designing the presentation
only, so do NOT rebuild the logic — style the markup and make the states obvious.

1. HEIGHT CHECKER — the site's most-used tool.
   Classes: .hchecker .hchecker__control .hchecker__readout .hchecker__value .hchecker__unit
            .hchecker__cm .hchecker__scale .hchecker__summary .hchecker__park .hchecker__stat
   One large range slider sets a child's height. Everything else responds. Requirements:
   - The current height is the largest number on the page — treat it as a readout on an instrument.
     Inches primary, centimetres secondary and muted.
   - A horizontal scale beneath the slider marks the real thresholds (32, 35, 38, 40, 42, 44, 46,
     48 inches) with tick marks, so a parent can see the next threshold coming.
   - Per-park summaries showing how many attractions the child clears versus misses, and — the part
     that matters most — what they miss BY AN INCH. That near-miss case deserves its own visual
     treatment; it is the single most useful thing this tool says.
   - The slider must be fully keyboard operable with a visible focus ring and correct ARIA.

2. FOOD TRACKER
   Classes: .tracker .tracker-bar .tracker-actions .tracker-progress .tracker-progress__ring
            .tracker-progress__count .tracker-progress__label .food-grid .filter-bar .chip
   A checklist of snacks marked want / tried / skip, saved on the device. Needs:
   - A circular SVG progress ring showing how many have been tried. Animated stroke-dashoffset,
     inside a reduced-motion guard.
   - A sticky filter bar of `.chip` toggles that stays usable one-handed on a phone.
   - Three clearly distinct item states. Not colour alone — the "tried" state should feel settled
     and slightly recessed, the "want" state should feel active.

3. TRIP TIMING RANKER
   Classes: .timing-controls .timing-priorities .timing-priority .timing-results .timing-result
            .timing-result__rank .timing-result__name .timing-result__bar .timing-result__fill
   The reader weights what they care about — crowds, cost, weather, what is running — and twelve
   months re-rank. Needs:
   - Priority controls that make the current weighting obvious at a glance.
   - A ranked result list with horizontal score bars that animate on change.
   - Rank 1 visually distinguished without a trophy or a gimmick.

Every tool must work at 320px, be fully keyboard operable, and announce changes to screen readers
via a polite live region. Show each tool in both themes.
```

---

## Batch 4 — Imagery

**Run this last, and read this paragraph before you do.** This is the expensive batch — image
generation costs meaningfully more per asset than layout work, and twelve images may well exceed the
$10 target on its own. Two cheaper options: generate only the hero and two section images now and
add the rest later, or generate the images in a dedicated image tool and have Lovable place them.
The prompts below work either way.

Paste verbatim.

```
Generate the photographic assets for the design comps, then produce `comp-4-imagery.html` placing
them into the layouts from batches 1–3.

RE-READ THE IP RULES IN THE KNOWLEDGE PANEL BEFORE GENERATING ANYTHING. They are not boilerplate.
Image models drift toward Disney whenever a prompt says "theme park", and there are two specific
failure modes I need you to actively guard against:

  (a) THE THREE-CIRCLE SILHOUETTE. Ask a model for "theme park snack" and it will happily produce a
      Mickey-shaped pretzel, ice cream bar, or balloon. Every food and balloon image must be checked
      for this and regenerated if it appears. No three-circle arrangements anywhere.
  (b) THE CASTLE. "Pink castle lit at night" describes a specific, aggressively protected building.
      The castle asset must be unmistakably a DIFFERENT building — see the brief below — and if it
      comes out looking like the real one, regenerate it rather than shipping it.

HOUSE PHOTOGRAPHIC STYLE — apply to every image so the set reads as one commission:
  Shot on a full-frame camera, 35mm or 50mm prime, wide aperture, natural light where possible.
  Rich but believable colour, deep shadows that keep detail, slight film grain. Warm highlights,
  cool shadows. Editorial documentary feel — a magazine photo essay, not stock photography and not
  a brochure. Absolutely no text, no logos, no watermarks, no signage with readable words.
  16:9 unless stated. Photorealistic.

THE IMAGES

1. HERO — "Fireworks over a fairground"
   Enormous golden and magenta firework bursts filling a deep indigo night sky, seen above the
   silhouetted rooflines of a generic fairground: a Ferris wheel, striped canvas awnings, string
   lights. Shot from within a crowd, so anonymous backlit heads and shoulders form the lower
   foreground. Deep blues and blacks in the lower third so white text sits over it cleanly. The
   fireworks occupy the upper right. No castle in this frame. No identifiable faces.

2. THE CASTLE — "A lit castle at dusk"
   A fantasy castle at blue hour, lit from below in warm rose and amber, against a deep teal sky.
   CRITICAL: this must be architecturally distinct from any real theme-park castle. Base it on a
   Moorish-Gothic hybrid — horseshoe arches, a single dominant square keep off-centre rather than a
   central spire, exactly two slim flanking towers with copper onion domes, and a wide arcaded
   terrace at the base. Asymmetric. No fairytale cluster of blue conical spires. Shot from a low
   three-quarter angle across water with a reflection. Stylised and painterly rather than
   documentary — this should read as an illustration of an idea, not a photograph of a place.

3. FAMILY JOY — "The moment the ride drops"
   A packed roller-coaster train at the crest of a drop, shot from the front, everyone's arms up,
   faces caught mid-scream and mid-laugh. Bright overcast daylight, motion blur in the background,
   the train sharp. Genuine unposed delight — open mouths, closed eyes, hair flying. Mixed ages and
   ethnicities. Plain clothing, no branded merchandise, no character ears of any kind.

4. THE CAROUSEL — "Small hands, bright horses"
   Interior of a traditional carousel at night, long exposure so the lights streak into gold ribbons
   while one painted horse and the small child riding it stay sharp. Warm bulbs, mirrored panels,
   ornate gilt. Wonder rather than excitement. Shot at child height.

5. PARK STAFF — "The welcome"
   A smiling attendant in a plain solid-colour uniform — no logo, no name tag, no character
   costuming — leaning slightly forward to give directions to a family, one arm extended pointing
   off-frame. Warm afternoon light, shallow depth of field. The interaction is the subject. Genuine
   warmth, not a customer-service smile.

6. FAIR FOOD — "Worth the money"
   An overhead flat-lay on weathered wood of vivid fairground food: a fresh-cut churro dusted in
   cinnamon sugar, a paper tray of loaded fries, a tall swirl of soft-serve in a waffle cone, a
   turkey leg, a paper cup of lemonade with condensation. Hard directional afternoon light, strong
   shadows. Nothing shaped like three circles. No branded packaging, no readable text on any
   wrapper.

7. THE QUEUE AT GOLDEN HOUR — "Waiting"
   A long switchback queue line seen from above at golden hour, warm low sun raking across, people
   in small clusters talking and laughing. Honest rather than flattering — this site tells the truth
   about queues. Long shadows, dust in the air.

8. WATER RIDE — "The splash"
   A log flume boat hitting the bottom of its drop, an enormous wall of white water frozen mid-air,
   the riders soaked and delighted behind it. High shutter speed, backlit so the spray glows.

9. NIGHT MARKET — "The food stall glow"
   A food stall at night, warm bulbs strung above the counter, steam rising, a vendor mid-motion
   handing something across. Everything else falls into darkness. Deep shadows, saturated warm
   pools of light. Bokeh from string lights behind.

10. QUIET MOMENT — "The end of the day"
    A parent carrying a sleeping child on their shoulder, walking away from camera down a lamplit
    path, both in silhouette against the warm blur of a fairground behind. Tender, unposed, slightly
    melancholy. This is the emotional counterweight to the fireworks.

TECHNICAL DELIVERY FOR EVERY IMAGE
  - AVIF primary with WebP fallback, inside <picture>.
  - Three widths in srcset: 640 / 1280 / 1920, with correct `sizes`.
  - Hero under 120 KB. Section images under 80 KB each.
  - Explicit width and height on every <img> to prevent layout shift.
  - loading="lazy" and decoding="async" on everything except the hero, which gets
    fetchpriority="high".
  - A 20px-wide blurred base64 LQIP behind each, revealed with a short cross-fade.
  - Decorative images alt="". Meaningful ones get a real description.
  - Every image needs a scrim wherever text sits over it. Verify AA contrast and note the ratio in
    a CSS comment.

Deliver comp-4-imagery.html with all images placed in the batch 1–3 layouts, and list every
generated file with its final byte size so the performance budget can be checked.
```

---

## What happens next

Send me the four HTML files and I will port them: the CSS folds into `assets/css/main.css` against
the same tokens, and the markup changes go into `src/templates/components.mjs` and the page modules.
Because the prompts pin the existing class names, most of it should be a stylesheet swap rather than
a template rewrite.

Two things I will check before anything ships, and will report honestly either way:

- **The performance budget, measured rather than promised.** If the hero lands at 400 KB, the "works
  on park WiFi" claim comes off the home page or the image gets cut. The claim is not negotiable
  against a nicer photograph.
- **Every generated image against the IP rules**, particularly the castle and anything food-shaped.

The image credit line goes in whether or not you take the labelling suggestion seriously — it costs
one line in the footer and it is the difference between "illustrative imagery" and an accusation of
fabrication landing on a site whose whole argument is that it does not fabricate things.
