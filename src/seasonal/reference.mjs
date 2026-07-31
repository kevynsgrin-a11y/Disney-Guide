/**
 * Holiday hubs, price pages, and the closure trackers.
 *
 * These three families share a shape — a dated reference table wrapped in editorial — so they share
 * a module. The handoff runs one way here: a price page owns what Lightning
 * Lane *costs* and links to the evergreen guide for how it *works*.
 */

import { html, raw, inline } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as SC from '../templates/seasonal-components.mjs'
import * as S from '../lib/schema.mjs'
import * as SS from '../lib/seasonal-schema.mjs'
import { urls } from '../lib/seasonal-data.mjs'
import * as f from '../lib/format.mjs'

const RESORT_LABEL = { 'walt-disney-world': 'Walt Disney World', disneyland: 'Disneyland Resort', both: 'Both resorts' }

const links = (entity) => (entity.crossLinks || []).filter((l) => l.resolved !== false)

/* ------------------------------------------------------------------ *
 * Holidays
 * ------------------------------------------------------------------ */

export function holidayPage (holiday, data) {
  const { site } = data
  const url = holiday.url
  const state = holiday.staleness

  const body = html`
    ${C.breadcrumbs(holiday.breadcrumbTrail)}
    ${C.hero({
      eyebrow: 'Holidays',
      title: holiday.h1 || holiday.title,
      lede: holiday.summary,
      aside: SC.freshnessRibbon(holiday.freshness, state),
    })}

    ${C.section({ children: SC.stalenessBanner(state) })}

    ${C.section({
      title: 'Your options, by resort',
      intro: 'Both coasts do this differently, and the right answer depends on which one you are going to.',
      children: SC.resortSplit(holiday.byResort, {
        renderer: (key, block) => {
          const events = (block.events || []).map((slug) => data.eventBySlug.get(slug)).filter(Boolean)
          return html`
            ${block.note ? html`<div class="prose">${inline(block.note)}</div>` : ''}
            ${events.length ? html`
              <ul class="rich-list rich-list--bullet mt-4">
                ${events.map((e) => html`<li><a href="${e.url}">${e.name}</a> — ${inline(e.summary)}</li>`)}
              </ul>` : ''}
          `
        },
      }),
    })}

    ${C.section({ children: SC.sectionBlocks(holiday.sections) })}

    ${C.faqSection(holiday.faqs)}

    ${SC.evergreenLinks(links(holiday))}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: holiday.title,
        titleTail: holiday.titleTail,
        description: holiday.description,
        trail: holiday.breadcrumbTrail,
        modified: `${holiday.freshness.verified}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        SS.seasonalArticle(site, {
          url, title: holiday.h1 || holiday.title, description: holiday.summary,
          modified: `${holiday.freshness.verified}-01`, section: 'Holidays',
        }),
        S.faqPage(site, { url, faqs: holiday.faqs }),
      ].filter(Boolean),
    }),
  }
}

export function holidaysIndex (data) {
  const { site, holidays } = data
  const url = urls.holidaysIndex()
  const trail = [{ label: 'Home', href: urls.home() }, { label: 'Holidays', href: url }]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: site.brand.name,
      title: 'Doing the Disney parks at a holiday',
      lede: 'One page per holiday, covering both resorts: what actually runs, what it costs, and whether the crowds are worth it.',
    })}
    ${C.section({
      children: C.cardGrid(holidays.map((h) => C.card({
        href: h.url,
        eyebrow: 'Holiday',
        title: h.h1 || h.title,
        summary: h.summary,
      })), { columns: 3 }),
    })}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: 'Disney parks at the holidays',
        titleTail: ': Every Option, Both Resorts',
        description: 'Halloween, Christmas, New Year, spring break and summer at Walt Disney World and Disneyland — what runs, what it costs, and whether it is worth the crowds.',
        trail,
      },
      body,
      schema: [S.itemList(site, { url, name: 'Holidays at the Disney parks', items: holidays.map((h) => ({ name: h.title, url: h.url })) })].filter(Boolean),
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Prices
 * ------------------------------------------------------------------ */

export function pricePage (price, data) {
  const { site } = data
  const url = price.url
  const state = price.staleness

  const body = html`
    ${C.breadcrumbs(price.breadcrumbTrail)}
    ${C.hero({
      eyebrow: 'Prices',
      title: price.h1 || price.title,
      lede: price.summary,
      aside: SC.freshnessRibbon(price.freshness, state),
    })}

    ${C.section({
      children: html`
        ${SC.stalenessBanner(state)}
        ${C.callout({
          type: 'money',
          title: 'Every figure here is a range',
          body: 'Prices vary by date, park, and demand at both resorts, so a single number would be wrong for almost everyone reading it. Each row carries the cycle it was checked against.',
        })}
      `,
    })}

    ${C.section({
      title: 'What it costs',
      children: SC.priceTable(price.rows, { caption: `Checked ${SC.monthLabel(price.freshness.verified)}. Ranges, not fixed prices — see the note above.` }),
    })}

    ${price.sections && price.sections.length ? C.section({ children: SC.sectionBlocks(price.sections) }) : ''}

    ${C.section({
      title: 'How to pay less',
      tone: 'tint',
      children: html`
        ${C.bulletList(price.howToSave, { style: 'number' })}
        ${C.affiliateBox(site, { kind: 'tickets' })}
      `,
    })}

    ${price.faqs && price.faqs.length ? C.faqSection(price.faqs) : ''}

    ${SC.evergreenLinks(links(price))}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: price.title,
        titleTail: price.titleTail,
        description: price.description,
        trail: price.breadcrumbTrail,
        modified: `${price.freshness.verified}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        SS.seasonalArticle(site, {
          url, title: price.h1 || price.title, description: price.summary,
          modified: `${price.freshness.verified}-01`, section: 'Prices',
        }),
        SS.priceList(site, { url, name: price.h1 || price.title, rows: price.rows }, { stale: state.state === 'stale' }),
        S.faqPage(site, { url, faqs: price.faqs }),
      ].filter(Boolean),
    }),
  }
}

export function pricesIndex (data) {
  const { site, prices } = data
  const url = urls.pricesIndex()
  const trail = [{ label: 'Home', href: urls.home() }, { label: 'Prices', href: url }]

  const allRows = prices.flatMap((p) => (p.rows || []).map((r) => ({ ...r, page: p })))

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: site.brand.name,
      title: 'What a Disney parks trip costs right now',
      lede: 'Tickets, Lightning Lane, parking, dining plans and annual passes at both resorts. Every figure is a range with the cycle it was checked against, because a single number is wrong for almost everyone.',
    })}

    ${C.section({
      children: C.cardGrid(prices.map((p) => C.card({
        href: p.url,
        eyebrow: 'Prices',
        title: p.h1 || p.title,
        summary: p.summary,
        badges: [{ label: p.staleness.confidenceLabel, tone: `conf-${p.staleness.confidence}` }],
      })), { columns: 3 }),
    })}

    ${allRows.length ? C.section({
      title: 'Everything on one page',
      tone: 'tint',
      intro: 'Every priced item on the site, in one sortable table.',
      children: C.dataTable({
        sortable: true,
        columns: [{ label: 'What' }, { label: 'Resort' }, { label: 'Low', align: 'right', sort: 'number' }, { label: 'High', align: 'right', sort: 'number' }, { label: 'As of' }, { label: 'Detail' }],
        rows: allRows.map((r) => [
          r.label,
          RESORT_LABEL[r.resort] || r.resort,
          f.price(r.rangeUsd[0]),
          f.price(r.rangeUsd[1]),
          r.asOf,
          html`<a href="${r.page.url}">${r.page.shortName || r.page.title}</a>`,
        ]),
      }),
    }) : ''}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: 'Disney parks prices',
        titleTail: ': Tickets, Lightning Lane, Parking',
        description: 'Current price ranges for tickets, Lightning Lane, parking, dining plans and annual passes at Walt Disney World and Disneyland, each dated.',
        trail,
      },
      body,
      schema: [S.itemList(site, { url, name: 'Disney parks price guides', items: prices.map((p) => ({ name: p.title, url: p.url })) })].filter(Boolean),
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Closures
 * ------------------------------------------------------------------ */

function closureRows (tracker) {
  return tracker.items.map((i) => ({
    ...i,
    parkName: i.parkInfo ? i.parkInfo.name : i.parkSlug,
    url: i.attractionUrl,
  }))
}

export function closuresPage (tracker, data) {
  const { site } = data
  const url = tracker.url
  const state = tracker.staleness
  const label = RESORT_LABEL[tracker.resort] || tracker.resort

  const body = html`
    ${C.breadcrumbs(tracker.breadcrumbTrail)}
    ${C.hero({
      eyebrow: 'Closures',
      title: `What is closed at ${label}`,
      lede: tracker.summary || `Attractions down for refurbishment or closed for good at ${label}, with what we can actually support about when they come back.`,
      aside: SC.freshnessRibbon(tracker.freshness, state),
    })}

    ${C.section({
      children: html`
        ${SC.stalenessBanner(state)}
        ${C.callout({
          type: 'warning',
          title: 'Refurbishment schedules move constantly',
          body: 'Operators add and drop closures with little notice, and a reopening date is an intention rather than a commitment until the ride is actually running. Check the official app on the morning of your visit — this page is for planning, not for the day itself.',
        })}
      `,
    })}

    ${C.section({
      title: 'Tracked closures',
      children: SC.closureTable(closureRows(tracker), { caption: `Checked ${SC.monthLabel(tracker.freshness.verified)}.` }),
    })}

    ${tracker.note ? C.section({ tone: 'tint', children: html`<div class="prose shell--narrow">${inline(tracker.note)}</div>` }) : ''}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: `${label} closures`,
        titleTail: ': Refurbishment Tracker',
        description: `Attractions closed for refurbishment at ${label}, with expected reopening where it has actually been announced.`,
        trail: tracker.breadcrumbTrail,
        modified: `${tracker.freshness.verified}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        SS.seasonalArticle(site, {
          url, title: `${label} closures`, description: tracker.summary || `Refurbishment tracker for ${label}.`,
          modified: `${tracker.freshness.verified}-01`, section: 'Closures',
        }),
      ].filter(Boolean),
    }),
  }
}

export function closuresIndex (data) {
  const { site, closures } = data
  const url = urls.closuresIndex()
  const trail = [{ label: 'Home', href: urls.home() }, { label: 'Closures', href: url }]
  const total = closures.reduce((n, c) => n + c.items.length, 0)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: site.brand.name,
      title: 'What is closed at the Disney parks',
      lede: 'Refurbishment and closure trackers for both resorts. We only list what we can support with a source, so an empty tracker means nothing verified rather than nothing closed.',
      meta: [{ label: 'Tracked', value: String(total) }, { label: 'Resorts', value: String(closures.length) }],
    })}
    ${closures.map((tracker) => C.section({
      title: RESORT_LABEL[tracker.resort] || tracker.resort,
      children: html`
        ${SC.freshnessRibbon(tracker.freshness, tracker.staleness)}
        <div class="mt-5">${SC.closureTable(closureRows(tracker))}</div>
        <p class="mt-4"><a href="${tracker.url}">Full ${RESORT_LABEL[tracker.resort]} tracker →</a></p>
      `,
    }))}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: 'Disney parks closures and refurbishments',
        titleTail: '',
        description: 'Current refurbishment and closure trackers for Walt Disney World and the Disneyland Resort, with reopening dates only where they have been announced.',
        trail,
      },
      body,
      schema: [],
    }),
  }
}
