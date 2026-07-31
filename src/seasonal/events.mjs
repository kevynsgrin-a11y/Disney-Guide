/**
 * Event pages.
 *
 * The pattern page is canonical and the year editions are subordinate — the reverse of how every
 * competing site does it. "Not-So-Scary 2026 dates" is the query, but a page built around this
 * year's dates is worthless in fourteen months and gets rewritten from scratch every year. A page
 * built around the pattern accrues links, and the dated block is a component inside it.
 */

import { html, raw, inline, paragraphs } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as SC from '../templates/seasonal-components.mjs'
import * as S from '../lib/schema.mjs'
import * as SS from '../lib/seasonal-schema.mjs'
import { urls, site1 } from '../lib/seasonal-data.mjs'
import * as f from '../lib/format.mjs'

const RESORT_LABEL = { 'walt-disney-world': 'Walt Disney World', disneyland: 'Disneyland Resort', both: 'Both resorts' }

/** Shaped for src/lib/seasonal-schema.mjs, which must not reach into loader internals itself. */
function schemaShape (event, edition) {
  return {
    ...event,
    parkName: event.parkInfo ? event.parkInfo.name : null,
    parkUrl: event.parkInfo ? event.parkInfo.url : null,
    resortName: RESORT_LABEL[event.resort],
    locality: event.parkInfo ? event.parkInfo.location : null,
    editionUrl: edition ? urls.edition(event.slug, edition.year) : null,
  }
}

function crossLinkTiles (event) {
  return (event.crossLinks || []).filter((l) => l.resolved !== false)
}

/* ------------------------------------------------------------------ *
 * Event pattern page
 * ------------------------------------------------------------------ */

export function eventPage (event, data) {
  const { site } = data
  const url = event.url
  const state = event.staleness
  const stale = state.state === 'stale'

  const latest = event.editions.find((e) => e.status === 'announced') || event.editions[0] || null

  const heroMeta = [
    { label: 'Where', value: event.parkInfo ? event.parkInfo.name : RESORT_LABEL[event.resort] },
    { label: 'Type', value: SC.categoryLabel(event.category) },
    event.typicalWindow
      ? { label: 'Usually runs', value: `${event.typicalWindow.startsAround} – ${event.typicalWindow.endsAround}` }
      : null,
    SC.pricingMeta(event.pricing),
  ].filter(Boolean)

  const body = html`
    ${C.breadcrumbs(event.breadcrumbTrail)}
    ${C.hero({
      eyebrow: RESORT_LABEL[event.resort],
      title: event.h1 || event.name,
      lede: event.summary,
      meta: heroMeta,
      aside: SC.freshnessRibbon(event.freshness, state),
    })}

    ${C.section({
      children: html`
        ${SC.stalenessBanner(state)}
        ${SC.windowStrip(event.typicalWindow)}
      `,
    })}

    ${C.section({
      title: 'What you get, and what you do not',
      children: SC.getVersusDont(event.whatYouGet, event.whatYouDont),
    })}

    ${event.pricing ? C.section({
      title: 'What it costs',
      tone: 'tint',
      children: html`
        <div class="stack">
          ${event.pricing.model === 'included'
            ? html`
              ${C.callout({
                type: 'money',
                title: 'No separate ticket',
                body: 'This one runs inside normal park hours on regular admission. The cost is the crowding it brings, not a line on your card.',
              })}
              ${Array.isArray(event.pricing.rangeUsd) ? html`
                <p class="price-lead mt-5">${SC.priceRange(event.pricing.rangeUsd, event.pricing.asOf, {
                  label: 'What people actually spend',
                  per: 'per festival item',
                })}</p>` : ''}
              ${event.pricing.notes && event.pricing.notes.length ? C.bulletList(event.pricing.notes) : ''}
            `
            : html`
              <p class="price-lead">${SC.priceRange(event.pricing.rangeUsd, event.pricing.asOf, {
                per: event.pricing.model === 'per-night' ? 'per person, per night' : event.pricing.model === 'per-day' ? 'per person, per day' : '',
              })}</p>
              ${C.factPanel([
                event.pricing.cheapestNights ? { label: 'Cheapest nights', value: event.pricing.cheapestNights } : null,
                event.pricing.priciestNights ? { label: 'Most expensive', value: event.pricing.priciestNights } : null,
              ].filter(Boolean), { columns: 2 })}
              ${event.pricing.notes && event.pricing.notes.length ? C.bulletList(event.pricing.notes) : ''}
            `}
          ${C.affiliateBox(site, { kind: 'tickets' })}
        </div>
      `,
    }) : ''}

    ${C.section({
      title: `How to actually do ${event.shortName || event.name}`,
      children: SC.sectionBlocks(event.strategy),
    })}

    ${event.food && event.food.items && event.food.items.length ? C.section({
      title: 'What to eat',
      intro: event.food.note,
      tone: 'tint',
      children: C.dataTable({
        caption: `Prices checked ${SC.monthLabel(event.freshness.verified)}. Booth menus change between cycles.`,
        columns: [{ label: 'Item' }, { label: 'Where' }, { label: 'Price', align: 'right' }, { label: 'Our take' }],
        rows: event.food.items.map((i) => [i.name, i.where || '—', f.price(i.priceUsd), i.verdict ? inline(i.verdict) : '']),
      }),
    }) : ''}

    ${C.section({ children: SC.verdictPanel(event.verdict) })}

    ${event.editions.length ? C.section({
      title: 'Year by year',
      intro: 'We publish a year only once it is announced. An empty year here means nobody has announced it yet — not that we forgot.',
      children: SC.editionList(event.editions.map((e) => ({ ...e, url: urls.edition(event.slug, e.year) })), { eventUrl: url }),
    }) : ''}

    ${C.faqSection(event.faqs)}

    ${SC.evergreenLinks(crossLinkTiles(event), site.brand.sisterSite)}

    ${event.relatedEvents.length ? C.relatedLinks(
      event.relatedEvents.map((e) => ({ href: e.url, label: e.name, summary: e.summary })),
      { title: 'Other seasonal events' }
    ) : ''}
  `

  // An Event node needs a real start date. Without confirmed dates this page is honestly an article
  // about a recurring event, so that is what it says it is.
  const eventNode = latest ? SS.event(site, schemaShape(event, latest), latest, { stale }) : null

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: event.title || event.name,
        titleTail: event.titleTail,
        description: event.description,
        trail: event.breadcrumbTrail,
        modified: `${event.freshness.verified}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        eventNode || SS.seasonalArticle(site, {
          url,
          title: event.h1 || event.name,
          description: event.summary,
          modified: `${event.freshness.verified}-01`,
          section: 'Events',
        }),
        S.faqPage(site, { url, faqs: event.faqs }),
        SS.siteRelationship(site),
      ].filter(Boolean),
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Edition page
 * ------------------------------------------------------------------ */

export function editionPage (event, edition, data) {
  const { site } = data
  const url = urls.edition(event.slug, edition.year)
  const state = edition.staleness
  const stale = state.state === 'stale'

  const body = html`
    ${C.breadcrumbs(edition.breadcrumbTrail)}
    ${C.hero({
      eyebrow: event.name,
      title: `${event.shortName || event.name} ${edition.year}`,
      lede: edition.status === 'announced'
        ? `Confirmed detail for the ${edition.year} run. The permanent guide to how this event works lives on the [main ${event.shortName || event.name} page](${event.url}).`
        : `${edition.year} is not announced. Everything below is either the pattern or the last confirmed cycle, labeled as such — see the [main ${event.shortName || event.name} page](${event.url}) for how the event works.`,
      meta: [
        { label: 'Status', value: f.titleize(edition.status || 'expected') },
        edition.nights ? { label: 'Nights', value: String(edition.nights) } : null,
        Array.isArray(edition.priceRangeUsd)
          ? { label: 'Price', value: `${f.price(edition.priceRangeUsd[0])}–${f.price(edition.priceRangeUsd[1])}` }
          : null,
      ].filter(Boolean),
      aside: SC.freshnessRibbon(edition.freshness, state),
    })}

    ${C.section({
      children: html`
        ${SC.stalenessBanner(state)}
        ${edition.dates
          ? C.factPanel([{ label: 'Dates', value: edition.dates }], { columns: 1 })
          : C.callout({
            type: 'note',
            title: `${edition.year} dates are not announced`,
            body: `We will not print dates nobody has published. The pattern is on the [main event page](${event.url}); when the operator announces, this page gets the real dates and a confirmed ribbon.`,
          })}
        ${edition.changes && edition.changes.length
          ? html`<div class="mt-5">${C.tipList(edition.changes, { title: `What is different in ${edition.year}`, tone: 'tip' })}</div>`
          : ''}
      `,
    })}

    ${C.section({
      title: 'How the event works',
      intro: 'This part does not change year to year, so it is kept in one place.',
      tone: 'tint',
      children: html`
        ${SC.windowStrip(event.typicalWindow)}
        <p class="mt-5"><a class="btn btn--primary" href="${event.url}">Full guide to ${event.shortName || event.name}</a></p>
      `,
    })}

    ${SC.evergreenLinks(crossLinkTiles(event), site.brand.sisterSite)}
  `

  const eventNode = SS.event(site, schemaShape(event, edition), edition, { stale })

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: `${event.shortName || event.name} ${edition.year}`,
        titleTail: edition.status === 'announced' ? ': Dates & Prices' : ': What We Know',
        description: `${edition.status === 'announced' ? 'Confirmed' : 'Expected'} detail for ${event.name} ${edition.year} — dates, nights, and pricing, with the confidence level stated on the page.`,
        trail: edition.breadcrumbTrail,
        modified: `${edition.freshness.verified}-01`,
        ogType: 'article',
        // An unannounced edition adds nothing a search engine wants and splits signal from the
        // pattern page, which is the page that should rank.
        noindex: edition.status !== 'announced',
      },
      body,
      schema: [
        eventNode || SS.seasonalArticle(site, {
          url,
          title: `${event.name} ${edition.year}`,
          description: event.summary,
          modified: `${edition.freshness.verified}-01`,
          section: 'Events',
        }),
      ].filter(Boolean),
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Index
 * ------------------------------------------------------------------ */

export function eventsIndex (data) {
  const { site, events } = data
  const url = urls.eventsIndex()
  const trail = [{ label: 'Home', href: urls.home() }, { label: 'Events', href: url }]

  const byResort = [
    { key: 'walt-disney-world', label: 'Walt Disney World' },
    { key: 'disneyland', label: 'Disneyland Resort' },
  ]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: site.brand.name,
      title: 'Every seasonal event at the US Disney parks',
      lede: 'Parties, festivals, overlays and after-hours events at both resorts — what each one is, what it costs, and whether it is worth the money. Every page states whether this year is confirmed or still expected.',
      meta: [
        { label: 'Events tracked', value: String(events.length) },
        { label: 'Resorts', value: '2' },
      ],
    })}

    ${byResort.map((group) => {
      const list = data.eventsByResort.get(group.key) || []
      if (!list.length) return raw('')
      return C.section({
        title: group.label,
        children: C.cardGrid(list.map((e) => SC.eventCard(e, e.staleness)), { columns: 3 }),
      })
    })}

    ${C.section({
      title: 'How to read the confidence labels',
      tone: 'tint',
      children: html`
        ${C.dataTable({
          columns: [{ label: 'Label' }, { label: 'What it means' }, { label: 'What we will state' }],
          rows: [
            [SC.confidencePill({ confidence: 'confirmed', confidenceLabel: 'Confirmed' }), 'Officially announced, with the announcement named on the page.', 'Exact dates and prices.'],
            [SC.confidencePill({ confidence: 'expected', confidenceLabel: 'Expected' }), 'Not announced, but the pattern has held for at least three years.', 'Windows and ranges. Never an exact date.'],
            [SC.confidencePill({ confidence: 'historical', confidenceLabel: 'Last confirmed cycle' }), 'This cycle is unannounced or unclear.', 'Last cycle\'s figures, labeled with their year.'],
          ],
        })}
        <p class="mt-4 muted small">Most competing pages state this year's dates whether or not anyone announced them. That is the practice this labelling exists to avoid.</p>
      `,
    })}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: 'Seasonal events at the US Disney parks',
        titleTail: ': Dates, Prices, Verdicts',
        description: 'Every party night, festival, and after-hours event at Walt Disney World and the Disneyland Resort — what each costs and whether it is worth it.',
        trail,
      },
      body,
      schema: [
        S.itemList(site, { url, name: 'Seasonal events at the US Disney parks', items: events }),
        SS.siteRelationship(site),
      ].filter(Boolean),
    }),
  }
}
