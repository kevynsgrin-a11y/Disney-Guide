import { html, raw, paragraphs, inline } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as S from '../lib/schema.mjs'
import { urls } from '../lib/data.mjs'
import * as f from '../lib/format.mjs'
import * as SC from '../templates/seasonal-components.mjs'
import { bandCovers, ganttBands, BUILD_MONTH_NUMBER } from '../seasonal/core.mjs'
import { BUILD_MONTH as BUILD_MONTH_RAW } from '../lib/staleness.mjs'
import { BUILD_MONTH } from '../lib/staleness.mjs'
import { MONTHS } from '../lib/seasonal-data.mjs'

function parkCard (park) {
  return C.card({
    href: park.url,
    eyebrow: park.resortInfo ? park.resortInfo.shortName : '',
    title: park.name,
    summary: park.tagline || park.summary,
    badges: [
      { label: `${park.attractions.filter((a) => a.isOpen).length} attractions`, tone: '' },
      { label: `${park.heightAttractions.length} height limits`, tone: 'height' },
      { label: `${park.food.length} tracked snacks`, tone: 'good' },
    ],
    meta: [
      { label: 'Opened', value: String(park.opened || '').slice(0, 4) },
      { label: 'Plan for', value: park.stats && park.stats.typicalFullDayHours ? park.stats.typicalFullDayHours : '—' },
    ],
  })
}
/** Resolve the smallest accurate location label available for a spotlight event. */
function spotlightVenue (event, site) {
  if (event.parkInfo) return event.parkInfo.name
  const resort = (site.resorts || []).find((item) => item.slug === event.resort)
  return resort ? (resort.shortName || resort.name) : 'Seasonal event'
}

/** The dedicated card stays compact so the season reads as an editorial plate, not a product grid. */
function spotlightEventCard (event, site) {
  const status = event.staleness && event.staleness.confidence === 'confirmed'
    ? 'Confirmed'
    : (event.staleness ? event.staleness.confidenceLabel : 'Not verified')
  const statusClass = event.staleness && event.staleness.confidence === 'confirmed' ? ' spotlight__status--confirmed' : ''
  return html`
    <article class="spotlight__event">
      <p class="spotlight__status${statusClass}">${status}</p>
      <h3 class="spotlight__event-title"><a href="${event.url}">${event.shortName || event.name}</a></h3>
      <p class="spotlight__event-venue">${spotlightVenue(event, site)}</p>
    </article>
  `
}

/**
 * The season spotlight is a themed, self-retiring homepage plate. Its copy, dates, CTA links,
 * and prioritized cards are authored in site.json; this renderer only supplies the shared scene.
 */
function seasonSpotlight (site, running) {
  const spot = site.seasonSpotlight
  if (!spot || !spot.season || !spot.until) return raw('')
  const [untilYear, untilMonth] = String(spot.until).split('-').map(Number)
  const buildKey = Number(BUILD_MONTH_RAW.slice(0, 4)) * 12 + Number(BUILD_MONTH_RAW.slice(5, 7))
  const untilKey = untilYear * 12 + untilMonth
  if (buildKey > untilKey) return raw('')

  const inSeason = (spot.events || [])
    .map((slug) => (running || []).find((event) => event.slug === slug))
    .filter(Boolean)
  const fallbackEvents = (running || []).filter((event) => event.season === spot.season).slice(0, 3)
  const events = inSeason.length ? inSeason : fallbackEvents
  const pumpkins = [0, 1, 2, 3].map((i) => {
    const x = 1125 + i * 176 + (i % 2) * 20
    const y = [322, 298, 326, 302][i]
    const r = [48, 62, 44, 56][i]
    return `<g class="spotlight-pumpkin"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.82}" fill="#b55318"/>
      <ellipse cx="${x - r * 0.42}" cy="${y}" rx="${r * 0.3}" ry="${r * 0.74}" fill="#813014" opacity="0.56"/>
      <ellipse cx="${x + r * 0.42}" cy="${y}" rx="${r * 0.3}" ry="${r * 0.74}" fill="#813014" opacity="0.56"/>
      <path d="M ${x} ${y - r * 0.79} q 6 -17 20 -19 q -4 11 -8 19 z" fill="#53632f"/>
      <path class="spotlight-pumpkin__face" d="M ${x - r * 0.34} ${y - 8} l 12 8 l -14 1 z M ${x + r * 0.12} ${y - 8} l 12 8 l -14 1 z M ${x - 10} ${y + 14} q 10 7 20 0" fill="#ffd979" filter="url(#spotlight-glow)"/></g>`
  }).join('')
  const bats = [[1260, 122, 1], [1450, 82, 0.72], [1690, 138, 0.84]].map(([x, y, k]) =>
    `<path class="spotlight-bat" d="M ${x} ${y} q ${-14 * k} ${-10 * k} ${-26 * k} ${-4 * k} q ${-2 * k} ${8 * k} ${-16 * k} ${10 * k} q ${12 * k} ${2 * k} ${14 * k} ${10 * k} q ${10 * k} ${-8 * k} ${28 * k} ${-8 * k} q ${18 * k} ${0} ${28 * k} ${8 * k} q ${2 * k} ${-8 * k} ${14 * k} ${-10 * k} q ${-14 * k} ${-2 * k} ${-16 * k} ${-10 * k} q ${-12 * k} ${-6 * k} ${-26 * k} ${4 * k} z" fill="#110918"/>`
  ).join('')
  const lights = Array.from({ length: 13 }, (_, i) =>
    `<circle cx="${60 + i * 156}" cy="${52 + (i % 2) * 13}" r="${i % 3 === 0 ? 5 : 4}" fill="${i % 2 ? '#c68dd5' : '#e8a13c'}" opacity="0.9" filter="url(#spotlight-light)"/>`
  ).join('')

  return html`
    <section class="band spotlight spotlight--${spot.season}" aria-labelledby="season-spotlight-title">
      <div class="spotlight__scene" aria-hidden="true">
        <svg viewBox="0 0 1920 500" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="spotlight-sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#170d24"/><stop offset="0.58" stop-color="#241238"/><stop offset="1" stop-color="#31173a"/></linearGradient>
            <radialGradient id="spotlight-haze" cx="0.73" cy="0.18" r="0.52"><stop stop-color="#8e68a5" stop-opacity="0.28"/><stop offset="1" stop-color="#8e68a5" stop-opacity="0"/></radialGradient>
            <filter id="spotlight-light"><feGaussianBlur stdDeviation="2.4"/></filter>
            <filter id="spotlight-glow"><feGaussianBlur stdDeviation="3.6"/></filter>
          </defs>
          <rect width="1920" height="500" fill="url(#spotlight-sky)"/><rect width="1920" height="500" fill="url(#spotlight-haze)"/>
          <circle cx="1610" cy="96" r="124" fill="#f5e5bd" opacity="0.1"/><path d="M 1608 41 a 52 52 0 1 0 32 92 a 43 43 0 1 1 -32 -92 z" fill="#f4dfaa"/>
          ${bats}
          <path d="M 0 54 Q 410 86 875 52 T 1920 58" fill="none" stroke="#120a1c" stroke-width="1.4" opacity="0.9"/>
          ${lights}
          <path d="M 0 386 Q 240 330 470 370 T 930 356 T 1370 382 T 1920 344 V 500 H 0 Z" fill="#120b17" opacity="0.96"/>
          <path d="M 1012 366 H 1915 M 1012 406 H 1915 M 1040 344 V 430 M 1195 344 V 430 M 1350 344 V 430 M 1505 344 V 430 M 1660 344 V 430 M 1815 344 V 430" stroke="#20101d" stroke-width="9" opacity="0.94"/>
          ${pumpkins}
        </svg>
      </div>
      <div class="shell spotlight__inner">
        <div class="spotlight__content">
          <p class="spotlight__label">${spot.label}</p>
          <h2 id="season-spotlight-title" class="spotlight__title">${spot.title}</h2>
          <p class="spotlight__lede">${spot.lede}</p>
          ${events.length ? html`<div class="spotlight__events" aria-label="Seasonal events">${events.map((event) => spotlightEventCard(event, site))}</div>` : ''}
          <p class="spotlight__actions">
            <a class="btn spotlight__cta spotlight__cta--primary" href="${spot.primaryHref || urls.holidaysIndex()}">${spot.primaryLabel || 'Seasonal guide'}</a>
            <a class="btn spotlight__cta spotlight__cta--quiet" href="${spot.secondaryHref || urls.whenToGoIndex()}">${spot.secondaryLabel || 'When to go'}</a>
          </p>
        </div>
      </div>
    </section>
  `
}

/** A brief, decor-only welcome moment; it never captures input and removes itself after playing. */
function landingBats () {
  const bat = (name) => html`<svg class="landing-bats__bat landing-bats__bat--${name}" viewBox="0 0 80 28" aria-hidden="true"><path d="M0 12c9-10 19-10 29 0 4-9 9-12 11-12s7 3 11 12c10-10 20-10 29 0-9 1-15 5-19 12-5-2-10-5-21-5s-16 3-21 5C15 17 9 13 0 12Z" fill="currentColor" stroke="none"/></svg>`
  return html`
    <div class="landing-bats" data-landing-bats aria-hidden="true">
      ${bat('one')}${bat('two')}${bat('three')}${bat('four')}${bat('five')}
      <svg class="landing-bats__bolt" viewBox="0 0 1440 900" preserveAspectRatio="none"><path d="M100 0 480 315 366 396 765 900"/><path d="M1440 80 1012 388 1136 468 748 900"/></svg>
      <span class="landing-bats__flash"></span>
    </div>
  `
}

export function homePage (data, seasonal) {
  const { site, parks } = data
  const totalAttractions = data.allAttractions.filter((a) => a.isOpen).length
  const totalFood = data.allFood.length
  const totalHeights = data.allHeightAttractions.length
  const totalDining = data.allDining.length

  /*
   * The home page's featured lists, picked by role and then topped up.
   *
   * These were six Disney slugs and four more, which meant a second operator's home page featured
   * whichever of them it happened to share — three guides and no comparisons at all. Roles pick the
   * intended pages on any operator; the top-up keeps the grid full when a role has no equivalent,
   * so the section is never half-empty for a reason no reader can see.
   */
  const pick = (roleNames, roleSlug, bySlug, count) => {
    const chosen = []
    const seen = new Set()
    for (const role of roleNames) {
      const slug = roleSlug[role]
      if (slug && bySlug.has(slug) && !seen.has(slug)) { seen.add(slug); chosen.push(bySlug.get(slug)) }
    }
    for (const [slug, doc] of bySlug) {
      if (chosen.length >= count) break
      if (!seen.has(slug)) { seen.add(slug); chosen.push(doc) }
    }
    return chosen.slice(0, count)
  }

  const featuredGuides = pick(
    ['heights', 'queue', 'isItScary', 'riderSwitch', 'ropeDrop', 'whatToPack'],
    { ...data.roleSlug, queue: data.guideBySlug.has(data.queue.guideSlug) ? data.queue.guideSlug : null },
    data.guideBySlug, 6)

  const featuredCompare = pick(
    ['resortVsResort', 'bestForYoungChildren', 'parkRankings', 'whichPark'],
    data.roleSlug, data.compareBySlug, 4)

  // Derived from the build month rather than authored, so the home page rotates itself and nobody
  // has to remember to take Halloween down in November.
  const bands = ganttBands(seasonal)
  const runningNow = bands.filter((b) => bandCovers(b, BUILD_MONTH_NUMBER)).map((b) => b.event)
  const thisMonth = seasonal.monthByNumber.get(BUILD_MONTH_NUMBER)
  const nextMonth = seasonal.monthByNumber.get(BUILD_MONTH_NUMBER === 12 ? 1 : BUILD_MONTH_NUMBER + 1)

  const body = html`
    ${landingBats()}
    ${C.hero({
      eyebrow: `${data.parks.length} US parks · independent & unofficial`,
      title: 'Know exactly what your family can ride, eat, and skip.',
      lede: 'Every height requirement, every ride worth queueing for, every snack worth the money — checked, dated, and built to work on park WiFi. No affiliate-driven rankings, no reprinted press releases.',
      actions: [
        { href: urls.heightChecker(), label: 'Check what your kid can ride', primary: true },
        { href: urls.foodTracker(), label: 'Build a snack list' },
      ],
      aside: html`
        ${C.statRow([
          { value: totalAttractions, label: 'Attractions documented' },
          { value: totalHeights, label: 'Height requirements' },
          { value: totalFood, label: 'Snacks with real prices' },
          { value: totalDining, label: 'Places to eat' },
        ])}
        ${C.lastVerified(BUILD_MONTH, 'Everything on this site verified')}
      `,
      image: data.photo.hero,
      video: site.heroVideo,
    })}

    ${C.trustStrip([
      { title: 'Independent and unofficial',
        body: 'We buy our own tickets. No park pays for a place on this site.',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>' },
      { title: 'Every fact is dated',
        body: 'Each page carries the month it was checked, and says so when it is overdue.',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' },
      { title: 'Rankings are not for sale',
        body: 'Affiliate links exist and are disclosed. They never change an order or a verdict.',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M7 7v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"/><path d="M10 4h4"/><path d="M10 11v5M14 11v5"/></svg>' },
      { title: 'Works without signal',
        body: 'The tools keep running on park WiFi, or on none at all.',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/><path d="m3 3 18 18"/></svg>' },
    ])}

    ${C.section({
      title: 'Start with your park',
      kicker: `The ${data.parks.length} parks`,
      intro: 'Each park hub links to its full ride list, height chart, dining, printable map, accessibility notes, and a first-timer plan you can actually follow.',
      children: C.cardGrid(parks.map(parkCard), { columns: 3 }),
    })}

    ${seasonSpotlight(site, runningNow)}

    ${C.section({
      tone: 'tint',
      title: 'Three things we do that a search result cannot',
      kicker: 'Tools, not listicles',
      children: html`
        ${C.cardGrid([
          C.card({
            href: urls.heightChecker(),
            tone: 'feature',
            eyebrow: 'Interactive',
            title: 'Height Checker',
            summary: 'Drag one slider to your child’s height and see, park by park, exactly which rides they clear and which they miss — including the ones they miss by an inch.',
          }),
          C.card({
            href: urls.foodTracker(),
            tone: 'feature',
            eyebrow: 'Saves offline',
            title: 'Food Tracker',
            summary: `Mark ${totalFood} snacks as want, tried, or skip. It saves on your device, shares as a link, prints as a checklist, and keeps working when the park WiFi does not.`,
          }),
          C.card({
            href: urls.parksIndex(),
            tone: 'feature',
            eyebrow: 'Printable',
            title: 'Park maps',
            summary: 'Clean schematic maps drawn from open geographic data — no clutter, no ads baked into the image, and they print on one page in black and white.',
          }),
        ], { columns: 3 })}
      `,
    })}

    ${runningNow.length ? C.section({
      title: `On right now, in ${MONTHS[BUILD_MONTH_NUMBER - 1].name}`,
      kicker: 'What is running',
      intro: 'Each of these states whether this year is confirmed or still only expected. Most sites will not tell you which.',
      children: C.cardGrid(runningNow.slice(0, 6).map((e) => SC.eventCard(e, e.staleness)), { columns: 3 }),
    }) : ''}

    ${thisMonth || nextMonth ? C.section({
      tone: 'tint',
      title: 'Thinking about when to go',
      kicker: 'Timing',
      intro: 'Every month graded on crowds, cost, weather, and what is actually running — including the months we think you should avoid.',
      children: html`
        <div class="month-grid">${[thisMonth, nextMonth].filter(Boolean).map((m) => SC.monthCard(m))}</div>
        <p class="mt-5">
          <a class="btn btn--primary" href="${urls.tripTiming()}">Rank the months by what you care about</a>
          <a class="btn btn--ghost" href="${urls.whenToGoIndex()}">All twelve, graded</a>
        </p>
      `,
    }) : ''}

    ${C.section({
      title: 'The guides people actually need',
      kicker: 'Planning',
      children: html`
        ${C.linkGrid(featuredGuides.map((g) => ({ href: urls.guide(g.slug), label: g.h1 || g.title, summary: g.summary })), { columns: 3 })}
        <p class="mt-5"><a class="btn btn--ghost" href="${urls.guidesIndex()}">All ${data.guides.length} guides</a></p>
      `,
    })}

    ${bands.length ? C.section({
      title: 'The whole year on one page',
      kicker: 'Seasonal calendar',
      intro: 'Every party night, festival, and overlay. Colour shows how much has actually been confirmed.',
      wide: true,
      children: html`
        ${SC.calendarGantt(bands)}
        <p class="mt-5"><a class="btn btn--ghost" href="${urls.calendar()}">Open the full calendar</a></p>
      `,
    }) : ''}

    ${C.section({
      tone: 'tint',
      title: 'Settle the argument',
      kicker: 'Comparisons',
      intro: 'We commit to an answer on every comparison page. Hedging is not a service.',
      children: html`
        ${C.linkGrid(featuredCompare.map((c) => ({ href: urls.compare(c.slug), label: c.h1 || c.title, summary: c.summary })), { columns: 2 })}
        <p class="mt-5"><a class="btn btn--ghost" href="${urls.compareIndex()}">All comparisons</a></p>
      `,
    })}

    ${C.section({
      title: 'How this site pays for itself',
      children: html`
        <div class="split">
          <div class="prose">
            ${paragraphs([
              'A small number of affiliate links, mostly to authorized ticket resellers, and nothing else at present. That is the entire business model today. Display advertising may follow; if it does, it will be disclosed here before it ships. Affiliate links are disclosed directly above the link, not buried in the footer.',
              'What that money does not buy is placement. No restaurant, ride, or reseller can pay to be ranked higher, described more kindly, or added to a “best of” list. When we think something is overpriced or overrated, we say so — including things we would earn a commission on.',
              site.legal.shortDisclaimer + ' We buy our own tickets.',
            ])}
            <p class="mt-5"><a class="btn btn--ghost" href="${urls.editorial()}">Read the editorial policy</a></p>
          </div>
          <div>
            ${C.callout({
              type: 'legal',
              title: 'Independent and unofficial',
              body: site.legal.disclaimer,
            })}
            ${C.callout({
              type: 'note',
              title: 'We say what we actually know',
              body: 'Permanent facts carry the month we last checked them. Anything that moves with the season also says whether it is **confirmed**, **expected**, or **last cycle** — and a page past its own review date says so in a banner nobody here can switch off. Most sites publish this year’s dates whether or not anyone announced them.',
            })}
          </div>
        </div>
      `,
    })}
  `

  return {
    url: '/',
    html: renderPage({
      site,
      page: {
        url: '/',
        title: `Honest guides to the ${site.brand.shortName} parks`,
        titleTail: '',
        description: site.meta.defaultDescription,
        modified: '2026-07-01',
      },
      body,
      schema: [S.itemList(site, {
        url: '/',
        name: `${site.brand.shortName} theme parks`,
        items: parks.map((p) => ({ name: p.name, url: p.url })),
      })],
    }),
  }
}

export function parksIndexPage (data) {
  const { site, parks } = data
  const trail = [{ label: 'Home', href: '/' }, { label: 'Parks', href: urls.parksIndex() }]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: `All ${data.parks.length} parks`,
      title: 'Every park, side by side',
      lede: 'Two resorts, six theme parks, and one honest answer to “which one should we actually do?” Pick a park for the deep dive, or jump straight to the comparison pages.',
      tone: 'compact',
      image: data.photo['scene-coaster'],
    })}

    ${C.section({
      children: html`
        ${C.dataTable({
          columns: [
            'Park', 'Resort', { label: 'Attractions', align: 'num', sort: 'number' },
            { label: 'Height limits', align: 'num', sort: 'number' },
            { label: 'Tallest', align: 'num', sort: 'number' }, 'Plan for',
          ],
          sortable: true,
          className: 'data-table--stack',
          rows: parks.map((park) => [
            html`<a href="${park.url}">${park.name}</a>`,
            park.resortInfo ? park.resortInfo.shortName : park.resort,
            html`<span data-value="${park.attractions.filter((a) => a.isOpen).length}">${park.attractions.filter((a) => a.isOpen).length}</span>`,
            html`<span data-value="${park.heightAttractions.length}">${park.heightAttractions.length}</span>`,
            html`<span data-value="${park.stats && park.stats.tallestRequirement ? park.stats.tallestRequirement : 0}">${park.stats && park.stats.tallestRequirement ? `${park.stats.tallestRequirement}"` : '—'}</span>`,
            park.stats && park.stats.typicalFullDayHours ? park.stats.typicalFullDayHours : '—',
          ]),
        })}
      `,
    })}

    ${site.resorts.map((resort) => C.section({
      tone: 'tint',
      title: resort.name,
      kicker: resort.location,
      intro: resort.tagline,
      children: html`
        ${C.cardGrid(resort.parkList.map(parkCard), { columns: resort.parkList.length >= 3 ? 3 : 2 })}
        <p class="mt-5"><a class="btn btn--ghost" href="${urls.resort(resort.slug)}">${resort.name} planning overview</a></p>
      `,
    }))}
  `

  return {
    url: urls.parksIndex(),
    html: renderPage({
      site,
      page: {
        url: urls.parksIndex(),
        title: `All ${data.parks.length} parks compared`,
        description: `Attraction counts, height requirements, and how long each of the ${data.parks.length} parks actually takes — with a link to the full guide for every one.`,
        trail,
        modified: '2026-07-01',
      },
      body,
      schema: [S.itemList(site, { url: urls.parksIndex(), name: `${site.brand.shortName} theme parks`, items: parks.map((p) => ({ name: p.name, url: p.url })) })],
    }),
  }
}

export function resortPages (data) {
  const { site } = data
  return site.resorts.map((resort) => {
    const trail = [{ label: 'Home', href: '/' }, { label: resort.shortName, href: urls.resort(resort.slug) }]
    const parkList = resort.parkList

    const allHeights = parkList.flatMap((p) => p.heightAttractions)
    const body = html`
      ${C.breadcrumbs(trail)}
      ${C.hero({
        eyebrow: resort.location,
        title: resort.name,
        lede: resort.tagline,
        image: data.photo['scene-carousel'],
        meta: [
          { label: 'Theme parks', value: String(parkList.length) },
          { label: 'Attractions', value: String(parkList.reduce((n, p) => n + p.attractions.filter((a) => a.isOpen).length, 0)) },
          { label: 'Height requirements', value: String(allHeights.length) },
          { label: 'Places to eat', value: String(parkList.reduce((n, p) => n + p.dining.length, 0)) },
        ],
        actions: [
          { href: parkList[0] ? parkList[0].url : urls.parksIndex(), label: `Start with ${parkList[0] ? parkList[0].name : 'a park'}`, primary: true },
          { href: data.link.resortVsResort, label: 'Which resort should we pick?' },
        ],
      })}

      ${C.section({
        children: html`
          <div class="split">
            <div class="prose prose--lede">${paragraphs(resort.intro)}</div>
            <div>
              ${C.factPanel(resort.practical.map((p) => ({ label: p.title, value: p.body })), { title: 'The practical bits', columns: 1 })}
            </div>
          </div>
        `,
      })}

      ${C.section({
        tone: 'tint',
        title: `The ${parkList.length} parks`,
        children: C.cardGrid(parkList.map(parkCard), { columns: parkList.length >= 3 ? 2 : 2 }),
      })}

      ${C.section({
        title: 'Height requirements across the resort',
        kicker: 'The question everyone asks first',
        intro: `Every ride at ${resort.shortName} with a minimum height, shortest first. Sort any column.`,
        children: html`
          ${C.dataTable({
            sortable: true,
            className: 'data-table--stack',
            columns: [
              'Attraction', 'Park', { label: 'Height', align: 'num', sort: 'number' }, 'Type',
            ],
            rows: allHeights
              .slice()
              .sort((a, b) => a.heightIn - b.heightIn || a.name.localeCompare(b.name))
              .map((a) => [
                a.hasPage ? html`<a href="${a.url}">${a.name}</a>` : a.name,
                html`<a href="${a.park.url}">${a.park.shortLabel}</a>`,
                html`<span data-value="${a.heightIn}">${a.heightIn}" · ${Math.round(a.heightIn * 2.54)}cm</span>`,
                f.attractionType(a.type),
              ]),
          })}
          <p><a class="btn btn--ghost" href="${urls.heightChecker()}">Try the interactive height checker</a></p>
        `,
      })}

      ${C.section({
        title: `${data.queue.name} here`,
        children: html`
          <div class="prose">
            <p>${inline(resort.lightningLaneNote)}</p>
          </div>
          ${C.callout({
            type: 'money',
            title: 'Prices move constantly — we publish ranges, not today’s number',
            body: `${data.queue.name} is dynamically priced by date and park. Any single figure you read anywhere is a snapshot. Our [full ${data.queue.name} guide](${urls.guide(data.queue.guideSlug)}) explains the mechanics, the booking windows, and when it is genuinely worth buying.`,
          })}
          ${C.affiliateBox(site, {
            kind: resort.ticketAffiliate && site.affiliates[resort.ticketAffiliate] ? resort.ticketAffiliate : 'tickets',
            heading: `Where we buy ${resort.shortName} tickets`,
          })}
        `,
      })}

      ${C.relatedLinks([
        data.guideBySlug.has(data.queue.guideSlug) ? { href: urls.guide(data.queue.guideSlug), label: `${data.queue.name}, explained`, summary: 'What each tier buys and when it is worth it' } : null,
        { href: data.link.firstTrip, label: 'Your first trip', summary: 'The five decisions that matter most' },
        { href: data.link.resortVsResort, label: data.compareBySlug.get(data.roleSlug.resortVsResort)?.title || 'Compare the resorts', summary: 'An actual verdict, not a shrug' },
        { href: data.link.heights, label: 'Every height requirement', summary: `All ${data.parks.length} parks in one table` },
      ])}
    `

    return {
      url: urls.resort(resort.slug),
      html: renderPage({
        site,
        page: {
          url: urls.resort(resort.slug),
          title: `${resort.name} planning guide`,
          titleTail: ': honest and unofficial',
          description: C.truncate(resort.summary, 155),
          trail,
          modified: '2026-07-01',
        },
        body,
        schema: [
          S.itemList(site, { url: urls.resort(resort.slug), name: `${resort.name} theme parks`, items: parkList.map((p) => ({ name: p.name, url: p.url })) }),
        ],
      }),
    }
  })
}
