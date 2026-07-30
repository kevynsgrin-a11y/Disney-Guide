import { html, raw, paragraphs, inline } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as S from '../lib/schema.mjs'
import { urls } from '../lib/data.mjs'
import * as f from '../lib/format.mjs'

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

export function homePage (data) {
  const { site, parks } = data
  const totalAttractions = data.allAttractions.filter((a) => a.isOpen).length
  const totalFood = data.allFood.length
  const totalHeights = data.allHeightAttractions.length
  const totalDining = data.allDining.length

  const featuredGuides = ['height-requirements', 'lightning-lane', 'is-it-scary', 'rider-switch', 'rope-drop-strategy', 'what-to-pack']
    .map((slug) => data.guideBySlug.get(slug))
    .filter(Boolean)

  const featuredCompare = ['disneyland-vs-disney-world', 'best-disney-park-for-toddlers', 'disney-park-rankings', 'which-disney-park-should-i-visit']
    .map((slug) => data.compareBySlug.get(slug))
    .filter(Boolean)

  const body = html`
    ${C.hero({
      eyebrow: 'Six US Disney parks · independent & unofficial',
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
        ${C.lastVerified('2026-07', 'Everything on this site verified')}
      `,
    })}

    ${C.section({
      title: 'Start with your park',
      kicker: 'The six parks',
      intro: 'Each park hub links to its full ride list, height chart, dining, printable map, accessibility notes, and a first-timer plan you can actually follow.',
      children: C.cardGrid(parks.map(parkCard), { columns: 3 }),
    })}

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

    ${C.section({
      title: 'The guides people actually need',
      kicker: 'Planning',
      children: html`
        ${C.linkGrid(featuredGuides.map((g) => ({ href: urls.guide(g.slug), label: g.h1 || g.title, summary: g.summary })), { columns: 3 })}
        <p class="mt-5"><a class="btn btn--ghost" href="${urls.guidesIndex()}">All ${data.guides.length} guides</a></p>
      `,
    })}

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
              'This site carries display advertising and a small number of affiliate links, mostly to authorized ticket resellers. That is the entire business model. It is disclosed above every affiliate link, not buried in the footer.',
              'What that money does not buy is placement. No restaurant, ride, or reseller can pay to be ranked higher, described more kindly, or added to a “best of” list. When we think something is overpriced or overrated, we say so — including things we would earn a commission on.',
              'We are not affiliated with The Walt Disney Company in any way. We buy our own tickets.',
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
              title: 'Everything here is evergreen',
              body: 'We deliberately do not cover party nights, festival menus, seasonal overlays, or today’s Lightning Lane price. Those change weekly and go stale in public. What you get instead is the durable stuff — kept correct, and stamped with the month we last checked it.',
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
        title: 'Height requirements, honest ride reviews & food tracking',
        description: site.meta.defaultDescription,
        modified: '2026-07-01',
      },
      body,
      schema: [S.itemList(site, {
        url: '/',
        name: 'US Disney theme parks',
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
      eyebrow: 'All six parks',
      title: 'Every US Disney park, side by side',
      lede: 'Two resorts, six theme parks, and one honest answer to “which one should we actually do?” Pick a park for the deep dive, or jump straight to the comparison pages.',
      tone: 'compact',
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
        title: 'All six US Disney parks compared',
        description: 'Attraction counts, height requirements, and how long each of the six US Disney parks actually takes — with a link to the full guide for every one.',
        trail,
        modified: '2026-07-01',
      },
      body,
      schema: [S.itemList(site, { url: urls.parksIndex(), name: 'US Disney theme parks', items: parks.map((p) => ({ name: p.name, url: p.url })) })],
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
        meta: [
          { label: 'Theme parks', value: String(parkList.length) },
          { label: 'Attractions', value: String(parkList.reduce((n, p) => n + p.attractions.filter((a) => a.isOpen).length, 0)) },
          { label: 'Height requirements', value: String(allHeights.length) },
          { label: 'Places to eat', value: String(parkList.reduce((n, p) => n + p.dining.length, 0)) },
        ],
        actions: [
          { href: parkList[0] ? parkList[0].url : urls.parksIndex(), label: `Start with ${parkList[0] ? parkList[0].name : 'a park'}`, primary: true },
          { href: urls.compare('disneyland-vs-disney-world'), label: 'Which resort should we pick?' },
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
                html`<a href="${a.park.url}">${a.park.shortName || a.park.name}</a>`,
                html`<span data-value="${a.heightIn}">${a.heightIn}" · ${Math.round(a.heightIn * 2.54)}cm</span>`,
                f.attractionType(a.type),
              ]),
          })}
          <p><a class="btn btn--ghost" href="${urls.heightChecker()}">Try the interactive height checker</a></p>
        `,
      })}

      ${C.section({
        title: 'Lightning Lane here',
        children: html`
          <div class="prose">
            <p>${inline(resort.lightningLaneNote)}</p>
          </div>
          ${C.callout({
            type: 'money',
            title: 'Prices move constantly — we publish ranges, not today’s number',
            body: 'Lightning Lane is dynamically priced by date and park. Any single figure you read anywhere is a snapshot. Our [full Lightning Lane guide](/guides/lightning-lane/) explains the mechanics, the booking windows, and when it is genuinely worth buying.',
          })}
          ${C.affiliateBox(site, {
            kind: resort.slug === 'disneyland' ? 'packagesDisneyland' : 'tickets',
            heading: `Where we buy ${resort.shortName} tickets`,
          })}
        `,
      })}

      ${C.relatedLinks([
        { href: urls.guide('lightning-lane'), label: 'Lightning Lane, explained', summary: 'What each tier buys and when it is worth it' },
        { href: urls.guide('first-disney-trip'), label: 'Your first trip', summary: 'The five decisions that matter most' },
        { href: urls.compare('disneyland-vs-disney-world'), label: 'Disneyland vs Disney World', summary: 'An actual verdict, not a shrug' },
        { href: urls.guide('height-requirements'), label: 'Every height requirement', summary: 'All six parks in one table' },
      ])}
    `

    return {
      url: urls.resort(resort.slug),
      html: renderPage({
        site,
        page: {
          url: urls.resort(resort.slug),
          title: `${resort.name}: an honest planning guide`,
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
