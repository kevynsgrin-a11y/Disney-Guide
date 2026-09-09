/**
 * The ride status pages: what we can honestly say about whether a ride is running.
 *
 * The honesty split is the whole design. Two kinds of truth are available:
 *
 * 1. SCHEDULED closures - published by the operator on their calendars, verified into our
 *    closures trackers by the normal gates. These wear our confidence styling and say so.
 * 2. Everything else. An "open" ride is "not scheduled for closure" - unscheduled downtime
 *    happens without warning and the operator publishes no pre-opening downtime list (they
 *    surface it per-attraction in their apps, in the day). For that, this page carries
 *    guest reports: anonymous, unverified pings from people at the park, rendered in a
 *    visual language deliberately distinct from anything the freshness contract uses, and
 *    expiring from a rolling window so nothing stale can survive a day.
 *
 * The client half (assets/js/status.js) hydrates the guest-report layer from /api/status.
 */

import { html, raw, escapeHtml } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import { urls } from '../lib/data.mjs'
import { BUILD_MONTH } from '../lib/staleness.mjs'
import * as f from '../lib/format.mjs'

const OFFICIAL_LINKS = {
  'walt-disney-world': {
    label: 'My Disney Experience app and the attraction pages at disneyworld.disney.go.com',
    href: 'https://disneyworld.disney.go.com/faq/parks/non-operational-attractions/',
  },
  disneyland: {
    label: 'the daily park-hours calendar at disneyland.disney.go.com',
    href: 'https://disneyland.disney.go.com/faq/parks/closures/',
  },
}

/** The standing disclaimer. Persistent, above the fold, and repeated in the footer of the page. */
function statusDisclaimer (site) {
  return html`
    <div class="callout callout--note status-disclaimer" role="note">
      <h3>Read this first: what this page can and cannot tell you</h3>
      <p>${site.brand.name} is an independent, unofficial publication with no affiliation to Disney or any park operator. <strong>Scheduled closures</strong> below come from the operator's published calendars and our verified trackers. <strong>Guest reports</strong> are anonymous pings from people at the park — they are <strong>not verified by us, and we cannot confirm any ride's actual operating status</strong>. Reports may be wrong, duplicated, or out of date, and they expire automatically: nothing older than twelve hours can influence anything on this page. Before you walk to a ride, check the operator's own channels — linked from every park page — because only their information is authoritative.</p>
    </div>
  `
}

/** Build the scheduled-closure lookup for one park across all resort trackers. */
function scheduledFor (seasonal, park) {
  const map = new Map()
  for (const tracker of (seasonal && seasonal.closures) || []) {
    for (const item of tracker.items || []) {
      if (item.parkSlug === park.slug) map.set(item.attractionSlug, item)
    }
  }
  return map
}

function scheduledLabel (item) {
  if (item.status === 'permanently-closed') return { label: 'Closed — permanently', tone: 'danger', note: item.note }
  if (item.status === 'under-construction') return { label: 'Not yet open — under construction', tone: 'muted', note: item.note }
  if (item.status === 'indefinite') return { label: 'Closed — no reopening announced', tone: 'warn', note: item.note }
  if (item.status === 'closed') return { label: 'Closed', tone: 'muted', note: item.note }
  if (item.reopening) return {
    label: `Closed — scheduled${item.reopeningConfidence === 'confirmed' ? `, reopening ${f.humanDate(item.reopening)}` : ''}`,
    tone: 'warn',
    note: item.note,
  }
  return { label: 'Closed — scheduled', tone: 'warn', note: item.note }
}

export function statusIndex (data) {
  const { site, parks } = data
  const url = urls.statusIndex()
  const trail = [{ label: 'Home', href: '/' }, { label: 'Ride status', href: url }]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: 'Live-ish, and honest about which parts',
      title: 'Ride status',
      lede: 'Scheduled closures, verified and dated. Guest reports from inside the park, anonymous and unverified, expiring on a twelve-hour rolling window so nothing stale survives the day. The operator\'s own channels outrank both — and every page here links to them.',
      tone: 'compact',
    })}

    ${C.section({
      children: html`
        ${statusDisclaimer(site)}
        <div class="mt-5">
          ${C.cardGrid(parks.map((p) => C.card({
            href: urls.statusPark(p.slug),
            title: `${p.name} ride status`,
            summary: `${p.attractions.filter((a) => a.isOpen).length} open attractions · scheduled closures verified ${BUILD_MONTH} · guest reports live`,
          })), { columns: 3 })}
        </div>
      `,
    })}

    ${C.section({
      tone: 'tint',
      title: 'How the guest-report tiers work',
      children: html`
        <div class="split split--even">
          <div class="prose">
            <p>Anyone at the park can tap <em>report closed</em> on a ride — no account, no name, nothing tracked. When <strong>two people</strong> report the same ride within <strong>two hours</strong>, the page shows an amber advisory: guests are reporting it down, be aware. When <strong>seven or more</strong> report it within <strong>twelve hours</strong>, the line turns red and reads as confirmed by guests — guests, not us, and never the operator.</p>
            <p>Reports carry a plain-English price: they are anecdotes, not data. The tiers exist because one person's one-off is noise and seven strangers agreeing within a morning is signal — strong enough to act on, weak enough to verify against the operator's app before you walk across a park.</p>
          </div>
          <div>
            ${C.callout({ type: 'tip', title: 'Why we will never say "confirmed closed"', body: 'The site\'s whole value is that "confirmed" means verified against a named source. A guest report is never that. The red tier says reported by seven or more guests — the operator\'s app is the only place the word confirmed belongs.' })}
            ${C.callout({ type: 'note', title: 'Reset and freshness', body: 'Every report expires exactly twelve hours after it was made, so each morning starts clean and nothing from yesterday can colour today. This is a rolling window by design — fresher than a single nightly reset.' })}
          </div>
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
        title: 'Ride status',
        titleTail: ' — scheduled closures and guest reports',
        description: 'Per-park ride status: verified scheduled closures plus anonymous, unverified guest reports on a twelve-hour rolling window, with the operator\'s official channels linked from every page.',
        trail,
        modified: `${BUILD_MONTH}-01`,
      },
      body,
    }),
  }
}

export function statusParkPage (park, data, seasonal) {
  const { site } = data
  const url = urls.statusPark(park.slug)
  const trail = [{ label: 'Home', href: '/' }, { label: 'Ride status', href: urls.statusIndex() }, { label: park.shortLabel || park.name, href: url }]
  const scheduled = scheduledFor(seasonal, park)
  const official = OFFICIAL_LINKS[park.resortInfo?.slug] || OFFICIAL_LINKS['walt-disney-world']
  /* Every attraction the dataset knows: open rides as live rows, closed or unbuilt ones
     as their verified tracker state - a board that omits the closed rides answers a
     different question than the one a reader brings to it. */
  const rides = park.attractions.map((a) => {
    const item = scheduled.get(a.slug) || (a.isOpen ? null : { status: 'closed', note: a.closedNote || null })
    return { slug: a.slug, name: a.name, url: a.url, item, isOpen: a.isOpen }
  })
  const closedCount = rides.filter((r) => r.item).length

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: `${park.resortInfo ? park.resortInfo.name : ''} · ride status`,
      title: `${park.name} today`,
      lede: `Scheduled closures are verified and dated. Everything else is guest-reported and unverified — and the operator's app outranks all of it.`,
      tone: 'compact',
      meta: [
        { label: 'Open attractions', value: String(rides.length - closedCount) },
        { label: 'Closed or scheduled', value: String(closedCount) },
        { label: 'Guest reports', value: 'rolling 12-hour window' },
      ],
    })}

    ${C.section({
      children: html`
        ${statusDisclaimer(site)}
        <p class="small mt-4">Official source for this resort: <a href="${official.href}" rel="noopener">${official.label}</a> <span class="muted">(external, operator-run).</span></p>
        <div class="mt-5 status-board" data-status-board="${park.slug}" data-turnstile-key="0x4AAAAAAEuLe7a9JPDqEtAx">
          <noscript><p class="callout callout--note">Guest reports need JavaScript. The scheduled-closure table below is complete without them.</p></noscript>
          <div data-status-rows>
            ${rides.map((r) => {
              if (r.item) {
                const s = scheduledLabel(r.item)
                return html`<div class="status-row status-row--scheduled" data-ride="${r.slug}">
                  <span class="status-row__name"><a href="${r.url}">${r.name}</a></span>
                  <span class="pill pill--tone-${s.tone} status-row__pill">${s.label}</span>
                  ${r.item.note ? html`<span class="status-row__note">${r.item.note}</span>` : ''}
                </div>`
              }
              return html`<div class="status-row" data-ride="${r.isOpen ? r.slug : ''}">
                <span class="status-row__name">${r.url ? html`<a href="${r.url}">${r.name}</a>` : r.name}</span>
                <span class="pill status-row__pill status-row__pill--open" data-open-pill>Not scheduled for closure</span>
                <span class="status-row__report" data-report-slot></span>
              </div>`
            }).join('')}
          </div>
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
        title: `${park.name} ride status`,
        titleTail: ' — closures and guest reports',
        description: `Ride status at ${park.name}: verified scheduled closures plus anonymous guest reports on a twelve-hour window. Unofficial and unaffiliated — the operator's app is authoritative.`,
        trail,
        modified: `${BUILD_MONTH}-01`,
        noindex: false,
      },
      body,
      scripts: ['/assets/js/status.js'],
    }),
  }
}
