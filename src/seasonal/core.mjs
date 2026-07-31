/**
 * The hub and the year-at-a-glance calendar.
 *
 * The home page answers "what is on right now, and what is next" from the build month, so it
 * changes shape with every rebuild rather than needing an author to remember to rotate it.
 */

import { html, raw, inline } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as SC from '../templates/seasonal-components.mjs'
import * as S from '../lib/schema.mjs'
import * as SS from '../lib/seasonal-schema.mjs'
import { urls, MONTHS } from '../lib/seasonal-data.mjs'
import { BUILD_MONTH } from '../lib/staleness.mjs'

const BUILD_MONTH_NUMBER = Number(BUILD_MONTH.slice(5, 7))

/** True when a band covers `n`, handling the ones that wrap the year (November → January). */
export function bandCovers (band, n) {
  return band.endMonth >= band.startMonth
    ? n >= band.startMonth && n <= band.endMonth
    : n >= band.startMonth || n <= band.endMonth
}

function ganttBands (data) {
  return data.calendarBands
    .filter((b) => b.event)
    .map((b) => ({ ...b, name: b.event.shortName || b.event.name, url: b.event.url }))
}

export function homePage (data) {
  const { site } = data
  const url = urls.home()
  const thisMonth = data.monthByNumber.get(BUILD_MONTH_NUMBER)
  const nextMonth = data.monthByNumber.get(BUILD_MONTH_NUMBER === 12 ? 1 : BUILD_MONTH_NUMBER + 1)

  const runningNow = data.calendarBands
    .filter((b) => b.event && bandCovers(b, BUILD_MONTH_NUMBER))
    .map((b) => b.event)
  const startingNext = data.calendarBands
    .filter((b) => b.event && b.startMonth === (BUILD_MONTH_NUMBER === 12 ? 1 : BUILD_MONTH_NUMBER + 1))
    .map((b) => b.event)

  const body = html`
    ${C.hero({
      eyebrow: 'Independent and unofficial',
      title: 'When to go, what is on, and what it costs',
      lede: `Seasonal planning for the six US Disney parks. Every dated fact on this site says whether it is **confirmed**, **expected**, or **last cycle's** — because most of the internet publishes this year's dates whether or not anyone announced them.`,
      actions: [
        { href: urls.whenToGoIndex(), label: 'Every month, graded', primary: true },
        { href: urls.eventsIndex(), label: 'All seasonal events' },
      ],
      meta: [
        { label: 'Events tracked', value: String(data.events.length) },
        { label: 'Months graded', value: String(data.months.length) },
        { label: 'Verified', value: SC.monthLabel(BUILD_MONTH) },
      ],
    })}

    ${runningNow.length ? C.section({
      title: `Running now, in ${MONTHS[BUILD_MONTH_NUMBER - 1].name}`,
      kicker: 'What is on',
      children: C.cardGrid(runningNow.map((e) => SC.eventCard(e, e.staleness)), { columns: 3 }),
    }) : ''}

    ${startingNext.length ? C.section({
      title: `Starting in ${MONTHS[BUILD_MONTH_NUMBER === 12 ? 0 : BUILD_MONTH_NUMBER].name}`,
      tone: 'tint',
      children: C.cardGrid(startingNext.map((e) => SC.eventCard(e, e.staleness)), { columns: 3 }),
    }) : ''}

    ${thisMonth || nextMonth ? C.section({
      title: 'Thinking about the next few weeks',
      children: html`<div class="month-grid">${[thisMonth, nextMonth].filter(Boolean).map((m) => SC.monthCard(m))}</div>`,
    }) : ''}

    ${C.section({
      title: 'The whole year on one page',
      intro: 'Every seasonal event at both resorts, month by month. Colour shows how much we actually know.',
      wide: true,
      children: html`
        ${SC.calendarGantt(ganttBands(data))}
        <p class="mt-5"><a class="btn btn--ghost" href="${urls.calendar()}">Open the full calendar</a></p>
      `,
    })}

    ${C.section({
      title: 'Why this site says "expected" so often',
      tone: 'tint',
      children: html`
        <div class="shell--narrow prose">
          <p>Search for any Disney event and you will find a dozen pages stating this year's dates with total confidence. Check the operator's own site and a good share of them turn out to be last year's dates, or a guess dressed as a fact.</p>
          <p>We publish the pattern — which is stable, useful, and true — and we mark the dates as confirmed only once somebody has actually announced them. A page that has drifted past its own review date says so in a banner nobody here can switch off.</p>
          <p>It costs us rich results on about half the event pages for part of each year. We think being right is the more durable asset.</p>
        </div>
      `,
    })}

    ${C.section({
      title: 'The permanent version of all this',
      children: html`
        <div class="shell--narrow prose">
          <p>Height requirements, ride-by-ride detail, accessibility, permanent dining and park maps live on <a href="${site.brand.sisterSite.origin}/">${site.brand.sisterSite.name}</a>, our year-round sister site. Those facts do not move with the season, so we link rather than repeat — one canonical owner per topic, in both directions.</p>
        </div>
      `,
    })}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: site.brand.name,
        titleTail: '',
        description: site.meta.defaultDescription,
        trail: [{ label: 'Home', href: url }],
        modified: `${BUILD_MONTH}-01`,
      },
      body,
      schema: [SS.siteRelationship(site)].filter(Boolean),
    }),
  }
}

export function calendarPage (data) {
  const { site } = data
  const url = urls.calendar()
  const trail = [{ label: 'Home', href: urls.home() }, { label: 'Calendar', href: url }]

  const ordered = MONTHS.map((m) => data.monthByNumber.get(m.month)).filter(Boolean)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: site.brand.name,
      title: 'The Disney parks year, at a glance',
      lede: 'Every seasonal event at both US resorts on one timeline, with the confidence level shown in the colour. Nothing here asserts a date nobody has announced.',
    })}

    ${C.section({
      wide: true,
      children: SC.calendarGantt(ganttBands(data), { title: 'Both resorts, twelve months' }),
    })}

    ${C.section({
      title: 'Month by month',
      tone: 'tint',
      children: html`<div class="month-grid">${ordered.map((m) => SC.monthCard(m))}</div>`,
    })}

    ${C.section({
      title: 'Reading this calendar',
      children: html`
        <div class="shell--narrow prose">
          <p>Bands show the window an event typically occupies, not its exact run. A green band means the current cycle is officially announced; amber means the pattern is strong but nobody has confirmed this year; grey means we are showing the last cycle we could confirm.</p>
          <p>Windows shift by a week or two between years, and the last week of any band is the one most likely to move. If a trip hinges on catching an event's final night, treat the band as an indication and check the operator before booking.</p>
        </div>
      `,
    })}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: 'Disney parks seasonal calendar',
        titleTail: ': The Whole Year',
        description: 'Every seasonal event at Walt Disney World and the Disneyland Resort on one twelve-month timeline, with confidence levels shown.',
        trail,
      },
      body,
      schema: [
        S.itemList(site, { url, name: 'Seasonal events by month', items: ganttBands(data).map((b) => ({ name: b.name, url: b.url })) }),
        SS.siteRelationship(site),
      ].filter(Boolean),
    }),
  }
}

/** Offline fallback for the service worker. Never indexed. */
export function offlinePage (data) {
  const { site } = data
  const url = '/offline/'
  const body = html`
    ${C.hero({
      title: 'You are offline',
      lede: 'This page has not been cached yet. The calendar, the month grid, and the trip-timing tool are stored on your device and will still open.',
      actions: [
        { href: urls.calendar(), label: 'Calendar', primary: true },
        { href: urls.whenToGoIndex(), label: 'When to go' },
        { href: urls.tripTiming(), label: 'Trip timing' },
      ],
    })}
  `
  return {
    url,
    html: renderPage({
      site,
      page: { url, title: 'Offline', description: 'You are offline.', noindex: true, trail: [] },
      body,
    }),
  }
}
