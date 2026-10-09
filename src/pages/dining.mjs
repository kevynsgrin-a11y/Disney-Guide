import { html, raw, paragraphs, inline } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as S from '../lib/schema.mjs'
import { urls } from '../lib/data.mjs'
import * as f from '../lib/format.mjs'

const crumbs = (park, ...rest) => [...park.breadcrumbTrail, ...rest]
const sourceBasedDining = (park, data) => park.slug === 'magic-mountain' && (data.operator === 'coasterguide' || data.site.operator === 'coasterguide')
const currentListing = (restaurant) => restaurant.listingStatus !== 'unverified'
const unknownBoolean = (value, yes, no) => value == null ? 'Unverified' : value ? yes : no

/* ------------------------------------------------------------------ *
 * Dining hub
 * ------------------------------------------------------------------ */

export function diningHub (park, data) {
  const { site } = data
  const sourceBased = sourceBasedDining(park, data)
  const listed = park.dining.filter(currentListing)
  const trail = crumbs(park, { label: 'Dining', href: urls.dining(park) })

  const byService = {}
  for (const restaurant of park.dining) {
    (byService[restaurant.service] = byService[restaurant.service] || []).push(restaurant)
  }
  // Preferred order first, then anything else the data uses. A service value that fell outside the
  // list would otherwise vanish from the card sections while still showing in the table above —
  // a silent omission rather than a visible error.
  const serviceOrder = ['table-service', 'quick-service', 'lounge', 'bakery', 'snack-cart', 'food-truck']
  const groups = [
    ...serviceOrder.filter((key) => byService[key] && byService[key].length),
    ...Object.keys(byService).filter((key) => !serviceOrder.includes(key)).sort(),
  ]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: park.name,
      title: `Where to eat at ${park.name}`,
      lede: sourceBased
        ? `${park.dining.length} dining records covered by this guide: ${listed.length} source-listed venues and ${park.dining.length - listed.length} unverified legacy records. This is a selected catalog, not the park’s complete dining inventory. These are pre-visit source descriptions; taste and value have not been reviewed firsthand.`
        : `All ${park.dining.length} places to eat in the park, with an honest verdict on each.${byService['table-service']?.length ? ' We tell you which reservations are worth the 60-day scramble and which are a waste of a meal.' : ''}`,
      tone: 'compact',
      meta: [
        { label: sourceBased ? 'Dining records covered' : 'Places to eat', value: String(park.dining.length) },
        { label: 'Table service', value: String((byService['table-service'] || []).length) },
        { label: 'Quick service', value: String((byService['quick-service'] || []).length) },
        { label: 'Tracked snacks', value: String(park.food.length) },
      ],
      actions: [{ href: urls.snacks(park), label: `Best snacks at ${park.shortLabel}`, primary: true }],
    })}

    ${C.section({
      children: html`
        ${C.dataTable({
          sortable: true,
          className: 'data-table--stack',
          caption: sourceBased ? 'Dining records covered here, including clearly marked unverified legacy records. Current prices are unverified; check the official directory and park app for the full inventory.' : 'Every dining location in the park. Sort by price, service style, or land.',
          columns: ['Restaurant', 'Land', 'Service', 'Cuisine', { label: 'Price', align: 'center' }, 'Reservations'],
          rows: park.dining.map((d) => [
            html`${d.hasPage ? html`<a href="${d.url}">${d.name}</a>` : d.name}${sourceBased && !currentListing(d) ? ' · Legacy record; current venue unverified' : ''}`,
            sourceBased && !currentListing(d) ? 'Legacy location; unverified' : d.landInfo ? html`<a href="${d.landInfo.url}">${d.landInfo.name}</a>` : '—',
            f.service(d.service),
            d.cuisine,
            sourceBased && !d.priceVerified ? 'Price unverified' : html`<span data-value="${(d.priceTier || '').length}">${d.priceTier}</span>`,
            sourceBased && !currentListing(d) ? 'Unverified' : f.reservations(d.reservations),
          ]),
        })}
        ${sourceBased ? html`<p class="small muted">Official dining and Fright Fest sources checked October 9, 2026. Prices were not verified. <a href="https://www.sixflags.com/magicmountain/dining">Official dining directory</a> · <a href="https://www.sixflags.com/magicmountain/events/fright-fest">Fright Fest menus</a></p>` : C.lastVerified(park.lastVerified)}
      `,
    })}

    ${groups.map((key) => C.section({
      tone: key === 'quick-service' ? 'tint' : '',
      id: key,
      title: f.service(key),
      kicker: `${byService[key].length} ${sourceBased ? 'records covered' : 'in this park'}`,
      children: C.cardGrid(byService[key].map((restaurant) => C.diningCard(sourceBased ? { ...restaurant, priceTier: restaurant.priceVerified ? restaurant.priceTier : 'Price unverified' } : restaurant)), { columns: 3 }),
    }))}

    ${C.section({
      tone: 'tint',
      title: 'How we handle menus and prices',
      children: html`
        <div class="prose">
          ${sourceBased ? html`
            <p>These records cover selected venues rather than a complete menu or restaurant inventory. Two older venue names remain unverified and are labeled as legacy records; a differently named official venue is not assumed to be the same place.</p>
            <p>No current item prices were verified in this source check. A price shown as unverified is unknown, not free. Check current menu prices, dining-plan inclusions, taxes and fees before ordering.</p>
            <p>These are source-based planning descriptions, not tasting reviews. CoasterReady’s October 15, 2026 visit had not happened when this correction was prepared. No table-service restaurant is covered here, so there is no 60-day reservation recommendation for these records.</p>
            <p>Venue-level vegetarian or vegan labels do not establish the ingredients of every dish or allergy safety. Ask venue staff about ingredients, preparation and cross-contact. Unsupported gluten-free labels have been withdrawn.</p>
          ` : html`
            <p>We do not mirror full live menus. Check the park app and current venue menu for the available selection.</p>
            <p>Where a price has been checked, it carries the month of verification. An unverified price is unknown; an older dated price is a guide rather than a promise.</p>
          `}
        </div>
        ${C.callout({
          type: 'note',
          title: 'Festival and seasonal menus are deliberately not here',
          body: 'Festival booths, holiday menus, and limited-run items change every few weeks. Putting them on an evergreen page just creates something that is wrong most of the year. Check the park app for what is running during your dates.',
        })}
      `,
    })}

    ${C.relatedLinks([
      { href: urls.snacks(park), label: `Best snacks at ${park.shortLabel}`, summary: sourceBased ? 'Source-listed items; prices unverified' : 'Ranked, priced, trackable' },
      { href: urls.foodTracker(), label: 'Food Tracker', summary: 'Build a list that saves offline' },
      { href: data.link.dining, label: 'Mobile order & reservations', summary: 'How to actually get a table' },
      { href: data.link.bestForFood, label: 'Best park for food', summary: 'We settle it' },
    ])}
  `

  return {
    url: urls.dining(park),
    html: renderPage({
      site,
      page: {
        url: urls.dining(park),
        title: `${park.shortLabel} dining`,
        titleTail: sourceBased ? ': selected venue coverage' : ': every restaurant, honestly',
        description: sourceBased ? `${park.dining.length} dining records covered at ${park.name}, with source-listed venues and clearly marked legacy records. Current prices are unverified.` : `All ${park.dining.length} places to eat at ${park.name}, with service style, price tier, reservation advice, and a candid verdict on each.`,
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
  const sourceBased = sourceBasedDining(park, data)
  const unverifiedVenue = sourceBased && !currentListing(restaurant)
  const trail = crumbs(park,
    { label: 'Dining', href: urls.dining(park) },
    { label: restaurant.name, href: restaurant.url })

  const linkedFood = park.food.filter((item) => item.restaurantSlug === restaurant.slug)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: `${park.name}${unverifiedVenue ? ' · Legacy venue record' : restaurant.landInfo ? ` · ${restaurant.landInfo.name}` : ''}`,
      title: restaurant.name,
      lede: restaurant.summary,
      meta: [
        { label: 'Service', value: f.service(restaurant.service) },
        { label: 'Price', value: sourceBased && !restaurant.priceVerified ? 'Price unverified' : restaurant.priceTier },
        { label: 'Cuisine', value: restaurant.cuisine },
        { label: 'Reservations', value: unverifiedVenue ? 'Unverified' : f.reservations(restaurant.reservations) },
      ],
      aside: html`
        ${C.factPanel([
          { label: 'Meals', value: (restaurant.mealPeriods || []).map(f.unslug).join(', ') },
          restaurant.priceNote ? { label: sourceBased && !restaurant.priceVerified ? 'Price status' : 'Typical cost', value: restaurant.priceNote, hint: restaurant.priceVerified ? `Verified ${f.humanDate(restaurant.priceVerified)}` : null } : null,
          { label: 'Mobile order', value: unknownBoolean(restaurant.mobileOrder, 'Yes', 'No') },
          { label: 'Dining plan', value: unknownBoolean(restaurant.diningPlan, 'Accepted', 'Not accepted') },
          { label: 'Alcohol', value: unknownBoolean(restaurant.alcohol, 'Served', 'Not served') },
          { label: 'Air conditioned', value: unknownBoolean(restaurant.airConditioned, 'Yes', 'No') },
          restaurant.characterDining ? { label: 'Character dining', value: 'Yes' } : null,
          (restaurant.dietary || []).length ? { label: 'Dietary', value: restaurant.dietary.map(f.diet).join(', ') } : null,
        ].filter(Boolean), { title: 'The facts', columns: 1 })}
        ${sourceBased && restaurant.sourceNote ? html`<p class="small muted">${restaurant.sourceNote}</p>` : C.lastVerified(restaurant.lastVerified)}
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
                <h2>${sourceBased ? 'Planning note' : 'Our verdict'}</h2>
                <p class="verdict-box__short">${inline(restaurant.verdict)}</p>
              </div>` : ''}

            ${restaurant.signatureItems && restaurant.signatureItems.length ? html`
              <div class="doc-section">
                <h2>${sourceBased ? 'Source-listed items' : 'What to order'}</h2>
                <p>${sourceBased ? 'Items named in the checked official listing. Confirm the current menu and availability at the venue.' : 'The dishes this kitchen is actually known for. Menus change seasonally, so treat this as what to look for rather than a guaranteed list.'}</p>
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
              body: `This is one of the reservations that disappears the moment the booking window opens. If it matters to your trip, set an alarm for the window and book it before anything else.${data.link.dining ? ` Our [dining guide](${data.link.dining}) covers the timing.` : ''}`,
            }) : ''}
            ${restaurant.landInfo ? C.linkGrid([
              { href: restaurant.landInfo.url, label: `More in ${restaurant.landInfo.name}` },
              { href: urls.dining(park), label: sourceBased ? `${park.shortLabel} dining coverage` : `All ${park.shortLabel} dining` },
              { href: urls.snacks(park), label: 'Best snacks in this park' },
            ], { columns: 1 }) : ''}
          </div>
        </div>
      `,
    })}

    ${linkedFood.length ? C.section({
      tone: 'tint',
      title: `Tracked items from ${restaurant.name}`,
      intro: sourceBased ? 'Linked catalog items, with unknown prices labeled unverified. A legacy venue record does not establish current availability. Mark anything here and it saves to your device.' : 'Prices we have checked ourselves, with the month we checked them. Mark anything here and it saves to your device.',
      children: html`<div class="food-grid">${linkedFood.map((item) => C.foodCard(item, { tracker: true }))}</div>`,
    }) : ''}

    ${C.faqSection(restaurant.faqs, { title: `${restaurant.name}: common questions` })}

    ${C.relatedLinks([
      { href: urls.dining(park), label: sourceBased ? `${park.shortLabel} dining coverage` : `All ${park.shortLabel} dining`, summary: sourceBased ? 'Selected venues and legacy records' : 'Every option, compared' },
      { href: urls.foodTracker(), label: 'Food Tracker', summary: 'Plan what you will eat' },
      { href: data.link.dining, label: 'Reservations & mobile order', summary: 'How to get a table' },
      { href: data.link.bestForFood, label: 'Best park for food', summary: 'The verdict' },
    ])}
  `

  return {
    url: restaurant.url,
    html: renderPage({
      site,
      page: {
        url: restaurant.url,
        title: `${restaurant.name} (${park.shortLabel})`,
        titleTail: restaurant.metaTitleTail ?? ': is it worth it?',
        description: C.truncate(`${restaurant.summary} ${restaurant.verdict || ''}`, 155),
        trail,
        modified: `${restaurant.lastVerified || '2026-07'}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        (() => {
          const schema = S.restaurant(site, restaurant)
          if (sourceBased && !restaurant.priceVerified) delete schema.priceRange
          if (unverifiedVenue) delete schema.acceptsReservations
          return schema
        })(),
        unverifiedVenue ? null : S.menu(site, restaurant, linkedFood),
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
  const sourceBased = sourceBasedDining(park, data)
  const trail = crumbs(park, { label: 'Best snacks', href: urls.snacks(park) })
  const items = park.topFood
  const unverifiedItems = items.filter((item) => item.availabilityStatus === 'unverified')
  const priced = items.filter((i) => typeof i.price === 'number' && Number.isFinite(i.price) && i.price > 0)
  const avg = priced.length ? priced.reduce((n, i) => n + i.price, 0) / priced.length : null
  const cheapest = priced.slice().sort((a, b) => a.price - b.price)[0]
  const mustTry = items.filter((i) => i.mustTry >= 4)
  const categories = [...new Set(items.map((i) => i.category))]
  const diets = [...new Set(items.flatMap((i) => i.dietaryTags || []))]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: park.name,
      title: sourceBased ? `Snacks and meal items at ${park.name}` : `The best snacks at ${park.name}`,
      lede: sourceBased
        ? `${items.length} items covered by this guide${unverifiedItems.length ? `, including ${unverifiedItems.length} clearly marked unverified legacy ${unverifiedItems.length === 1 ? 'item' : 'items'}` : ''}. Current prices are unverified. These are source-based pre-visit descriptions, not firsthand tasting reviews. Mark them want, tried, or skip — it saves on your device and prints as a checklist.`
        : `${items.length} tracked items, with ${priced.length} dated prices and unverified prices clearly marked. Mark them want, tried, or skip — it saves on your device and prints as a checklist.`,
      tone: 'compact',
      meta: [
        { label: 'Items tracked', value: String(items.length) },
        avg ? { label: 'Average price', value: f.price(Math.round(avg * 100) / 100) } : null,
        cheapest ? { label: 'Cheapest', value: `${f.price(cheapest.price)} · ${cheapest.name}` } : null,
        sourceBased ? null : { label: 'Do-not-miss', value: String(mustTry.length) },
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
        ${sourceBased ? html`<p class="small muted">Official venue sources checked October 9, 2026. No item prices were verified. Check current menus and ask venue staff about allergens and cross-contact.</p>` : priced.length ? html`<p class="small muted">${priced.length} dated prices; check each item’s verification date. Other prices are unverified.</p>` : html`<p class="small muted">Item prices are unverified.</p>`}
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
            item.price == null ? 'Price unverified' : html`<span data-value="${item.price}">${f.price(item.price)}</span>`,
            item.verdict,
          ]),
        })}
      `,
    }) : ''}

    ${C.section({
      title: 'A note on prices',
      children: html`
        <div class="prose">
          <p>A price marked unverified is unknown, not free. Where an item has a checked price, its record carries the verification month. Check the current venue menu for prices, taxes, fees and dining-plan inclusions before ordering.</p>
          ${sourceBased ? html`<p>The official directory lists the funnel-cake, churro and turkey-leg venues used here. The legacy brisket plate remains unverified and is not a current meal recommendation. No tasting or portion-value review from the future October 15 visit is claimed.</p><p>Unsupported item-level dietary assurances have been withdrawn. Venue-level vegetarian or vegan labels do not establish allergy safety; ask staff about the specific item and cross-contact.</p>` : ''}
          <p>If you spot something that has changed, corrections help keep these records useful.</p>
        </div>
      `,
    })}

    ${C.relatedLinks([
      { href: urls.foodTracker(), label: 'Food Tracker', summary: `All ${data.parks.length} parks in one list` },
      { href: urls.dining(park), label: `${park.shortLabel} dining`, summary: 'Restaurants, not snacks' },
      { href: data.link.bestForFood, label: 'Best park for food', summary: 'Where this park lands' },
      { href: urls.map(park), label: 'Park map', summary: 'Find these on the ground' },
    ])}
  `

  return {
    url: urls.snacks(park),
    html: renderPage({
      site,
      page: {
        url: urls.snacks(park),
        title: `Best snacks at ${park.shortLabel}`,
        titleTail: sourceBased ? ': source-listed items, prices unverified' : priced.length ? ' (with dated prices)' : ' (prices unverified)',
        description: sourceBased ? `${items.length} snack and meal records covered at ${park.name}. Source-listed venues and a marked legacy item; prices and firsthand taste reviews are unverified.` : `${items.length} tracked snacks at ${park.name}, with dated prices where checked and unknown prices marked unverified. Track what you want to try.`,
        trail,
        modified: `${park.lastVerified || '2026-07'}-01`,
      },
      body,
      scripts: ['/assets/js/food-tracker.js'],
      schema: [S.itemList(site, { url: urls.snacks(park), name: `Best snacks at ${park.name}`, items: items.slice(0, 30) })],
    }),
  }
}
