import { html, raw, paragraphs, inline } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as S from '../lib/schema.mjs'
import { urls } from '../lib/data.mjs'
import * as f from '../lib/format.mjs'

const CATEGORY_LABEL = {
  planning: 'Planning',
  accessibility: 'Accessibility',
  food: 'Food & dining',
  rides: 'Rides',
  money: 'Money',
  families: 'Families',
}

/* ------------------------------------------------------------------ *
 * Live data appendices
 *
 * Three guides make cross-park factual claims that would silently drift from the dataset if they
 * were only prose. Each gets a generated appendix rendered straight from the same fields the ride
 * pages use, so a height correction in one JSON file propagates here automatically. The authored
 * sections still carry the explanation; these carry the numbers.
 * ------------------------------------------------------------------ */

function heightAppendix (data) {
  const rows = data.allHeightAttractions
    .slice()
    .sort((a, b) => a.heightIn - b.heightIn || a.park.name.localeCompare(b.park.name))
    .map((a) => [
      a.hasPage ? html`<a href="${a.url}">${a.name}</a>` : a.name,
      html`<a href="${a.park.url}">${a.park.shortLabel}</a>`,
      html`<span data-value="${a.heightIn}">${a.heightIn}"</span>`,
      html`<span data-value="${Math.round(a.heightIn * 2.54)}">${Math.round(a.heightIn * 2.54)}</span>`,
      f.attractionType(a.type),
    ])

  const bands = data.heightThresholds.map((threshold) => {
    const unlocked = data.allHeightAttractions.filter((a) => a.heightIn <= threshold)
    const justNow = data.allHeightAttractions.filter((a) => a.heightIn === threshold)
    return [
      html`<span data-value="${threshold}">${threshold}" · ${Math.round(threshold * 2.54)}cm</span>`,
      html`<span data-value="${unlocked.length}">${unlocked.length}</span>`,
      f.list(justNow.map((a) => `${a.name} (${a.park.shortLabel})`)),
    ]
  })

  return C.section({
    id: 'every-height-requirement',
    tone: 'tint',
    title: `Every height requirement at all ${data.parks.length} parks`,
    kicker: 'Generated from our live dataset',
    intro: `All ${data.allHeightAttractions.length} attractions with a minimum height, shortest first. This table is generated from the same data as every ride page on the site, so it cannot drift out of step with them.`,
    children: html`
      ${C.dataTable({
        sortable: true,
        className: 'data-table--stack',
        columns: ['Attraction', 'Park', { label: 'Inches', align: 'num', sort: 'number' }, { label: 'cm', align: 'num', sort: 'number' }, 'Type'],
        rows,
      })}
      <h3 class="mt-6">What unlocks at each height</h3>
      ${C.dataTable({
        className: 'data-table--stack',
        caption: 'Counting only rides that have a requirement — every attraction with no requirement is rideable at any height.',
        columns: [{ label: 'Height', align: 'num', sort: 'number' }, { label: 'Rides now open to them', align: 'num', sort: 'number' }, 'Newly unlocked at this height'],
        rows: bands,
      })}
      <p class="mt-5"><a class="btn btn--primary" href="${urls.heightChecker()}">Try the interactive height checker</a></p>
    `,
  })
}

function scaryAppendix (data) {
  const rows = data.allAttractions
    .filter((a) => a.isOpen && a.scary && a.scary.score >= 3)
    .sort((a, b) => b.scary.score - a.scary.score || a.park.name.localeCompare(b.park.name))
    .map((a) => [
      a.hasPage ? html`<a href="${a.url}">${a.name}</a>` : a.name,
      html`<a href="${a.park.url}">${a.park.shortLabel}</a>`,
      html`<span data-value="${a.scary.score}">${a.scary.score}/5</span>`,
      html`<span data-value="${a.scary.darkness || 0}">${a.scary.darkness ?? '—'}</span>`,
      html`<span data-value="${a.scary.drops || 0}">${a.scary.drops ?? '—'}</span>`,
      html`<span data-value="${a.scary.loudness || 0}">${a.scary.loudness ?? '—'}</span>`,
      html`<span data-value="${a.scary.startles || 0}">${a.scary.startles ?? '—'}</span>`,
      a.heightIn ? `${a.heightIn}"` : 'Any',
    ])
  if (!rows.length) return raw('')

  return C.section({
    id: 'scariest-attractions',
    tone: 'tint',
    title: 'Every attraction we rate 3 out of 5 or scarier',
    kicker: 'Generated from our live dataset',
    intro: 'Scored against what frightens a typical four- to seven-year-old, not an adult. Darkness, drops, loudness, and sudden effects are broken out separately, because a child scared of the dark and a child scared of drops need different advice.',
    children: C.dataTable({
      sortable: true,
      className: 'data-table--stack',
      columns: [
        'Attraction', 'Park',
        { label: 'Overall', align: 'center', sort: 'number' },
        { label: 'Dark', align: 'center', sort: 'number' },
        { label: 'Drops', align: 'center', sort: 'number' },
        { label: 'Loud', align: 'center', sort: 'number' },
        { label: 'Startles', align: 'center', sort: 'number' },
        { label: 'Height', align: 'center' },
      ],
      rows,
    }),
  })
}

function motionAppendix (data) {
  const rank = { high: 3, moderate: 2, low: 1, none: 0 }
  const rows = data.allAttractions
    .filter((a) => a.isOpen && rank[a.motionSickness] >= 2)
    .sort((a, b) => rank[b.motionSickness] - rank[a.motionSickness] || a.park.name.localeCompare(b.park.name))
    .map((a) => [
      a.hasPage ? html`<a href="${a.url}">${a.name}</a>` : a.name,
      html`<a href="${a.park.url}">${a.park.shortLabel}</a>`,
      html`<span data-value="${rank[a.motionSickness]}">${f.motion(a.motionSickness)}</span>`,
      f.attractionType(a.type),
      html`<span data-value="${a.intensity || 0}">${f.intensityLabel(a.intensity)}</span>`,
    ])
  if (!rows.length) return raw('')

  return C.section({
    id: 'motion-risk-by-ride',
    tone: 'tint',
    title: 'Every ride we flag for motion sickness',
    kicker: 'Generated from our live dataset',
    intro: 'Moderate and high risk only. Simulators and spinners dominate the top of this list; roller coasters, counter-intuitively, cause far fewer problems because your inner ear and your eyes agree about what is happening.',
    children: C.dataTable({
      sortable: true,
      className: 'data-table--stack',
      columns: ['Attraction', 'Park', 'Risk', 'Type', { label: 'Intensity', align: 'center', sort: 'number' }],
      rows,
    }),
  })
}

const APPENDICES = {
  'height-requirements': heightAppendix,
  'is-it-scary': scaryAppendix,
  'motion-sickness': motionAppendix,
}

/* ------------------------------------------------------------------ *
 * Guides
 * ------------------------------------------------------------------ */

export function guidePage (guide, data) {
  const { site } = data
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Guides', href: urls.guidesIndex() },
    { label: guide.h1 || guide.title, href: urls.guide(guide.slug) },
  ]
  const related = (guide.related || []).map((slug) => data.guideBySlug.get(slug)).filter(Boolean)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: CATEGORY_LABEL[guide.category] || 'Guide',
      title: guide.h1 || guide.title,
      lede: guide.summary,
      tone: 'compact',
      meta: [
        guide.readingTimeMinutes ? { label: 'Reading time', value: `${guide.readingTimeMinutes} min` } : null,
        { label: 'Last verified', value: f.humanDate(guide.lastVerified) },
      ].filter(Boolean),
    })}

    ${C.section({
      children: html`
        <div class="doc-layout">
          <div>
            <div class="prose prose--lede">${paragraphs(guide.intro)}</div>
            ${C.keyPoints(guide.keyPoints)}
            ${C.renderSections(guide.sections)}
            ${C.lastVerified(guide.lastVerified)}
          </div>
          <aside class="doc-layout__aside" data-print-hide>
            ${C.tableOfContents(guide.sections)}
            ${related.length ? C.linkGrid(related.map((g) => ({ href: urls.guide(g.slug), label: g.h1 || g.title })), { columns: 1 }) : ''}
          </aside>
        </div>
      `,
    })}

    ${APPENDICES[guide.slug] ? APPENDICES[guide.slug](data) : ''}

    ${C.faqSection(guide.faqs)}

    ${related.length ? C.relatedLinks(related.map((g) => ({
      href: urls.guide(g.slug), label: g.h1 || g.title, summary: g.summary,
    }))) : ''}
  `

  return {
    url: urls.guide(guide.slug),
    html: renderPage({
      site,
      page: {
        url: urls.guide(guide.slug),
        title: guide.title,
        description: C.truncate(guide.metaDescription, 158),
        trail,
        modified: `${guide.lastVerified || '2026-07'}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        S.article(site, {
          url: urls.guide(guide.slug),
          title: guide.h1 || guide.title,
          description: C.truncate(guide.metaDescription, 158),
          modified: `${guide.lastVerified || '2026-07'}-01`,
          section: CATEGORY_LABEL[guide.category] || 'Planning',
        }),
        S.faqPage(site, { url: urls.guide(guide.slug), faqs: guide.faqs }),
      ],
    }),
  }
}

export function guidesIndex (data) {
  const { site, guides } = data
  const trail = [{ label: 'Home', href: '/' }, { label: 'Guides', href: urls.guidesIndex() }]

  const byCategory = {}
  for (const guide of guides) {
    (byCategory[guide.category || 'planning'] = byCategory[guide.category || 'planning'] || []).push(guide)
  }
  const order = ['planning', 'rides', 'families', 'accessibility', 'food', 'money']
  const categories = [...order.filter((c) => byCategory[c]), ...Object.keys(byCategory).filter((c) => !order.includes(c))]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: `${guides.length} evergreen guides`,
      title: 'Guides that stay true',
      lede: 'The mechanics that do not change week to week: how Lightning Lane works, how heights are measured, what actually frightens a four-year-old, and what belongs in the bag.',
      tone: 'compact',
    })}

    ${categories.map((category) => C.section({
      id: category,
      tone: categories.indexOf(category) % 2 ? 'tint' : '',
      title: CATEGORY_LABEL[category] || f.titleize(category),
      children: C.cardGrid(byCategory[category].map((guide) => C.card({
        href: urls.guide(guide.slug),
        eyebrow: guide.readingTimeMinutes ? `${guide.readingTimeMinutes} min read` : '',
        title: guide.h1 || guide.title,
        summary: guide.summary,
        meta: [{ label: 'Verified', value: f.humanDate(guide.lastVerified) }],
      })), { columns: 3 }),
    }))}
  `

  return {
    url: urls.guidesIndex(),
    html: renderPage({
      site,
      page: {
        url: urls.guidesIndex(),
        title: `${site.brand.shortName} park planning guides`,
        description: `${guides.length} evergreen guides to the ${data.parks.length} parks: ${data.queue.name}, height requirements, accessibility, motion sickness, packing, and park etiquette.`,
        trail,
        modified: '2026-07-01',
      },
      body,
      schema: [S.itemList(site, {
        url: urls.guidesIndex(),
        name: 'Planning guides',
        items: guides.map((g) => ({ name: g.h1 || g.title, url: urls.guide(g.slug) })),
      })],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Comparisons
 * ------------------------------------------------------------------ */

function comparisonTable (page) {
  const contenders = page.contenders || []
  const dims = page.dimensions || []
  if (!dims.length || !contenders.length) return raw('')

  // An empty corner cell is the visual convention, but it reads as an unlabelled column to a
  // screen reader — and on mobile the stacked layout uses these labels as the row prefixes.
  const columns = [raw('<span class="visually-hidden">Comparison point</span>'), ...contenders.map((c) => c.name)]
  const rows = dims.map((dim) => {
    const cells = contenders.map((c) => {
      const value = (dim.cells || {})[c.key]
      const isWinner = dim.winner === c.key
      return html`${isWinner ? html`<span class="winner-flag">Edge</span><br>` : ''}${inline(value || '—')}`
    })
    return [
      html`<strong>${dim.name}</strong>${dim.note ? html`<span class="facts__hint">${inline(dim.note)}</span>` : ''}`,
      ...cells,
    ]
  })

  return C.dataTable({
    columns,
    rows,
    className: 'compare-table data-table--stack',
    caption: '“Edge” marks which side we think wins that row. A row with no edge marked is genuinely a tie.',
  })
}

function rankingList (page, data) {
  const ranking = page.ranking
  if (!ranking || !ranking.length) return raw('')
  return html`
    <div class="rank-list">
      ${ranking.map((entry) => {
        const park = data.parkBySlug.get(entry.key)
        const contender = (page.contenders || []).find((c) => c.key === entry.key)
        const name = park ? park.name : (contender ? contender.name : f.titleize(entry.key))
        const href = park ? park.url : null
        return html`
          <article class="rank-item">
            <div class="rank-item__head">
              <span class="rank-item__num">${entry.rank}</span>
              <h3 class="rank-item__name">${href ? html`<a href="${href}">${name}</a>` : name}</h3>
            </div>
            ${entry.headline ? html`<p class="rank-item__headline">${inline(entry.headline)}</p>` : ''}
            ${paragraphs(entry.body)}
            ${(entry.pros && entry.pros.length) || (entry.cons && entry.cons.length) ? html`
              <div class="proscons">
                ${entry.pros && entry.pros.length ? html`
                  <div class="proscons__pro"><h4>What it gets right</h4><ul>${entry.pros.map((p) => html`<li>${inline(p)}</li>`)}</ul></div>` : ''}
                ${entry.cons && entry.cons.length ? html`
                  <div class="proscons__con"><h4>What it does not</h4><ul>${entry.cons.map((c) => html`<li>${inline(c)}</li>`)}</ul></div>` : ''}
              </div>` : ''}
          </article>
        `
      })}
    </div>
  `
}

function pickThisIf (page) {
  const map = page.pickThisIf
  if (!map) return raw('')
  const contenders = page.contenders || []
  const entries = contenders.filter((c) => map[c.key] && map[c.key].length)
  if (!entries.length) return raw('')
  return html`
    <div class="pickif">
      ${entries.map((c) => html`
        <div class="pickif__col">
          <h3>Pick ${c.name} if…</h3>
          <ul>${map[c.key].map((line) => html`<li>${inline(line)}</li>`)}</ul>
        </div>
      `)}
    </div>
  `
}

export function comparePage (page, data) {
  const { site } = data
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Compare', href: urls.compareIndex() },
    { label: page.h1 || page.title, href: urls.compare(page.slug) },
  ]
  const related = (page.related || []).map((slug) => data.compareBySlug.get(slug)).filter(Boolean)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: 'Comparison',
      title: page.h1 || page.title,
      lede: page.summary,
      tone: 'compact',
      meta: [
        page.readingTimeMinutes ? { label: 'Reading time', value: `${page.readingTimeMinutes} min` } : null,
        { label: 'Last verified', value: f.humanDate(page.lastVerified) },
      ].filter(Boolean),
    })}

    ${C.section({
      children: html`
        ${page.verdict ? html`
          <div class="verdict-box">
            <h2>The verdict</h2>
            <p class="verdict-box__short">${inline(page.verdict.short)}</p>
            ${paragraphs(page.verdict.body)}
          </div>` : ''}
        <div class="prose prose--lede">${paragraphs(page.intro)}</div>
      `,
    })}

    ${page.dimensions && page.dimensions.length ? C.section({
      tone: 'tint',
      title: 'Head to head',
      wide: true,
      children: comparisonTable(page),
    }) : ''}

    ${page.ranking && page.ranking.length ? C.section({
      title: 'The ranking',
      intro: 'In order, with the case against each placement included — because a ranking nobody argues with is a ranking nobody needed.',
      children: rankingList(page, data),
    }) : ''}

    ${page.sections && page.sections.length ? C.section({
      tone: page.ranking && page.ranking.length ? 'tint' : '',
      children: html`
        <div class="doc-layout">
          <div>${C.renderSections(page.sections)}</div>
          <aside class="doc-layout__aside" data-print-hide>${C.tableOfContents(page.sections)}</aside>
        </div>
      `,
    }) : ''}

    ${page.pickThisIf ? C.section({
      title: 'So which one is yours?',
      children: pickThisIf(page),
    }) : ''}

    ${C.section({
      tone: 'tight',
      children: C.affiliateBox(site, {
        kind: 'tickets',
        heading: 'When you have decided',
        body: 'Whichever way you go, the parks do not discount their own tickets — authorized resellers do. The savings are modest but real on multi-day tickets, and this is the reseller we use ourselves.',
      }),
    })}

    ${C.faqSection(page.faqs)}

    ${related.length ? C.relatedLinks(related.map((c) => ({
      href: urls.compare(c.slug), label: c.h1 || c.title, summary: c.summary,
    })), { title: 'More comparisons' }) : ''}
  `

  return {
    url: urls.compare(page.slug),
    html: renderPage({
      site,
      page: {
        url: urls.compare(page.slug),
        title: page.title,
        description: C.truncate(page.metaDescription, 158),
        trail,
        modified: `${page.lastVerified || '2026-07'}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        S.article(site, {
          url: urls.compare(page.slug),
          title: page.h1 || page.title,
          description: C.truncate(page.metaDescription, 158),
          modified: `${page.lastVerified || '2026-07'}-01`,
          section: 'Comparisons',
        }),
        page.ranking && page.ranking.length
          ? S.itemList(site, {
            url: urls.compare(page.slug),
            name: page.h1 || page.title,
            items: page.ranking
              .slice()
              .sort((a, b) => a.rank - b.rank)
              .map((entry) => {
                const park = data.parkBySlug.get(entry.key)
                const contender = (page.contenders || []).find((c) => c.key === entry.key)
                return { name: park ? park.name : (contender ? contender.name : entry.key), url: park ? park.url : null }
              }),
          })
          : null,
        S.faqPage(site, { url: urls.compare(page.slug), faqs: page.faqs }),
      ].filter(Boolean),
    }),
  }
}

export function compareIndex (data) {
  const { site, compare } = data
  const trail = [{ label: 'Home', href: '/' }, { label: 'Compare', href: urls.compareIndex() }]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: `${compare.length} comparisons`,
      title: 'The arguments, settled',
      lede: 'Every comparison page here commits to an answer and shows the reasoning. If we think it is genuinely a tie, we say that too — but only when it is.',
      tone: 'compact',
    })}

    ${C.section({
      children: C.cardGrid(compare.map((page) => C.card({
        href: urls.compare(page.slug),
        eyebrow: page.contenders && page.contenders.length > 2 ? `${page.contenders.length} contenders` : 'Head to head',
        title: page.h1 || page.title,
        summary: page.verdict && page.verdict.short ? page.verdict.short : page.summary,
        meta: [{ label: 'Verified', value: f.humanDate(page.lastVerified) }],
      })), { columns: 2 }),
    })}
  `

  return {
    url: urls.compareIndex(),
    html: renderPage({
      site,
      page: {
        url: urls.compareIndex(),
        title: 'Park comparisons with actual verdicts',
        description: `Resort against resort, the best park for young children, all ${data.parks.length} parks ranked — comparison pages that commit to an answer instead of hedging.`,
        trail,
        modified: '2026-07-01',
      },
      body,
      schema: [S.itemList(site, {
        url: urls.compareIndex(),
        name: 'Park comparisons',
        items: compare.map((c) => ({ name: c.h1 || c.title, url: urls.compare(c.slug) })),
      })],
    }),
  }
}
