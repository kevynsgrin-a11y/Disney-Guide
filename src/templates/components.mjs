import { html, raw, each, inline, paragraphs, escapeHtml, truncate } from '../lib/html.mjs'
import * as f from '../lib/format.mjs'

/* ------------------------------------------------------------------ *
 * Structure
 * ------------------------------------------------------------------ */

export function shell (content, className = '') {
  return html`<div class="shell ${className}">${content}</div>`
}

export function breadcrumbs (trail) {
  if (!trail || trail.length < 2) return raw('')
  return html`
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <div class="shell">
        <ol>
          ${trail.map((crumb, i) => html`
            <li>${i === trail.length - 1
              ? html`<span aria-current="page">${crumb.label}</span>`
              : html`<a href="${crumb.href}">${crumb.label}</a>`}</li>
          `)}
        </ol>
      </div>
    </nav>
  `
}

/**
 * Page hero. `meta` is an array of {label, value} chips; `actions` an array of {href,label,primary}.
 */
export function hero ({ eyebrow, title, lede, meta, actions, tone = 'default', aside }) {
  return html`
    <section class="hero hero--${tone}">
      <div class="shell hero__inner">
        <div class="hero__body">
          ${eyebrow ? html`<p class="hero__eyebrow">${eyebrow}</p>` : ''}
          <h1 class="hero__title">${title}</h1>
          ${lede ? html`<p class="hero__lede">${inline(lede)}</p>` : ''}
          ${meta && meta.length ? html`
            <ul class="hero__meta">
              ${meta.filter(Boolean).map((m) => html`
                <li><span class="hero__meta-label">${m.label}</span><span class="hero__meta-value">${m.value}</span></li>
              `)}
            </ul>` : ''}
          ${actions && actions.length ? html`
            <div class="hero__actions">
              ${actions.filter(Boolean).map((a) => html`
                <a class="btn ${a.primary ? 'btn--primary' : 'btn--ghost'}" href="${a.href}">${a.label}</a>
              `)}
            </div>` : ''}
        </div>
        ${aside ? html`<div class="hero__aside">${aside}</div>` : ''}
      </div>
    </section>
  `
}

export function section ({ id, title, kicker, intro, children, tone = '', wide = false }) {
  return html`
    <section class="band ${tone ? `band--${tone}` : ''}"${id ? raw(` id="${escapeHtml(id)}"`) : raw('')}>
      <div class="shell ${wide ? 'shell--wide' : ''}">
        ${title ? html`
          <header class="band__head">
            ${kicker ? html`<p class="kicker">${kicker}</p>` : ''}
            <h2>${title}</h2>
            ${intro ? html`<p class="band__intro">${inline(intro)}</p>` : ''}
          </header>` : ''}
        ${children}
      </div>
    </section>
  `
}

export function prose (paras, className = '') {
  return html`<div class="prose ${className}">${paragraphs(paras)}</div>`
}

/* ------------------------------------------------------------------ *
 * Small pieces
 * ------------------------------------------------------------------ */

export function pill (label, tone = '') {
  return html`<span class="pill ${tone ? `pill--${tone}` : ''}">${label}</span>`
}

export function heightBadge (inches) {
  if (inches == null) return html`<span class="hbadge hbadge--any">Any height</span>`
  const tone = inches >= 44 ? 'tall' : inches >= 40 ? 'mid' : 'short'
  return html`<span class="hbadge hbadge--${tone}"><strong>${inches}"</strong><span>${Math.round(inches * 2.54)}cm</span></span>`
}

export function lastVerified (date, label = 'Last verified') {
  if (!date) return raw('')
  return html`<p class="verified"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 8.5 6 12l8-8"/></svg> ${label} ${f.humanDate(date)}</p>`
}

export function callout ({ type = 'note', title, body, children }) {
  const icons = {
    tip: 'M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5 5.6 5.6M10.4 10.4l2.1 2.1M12.5 3.5l-2.1 2.1M5.6 10.4 3.5 12.5',
    warning: 'M8 2 1.5 13.5h13L8 2ZM8 6.5v3M8 11.5v.01',
    note: 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM8 4.5v.01M8 7v4.5',
    money: 'M8 1v14M11 4.5H6.5a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4H5',
    legal: 'M8 1.5 2 4v4.5c0 3.5 2.4 5.6 6 6.5 3.6-.9 6-3 6-6.5V4L8 1.5Z',
  }
  return html`
    <aside class="callout callout--${type}">
      <svg class="callout__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="${icons[type] || icons.note}"/></svg>
      <div class="callout__body">
        ${title ? html`<p class="callout__title">${title}</p>` : ''}
        ${body ? html`<p>${inline(body)}</p>` : ''}
        ${children || ''}
      </div>
    </aside>
  `
}

/**
 * Key/value fact panel. `items` = [{label, value, hint}] — values may be Raw.
 */
export function factPanel (items, { title, columns = 2 } = {}) {
  const rows = (items || []).filter((i) => i && i.value != null && i.value !== '')
  if (!rows.length) return raw('')
  return html`
    <div class="facts facts--cols-${columns}">
      ${title ? html`<h3 class="facts__title">${title}</h3>` : ''}
      <dl>
        ${rows.map((item) => html`
          <div class="facts__row">
            <dt>${item.label}</dt>
            <dd>${item.value}${item.hint ? html`<span class="facts__hint">${item.hint}</span>` : ''}</dd>
          </div>
        `)}
      </dl>
    </div>
  `
}

export function statRow (stats) {
  const items = (stats || []).filter(Boolean)
  if (!items.length) return raw('')
  return html`
    <ul class="stat-row">
      ${items.map((s) => html`
        <li><span class="stat-row__value">${s.value}</span><span class="stat-row__label">${s.label}</span></li>
      `)}
    </ul>
  `
}

/** A labelled 1–5 meter. */
export function meter (label, value, max = 5, tone = '') {
  const pct = Math.max(0, Math.min(100, (Number(value) / max) * 100))
  return html`
    <div class="meter ${tone ? `meter--${tone}` : ''}">
      <div class="meter__head"><span>${label}</span><span class="meter__value">${value}<i>/${max}</i></span></div>
      <div class="meter__track" role="img" aria-label="${label}: ${value} out of ${max}">
        <div class="meter__fill" style="width:${pct}%"></div>
      </div>
    </div>
  `
}

/* ------------------------------------------------------------------ *
 * Tables
 * ------------------------------------------------------------------ */

/**
 * @param columns  array of strings, or {label, align, scope, width, sort}
 * @param rows     array of arrays; cells may be strings or Raw
 */
export function dataTable ({ caption, columns, rows, id, className = '', sortable = false, dense = false }) {
  if (!rows || !rows.length) return raw('')
  const cols = columns.map((c) => (typeof c === 'string' ? { label: c } : c))
  return html`
    <div class="table-wrap"${sortable ? raw(' data-sortable-wrap') : raw('')}>
      <table class="data-table ${dense ? 'data-table--dense' : ''} ${className}"${id ? raw(` id="${escapeHtml(id)}"`) : raw('')}${sortable ? raw(' data-sortable') : raw('')}>
        ${caption ? html`<caption>${inline(caption)}</caption>` : ''}
        <thead>
          <tr>
            ${cols.map((c, i) => html`<th scope="col"${c.align ? raw(` class="ta-${c.align}"`) : raw('')}${sortable ? raw(` data-sort-index="${i}" data-sort-type="${c.sort || 'text'}"`) : raw('')}>${c.label}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => html`
            <tr>
              ${row.map((cell, i) => (i === 0
                ? html`<th scope="row"${cols[i] && cols[i].align ? raw(` class="ta-${cols[i].align}"`) : raw('')}>${cell}</th>`
                : html`<td${cols[i] && cols[i].align ? raw(` class="ta-${cols[i].align}"`) : raw('')}${cols[i] && cols[i].label ? raw(` data-label="${escapeHtml(cols[i].label)}"`) : raw('')}>${cell}</td>`))}
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `
}

/* ------------------------------------------------------------------ *
 * Lists
 * ------------------------------------------------------------------ */

export function bulletList (items, { style = 'bullet', className = '' } = {}) {
  const arr = (items || []).filter(Boolean)
  if (!arr.length) return raw('')
  const Tag = style === 'number' ? 'ol' : 'ul'
  return raw(`<${Tag} class="rich-list rich-list--${style} ${escapeHtml(className)}">` +
    arr.map((i) => `<li>${inline(i)}</li>`).join('') + `</${Tag}>`)
}

export function tipList (tips, { title = 'Tips that actually help', tone = 'tip' } = {}) {
  const arr = (tips || []).filter(Boolean)
  if (!arr.length) return raw('')
  return html`
    <div class="tips tips--${tone}">
      <h3 class="tips__title">${title}</h3>
      <ul>${arr.map((t) => html`<li>${inline(t)}</li>`)}</ul>
    </div>
  `
}

export function keyPoints (points, title = 'The short version') {
  const arr = (points || []).filter(Boolean)
  if (!arr.length) return raw('')
  return html`
    <div class="keypoints">
      <h2 class="keypoints__title">${title}</h2>
      <ul>${arr.map((p) => html`<li>${inline(p)}</li>`)}</ul>
    </div>
  `
}

export function faqSection (faqs, { title = 'Frequently asked questions', id = 'faq' } = {}) {
  const arr = (faqs || []).filter((x) => x && x.q && x.a)
  if (!arr.length) return raw('')
  return html`
    <section class="band band--tint" id="${id}">
      <div class="shell shell--narrow">
        <h2 class="faq__title">${title}</h2>
        <div class="faq">
          ${arr.map((faq, i) => html`
            <details class="faq__item"${i === 0 ? raw(' open') : raw('')}>
              <summary><span>${inline(faq.q)}</span></summary>
              <div class="faq__answer">${paragraphs(String(faq.a).split('\n\n'))}</div>
            </details>
          `)}
        </div>
      </div>
    </section>
  `
}

/* ------------------------------------------------------------------ *
 * Cards
 * ------------------------------------------------------------------ */

export function card ({ href, eyebrow, title, summary, meta, badges, tone = '', footer }) {
  const inner = html`
    ${eyebrow ? html`<p class="card__eyebrow">${eyebrow}</p>` : ''}
    <h3 class="card__title">${href ? html`<a href="${href}">${title}</a>` : title}</h3>
    ${summary ? html`<p class="card__summary">${inline(summary)}</p>` : ''}
    ${badges && badges.length ? html`<p class="card__badges">${badges.filter(Boolean).map((b) => pill(b.label ?? b, b.tone))}</p>` : ''}
    ${meta && meta.length ? html`<ul class="card__meta">${meta.filter(Boolean).map((m) => html`<li><span>${m.label}</span><strong>${m.value}</strong></li>`)}</ul>` : ''}
    ${footer || ''}
  `
  return html`<article class="card ${tone ? `card--${tone}` : ''}">${inner}</article>`
}

export function cardGrid (cards, { columns = 3, className = '' } = {}) {
  const arr = (cards || []).filter(Boolean)
  if (!arr.length) return raw('')
  return html`<div class="card-grid card-grid--${columns} ${className}">${arr}</div>`
}

export function linkGrid (links, { columns = 3 } = {}) {
  const arr = (links || []).filter(Boolean)
  if (!arr.length) return raw('')
  return html`
    <div class="link-grid link-grid--${columns}">
      ${arr.map((l) => html`
        <a class="link-tile" href="${l.href}">
          <span class="link-tile__title">${l.label}</span>
          ${l.summary ? html`<span class="link-tile__summary">${inline(l.summary)}</span>` : ''}
          <svg class="link-tile__chev" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m6 3 5 5-5 5"/></svg>
        </a>
      `)}
    </div>
  `
}

/* ------------------------------------------------------------------ *
 * Domain cards
 * ------------------------------------------------------------------ */

export function attractionCard (attraction) {
  const badges = [
    attraction.heightIn != null ? { label: `${attraction.heightIn}" min`, tone: 'height' } : { label: 'Any height', tone: 'good' },
    attraction.lightningLane !== 'none' ? { label: f.lightningLaneShort(attraction.lightningLane), tone: 'll' } : null,
    !attraction.isOpen ? { label: 'Closed', tone: 'closed' } : null,
    attraction.singleRider ? { label: 'Single rider', tone: '' } : null,
  ].filter(Boolean)
  return card({
    href: attraction.url,
    eyebrow: `${f.attractionType(attraction.type)}${attraction.landInfo ? ` · ${attraction.landInfo.name}` : ''}`,
    title: attraction.name,
    summary: attraction.summary,
    badges,
    meta: [
      attraction.durationMinutes != null ? { label: 'Length', value: f.duration(attraction.durationMinutes) } : null,
      attraction.intensity ? { label: 'Intensity', value: f.intensityLabel(attraction.intensity) } : null,
      attraction.scary && attraction.scary.score ? { label: 'Scare factor', value: `${attraction.scary.score}/5` } : null,
    ].filter(Boolean),
  })
}

export function diningCard (restaurant) {
  return card({
    href: restaurant.url,
    eyebrow: `${f.service(restaurant.service)}${restaurant.landInfo ? ` · ${restaurant.landInfo.name}` : ''}`,
    title: restaurant.name,
    summary: restaurant.summary,
    badges: [
      { label: restaurant.priceTier, tone: 'price' },
      restaurant.mobileOrder ? { label: 'Mobile order', tone: 'good' } : null,
      restaurant.characterDining ? { label: 'Character dining', tone: '' } : null,
      restaurant.reservations === 'essential' ? { label: 'Book ahead', tone: 'warn' } : null,
    ].filter(Boolean),
    meta: [
      { label: 'Cuisine', value: restaurant.cuisine },
      { label: 'Reservations', value: f.reservations(restaurant.reservations) },
    ],
  })
}

/**
 * A food card. When `tracker` is true it renders the three-state control the Food Tracker binds to.
 * The control is a real button group so it works without JS for reading, and the JS layer only adds
 * persistence.
 */
export function foodCard (item, { tracker = false, showPark = false } = {}) {
  return html`
    <article class="food-card" data-food-id="${item.id}" data-park="${item.parkSlug || ''}" data-category="${item.category}" data-price="${item.price ?? ''}" data-musttry="${item.mustTry || 0}" data-diet="${(item.dietaryTags || []).join(' ')}">
      <div class="food-card__head">
        <div>
          <h3 class="food-card__name">${item.name}</h3>
          <p class="food-card__where">
            ${item.restaurantInfo && item.restaurantInfo.hasPage
              ? html`<a href="${item.restaurantInfo.url}">${item.restaurant}</a>`
              : item.restaurant}
            ${showPark && item.parkName ? html`<span class="food-card__park">${item.parkName}</span>` : ''}
          </p>
        </div>
        <span class="food-card__price">${f.price(item.price)}</span>
      </div>
      <p class="food-card__desc">${inline(item.description)}</p>
      ${item.verdict ? html`<p class="food-card__verdict"><strong>Our take:</strong> ${inline(item.verdict)}</p>` : ''}
      <p class="food-card__tags">
        ${item.mustTry >= 4 ? pill(f.mustTryLabel(item.mustTry), 'must') : ''}
        ${pill(f.foodCategory(item.category))}
        ${(item.dietaryTags || []).map((t) => pill(f.diet(t), 'diet'))}
        ${item.portable ? pill('Walkable') : ''}
      </p>
      ${tracker ? html`
        <div class="tracker" role="group" aria-label="Track ${escapeHtml(item.name)}">
          <button type="button" data-track="want" aria-pressed="false"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14s-6-3.7-6-7.7A3.3 3.3 0 0 1 8 4.4a3.3 3.3 0 0 1 6 1.9C14 10.3 8 14 8 14Z"/></svg>Want</button>
          <button type="button" data-track="tried" aria-pressed="false"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8.5 6 12l8-8"/></svg>Tried</button>
          <button type="button" data-track="skip" aria-pressed="false"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>Skip</button>
        </div>` : ''}
    </article>
  `
}

/* ------------------------------------------------------------------ *
 * Attraction detail blocks (reused on the ride list and land pages)
 * ------------------------------------------------------------------ */

export function attractionInline (attraction) {
  return html`
    <article class="inline-attraction" id="${attraction.slug}">
      <div class="inline-attraction__head">
        <h3>${attraction.hasPage ? html`<a href="${attraction.url}">${attraction.name}</a>` : attraction.name}</h3>
        ${heightBadge(attraction.heightIn)}
      </div>
      <p class="inline-attraction__meta">
        ${f.attractionType(attraction.type)}
        ${attraction.durationMinutes != null ? html` · ${f.duration(attraction.durationMinutes)}` : ''}
        ${attraction.lightningLane !== 'none' ? html` · ${f.lightningLaneShort(attraction.lightningLane)}` : ''}
        ${!attraction.isOpen ? html` · <strong class="is-closed">Closed</strong>` : ''}
      </p>
      <p class="inline-attraction__summary">${inline(attraction.summary)}</p>
      ${attraction.description && attraction.description.length
        ? html`<div class="inline-attraction__body">${paragraphs(attraction.description.slice(0, 1))}</div>` : ''}
      ${attraction.tips && attraction.tips.length ? html`
        <details class="inline-attraction__tips">
          <summary>Tips for ${attraction.name}</summary>
          ${bulletList(attraction.tips)}
        </details>` : ''}
      ${attraction.hasPage ? html`<p class="inline-attraction__more"><a href="${attraction.url}">Full guide to ${attraction.name} →</a></p>` : ''}
    </article>
  `
}

/* ------------------------------------------------------------------ *
 * Guide / comparison section renderer
 * ------------------------------------------------------------------ */

export function renderSections (sections) {
  const arr = (sections || []).filter(Boolean)
  if (!arr.length) return raw('')
  return each(arr, (s) => html`
    <section class="doc-section" id="${s.id}">
      <h2>${inline(s.heading)}</h2>
      ${paragraphs(s.body)}
      ${s.list ? bulletList(s.list.items, { style: s.list.style }) : ''}
      ${s.table ? dataTable({ caption: s.table.caption, columns: s.table.columns, rows: s.table.rows }) : ''}
      ${s.callout ? callout(s.callout) : ''}
    </section>
  `)
}

export function tableOfContents (sections, { title = 'On this page' } = {}) {
  const arr = (sections || []).filter((s) => s && s.id && s.heading)
  if (arr.length < 3) return raw('')
  return html`
    <nav class="toc" aria-label="${title}">
      <p class="toc__title">${title}</p>
      <ol>${arr.map((s) => html`<li><a href="#${s.id}">${inline(s.heading)}</a></li>`)}</ol>
    </nav>
  `
}

/* ------------------------------------------------------------------ *
 * Monetization — FTC disclosure always renders ABOVE the link
 * ------------------------------------------------------------------ */

export function affiliateBox (site, { kind = 'tickets', heading, body }) {
  const partner = site.affiliates[kind]
  if (!partner) return raw('')
  return html`
    <aside class="affiliate">
      <p class="affiliate__disclosure">${site.legal.affiliateDisclosure}</p>
      <div class="affiliate__body">
        <h3>${heading || 'Where we buy tickets'}</h3>
        <p>${inline(body || partner.note)}</p>
        <a class="btn btn--primary" href="${partner.href}" rel="${partner.rel}">${partner.label}</a>
      </div>
    </aside>
  `
}

export function relatedLinks (links, { title = 'Keep reading' } = {}) {
  const arr = (links || []).filter(Boolean)
  if (!arr.length) return raw('')
  return html`
    <section class="band band--tint">
      <div class="shell">
        <h2 class="related__title">${title}</h2>
        ${linkGrid(arr, { columns: arr.length >= 4 ? 4 : 3 })}
      </div>
    </section>
  `
}

/** Site-2 handoff. One canonical owner per topic; we link, never duplicate. */
export function seasonalHandoff (topic) {
  return callout({
    type: 'note',
    title: 'Looking for what is on right now?',
    body: `This page covers the permanent, year-round version of ${topic}. Seasonal overlays, festival menus, party nights, and today's Lightning Lane prices change constantly, so we keep them off this page on purpose — check the park's official site or app for live details before you go.`,
  })
}

export { f as format, truncate }
