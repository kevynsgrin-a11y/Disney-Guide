import { html, raw, paragraphs } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as S from '../lib/schema.mjs'
import { urls, foodTrackerOrder } from '../lib/data.mjs'
import * as f from '../lib/format.mjs'

/* ------------------------------------------------------------------ *
 * Food Tracker
 * ------------------------------------------------------------------ */

export function foodTrackerPage (data) {
  const { site, parks } = data
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: urls.toolsIndex() },
    { label: 'Food Tracker', href: urls.foodTracker() },
  ]

  const order = foodTrackerOrder(data).ids
  const total = data.allFood.length
  const categories = [...new Set(data.allFood.map((i) => i.category))]
  const diets = [...new Set(data.allFood.flatMap((i) => i.dietaryTags || []))]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: 'Tool · saves on your device · works offline',
      title: `${site.brand.shortName} Food Tracker`,
      lede: `Every snack worth knowing about across all ${data.parks.length} parks — ${total} of them, with checked prices and honest verdicts. Mark what you want, tick off what you have tried, share the list, print it, take it into the park with no signal.`,
      tone: 'compact',
    })}

    <div class="tracker-bar" data-print-hide>
      <div class="shell tracker-bar__inner">
        <div class="tracker-progress">
          <svg class="tracker-progress__ring" viewBox="0 0 44 44" aria-hidden="true">
            <circle class="tracker-progress__bg" cx="22" cy="22" r="18"/>
            <circle class="tracker-progress__fg" cx="22" cy="22" r="18"
                    transform="rotate(-90 22 22)" stroke-dasharray="0 113"/>
          </svg>
          <span class="tracker-progress__text">
            <span class="tracker-progress__count" data-progress-count>0 / ${total}</span>
            <span class="tracker-progress__label" data-progress-label>0% tried · 0 on your list</span>
          </span>
        </div>
        <div class="tracker-actions">
          <button class="btn btn--ghost btn--small" type="button" data-action="share">Copy share link</button>
          <button class="btn btn--ghost btn--small" type="button" data-action="print">Print checklist</button>
          <button class="btn btn--ghost btn--small" type="button" data-action="want-visible">Add visible to list</button>
          <button class="btn btn--ghost btn--small" type="button" data-action="reset">Clear</button>
        </div>
      </div>
    </div>
    <p class="shell small muted" role="status" data-tracker-status></p>

    ${C.section({
      tone: 'tight',
      children: html`
        <div class="filter-bar" data-print-hide>
          <label for="food-search">Filter</label>
          <span class="field-inline">
            <input id="food-search" type="search" data-filter="query" placeholder="Search all ${total} items…" autocomplete="off">
          </span>
          <span class="field-inline">
            <label class="visually-hidden" for="food-park">Park</label>
            <select id="food-park" data-filter="park">
              <option value="all">Every park</option>
              ${parks.map((p) => html`<option value="${p.slug}">${p.name}</option>`)}
            </select>
          </span>
          <span class="field-inline">
            <label class="visually-hidden" for="food-status">Status</label>
            <select id="food-status" data-filter="status">
              <option value="all">Any status</option>
              <option value="want">On my list</option>
              <option value="tried">Already tried</option>
              <option value="skip">Skipping</option>
              <option value="unset">Not yet marked</option>
            </select>
          </span>
          ${categories.map((cat) => html`<button class="chip" type="button" data-filter="category" data-value="${cat}" aria-pressed="false">${f.foodCategory(cat)}</button>`)}
          ${diets.map((d) => html`<button class="chip" type="button" data-filter="diet" data-value="${d}" aria-pressed="false">${f.diet(d)}</button>`)}
        </div>
        <p class="small muted" data-print-hide role="status"><span data-shown-count>${total}</span> of ${total} shown</p>
      `,
    })}

    ${parks.map((park) => html`
      <section class="band ${parks.indexOf(park) % 2 ? 'band--tint' : ''} park-group" data-park-group="${park.slug}">
        <div class="shell">
          <header class="band__head">
            <p class="kicker">${park.resortInfo ? park.resortInfo.shortName : ''}</p>
            <h2>${park.name}</h2>
            <p class="band__intro">${park.food.length} tracked items · <a href="${urls.snacks(park)}">the ranked version</a></p>
          </header>
          <div class="food-grid">
            ${park.topFood.map((item) => C.foodCard(item, { tracker: true, showPark: false }))}
          </div>
        </div>
      </section>
    `)}

    <div class="shell">
      <div class="empty-state" data-empty-state hidden>
        <h3>Nothing matches those filters</h3>
        <p>Clear a filter or two and the list comes back.</p>
      </div>
    </div>

    ${C.section({
      title: 'How this works, and what it does with your data',
      hide: 'checklist',
      children: html`
        <div class="split split--even">
          <div class="prose">
            ${paragraphs([
              'Your list is stored in your browser, on your device, using localStorage. There is no account, no sign-up, and no server copy. We cannot see what you marked, because it never leaves your phone.',
              'The **Copy share link** button packs your whole list into the URL itself — two bits per item, base64-encoded — so a link is self-contained and still costs nothing to host. Send it to whoever you are travelling with and they get your exact list.',
              '**Print checklist** produces a clean, grouped, tickable sheet with no navigation, no ads, and no colour. Skipped items drop off it entirely.',
              'Once you have opened this page on a decent connection, it is cached on your device. It keeps working in the park when the WiFi does not, which is most of the time.',
            ])}
          </div>
          <div>
            ${C.callout({
              type: 'tip',
              title: 'Old share links keep working',
              body: 'Item ids never change and the canonical order is only ever appended to, so a link you sent a year ago still decodes correctly. Items added since then simply show up unmarked.',
            })}
            ${C.callout({
              type: 'note',
              title: 'Prices are dated, not live',
              body: 'Every price here carries the month we last checked it. Snack prices move once or twice a year, almost always upward. Treat an older date as a guide.',
            })}
          </div>
        </div>
      `,
    })}

    <div data-checklist-hide>
      ${C.relatedLinks(parks.slice(0, 4).map((p) => ({
        href: urls.snacks(p), label: `Best snacks at ${p.shortLabel}`, summary: `${p.food.length} items, ranked`,
      })), { title: 'Park by park' })}
    </div>

    <script type="application/json" id="food-order">${raw(JSON.stringify(order))}</script>
  `

  return {
    url: urls.foodTracker(),
    html: renderPage({
      site,
      page: {
        url: urls.foodTracker(),
        title: `${site.brand.shortName} Food Tracker`,
        titleTail: ' — all six US parks',
        description: `Track ${total} theme park snacks across all ${data.parks.length} parks. Saves to your device, shares as a link, prints as a checklist, and works offline in the park.`,
        trail,
        modified: '2026-07-01',
        bodyClass: 'page-tracker',
      },
      body,
      scripts: ['/assets/js/food-tracker.js'],
      schema: [
        S.webApplication(site, {
          url: urls.foodTracker(),
          name: `${site.brand.shortName} Food Tracker`,
          description: `Track ${total} theme park snacks across all ${data.parks.length} parks. Saves to your device, shares as a link, prints as a checklist, works offline.`,
        }),
        S.itemList(site, {
        url: urls.foodTracker(),
        name: 'Park snacks worth trying',
        items: data.allFood.filter((i) => i.mustTry >= 4).slice(0, 60),
      })],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Height Checker
 * ------------------------------------------------------------------ */

export function heightCheckerPage (data) {
  const { site, parks } = data
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: urls.toolsIndex() },
    { label: 'Height Checker', href: urls.heightChecker() },
  ]

  const payload = {
    // data.parks is already in the order site.json declares, so no second ordering is needed.
    parks: data.parks
      .map((park) => ({
        name: park.name,
        url: park.url,
        rides: park.attractions
          .filter((a) => a.isOpen && ['roller-coaster', 'dark-ride', 'water-ride', 'simulator', 'spinner', 'train', 'boat-ride', 'interactive-game'].includes(a.type))
          .map((a) => ({ n: a.name, h: a.heightIn })),
      }))
      .filter((p) => p.rides.length),
  }

  const allHeights = data.allHeightAttractions

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: `Tool · all ${data.parks.length} parks`,
      title: 'What can my child ride?',
      lede: 'Set one slider to your child’s height and see, park by park, exactly what they clear, what they miss, and what they miss by less than two inches. Measure with shoes on — that is how the parks do it.',
      tone: 'compact',
    })}

    ${C.section({
      children: html`
        <div class="hchecker">
          <div class="hchecker__control">
            <div class="hchecker__readout">
              <span class="hchecker__value" data-height-value>40</span>
              <span class="hchecker__unit" data-height-unit-label>inches</span>
              <span class="hchecker__cm" data-height-cm>102 cm</span>
            </div>
            <label class="visually-hidden" for="height-slider">Child height in inches</label>
            <input id="height-slider" type="range" min="28" max="56" step="1" value="40" data-height-slider>
            <div class="hchecker__scale" aria-hidden="true">
              <span>28"</span><span>34"</span><span>40"</span><span>46"</span><span>52"</span><span>56"</span>
            </div>
            <div class="hchecker__save-rider" data-save-rider-hook></div>
            <div class="hchecker__summary">
              <div class="hchecker__stat"><b data-height-can>—</b><span>rides they can do</span></div>
              <div class="hchecker__stat"><b data-height-cant>—</b><span>still too short</span></div>
              <div class="hchecker__stat"><b data-height-pct>—</b><span>of all rides</span></div>
            </div>
            <p class="center mt-4" data-print-hide>
              <button class="chip" type="button" data-height-unit aria-pressed="false">Show centimetres</button>
            </p>
          </div>

          <!-- The slider's result is a list of a hundred-odd rides. Announcing that on every tick
               is unusable, and announcing nothing — which is what shipped — leaves the tool's whole
               answer invisible to a screen reader. So the live region carries the count, debounced,
               and the list stays off it for anyone to read at their own pace. -->
          <p class="visually-hidden" role="status" aria-live="polite" data-height-announce></p>

          <div data-height-results></div>

          <noscript>
            <p class="muted">The slider needs JavaScript. The full height table below works without it.</p>
          </noscript>
        </div>
      `,
    })}

    ${C.section({
      tone: 'tint',
      title: `Every height requirement at all ${data.parks.length} parks`,
      intro: 'The complete reference table. Sort by height to see what unlocks next, or by park to plan a single day.',
      children: html`
        ${C.dataTable({
          sortable: true,
          className: 'data-table--stack',
          columns: [
            'Attraction', 'Park',
            { label: 'Height', align: 'num', sort: 'number' },
            { label: 'cm', align: 'num', sort: 'number' },
            'Type',
          ],
          rows: allHeights
            .slice()
            .sort((a, b) => a.heightIn - b.heightIn || a.park.name.localeCompare(b.park.name))
            .map((a) => [
              a.hasPage ? html`<a href="${a.url}">${a.name}</a>` : a.name,
              html`<a href="${a.park.url}">${a.park.shortLabel}</a>`,
              html`<span data-value="${a.heightIn}">${a.heightIn}"</span>`,
              html`<span data-value="${Math.round(a.heightIn * 2.54)}">${Math.round(a.heightIn * 2.54)}</span>`,
              f.attractionType(a.type),
            ]),
        })}
      `,
    })}

    ${C.section({
      title: 'How the parks measure',
      children: html`
        <div class="split split--even">
          <div class="prose">
            ${paragraphs([
              'A cast member measures against a fixed stick at the attraction entrance: shoes on, hats off, standing straight. There is no discretion in it and no point arguing — the stick is the policy.',
              'If your child is borderline, ask for a wristband at the first attraction that measures them. A coloured band means they have been measured for the day and will not be re-measured at every queue. It saves time and it saves your child being told no seven separate times.',
              'Thick-soled shoes are not cheating — the measurement is taken with shoes on, so what they wear genuinely matters. Hair volume does not count and will be flattened.',
            ])}
          </div>
          <div>
            ${C.callout({
              type: 'tip',
              title: 'Measure honestly at home',
              body: 'Barefoot against a wall, a book flat on the head, then add the sole thickness of the shoes they will actually wear. Round down. Optimistic home measurements are how families end up leaving a 50-minute queue in tears.',
            })}
            ${C.callout({
              type: 'note',
              title: 'Height is not the only limit',
              body: data.link.isItScary
                ? `A child tall enough for a ride is not automatically ready for it. Our [is it scary guide](${data.link.isItScary}) covers darkness, drops, and sudden noise, which stop more small children than the measuring stick does.`
                : 'A child tall enough for a ride is not automatically ready for it. Darkness, drops, and sudden noise stop more small children than the measuring stick does — each ride page on this site carries a scare assessment covering exactly those.',
            })}
          </div>
        </div>
      `,
    })}

    ${C.relatedLinks([
      { href: urls.guide('height-requirements'), label: 'The full height guide', summary: 'Bands, edge cases, and per-park breakdowns' },
      { href: data.link.riderSwitch, label: 'Rider switch', summary: 'How adults ride when a child cannot' },
      { href: data.link.isItScary, label: 'Is it scary?', summary: 'The other limit that matters' },
      { href: data.link.bestForYoungChildren, label: 'Best park for young children', summary: 'Where short riders get the most' },
    ])}

    <script type="application/json" id="height-data">${raw(JSON.stringify(payload))}</script>
  `

  return {
    url: urls.heightChecker(),
    html: renderPage({
      site,
      page: {
        url: urls.heightChecker(),
        title: `${site.brand.shortName} height checker`,
        titleTail: ': what can my kid ride?',
        description: `Set one slider to your child’s height and see every ride they can and cannot do at all ${data.parks.length} parks — including the ones they miss by an inch.`,
        trail,
        modified: '2026-07-01',
      },
      body,
      scripts: ['/assets/js/height-checker.js', '/assets/js/rider-profiles.js'],
      schema: [
        S.webApplication(site, {
          url: urls.heightChecker(),
          name: `${site.brand.shortName} height checker`,
          description: `Set one slider to your child's height and see every ride they can and cannot do at all ${data.parks.length} parks.`,
        }),
      ],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Rider Profiles — the height passport
 *
 * One payload shared by this page and the home page's watch strip: every
 * posted height requirement across the operator's parks, compact. The
 * client engine (assets/js/rider-profiles.js) keeps the riders themselves
 * in localStorage — no account, nothing uploaded, works offline.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Day Blueprint — a generated rope-drop-to-close plan, from the plans
 * our park pages are authored from, with the reasoning printed.
 * ------------------------------------------------------------------ */

export function dayBlueprintPage (data) {
  const { site } = data
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: urls.toolsIndex() },
    { label: 'Day Blueprint', href: urls.dayBlueprint() },
  ]
  const payload = {
    ridersUrl: urls.myRiders(),
    parks: data.parks.map((park) => ({
      name: park.name,
      url: park.url,
      plans: park.firstTimer
        ? {
            morning: park.firstTimer.morningPlan || [],
            midday: park.firstTimer.middayPlan || [],
            evening: park.firstTimer.eveningPlan || [],
          }
        : null,
    })),
  }

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: 'Tool · free, explainable',
      title: 'Day Blueprint',
      lede: `Pick a park and a pace. The plan is generated from the same authored morning-to-evening plans our park pages carry — and every step says why it is where it is, which is the part a generated itinerary usually hides.`,
      tone: 'compact',
      meta: [
        { label: 'Parks', value: `${payload.parks.length} with authored plans` },
        { label: 'Account', value: 'None' },
        { label: 'Works', value: 'Offline' },
      ],
    })}
    ${C.section({
      children: html`
        <div class="tool-sheet" data-blueprint>
          <noscript><p>This tool runs in your browser and needs JavaScript. The same plans exist as writing on every park page.</p></noscript>
        </div>
        <p class="muted field-note">Generated from our authored plans, not live wait times — verify the park's hours and any early-entry rules on the day. Riders, if saved, are greeted from this device only.</p>
      `,
    })}
    <script type="application/json" id="blueprint-data">${raw(JSON.stringify(payload))}</script>
  `
  return {
    url: urls.dayBlueprint(),
    html: renderPage({
      site,
      page: {
        url: urls.dayBlueprint(),
        title: 'Day Blueprint',
        titleTail: ': a generated park plan with its reasoning',
        description: `Generate a rope-drop-to-close plan for any of ${data.parks.length} parks from authored touring plans — every step explains why it is where it is. Free, offline, no account.`,
        trail,
        modified: '2026-07-01',
      },
      body,
      scripts: ['/assets/js/rider-profiles.js', '/assets/js/day-blueprint.js'],
      schema: [S.webApplication(site, {
        url: urls.dayBlueprint(),
        name: `${site.brand.shortName} Day Blueprint`,
        description: 'A generated park day plan built from authored touring plans, with the reasoning printed.',
      })],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Road-Trip Combiner — CoasterReady's multi-park itinerary tool.
 * ------------------------------------------------------------------ */

export function roadTripPage (data) {
  const { site } = data
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: urls.toolsIndex() },
    { label: 'Road-Trip Combiner', href: urls.roadTrip() },
  ]
  const payload = {
    note: site.roadTrip.note,
    clusters: site.roadTrip.clusters.map((c) => ({ slug: c.slug, name: c.name, blurb: c.blurb, schoolBand: c.schoolBand, parks: c.parks })),
    // Leg keys normalize to sorted pairs at build time so the engine's
    // legKey() lookup finds them regardless of authored key order.
    legs: Object.fromEntries(
      Object.entries({
        ...Object.assign({}, ...site.roadTrip.clusters.map((c) => c.legs)),
        ...site.roadTrip.spareLegs,
      }).map(([k, v]) => [k.split('|').sort().join('|'), v])
    ),
    parks: Object.fromEntries(data.parks.map((p) => [p.slug, { name: p.name, url: p.url }])),
  }

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: 'Tool · ten parks, five regions',
      title: 'Road-Trip Combiner',
      lede: 'Pick two to five parks and get the ordered trip: drive legs with typical times, one park per day, and the school-calendar crowd note that decides regional dates. Drive times are honest ranges, not promises.',
      tone: 'compact',
      meta: [
        { label: 'Clusters', value: `${payload.clusters.length} authored` },
        { label: 'Pairwise drives', value: `${Object.keys(payload.legs).length}` },
        { label: 'Account', value: 'None' },
      ],
    })}
    ${C.section({
      children: html`
        <div class="tool-sheet" data-roadtrip>
          <noscript><p>This tool runs in your browser and needs JavaScript.</p></noscript>
        </div>
        <p class="muted field-note">${payload.note}</p>
      `,
    })}
    <script type="application/json" id="roadtrip-data">${raw(JSON.stringify(payload))}</script>
  `
  return {
    url: urls.roadTrip(),
    html: renderPage({
      site,
      page: {
        url: urls.roadTrip(),
        title: 'Road-Trip Combiner',
        titleTail: ': multi-park itineraries with drive times',
        description: 'Combine two to five regional coaster parks into one ordered trip — drive legs, day assignments, and the school-calendar crowd windows that decide the dates.',
        trail,
        modified: '2026-07-01',
      },
      body,
      scripts: ['/assets/js/road-trip.js'],
      schema: [S.webApplication(site, {
        url: urls.roadTrip(),
        name: `${site.brand.shortName} Road-Trip Combiner`,
        description: 'Multi-park itineraries with typical drive times and school-calendar crowd notes.',
      })],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Express Pass ROI — Hollywood Ride Guide's queue-maths calculator.
 * ------------------------------------------------------------------ */

export function expressRoiPage (data) {
  const { site } = data
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: urls.toolsIndex() },
    { label: 'Express Pass ROI', href: urls.expressRoi() },
  ]
  const payload = {
    asOf: site.expressRoi.asOf,
    tiers: site.expressRoi.tiers,
    parks: site.expressRoi.parks.map((slug) => {
      const park = data.parks.find((p) => p.slug === slug)
      return { slug, name: park ? park.name : slug, url: park ? park.url : '/' }
    }),
    parkNote: site.expressRoi.parkNote,
    guideUrl: urls.guide(site.queue.guideSlug),
  }

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: 'Tool · the arithmetic, printed',
      title: 'Express Pass ROI',
      lede: 'Party size, the rides you actually re-ride, and a standby estimate in — cost per hour saved out. The verdict prints its arithmetic and its assumptions, because a queue-maths tool that hides either is marketing.',
      tone: 'compact',
      meta: [
        { label: 'Pricing', value: 'Banded ranges' },
        { label: 'Framing', value: site.expressRoi.asOf.split('—')[0].trim() },
        { label: 'Account', value: 'None' },
      ],
    })}
    ${C.section({
      children: html`
        <div class="tool-sheet" data-express-roi>
          <noscript><p>This tool runs in your browser and needs JavaScript.</p></noscript>
        </div>
        <p class="muted field-note">${payload.parkNote}</p>
      `,
    })}
    <script type="application/json" id="roi-data">${raw(JSON.stringify(payload))}</script>
  `
  return {
    url: urls.expressRoi(),
    html: renderPage({
      site,
      page: {
        url: urls.expressRoi(),
        title: 'Express Pass ROI',
        titleTail: ': is it worth it, in hours',
        description: 'The Express Pass buy-or-skip arithmetic: party size and re-rides against banded prices, printed with every assumption. Ranges as of July 2026.',
        trail,
        modified: '2026-07-01',
      },
      body,
      scripts: ['/assets/js/express-roi.js'],
      schema: [S.webApplication(site, {
        url: urls.expressRoi(),
        name: `${site.brand.shortName} Express Pass ROI`,
        description: 'The buy-or-skip arithmetic for Express Pass, printed with its assumptions.',
      })],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Haunt Planner — HHN night routes from the wait-curve pattern.
 * ------------------------------------------------------------------ */

export function hauntPlannerPage (data, seasonal) {
  const { site } = data
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: urls.toolsIndex() },
    { label: 'Haunt Planner', href: urls.hauntPlanner() },
  ]
  const bySlug = new Map(seasonal.events.map((e) => [e.slug, e]))
  const payload = {
    note: site.hauntPlanner.note,
    events: site.hauntPlanner.events.flatMap((slug) => {
      const ev = bySlug.get(slug)
      if (!ev) return []
      return [{
        slug: ev.slug,
        name: ev.name,
        url: urls.event(ev.slug),
        nights: ev.typicalWindow ? (ev.typicalWindow.nightsRange || null) : null,
        hours: ev.typicalWindow ? ev.typicalWindow.hours : null,
      }]
    }),
  }

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: 'Tool · pattern-based, honestly labelled',
      title: 'Haunt Planner',
      lede: 'House routes built from the haunt wait-curve pattern — the marquee mazes hold queues all night, the back half thins after midnight — tuned to your night type and arrival time. House names land on the event pages when the parks announce them; this turns the pattern into a plan you can print.',
      tone: 'compact',
      meta: [
        { label: 'Events', value: `${payload.events.length} covered` },
        { label: 'Basis', value: 'Multi-year pattern' },
        { label: 'Account', value: 'None' },
      ],
    })}
    ${C.section({
      children: html`
        <div class="tool-sheet" data-haunt-planner>
          <noscript><p>This tool runs in your browser and needs JavaScript.</p></noscript>
        </div>
        <p class="muted field-note">${payload.note}</p>
      `,
    })}
    <script type="application/json" id="haunt-data">${raw(JSON.stringify(payload))}</script>
  `
  return {
    url: urls.hauntPlanner(),
    html: renderPage({
      site,
      page: {
        url: urls.hauntPlanner(),
        title: 'Haunt Planner',
        titleTail: ': your Halloween Horror Nights route',
        description: 'Build an ordered haunted-house route from the wait-curve pattern — marquee mazes first, back half after midnight, line-skip math for peak Saturdays. Pattern-based and labelled as such.',
        trail,
        modified: '2026-07-01',
      },
      body,
      scripts: ['/assets/js/haunt-planner.js'],
      schema: [S.webApplication(site, {
        url: urls.hauntPlanner(),
        name: `${site.brand.shortName} Haunt Planner`,
        description: 'An ordered haunt-night route from the multi-year wait-curve pattern.',
      })],
    }),
  }
}

export function riderDataPayload (data) {
  return {
    myRidersUrl: urls.myRiders(),
    attractions: data.parks.flatMap((park) =>
      park.heightAttractions
        .filter((a) => a.isOpen)
        .map((a) => ({ n: a.name, h: a.heightIn, p: park.shortLabel || park.name, u: urls.heights(park) }))
    ),
  }
}

export function myRidersPage (data) {
  const { site } = data
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: urls.toolsIndex() },
    { label: 'My Riders', href: urls.myRiders() },
  ]
  const payload = riderDataPayload(data)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: 'Tool · the height passport',
      title: 'My Riders',
      lede: `Save each child once — name, birthday, height, measured with shoes on. From then on this site knows your family: every height table labels itself for your riders, and growth bands project when each ride unlocks.`,
      tone: 'compact',
      meta: [
        { label: 'Riders', value: 'On this device' },
        { label: 'Coverage', value: `${payload.attractions.length} posted heights` },
        { label: 'Account needed', value: 'None' },
      ],
      actions: [{ href: urls.heightChecker(), label: 'Open the height checker' }],
    })}

    ${C.section({
      children: html`
        <div class="rider-layout">
          <form class="rider-form" data-rider-form>
            <h2 class="rider-form__title">${'Add or update a rider'}</h2>
            <div class="field-inline">
              <label for="rider-name">Name</label>
              <input id="rider-name" name="name" type="text" maxlength="40" autocomplete="off" required placeholder="Maya">
            </div>
            <div class="field-inline">
              <label for="rider-birthday">Birthday <span class="muted">(optional — sharpens the growth estimate)</span></label>
              <input id="rider-birthday" name="birthday" type="date">
            </div>
            <div class="field-inline">
              <label for="rider-height">Height in inches <span class="muted">(shoes on, measured today)</span></label>
              <input id="rider-height" name="heightIn" type="number" min="24" max="84" step="0.5" inputmode="decimal" required placeholder="46">
            </div>
            <div class="field-inline">
              <label for="rider-measured">Measured on</label>
              <input id="rider-measured" name="measuredOn" type="date">
            </div>
            <p class="field-note muted" data-form-note></p>
            <button class="btn btn--primary" type="submit">Save rider</button>
            <p class="field-note muted">Stays on this device — no account, no sync, no email. Growth projections are banded estimates from typical growth by age, not promises; the height stick at the park always decides.</p>
          </form>
          <div class="rider-list" data-my-riders></div>
        </div>
        <p class="rider-print-row"><button class="btn btn--ghost" type="button" data-rider-print>Print the passport</button></p>
      `,
    })}

    <script type="application/json" id="rider-data">${raw(JSON.stringify(payload))}</script>
  `

  return {
    url: urls.myRiders(),
    html: renderPage({
      site,
      page: {
        url: urls.myRiders(),
        title: 'My Riders',
        titleTail: ': the height passport',
        description: `Save your children's heights once and every height requirement across all ${data.parks.length} parks labels itself for your family — with growth projections for every ride they have not yet reached.`,
        trail,
        modified: '2026-07-01',
      },
      body,
      scripts: ['/assets/js/rider-profiles.js'],
      schema: [
        S.webApplication(site, {
          url: urls.myRiders(),
          name: `${site.brand.shortName} My Riders`,
          description: 'Save each child once; every height table on this site labels itself for your family, with growth-projected unlock dates.',
        }),
      ],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Tools index
 * ------------------------------------------------------------------ */

export function toolsIndex (data) {
  const { site, parks } = data
  const trail = [{ label: 'Home', href: '/' }, { label: 'Tools', href: urls.toolsIndex() }]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: 'Free, no account, works offline',
      title: 'Tools',
      lede: 'The things a search result cannot do for you. Everything here runs entirely in your browser — nothing is uploaded, nothing needs an account, and all of it keeps working when the park WiFi gives up.',
      tone: 'compact',
    })}

    ${C.section({
      children: C.cardGrid([
        C.card({
          href: urls.myRiders(),
          tone: 'feature',
          eyebrow: 'Saves on this device',
          title: 'My Riders',
          summary: `The height passport: save each child once and every height requirement across all ${data.parks.length} parks labels itself for your family — plus growth-projected dates for every ride they have not reached.`,
        }),
        C.card({
          href: urls.heightChecker(),
          tone: 'feature',
          eyebrow: 'Interactive',
          title: 'Height Checker',
          summary: `One slider against ${data.allHeightAttractions.length} height requirements across all ${data.parks.length} parks. Shows what they clear, what they miss, and what they miss by an inch.`,
        }),
        C.card({
          href: urls.foodTracker(),
          tone: 'feature',
          eyebrow: 'Saves & shares',
          title: 'Food Tracker',
          summary: `${data.allFood.length} snacks with checked prices. Mark want, tried, or skip; share the list as a link; print it as a checklist; use it offline.`,
        }),
        C.card({
          href: urls.tripTiming(),
          tone: 'feature',
          eyebrow: 'Interactive',
          title: 'Trip Timing',
          summary: 'All twelve months re-ranked against what you actually care about — thin crowds, low cost, good weather, or plenty running. Most crowd calendars decide that for you.',
        }),
        C.card({
          href: urls.calendar(),
          tone: 'feature',
          eyebrow: 'Reference',
          title: 'Seasonal calendar',
          summary: 'Every event on one twelve-month timeline, colour-coded by how much has actually been confirmed.',
        }),
        C.card({
          href: urls.parksIndex(),
          tone: 'feature',
          eyebrow: 'Printable',
          title: 'Park maps',
          summary: `Schematic maps for all ${data.parks.length} parks, drawn by us from open geographic data. One page, black and white, no signal required.`,
        }),
      ], { columns: 3 }),
    })}

    ${C.section({
      tone: 'tint',
      title: 'Park maps',
      children: C.linkGrid(parks.map((p) => ({
        href: urls.map(p), label: `${p.name} map`, summary: `${p.lands.length} lands · printable`,
      })), { columns: 3 }),
    })}
  `

  return {
    url: urls.toolsIndex(),
    html: renderPage({
      site,
      page: {
        url: urls.toolsIndex(),
        title: `Free ${site.brand.shortName} planning tools`,
        description: `A height checker, an offline food tracker, a trip-timing ranker, and printable maps for all ${data.parks.length} parks. No account, no upload, no cost.`,
        trail,
        modified: '2026-07-01',
      },
      body,
    }),
  }
}
