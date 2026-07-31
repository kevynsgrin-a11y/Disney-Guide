/**
 * Trip Timing.
 *
 * Every seasonal site publishes a crowd calendar. Almost none let a reader say "I care about cost,
 * not weather" and re-rank on that — which is the actual question, because a retired couple and a
 * family tied to school holidays are not looking at the same calendar at all.
 *
 * Scores are computed here, at build time, from the same authored month data the /when-to-go/ pages
 * render. The tool and the pages therefore cannot disagree, which they would within a month if the
 * tool carried its own hand-maintained numbers.
 */

import { html, raw } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as SC from '../templates/seasonal-components.mjs'
import * as S from '../lib/schema.mjs'
import * as SS from '../lib/seasonal-schema.mjs'
import { urls, MONTHS } from '../lib/seasonal-data.mjs'

/** Visitor-facing, so low crowds and low cost score high. */
const LEVEL_SCORE = { low: 5, moderate: 4, high: 2.5, peak: 1 }

/**
 * Weather pleasantness, 1–5, from the climate normals.
 *
 * 70–82°F is the band where a full park day is comfortable rather than an endurance exercise;
 * outside it the score falls by roughly a point per six degrees. Rain days cost a fifth of a point
 * each — Florida's afternoon storms are short and survivable, so they should not dominate the way a
 * heavier weighting would make them.
 */
export function weatherScore ({ highF, rainDays }) {
  const deviation = highF > 82 ? highF - 82 : highF < 70 ? 70 - highF : 0
  const score = 5 - deviation / 6 - (rainDays || 0) * 0.2
  return Math.round(Math.max(1, Math.min(5, score)) * 10) / 10
}

function payload (data) {
  const months = MONTHS.map((m) => data.monthByNumber.get(m.month)).filter(Boolean)
  return {
    months: months.map((m) => ({
      n: m.month,
      name: m.name,
      url: m.url,
      grade: m.verdict.grade,
      tone: SC.gradeTone(m.verdict.grade),
      crowds: LEVEL_SCORE[m.crowds.level] ?? 3,
      cost: LEVEL_SCORE[m.cost.level] ?? 3,
      // Nothing running is a real answer, not a zero — a quiet month is exactly what some readers
      // are looking for, and it still scores badly only on the "plenty on" dimension.
      events: Math.min(5, 2 + m.events.length),
      w: {
        'walt-disney-world': weatherScore(m.weather.wdw),
        disneyland: weatherScore(m.weather.dlr),
      },
    })),
  }
}

const PRIORITIES = [
  { value: 'crowds', label: 'Thin crowds' },
  { value: 'cost', label: 'Low cost' },
  { value: 'weather', label: 'Good weather' },
  { value: 'events', label: 'Plenty on' },
]

export function tripTimingPage (data) {
  const { site } = data
  const url = urls.tripTiming()
  const trail = [
    { label: 'Home', href: urls.home() },
    { label: 'Tools', href: urls.toolsIndex() },
    { label: 'Trip timing', href: url },
  ]

  const months = MONTHS.map((m) => data.monthByNumber.get(m.month)).filter(Boolean)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: 'Tool',
      title: 'When should you actually go?',
      lede: 'Pick a resort and say what matters to you. All twelve months re-rank against your answer, not against a generic average of everyone.',
    })}

    ${C.section({
      children: html`
        <div class="timing-controls" data-timing hidden>
          <fieldset>
            <legend class="facts__title">Which resort?</legend>
            <div class="timing-priorities">
              <label class="timing-priority">
                <input type="radio" name="timing-resort" value="walt-disney-world" checked>
                <span>Walt Disney World</span>
              </label>
              <label class="timing-priority">
                <input type="radio" name="timing-resort" value="disneyland">
                <span>Disneyland Resort</span>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend class="facts__title">What matters to you?</legend>
            <div class="timing-priorities">
              ${PRIORITIES.map((p) => html`
                <label class="timing-priority">
                  <input type="checkbox" data-timing-priority value="${p.value}" checked>
                  <span>${p.label}</span>
                </label>
              `)}
            </div>
          </fieldset>

          <p class="lead" data-timing-summary></p>
          <ol class="timing-results" data-timing-results></ol>

          <p class="small muted">Scores come from the same crowd, cost and climate data behind every month page. Weather is scored on how comfortable a full park day is: 70–82°F is the comfortable band, and rain days cost a fifth of a point each.</p>
        </div>

        <div data-timing-fallback>
          ${C.callout({
            type: 'note',
            title: 'The ranking needs JavaScript',
            body: 'Here is the full grid instead — the same data the tool sorts.',
          })}
          <div class="month-grid mt-5">${months.map((m) => SC.monthCard(m))}</div>
        </div>
      `,
    })}

    ${C.section({
      title: 'What the tool will not do',
      tone: 'tint',
      children: html`
        <div class="shell--narrow prose">
          <p>It will not predict a specific week. Crowd levels within a month swing far more than between months — the first week of December and the last week of December are not the same trip, and no monthly grade can capture that. The month pages call out the specific windows worth targeting and avoiding.</p>
          <p>It also will not price your trip. Ticket and hotel pricing varies by date within every month at both resorts; the cost score reflects the month's general level, not a quote.</p>
        </div>
      `,
    })}

    <script type="application/json" id="timing-data">${raw(JSON.stringify(payload(data)).replace(/</g, '\\u003c'))}</script>
  `

  return {
    url,
    html: renderPage({
      site,
      page: {
        url,
        title: 'Trip timing tool',
        titleTail: ': Rank Months By What You Care About',
        description: 'Rank all twelve months for a Walt Disney World or Disneyland trip against what you actually care about — crowds, cost, weather, or what is running.',
        trail,
      },
      body,
      scripts: ['/assets/js/trip-timing.js'],
      schema: [],
    }),
  }
}
