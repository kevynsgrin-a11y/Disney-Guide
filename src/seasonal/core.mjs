/**
 * The year-at-a-glance calendar.
 *
 * `bandCovers` and `ganttBands` are exported because the site home page renders a "running now"
 * strip from the same bands. Computing that from the build month rather than from an authored list
 * means nobody has to remember to rotate it.
 */

import { html, raw, inline } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as SC from '../templates/seasonal-components.mjs'
import * as S from '../lib/schema.mjs'
import * as SS from '../lib/seasonal-schema.mjs'
import { urls, MONTHS } from '../lib/seasonal-data.mjs'
import { BUILD_MONTH } from '../lib/staleness.mjs'
import { scopeOf } from '../lib/data.mjs'

export const BUILD_MONTH_NUMBER = Number(BUILD_MONTH.slice(5, 7))

/** True when a band covers `n`, handling the ones that wrap the year (November → January). */
export function bandCovers (band, n) {
  return band.endMonth >= band.startMonth
    ? n >= band.startMonth && n <= band.endMonth
    : n >= band.startMonth || n <= band.endMonth
}

export function ganttBands (data) {
  return data.calendarBands
    .filter((b) => b.event)
    .map((b) => ({ ...b, name: b.event.shortName || b.event.name, url: b.event.url }))
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
      title: `The ${scopeOf(site).parksLabel} year, at a glance`,
      lede: `Every seasonal event ${scopeOf(site).venuePhrase} on one timeline, with the confidence level shown in the colour. Nothing here asserts a date nobody has announced.`,
    })}

    ${C.section({
      wide: true,
      children: SC.calendarGantt(ganttBands(data), { title: 'Twelve months, every event' }),
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
        title: `${scopeOf(site).parksLabel.charAt(0).toUpperCase() + scopeOf(site).parksLabel.slice(1)} seasonal calendar`,
        titleTail: ': The Whole Year',
        description: `Every seasonal event ${scopeOf(site).venuePhrase} on one twelve-month timeline, with confidence levels shown.`,
        trail,
      },
      body,
      schema: [
        S.itemList(site, { url, name: 'Seasonal events by month', items: ganttBands(data).map((b) => ({ name: b.name, url: b.url })) }),
      ].filter(Boolean),
    }),
  }
}
