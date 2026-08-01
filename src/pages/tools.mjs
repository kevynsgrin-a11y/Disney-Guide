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
      schema: [S.itemList(site, {
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
            <div class="hchecker__summary">
              <div class="hchecker__stat"><b data-height-can>—</b><span>rides they can do</span></div>
              <div class="hchecker__stat"><b data-height-cant>—</b><span>still too short</span></div>
              <div class="hchecker__stat"><b data-height-pct>—</b><span>of all rides</span></div>
            </div>
            <p class="center mt-4" data-print-hide>
              <button class="chip" type="button" data-height-unit aria-pressed="false">Show centimetres</button>
            </p>
          </div>

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
              body: 'A child tall enough for a ride is not automatically ready for it. Our [is it scary guide](/guides/is-it-scary/) covers darkness, drops, and sudden noise, which stop more small children than the measuring stick does.',
            })}
          </div>
        </div>
      `,
    })}

    ${C.relatedLinks([
      { href: urls.guide('height-requirements'), label: 'The full height guide', summary: 'Bands, edge cases, and per-park breakdowns' },
      { href: data.link.riderSwitch, label: 'Rider switch', summary: 'How adults ride when a child cannot' },
      { href: urls.guide('is-it-scary'), label: 'Is it scary?', summary: 'The other limit that matters' },
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
      scripts: ['/assets/js/height-checker.js'],
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
