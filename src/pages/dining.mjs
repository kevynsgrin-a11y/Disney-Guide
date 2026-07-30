import { html, raw, paragraphs, inline } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as S from '../lib/schema.mjs'
import { urls } from '../lib/data.mjs'
import * as f from '../lib/format.mjs'

const crumbs = (park, ...rest) => [...park.breadcrumbTrail, ...rest]

/* ------------------------------------------------------------------ *
 * Dining hub
 * ------------------------------------------------------------------ */

export function diningHub (park, data) {
  const { site } = data
  const trail = crumbs(park, { label: 'Dining', href: urls.dining(park) })

  const byService = {}
  for (const restaurant of park.dining) {
    (byService[restaurant.service] = byService[restaurant.service] || []).push(restaurant)
  }
  const serviceOrder = ['table-service', 'quick-service', 'lounge', 'bakery', 'snack-cart', 'food-truck']
  const groups = serviceOrder.filter((key) => byService[key] && byService[key].length)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: park.name,
      title: `Where to eat at ${park.name}`,
      lede: `All ${park.dining.length} places to eat in the park, with an honest verdict on each. We tell you which reservations are worth the 60-day scramble and which are a waste of a meal.`,
      tone: 'compact',
      meta: [
        { label: 'Places to eat', value: String(park.dining.length) },
        { label: 'Table service', value: String((byService['table-service'] || []).length) },
        { label: 'Quick service', value: String((byService['quick-service'] || []).length) },
        { label: 'Tracked snacks', value: String(park.food.length) },
      ],
      actions: [{ href: urls.snacks(park), label: `Best snacks at ${park.shortName || park.name}`, primary: true }],
    })}

    ${C.section({
      children: html`
        ${C.dataTable({
          sortable: true,
          className: 'data-table--stack',
          caption: 'Every dining location in the park. Sort by price, service style, or land.',
          columns: ['Restaurant', 'Land', 'Service', 'Cuisine', { label: 'Price', align: 'center' }, 'Reservations'],
          rows: park.dining.map((d) => [
            d.hasPage ? html`<a href="${d.url}">${d.name}</a>` : d.name,
            d.landInfo ? html`<a href="${d.landInfo.url}">${d.landInfo.name}</a>` : '—',
            f.service(d.service),
            d.cuisine,
            html`<span data-value="${(d.priceTier || '').length}">${d.priceTier}</span>`,
            f.reservations(d.reservations),
          ]),
        })}
        ${C.lastVerified(park.lastVerified)}
      `,
    })}

    ${groups.map((key) => C.section({
      tone: key === 'quick-service' ? 'tint' : '',
      id: key,
      title: f.service(key),
      kicker: `${byService[key].length} in this park`,
      children: C.cardGrid(byService[key].map(C.diningCard), { columns: 3 }),
    }))}

    ${C.section({
      tone: 'tint',
      title: 'How we handle menus and prices',
      children: html`
        <div class="prose">
          <p>We do not mirror full live menus. Disney changes hundreds of menu items across its US resorts in a single month, and any site claiming a complete live menu database is either doing enormous manual work or is quietly out of date.</p>
          <p>What we maintain instead is the part that stays true: what each restaurant is, how it is served, who it suits, whether the reservation is worth chasing, and a curated set of signature items with prices we have actually checked and dated. Every price on this site carries the month it was verified. If that month is old, treat the number as a guide and not a promise.</p>
        </div>
        ${C.callout({
          type: 'note',
          title: 'Festival and seasonal menus are deliberately not here',
          body: 'Festival booths, holiday menus, and limited-run items change every few weeks. Putting them on an evergreen page just creates something that is wrong most of the year. Check the park app for what is running during your dates.',
        })}
      `,
    })}

    ${C.relatedLinks([
      { href: urls.snacks(park), label: `Best snacks at ${park.shortName || park.name}`, summary: 'Ranked, priced, trackable' },
      { href: urls.foodTracker(), label: 'Food Tracker', summary: 'Build a list that saves offline' },
      { href: urls.guide('mobile-order-and-dining'), label: 'Mobile order & reservations', summary: 'How to actually get a table' },
      { href: urls.compare('best-disney-park-for-food'), label: 'Best park for food', summary: 'We settle it' },
    ])}
  `

  return {
    url: urls.dining(park),
    html: renderPage({
      site,
      page: {
        url: urls.dining(park),
        title: `${park.shortName || park.name} dining: every restaurant, honestly`,
        description: `All ${park.dining.length} places to eat at ${park.name}, with service style, price tier, reservation advice, and a candid verdict on each.`,
        trail,
        modified: `${park.lastVerified || '2026-07'}-01`,
      },
      body,
      schema: [S.itemList(site, { url: urls.dining(park), name: `${park.name} restaurants`, items: park.dining })],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Restaurant detail
 * ------------------------------------------------------------------ */

export function restaurantPage (restaurant, data) {
  const { site } = data
  const park = restaurant.park
  const trail = crumbs(park,
    { label: 'Dining', href: urls.dining(park) },
    { label: restaurant.name, href: restaurant.url })

  const linkedFood = park.food.filter((item) => item.restaurantSlug === restaurant.slug)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: `${park.name}${restaurant.landInfo ? ` · ${restaurant.landInfo.name}` : ''}`,
      title: restaurant.name,
      lede: restaurant.summary,
      meta: [
        { label: 'Service', value: f.service(restaurant.service) },
        { label: 'Price', value: restaurant.priceTier },
        { label: 'Cuisine', value: restaurant.cuisine },
        { label: 'Reservations', value: f.reservations(restaurant.reservations) },
      ],
      aside: html`
        ${C.factPanel([
          { label: 'Meals', value: (restaurant.mealPeriods || []).map(f.unslug).join(', ') },
          restaurant.priceNote ? { label: 'Typical cost', value: restaurant.priceNote, hint: restaurant.priceVerified ? `Verified ${f.humanDate(restaurant.priceVerified)}` : null } : null,
          { label: 'Mobile order', value: restaurant.mobileOrder ? 'Yes' : 'No' },
          { label: 'Dining plan', value: restaurant.diningPlan ? 'Accepted' : 'Not accepted' },
          { label: 'Alcohol', value: restaurant.alcohol ? 'Served' : 'Not served' },
          { label: 'Air conditioned', value: restaurant.airConditioned ? 'Yes' : 'No' },
          restaurant.characterDining ? { label: 'Character dining', value: 'Yes' } : null,
          (restaurant.dietary || []).length ? { label: 'Dietary', value: restaurant.dietary.map(f.diet).join(', ') } : null,
        ].filter(Boolean), { title: 'The facts', columns: 1 })}
        ${C.lastVerified(restaurant.lastVerified)}
      `,
    })}

    ${C.section({
      children: html`
        <div class="split">
          <div>
            <div class="doc-section">
              <h2>What it is</h2>
              ${paragraphs(restaurant.description)}
            </div>

            ${restaurant.verdict ? html`
              <div class="verdict-box">
                <h2>Our verdict</h2>
                <p class="verdict-box__short">${inline(restaurant.verdict)}</p>
              </div>` : ''}

            ${restaurant.signatureItems && restaurant.signatureItems.length ? html`
              <div class="doc-section">
                <h2>What to order</h2>
                <p>The dishes this kitchen is actually known for. Menus change seasonally, so treat this as what to look for rather than a guaranteed list.</p>
                ${C.bulletList(restaurant.signatureItems)}
              </div>` : ''}

            ${C.tipList(restaurant.tips, { title: `Tips for ${restaurant.name}` })}
          </div>
          <div class="split__aside">
            ${(restaurant.goodFor || []).length ? C.factPanel([
              { label: 'Good for', value: restaurant.goodFor.map(f.titleize).join(' · ') },
            ], { title: 'Who it suits', columns: 1 }) : ''}
            ${restaurant.reservations === 'essential' ? C.callout({
              type: 'warning',
              title: 'Book this one early',
              body: 'This is one of the reservations that disappears the moment the booking window opens. If it matters to your trip, set an alarm for the window and book it before anything else. Our [dining guide](/guides/mobile-order-and-dining/) covers the timing.',
            }) : ''}
            ${restaurant.landInfo ? C.linkGrid([
              { href: restaurant.landInfo.url, label: `More in ${restaurant.landInfo.name}` },
              { href: urls.dining(park), label: `All ${park.shortName || park.name} dining` },
              { href: urls.snacks(park), label: 'Best snacks in this park' },
            ], { columns: 1 }) : ''}
          </div>
        </div>
      `,
    })}

    ${linkedFood.length ? C.section({
      tone: 'tint',
      title: `Tracked items from ${restaurant.name}`,
      intro: 'Prices we have checked ourselves, with the month we checked them. Mark anything here and it saves to your device.',
      children: html`<div class="food-grid">${linkedFood.map((item) => C.foodCard(item, { tracker: true }))}</div>`,
    }) : ''}

    ${C.faqSection(restaurant.faqs, { title: `${restaurant.name}: common questions` })}

    ${C.relatedLinks([
      { href: urls.dining(park), label: `All ${park.shortName || park.name} dining`, summary: 'Every option, compared' },
      { href: urls.foodTracker(), label: 'Food Tracker', summary: 'Plan what you will eat' },
      { href: urls.guide('mobile-order-and-dining'), label: 'Reservations & mobile order', summary: 'How to get a table' },
      { href: urls.compare('best-disney-park-for-food'), label: 'Best park for food', summary: 'The verdict' },
    ])}
  `

  return {
    url: restaurant.url,
    html: renderPage({
      site,
      page: {
        url: restaurant.url,
        title: `${restaurant.name} (${park.shortName || park.name}): worth it?`,
        description: C.truncate(`${restaurant.summary} ${restaurant.verdict || ''}`, 155),
        trail,
        modified: `${restaurant.lastVerified || '2026-07'}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        S.restaurant(site, restaurant),
        S.menu(site, restaurant, linkedFood),
        S.faqPage(site, { url: restaurant.url, faqs: restaurant.faqs }),
      ].filter(Boolean),
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Best snacks
 * ------------------------------------------------------------------ */

export function snacksPage (park, data) {
  const { site } = data
  const trail = crumbs(park, { label: 'Best snacks', href: urls.snacks(park) })
  const items = park.topFood
  const priced = items.filter((i) => i.price != null)
  const avg = priced.length ? priced.reduce((n, i) => n + i.price, 0) / priced.length : null
  const cheapest = priced.slice().sort((a, b) => a.price - b.price)[0]
  const mustTry = items.filter((i) => i.mustTry >= 4)
  const categories = [...new Set(items.map((i) => i.category))]
  const diets = [...new Set(items.flatMap((i) => i.dietaryTags || []))]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: park.name,
      title: `The best snacks at ${park.name}`,
      lede: `${items.length} items, every one with a price we checked and a verdict we mean. Mark them want, tried, or skip — it saves on your device and prints as a checklist.`,
      tone: 'compact',
      meta: [
        { label: 'Items tracked', value: String(items.length) },
        avg ? { label: 'Average price', value: f.price(Math.round(avg * 100) / 100) } : null,
        cheapest ? { label: 'Cheapest', value: `${f.price(cheapest.price)} · ${cheapest.name}` } : null,
        { label: 'Do-not-miss', value: String(mustTry.length) },
      ].filter(Boolean),
      actions: [
        { href: urls.foodTracker(), label: 'Open the full Food Tracker', primary: true },
        { href: urls.dining(park), label: 'Full dining guide' },
      ],
    })}

    ${C.section({
      children: html`
        <div class="filter-bar" data-print-hide>
          <label for="snack-search">Filter</label>
          <span class="field-inline">
            <input id="snack-search" type="search" data-filter="query" placeholder="Search these snacks…" autocomplete="off">
          </span>
          ${categories.map((cat) => html`<button class="chip" type="button" data-filter="category" data-value="${cat}" aria-pressed="false">${f.foodCategory(cat)}</button>`)}
          ${diets.map((d) => html`<button class="chip" type="button" data-filter="diet" data-value="${d}" aria-pressed="false">${f.diet(d)}</button>`)}
          <button class="chip" type="button" data-filter="status" data-value="unset" aria-pressed="false">Not yet marked</button>
        </div>
        <p class="small muted" data-print-hide role="status"><span data-shown-count>${items.length}</span> shown · <span data-count="tried">0</span> tried · <span data-count="want">0</span> on your list</p>
        <div class="food-grid">
          ${items.map((item) => C.foodCard(item, { tracker: true }))}
        </div>
        <div class="empty-state" data-empty-state hidden>
          <h3>Nothing matches those filters</h3>
          <p>Clear a filter to see the rest of the list.</p>
        </div>
        ${C.lastVerified(park.lastVerified, 'Prices verified')}
      `,
    })}

    ${mustTry.length ? C.section({
      tone: 'tint',
      title: 'If you only eat a few things here',
      intro: 'Ranked by how much we would rearrange a day to get one.',
      children: html`
        ${C.dataTable({
          className: 'data-table--stack',
          columns: ['Item', 'Where', { label: 'Price', align: 'num', sort: 'number' }, 'Why'],
          rows: mustTry.slice(0, 12).map((item) => [
            item.name,
            item.restaurantInfo && item.restaurantInfo.hasPage
              ? html`<a href="${item.restaurantInfo.url}">${item.restaurant}</a>`
              : item.restaurant,
            html`<span data-value="${item.price ?? 0}">${f.price(item.price)}</span>`,
            item.verdict,
          ]),
        })}
      `,
    }) : ''}

    ${C.section({
      title: 'A note on prices',
      children: html`
        <div class="prose">
          <p>Snack prices at both resorts move once or twice a year, usually upward, and often without announcement. Every price here carries the month we last checked it. Where two sources disagreed we went with the one we could verify most recently, and we would rather show you a dated number than a confidently wrong one.</p>
          <p>If you spot something that has changed, that is genuinely useful to us — corrections make this dataset better for everyone using it.</p>
        </div>
      `,
    })}

    ${C.relatedLinks([
      { href: urls.foodTracker(), label: 'Food Tracker', summary: 'All six parks in one list' },
      { href: urls.dining(park), label: `${park.shortName || park.name} dining`, summary: 'Restaurants, not snacks' },
      { href: urls.compare('best-disney-park-for-food'), label: 'Best park for food', summary: 'Where this park lands' },
      { href: urls.map(park), label: 'Park map', summary: 'Find these on the ground' },
    ])}
  `

  return {
    url: urls.snacks(park),
    html: renderPage({
      site,
      page: {
        url: urls.snacks(park),
        title: `Best snacks at ${park.shortName || park.name} (with prices)`,
        description: `${items.length} snacks at ${park.name} with checked prices and honest verdicts — including the ones we think are overrated. Track what you want to try.`,
        trail,
        modified: `${park.lastVerified || '2026-07'}-01`,
      },
      body,
      scripts: ['/assets/js/food-tracker.js'],
      schema: [S.itemList(site, { url: urls.snacks(park), name: `Best snacks at ${park.name}`, items: items.slice(0, 30) })],
    }),
  }
}
