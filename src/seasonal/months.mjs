/**
 * When-to-go pages: the index grid and twelve month pages.
 *
 * There is deliberately no parallel /calendar/<month>/ tree. Two pages competing for "Disney World
 * in March" is how a site cannibalises itself, so each month has exactly one owner and /calendar/
 * is an index across all twelve rather than a second set of month pages.
 */

import { html, raw, inline } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as SC from '../templates/seasonal-components.mjs'
import * as S from '../lib/schema.mjs'
import * as SS from '../lib/seasonal-schema.mjs'
import { urls, MONTHS } from '../lib/seasonal-data.mjs'
import * as f from '../lib/format.mjs'

const LEVEL_NOUN = { low: 'Low', moderate: 'Moderate', high: 'High', peak: 'Peak' }

function crossLinkTiles (entity) {
  return (entity.crossLinks || []).filter((l) => l.resolved !== false)
}

export function monthPage (month, data) {
  const { site } = data
  const url = month.url
  const state = month.staleness
  const prev = data.monthByNumber.get(month.month === 1 ? 12 : month.month - 1)
  const next = data.monthByNumber.get(month.month === 12 ? 1 : month.month + 1)

  const body = html`
    ${C.breadcrumbs(month.breadcrumbTrail)}
    ${C.hero({
      eyebrow: 'When to go',
      title: `${month.name} at the Disney parks`,
      lede: month.summary,
      meta: [
        { label: 'Crowds', value: LEVEL_NOUN[month.crowds.level] || month.crowds.level },
        { label: 'Cost', value: LEVEL_NOUN[month.cost.level] || month.cost.level },
        { label: 'Events on', value: String(month.events.length) },
      ],
      aside: html`
        <div class="month-verdict-aside">
          ${SC.gradeBadge(month.verdict.grade, { size: 'lg' })}
          <p>${inline(month.verdict.short)}</p>
        </div>
      `,
    })}

    ${C.section({
      children: html`
        ${SC.stalenessBanner(state)}
        ${SC.freshnessRibbon(month.freshness, state)}
      `,
    })}

    ${C.section({
      title: 'The verdict',
      children: html`
        <div class="give-take">
          <div class="give-take__col give-take__col--get">
            <h3><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 8.5 6 12l8-8"/></svg> Good month for</h3>
            ${C.bulletList(month.verdict.bestFor)}
          </div>
          <div class="give-take__col give-take__col--dont">
            <h3><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8"/></svg> Bad month for</h3>
            ${C.bulletList(month.verdict.worstFor)}
          </div>
        </div>
      `,
    })}

    ${C.section({
      title: 'Crowds',
      tone: 'tint',
      children: html`
        <p class="lead">${SC.levelPill(month.crowds.level, 'crowds')}</p>
        <div class="prose mt-4">${inline(month.crowds.shape)}</div>
        ${month.crowds.peakWindows && month.crowds.peakWindows.length
          ? C.tipList(month.crowds.peakWindows, { title: 'Busiest windows', tone: 'warn' }) : ''}
        ${month.crowds.quietWindows && month.crowds.quietWindows.length
          ? C.tipList(month.crowds.quietWindows, { title: 'Quietest windows', tone: 'tip' }) : ''}
      `,
    })}

    ${C.section({
      title: 'Weather',
      intro: 'Climate normals for each resort. These are averages over a long reference period, not a forecast — the only figures on this site that do not decay.',
      children: SC.weatherTable(month.weather),
    })}

    ${C.section({
      title: 'Cost',
      tone: 'tint',
      children: html`
        <p class="lead">${SC.levelPill(month.cost.level, 'cost')}</p>
        ${month.cost.note ? html`<div class="prose mt-4">${inline(month.cost.note)}</div>` : ''}
        ${C.affiliateBox(site, { kind: 'tickets' })}
      `,
    })}

    ${C.section({
      title: `What is on in ${month.name}`,
      intro: month.events.length
        ? 'Each of these has its own page with pricing, strategy, and a verdict.'
        : null,
      children: month.events.length
        ? C.cardGrid(month.events.map((e) => SC.eventCard(e, e.staleness)), { columns: 3 })
        : C.callout({
          type: 'note',
          title: 'Nothing seasonal running',
          body: `${month.name} is one of the few genuinely quiet windows in the calendar. That is a feature if you came for the rides and a problem if you came for the atmosphere.`,
        }),
    })}

    ${C.section({
      title: 'Planning notes',
      children: SC.sectionBlocks(month.planningNotes),
    })}

    ${SC.evergreenLinks(crossLinkTiles(month))}

    ${C.section({
      tone: 'tint',
      children: html`
        <nav class="month-nav" aria-label="Other months">
          ${prev ? html`<a class="month-nav__prev" href="${prev.url}"><span>Previous</span><strong>${prev.name}</strong>${SC.gradeBadge(prev.verdict.grade)}</a>` : ''}
          <a class="month-nav__all" href="${urls.whenToGoIndex()}">All twelve months, ranked</a>
          ${next ? html`<a class="month-nav__next" href="${next.url}"><span>Next</span><strong>${next.name}</strong>${SC.gradeBadge(next.verdict.grade)}</a>` : ''}
        </nav>
      `,
    })}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: `Disney parks in ${month.name}`,
        titleTail: ': Crowds, Weather, Cost',
        description: `Is ${month.name} a good time to visit Walt Disney World or Disneyland? Crowd levels, climate normals, cost, what is running, and a graded verdict.`,
        trail: month.breadcrumbTrail,
        modified: `${month.freshness.verified}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        SS.seasonalArticle(site, {
          url,
          title: `Disney parks in ${month.name}`,
          description: month.summary,
          modified: `${month.freshness.verified}-01`,
          section: 'When to go',
        }),
        S.itemList(site, { url, name: `What is on in ${month.name}`, items: month.events }),
      ].filter(Boolean),
    }),
  }
}

export function whenToGoIndex (data) {
  const { site } = data
  const url = urls.whenToGoIndex()
  const trail = [{ label: 'Home', href: urls.home() }, { label: 'When to go', href: url }]

  const ordered = MONTHS.map((m) => data.monthByNumber.get(m.month)).filter(Boolean)
  // Ranking by grade rather than by calendar order is the whole reason to have an index page: a
  // reader who can travel any month wants the answer, not a list of twelve links in January-first
  // order they could have guessed.
  const ranked = ordered.slice().sort((a, b) => {
    const rank = (g) => 'A+ A A- B+ B B- C+ C C- D+ D D- F'.split(' ').indexOf(g)
    return rank(a.verdict.grade) - rank(b.verdict.grade) || a.month - b.month
  })

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: site.brand.name,
      title: 'The best and worst months to visit the Disney parks',
      lede: 'Every month graded on crowds, cost, weather and what is actually running. We commit to a letter grade for each one — including the months we think you should avoid.',
      actions: [{ href: urls.tripTiming(), label: 'Rank months by what you care about', primary: true }],
    })}

    ${C.section({
      title: 'Ranked, best to worst',
      intro: 'One verdict per month, in order. Click through for the reasoning.',
      children: html`<div class="month-grid">${ranked.map((m) => SC.monthCard(m))}</div>`,
    })}

    ${C.section({
      title: 'The same twelve, in calendar order',
      tone: 'tint',
      children: C.dataTable({
        sortable: true,
        caption: 'Grades reflect a general-purpose trip. The trip-timing tool re-ranks these against what you personally care about.',
        columns: [
          { label: 'Month' },
          { label: 'Grade' },
          { label: 'Crowds' },
          { label: 'Cost' },
          { label: 'Orlando high', align: 'right', sort: 'number' },
          { label: 'Anaheim high', align: 'right', sort: 'number' },
          { label: 'On' },
        ],
        rows: ordered.map((m) => [
          html`<a href="${m.url}">${m.name}</a>`,
          SC.gradeBadge(m.verdict.grade),
          LEVEL_NOUN[m.crowds.level] || m.crowds.level,
          LEVEL_NOUN[m.cost.level] || m.cost.level,
          `${m.weather.wdw.highF}°F`,
          `${m.weather.dlr.highF}°F`,
          String(m.events.length),
        ]),
      }),
    })}
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: 'Best time to visit the Disney parks',
        titleTail: ': Every Month Graded',
        description: 'All twelve months at Walt Disney World and Disneyland graded on crowds, cost, weather and events — with the months worth avoiding named outright.',
        trail,
      },
      body,
      schema: [
        S.itemList(site, {
          url,
          name: 'Months ranked for a Disney parks visit',
          items: ranked.map((m) => ({ name: `${m.name} — ${m.verdict.grade}`, url: m.url })),
        }),
      ].filter(Boolean),
    }),
  }
}
