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
        description: guide.metaDescription,
        trail,
        modified: `${guide.lastVerified || '2026-07'}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        S.article(site, {
          url: urls.guide(guide.slug),
          title: guide.h1 || guide.title,
          description: guide.metaDescription,
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
        title: 'Disney park planning guides',
        description: `${guides.length} evergreen guides to the six US Disney parks: Lightning Lane, height requirements, accessibility, motion sickness, packing, and park etiquette.`,
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

  const columns = ['', ...contenders.map((c) => c.name)]
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
        body: 'Whichever way you go, Disney does not discount its own tickets — authorized resellers do. The savings are modest but real on multi-day tickets, and this is the reseller we use ourselves.',
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
        description: page.metaDescription,
        trail,
        modified: `${page.lastVerified || '2026-07'}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        S.article(site, {
          url: urls.compare(page.slug),
          title: page.h1 || page.title,
          description: page.metaDescription,
          modified: `${page.lastVerified || '2026-07'}-01`,
          section: 'Comparisons',
        }),
        S.faqPage(site, { url: urls.compare(page.slug), faqs: page.faqs }),
      ],
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
        title: 'Disney park comparisons with actual verdicts',
        description: 'Disneyland vs Disney World, the best park for toddlers, all six parks ranked — comparison pages that commit to an answer instead of hedging.',
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
