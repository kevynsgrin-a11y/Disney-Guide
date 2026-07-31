/**
 * Components for the dated half of the site.
 *
 * Everything in src/templates/components.mjs is reused unchanged — this module only adds the pieces
 * that exist because part of the content has a shelf life and the rest does not.
 *
 * The freshness ribbon and the staleness banner are the two that matter. Every competing seasonal
 * page looks current whether or not it is; the entire editorial claim here is that ours says which.
 * So the ribbon renders on every dated page from authored JSON, and the banner renders from a
 * build-time comparison the author cannot switch off.
 */

import { html, raw, each, inline, paragraphs, escapeHtml } from '../lib/html.mjs'
import { pill, callout, dataTable, card, bulletList } from './components.mjs'
import * as f from '../lib/format.mjs'

/* ------------------------------------------------------------------ *
 * Freshness — the flagship
 * ------------------------------------------------------------------ */

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

/** 'YYYY-MM' → 'July 2026'. Deliberately not Date-based: no timezone can shift a month label. */
export function monthLabel (ym) {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ''
  const [year, month] = ym.split('-')
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`
}

/**
 * The provenance strip. Renders what we know, how we know it, and when it stops being trustworthy.
 *
 * `state` comes from src/lib/staleness.mjs and is computed against the build month, so a page that
 * has gone past its review date says so even though nobody edited it.
 */
export function freshnessRibbon (freshness, state) {
  if (!freshness) return raw('')
  const s = state || {}
  return html`
    <div class="freshness freshness--${s.ribbonTone || 'grey'} freshness--${s.state || 'stale'}">
      <p class="freshness__lead">
        <span class="freshness__dot" aria-hidden="true"></span>
        <strong>${s.confidenceLabel || 'Unverified'}</strong>
        ${freshness.verified ? html`<span class="freshness__sep">·</span> Checked ${monthLabel(freshness.verified)}` : ''}
      </p>
      ${freshness.sourceNote ? html`<p class="freshness__note">${inline(freshness.sourceNote)}</p>` : ''}
      <p class="freshness__meta">
        ${freshness.reviewBy
          ? html`<span>${s.state === 'stale' ? 'Was due for review' : 'Next review'} ${monthLabel(freshness.reviewBy)}</span>`
          : ''}
        ${s.state === 'stale' && s.monthsOverdue
          ? html`<span class="freshness__overdue">${f.pluralize(s.monthsOverdue, 'month')} overdue</span>`
          : ''}
      </p>
    </div>
  `
}

/**
 * Rendered above the content when the build month has passed `reviewBy`.
 *
 * There is no JSON field that suppresses this. An author who forgot to re-check is precisely the
 * case it exists for, so letting the data turn it off would defeat it.
 */
export function stalenessBanner (state) {
  if (!state || state.state !== 'stale') return raw('')
  return callout({
    type: 'warning',
    title: 'Some details on this page are past their review date',
    body: `We last checked this ${state.monthsOverdue ? `${f.pluralize(state.monthsOverdue, 'month')} ` : ''}after the date we set to re-check it, so treat the dated figures below as a starting point rather than current fact. The permanent detail — how the event works, what it is like, who it suits — is unaffected.`,
  })
}

export function confidencePill (state) {
  if (!state || !state.confidence) return raw('')
  return pill(state.confidenceLabel || state.confidence, `conf-${state.confidence}`)
}

/* ------------------------------------------------------------------ *
 * Money — always a range, always dated
 * ------------------------------------------------------------------ */

/**
 * A price range with its as-of cycle attached.
 *
 * The as-of is not decoration. A number without one is the single most common way a seasonal page
 * misleads, so the component makes the pairing structural: you cannot render the figure without it.
 */
export function priceRange (rangeUsd, asOf, { label, per } = {}) {
  if (!Array.isArray(rangeUsd) || rangeUsd.length !== 2) return raw('')
  const [low, high] = rangeUsd
  return html`
    <span class="price-range">
      ${label ? html`<span class="price-range__label">${label}</span>` : ''}
      <span class="price-range__figure">${f.price(low)}<i>–</i>${f.price(high)}</span>
      ${per ? html`<span class="price-range__per">${per}</span>` : ''}
      ${asOf ? html`<span class="price-range__asof">as of ${asOf}</span>` : ''}
    </span>
  `
}

export function priceTable (rows, { caption } = {}) {
  const arr = (rows || []).filter(Boolean)
  if (!arr.length) return raw('')
  return dataTable({
    caption,
    columns: [
      { label: 'What' },
      { label: 'Resort' },
      { label: 'Range', align: 'right' },
      { label: 'As of' },
      { label: 'Notes' },
    ],
    rows: arr.map((r) => [
      r.label,
      r.resort === 'walt-disney-world' ? 'Walt Disney World' : r.resort === 'disneyland' ? 'Disneyland' : 'Both',
      Array.isArray(r.rangeUsd) ? html`${f.price(r.rangeUsd[0])}–${f.price(r.rangeUsd[1])}` : '—',
      r.asOf || '—',
      r.note ? inline(r.note) : '',
    ]),
  })
}

/* ------------------------------------------------------------------ *
 * Events
 * ------------------------------------------------------------------ */

const CATEGORY_LABEL = {
  'hard-ticket': 'Separate ticket',
  festival: 'Festival',
  overlay: 'Included overlay',
  'after-hours': 'After hours',
  run: 'Race weekend',
}

export function categoryLabel (value) { return CATEGORY_LABEL[value] || f.unslug(value || '') }

/**
 * The window strip. What survives when this year's dates do not.
 *
 * Authored as prose ("mid-August") rather than dates on purpose — see §7.4 of the data contract.
 */
export function windowStrip (win) {
  if (!win) return raw('')
  const items = [
    { label: 'Typically starts', value: win.startsAround },
    { label: 'Typically ends', value: win.endsAround },
    win.nightsTypical ? { label: 'Nights', value: win.nightsRange ? `~${win.nightsTypical} (${win.nightsRange[0]}–${win.nightsRange[1]})` : `~${win.nightsTypical}` } : null,
    win.daysOfWeek && win.daysOfWeek.length ? { label: 'Nights of the week', value: win.daysOfWeek.join(', ') } : null,
    win.hours ? { label: 'Hours', value: win.hours } : null,
  ].filter((i) => i && i.value)
  if (!items.length) return raw('')
  return html`
    <div class="window-strip">
      <p class="window-strip__title">The pattern</p>
      <dl>
        ${items.map((i) => html`<div><dt>${i.label}</dt><dd>${i.value}</dd></div>`)}
      </dl>
    </div>
  `
}

/**
 * The price line for an event summary.
 *
 * `model: "included"` events run on normal admission, and their `rangeUsd` describes what a visitor
 * typically *spends* inside the event — festival food, mostly — not what it costs to get in.
 * Labelling that as a price would tell a reader an included overlay costs money to attend, which is
 * the opposite of its single most useful fact, so the model is checked before the range is read.
 */
export function pricingMeta (pricing) {
  if (!pricing) return null
  if (pricing.model === 'included') return { label: 'Ticket', value: 'Included with admission' }
  if (!Array.isArray(pricing.rangeUsd)) return null
  const per = pricing.model === 'per-night' ? ' / night' : pricing.model === 'per-day' ? ' / day' : ''
  return { label: 'Typical price', value: `${f.price(pricing.rangeUsd[0])}–${f.price(pricing.rangeUsd[1])}${per}` }
}

export function eventCard (event, state) {
  return card({
    href: event.url,
    eyebrow: `${categoryLabel(event.category)}${event.parkName ? ` · ${event.parkName}` : event.resortName ? ` · ${event.resortName}` : ''}`,
    title: event.name,
    summary: event.summary,
    badges: [
      state && state.confidence ? { label: state.confidenceLabel, tone: `conf-${state.confidence}` } : null,
      event.pricing && event.pricing.model === 'included' ? { label: 'No extra ticket', tone: 'good' } : null,
    ].filter(Boolean),
    meta: [
      event.typicalWindow && event.typicalWindow.startsAround
        ? { label: 'Runs', value: `${event.typicalWindow.startsAround} – ${event.typicalWindow.endsAround}` }
        : null,
      pricingMeta(event.pricing),
    ].filter(Boolean),
  })
}

/** The give-and-take pair. `whatYouDont` is required by the contract; a one-sided page is an advert. */
export function getVersusDont (get, dont) {
  const a = (get || []).filter(Boolean)
  const b = (dont || []).filter(Boolean)
  if (!a.length && !b.length) return raw('')
  return html`
    <div class="give-take">
      <div class="give-take__col give-take__col--get">
        <h3><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 8.5 6 12l8-8"/></svg> What you get</h3>
        ${bulletList(a)}
      </div>
      <div class="give-take__col give-take__col--dont">
        <h3><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8"/></svg> What you do not</h3>
        ${bulletList(b)}
      </div>
    </div>
  `
}

export function verdictPanel (verdict, { title = 'The verdict' } = {}) {
  if (!verdict) return raw('')
  return html`
    <div class="verdict">
      <h2 class="verdict__title">${title}</h2>
      ${verdict.short ? html`<p class="verdict__short">${inline(verdict.short)}</p>` : ''}
      <div class="verdict__cols">
        ${verdict.worthItIf && verdict.worthItIf.length ? html`
          <div class="verdict__col verdict__col--yes">
            <h3>Worth it if</h3>
            ${bulletList(verdict.worthItIf)}
          </div>` : ''}
        ${verdict.skipIf && verdict.skipIf.length ? html`
          <div class="verdict__col verdict__col--no">
            <h3>Skip it if</h3>
            ${bulletList(verdict.skipIf)}
          </div>` : ''}
      </div>
    </div>
  `
}

const EDITION_TONE = { announced: 'good', expected: 'warn', past: '', cancelled: 'closed' }

export function editionList (editions, { eventUrl } = {}) {
  const arr = (editions || []).filter(Boolean)
  if (!arr.length) return raw('')
  return html`
    <ol class="editions">
      ${arr.map((e) => html`
        <li class="editions__item">
          <div class="editions__head">
            <h3>${e.year}</h3>
            ${pill(f.titleize(e.status || 'expected'), EDITION_TONE[e.status] || '')}
          </div>
          ${e.dates ? html`<p class="editions__dates">${e.dates}</p>` : html`<p class="editions__dates editions__dates--none">Dates not announced.</p>`}
          <ul class="editions__meta">
            ${e.nights ? html`<li><span>Nights</span><strong>${e.nights}</strong></li>` : ''}
            ${Array.isArray(e.priceRangeUsd) ? html`<li><span>Price</span><strong>${f.price(e.priceRangeUsd[0])}–${f.price(e.priceRangeUsd[1])}</strong></li>` : ''}
          </ul>
          ${e.changes && e.changes.length ? bulletList(e.changes) : ''}
          ${eventUrl && e.url ? html`<p class="editions__more"><a href="${e.url}">Full ${e.year} detail →</a></p>` : ''}
        </li>
      `)}
    </ol>
  `
}

/* ------------------------------------------------------------------ *
 * Months
 * ------------------------------------------------------------------ */

/** A → great, B → good, C → mixed, D/F → poor. The letter is authored; the tone is derived. */
export function gradeTone (grade) {
  const letter = String(grade || '').charAt(0).toUpperCase()
  if (letter === 'A') return 'great'
  if (letter === 'B') return 'good'
  if (letter === 'C') return 'mixed'
  return 'poor'
}

export function gradeBadge (grade, { size = '' } = {}) {
  if (!grade) return raw('')
  return html`<span class="grade grade--${gradeTone(grade)} ${size ? `grade--${size}` : ''}" aria-label="Overall grade ${escapeHtml(String(grade))}">${grade}</span>`
}

const LEVEL_TONE = { low: 'great', moderate: 'good', high: 'mixed', peak: 'poor' }

export function levelPill (level, noun) {
  if (!level) return raw('')
  return pill(`${f.titleize(level)} ${noun}`, `level-${LEVEL_TONE[level] || 'mixed'}`)
}

export function monthCard (month) {
  return html`
    <a class="month-card month-card--${gradeTone(month.verdict && month.verdict.grade)}" href="${month.url}">
      <span class="month-card__name">${month.name}</span>
      ${gradeBadge(month.verdict && month.verdict.grade)}
      <span class="month-card__short">${month.verdict ? inline(month.verdict.short) : ''}</span>
      <span class="month-card__levels">
        ${month.crowds ? html`<span class="month-card__level month-card__level--${LEVEL_TONE[month.crowds.level] || 'mixed'}">${f.titleize(month.crowds.level)} crowds</span>` : ''}
        ${month.cost ? html`<span class="month-card__level month-card__level--${LEVEL_TONE[month.cost.level] || 'mixed'}">${f.titleize(month.cost.level)} cost</span>` : ''}
      </span>
    </a>
  `
}

export function weatherTable (weather) {
  if (!weather) return raw('')
  const rows = []
  if (weather.wdw) rows.push(['Walt Disney World (Orlando)', `${weather.wdw.highF}°F`, `${weather.wdw.lowF}°F`, `${weather.wdw.rainDays}`, weather.wdw.note ? inline(weather.wdw.note) : ''])
  if (weather.dlr) rows.push(['Disneyland (Anaheim)', `${weather.dlr.highF}°F`, `${weather.dlr.lowF}°F`, `${weather.dlr.rainDays}`, weather.dlr.note ? inline(weather.dlr.note) : ''])
  if (!rows.length) return raw('')
  return dataTable({
    caption: 'Climate normals, not a forecast. Averages over a 30-year reference period.',
    columns: [{ label: 'Resort' }, { label: 'Avg high', align: 'right' }, { label: 'Avg low', align: 'right' }, { label: 'Rain days', align: 'right' }, { label: 'What it feels like' }],
    rows,
  })
}

/* ------------------------------------------------------------------ *
 * Calendar
 * ------------------------------------------------------------------ */

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * The year-at-a-glance Gantt, as a CSS grid. No library, and no canvas — it has to print.
 *
 * A band that wraps the year (Holidays at Disneyland runs November to January) is authored honestly
 * as 11 → 1 and split into two segments here. Clamping it to December instead would have been
 * simpler and would have quietly lied about January.
 */
export function calendarGantt (bands, { title } = {}) {
  const arr = (bands || []).filter((b) => b && b.startMonth && b.endMonth)
  if (!arr.length) return raw('')

  const segments = (band) => (band.endMonth >= band.startMonth
    ? [[band.startMonth, band.endMonth]]
    : [[band.startMonth, 12], [1, band.endMonth]])

  return html`
    <div class="gantt-wrap">
      ${title ? html`<p class="gantt__title">${title}</p>` : ''}
      <div class="gantt" role="table" aria-label="Seasonal events by month">
        <div class="gantt__head" role="row">
          <span class="gantt__corner" role="columnheader">Event</span>
          ${MONTH_ABBR.map((m) => html`<span class="gantt__month" role="columnheader">${m}</span>`)}
        </div>
        ${arr.map((band) => html`
          <div class="gantt__row" role="row">
            <span class="gantt__label" role="rowheader">
              ${band.url ? html`<a href="${band.url}">${band.name || band.eventSlug}</a>` : (band.name || band.eventSlug)}
              <i class="gantt__resort">${band.resort === 'walt-disney-world' ? 'WDW' : band.resort === 'disneyland' ? 'DLR' : 'Both'}</i>
            </span>
            <span class="gantt__track" role="cell">
              ${MONTH_ABBR.map(() => html`<i class="gantt__cell" aria-hidden="true"></i>`)}
              ${segments(band).map(([from, to]) => html`
                <span class="gantt__bar gantt__bar--${band.confidence || 'expected'}"
                      style="grid-column:${from} / ${to + 1}">
                  <span class="visually-hidden">${band.name || band.eventSlug}: ${MONTH_ABBR[from - 1]} to ${MONTH_ABBR[to - 1]}</span>
                </span>
              `)}
            </span>
          </div>
        `)}
      </div>
      <p class="gantt__key">
        <span class="gantt__keyitem"><i class="gantt__swatch gantt__swatch--confirmed"></i>Confirmed</span>
        <span class="gantt__keyitem"><i class="gantt__swatch gantt__swatch--expected"></i>Expected</span>
        <span class="gantt__keyitem"><i class="gantt__swatch gantt__swatch--historical"></i>Last confirmed cycle</span>
      </p>
    </div>
  `
}

/* ------------------------------------------------------------------ *
 * Closures
 * ------------------------------------------------------------------ */

/**
 * Whether a closure is coming back is the only thing a reader is really asking, so the tone carries
 * it: red for gone, amber for down-but-returning, green for a confirmed return.
 */
const CLOSURE_TONE = {
  'permanently-closed': 'closed',
  indefinite: 'closed',
  'under-construction': 'warn',
  refurbishment: 'warn',
  seasonal: '',
  reopening: 'good',
}

const CLOSURE_LABEL = {
  'permanently-closed': 'Permanently closed',
  indefinite: 'Closed indefinitely',
  'under-construction': 'Under construction',
  refurbishment: 'Refurbishment',
  seasonal: 'Seasonal',
  reopening: 'Reopening',
}

export function closureTable (items, { caption } = {}) {
  const arr = (items || []).filter(Boolean)
  if (!arr.length) {
    return callout({
      type: 'note',
      title: 'Nothing tracked right now',
      body: 'We only list closures we can actually support with a source. An empty tracker means we have nothing verified, not that everything is open.',
    })
  }
  return dataTable({
    caption,
    columns: [{ label: 'Attraction' }, { label: 'Park' }, { label: 'Status' }, { label: 'Expected back' }, { label: 'Notes' }],
    rows: arr.map((i) => [
      i.url ? html`<a href="${i.url}">${i.name}</a>` : i.name,
      i.parkName || f.titleize(i.parkSlug || ''),
      pill(CLOSURE_LABEL[i.status] || f.titleize(i.status || ''), CLOSURE_TONE[i.status] || ''),
      i.reopening || (i.status === 'permanently-closed' ? 'Not coming back' : 'Not announced'),
      i.note ? inline(i.note) : '',
    ]),
  })
}

/* ------------------------------------------------------------------ *
 * Cross-site handoff — the mirror of components.mjs seasonalHandoff()
 * ------------------------------------------------------------------ */

/**
 * Links to the evergreen pages that own every permanent fact.
 *
 * The evergreen pages refuse to carry dated content and link here; this sends the reader back.
 * Between them there is exactly one canonical owner per topic, which is the whole reason the two
 * sites are separate rather than one site with a seasonal section.
 */
export function evergreenLinks (links, sisterSite, { title = 'The permanent version of all this' } = {}) {
  const arr = (links || []).filter((l) => l && l.href && l.label)
  if (!arr.length) return raw('')
  const origin = (sisterSite && sisterSite.origin) || ''
  const name = (sisterSite && sisterSite.name) || 'our evergreen guide'
  return html`
    <section class="band band--tint evergreen">
      <div class="shell">
        <h2 class="evergreen__title">${title}</h2>
        <p class="evergreen__intro">Height requirements, ride mechanics, accessibility detail, and permanent dining live on ${name}, our year-round sister site. They do not change with the season, so we do not repeat them here.</p>
        <div class="link-grid link-grid--${arr.length >= 4 ? 4 : 3}">
          ${arr.map((l) => html`
            <a class="link-tile link-tile--external" href="${origin}${l.href}">
              <span class="link-tile__title">${l.label}</span>
              ${l.note ? html`<span class="link-tile__summary">${inline(l.note)}</span>` : ''}
              <svg class="link-tile__chev" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m6 3 5 5-5 5"/></svg>
            </a>
          `)}
        </div>
      </div>
    </section>
  `
}

export function resortSplit (byResort, { renderer }) {
  if (!byResort) return raw('')
  const keys = Object.keys(byResort)
  if (!keys.length) return raw('')
  const LABEL = { 'walt-disney-world': 'Walt Disney World', disneyland: 'Disneyland Resort' }
  return html`
    <div class="resort-split">
      ${keys.map((key) => html`
        <div class="resort-split__col">
          <h3 class="resort-split__title">${LABEL[key] || f.titleize(key)}</h3>
          ${renderer ? renderer(key, byResort[key]) : ''}
        </div>
      `)}
    </div>
  `
}

export function sectionBlocks (sections) {
  const arr = (sections || []).filter((s) => s && s.heading)
  if (!arr.length) return raw('')
  return each(arr, (s) => html`
    <section class="doc-section" id="${s.id || slugifyHeading(s.heading)}">
      <h2>${inline(s.heading)}</h2>
      ${paragraphs(s.body)}
      ${s.list ? bulletList(s.list.items || s.list, { style: (s.list && s.list.style) || 'bullet' }) : ''}
      ${s.callout ? callout(s.callout) : ''}
    </section>
  `)
}

export function slugifyHeading (heading) {
  return String(heading).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

export { f as format }
