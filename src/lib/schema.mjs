/**
 * JSON-LD builders.
 *
 * Deliberate choices, per the 2026 rich-result landscape:
 *   - BreadcrumbList  — still an active rich result. Emitted on every page. Highest ROI here.
 *   - ItemList        — supports list/carousel treatments on ride and food lists.
 *   - TouristAttraction / Restaurant / Place — no direct SERP lift, but cheap and it is what
 *     entity-extraction and AI answer surfaces actually read. Worth keeping.
 *   - FAQPage         — Google retired the rich result in May 2026. The markup is still valid and
 *     harmless, and it remains useful for entity clarity, so we emit it where FAQs exist. We do not
 *     count on it for SERP real estate, and no page is designed around it.
 *   - HowTo           — retired. Never emitted.
 */

import { plain, truncate } from './html.mjs'
import { isoDuration } from './format.mjs'

/** Drop null/undefined/empty values so the emitted JSON stays tight. */
function clean (obj) {
  if (Array.isArray(obj)) {
    const arr = obj.map(clean).filter((v) => v != null)
    return arr.length ? arr : undefined
  }
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const [key, value] of Object.entries(obj)) {
      const cleaned = clean(value)
      if (cleaned != null && cleaned !== '') out[key] = cleaned
    }
    return Object.keys(out).length ? out : undefined
  }
  return obj
}

export function serialize (nodes) {
  const graph = (Array.isArray(nodes) ? nodes : [nodes]).map(clean).filter(Boolean)
  if (!graph.length) return ''
  const payload = graph.length === 1
    ? { '@context': 'https://schema.org', ...graph[0] }
    : { '@context': 'https://schema.org', '@graph': graph }
  // `<` cannot appear unescaped inside a script element.
  return JSON.stringify(payload).replace(/</g, '\\u003c')
}

const abs = (site, path) => `${site.brand.origin}${path}`

export function organization (site) {
  return {
    '@type': 'Organization',
    '@id': abs(site, '/#organization'),
    name: site.brand.name,
    url: abs(site, '/'),
    description: site.brand.tagline,
    foundingDate: String(site.brand.founded),
    disambiguatingDescription: site.legal.shortDisclaimer,
  }
}

export function website (site) {
  return {
    '@type': 'WebSite',
    '@id': abs(site, '/#website'),
    name: site.brand.name,
    url: abs(site, '/'),
    inLanguage: site.brand.locale,
    description: site.meta.defaultDescription,
    publisher: { '@id': abs(site, '/#organization') },
  }
}

export function breadcrumbs (site, trail) {
  if (!trail || trail.length < 2) return null
  const url = trail[trail.length - 1].href
  return {
    '@type': 'BreadcrumbList',
    '@id': abs(site, url) + '#breadcrumb',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: abs(site, crumb.href),
    })),
  }
}

export function webPage (site, { url, title, description, trail, modified }) {
  return {
    '@type': 'WebPage',
    '@id': abs(site, url) + '#webpage',
    url: abs(site, url),
    name: title,
    description: truncate(description, 300),
    isPartOf: { '@id': abs(site, '/#website') },
    inLanguage: site.brand.locale,
    dateModified: modified,
    breadcrumb: trail && trail.length > 1 ? { '@id': abs(site, url) + '#breadcrumb' } : undefined,
  }
}

export function place (site, park) {
  return {
    '@type': ['TouristAttraction', 'AmusementPark'],
    '@id': abs(site, park.url) + '#park',
    name: park.name,
    url: abs(site, park.url),
    description: truncate(park.summary, 300),
    address: { '@type': 'PostalAddress', addressLocality: park.location },
    geo: park.coordinates
      ? { '@type': 'GeoCoordinates', latitude: park.coordinates.lat, longitude: park.coordinates.lng }
      : undefined,
    isAccessibleForFree: false,
    publicAccess: true,
  }
}

export function touristAttraction (site, attraction) {
  const park = attraction.park
  const audience = attraction.heightIn
    ? { '@type': 'PeopleAudience', requiredMinAge: undefined, suggestedMinAge: undefined }
    : undefined
  return {
    '@type': 'TouristAttraction',
    '@id': abs(site, attraction.url) + '#attraction',
    name: attraction.name,
    url: abs(site, attraction.url),
    description: truncate(attraction.summary, 300),
    containedInPlace: { '@type': 'AmusementPark', name: park.name, url: abs(site, park.url) },
    geo: park.coordinates
      ? { '@type': 'GeoCoordinates', latitude: park.coordinates.lat, longitude: park.coordinates.lng }
      : undefined,
    isAccessibleForFree: false,
    publicAccess: true,
    audience,
    additionalProperty: clean([
      attraction.heightIn != null && {
        '@type': 'PropertyValue',
        name: 'Minimum height requirement',
        value: `${attraction.heightIn} inches`,
        unitCode: 'INH',
      },
      attraction.durationMinutes != null && {
        '@type': 'PropertyValue',
        name: 'Ride duration',
        value: isoDuration(attraction.durationMinutes),
      },
      attraction.opened && {
        '@type': 'PropertyValue', name: 'Opened', value: String(attraction.opened),
      },
    ].filter(Boolean)),
  }
}

const PRICE_RANGE = { $: '$', $$: '$$', $$$: '$$$', $$$$: '$$$$' }

export function restaurant (site, place_) {
  const park = place_.park
  return {
    '@type': 'Restaurant',
    '@id': abs(site, place_.url) + '#restaurant',
    name: place_.name,
    url: abs(site, place_.url),
    description: truncate(place_.summary, 300),
    servesCuisine: place_.cuisine,
    priceRange: PRICE_RANGE[place_.priceTier] || place_.priceTier,
    acceptsReservations: place_.reservations === 'not-accepted' ? 'False' : 'True',
    containedInPlace: { '@type': 'AmusementPark', name: park.name, url: abs(site, park.url) },
    address: { '@type': 'PostalAddress', addressLocality: park.location },
    geo: park.coordinates
      ? { '@type': 'GeoCoordinates', latitude: park.coordinates.lat, longitude: park.coordinates.lng }
      : undefined,
  }
}

/** A Menu node built from the curated must-try items tied to a restaurant. */
export function menu (site, place_, items) {
  if (!items || !items.length) return null
  return {
    '@type': 'Menu',
    '@id': abs(site, place_.url) + '#menu',
    name: `Signature items at ${place_.name}`,
    hasMenuSection: [{
      '@type': 'MenuSection',
      name: 'Reader favourites',
      hasMenuItem: items.map((item) => ({
        '@type': 'MenuItem',
        name: item.name,
        description: truncate(item.description, 220),
        suitableForDiet: (item.dietaryTags || []).map(dietUri).filter(Boolean),
        offers: item.price != null
          ? { '@type': 'Offer', price: item.price.toFixed(2), priceCurrency: 'USD' }
          : undefined,
      })),
    }],
  }
}

function dietUri (tag) {
  const map = {
    vegan: 'https://schema.org/VeganDiet',
    vegetarian: 'https://schema.org/VegetarianDiet',
    'gluten-free': 'https://schema.org/GlutenFreeDiet',
  }
  return map[tag]
}

export function itemList (site, { url, name, items }) {
  if (!items || !items.length) return null
  return {
    '@type': 'ItemList',
    '@id': abs(site, url) + '#list',
    name,
    numberOfItems: items.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: items.slice(0, 100).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: item.url ? abs(site, item.url) : undefined,
    })),
  }
}

/**
 * FAQPage. Emitted for entity clarity only — Google retired the FAQ rich result in May 2026,
 * so nothing on this site is designed around winning one.
 */
export function faqPage (site, { url, faqs }) {
  if (!faqs || !faqs.length) return null
  return {
    '@type': 'FAQPage',
    '@id': abs(site, url) + '#faq',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: plain(faq.q),
      acceptedAnswer: { '@type': 'Answer', text: plain(faq.a) },
    })),
  }
}

export function article (site, { url, title, description, modified, section }) {
  return {
    '@type': 'Article',
    '@id': abs(site, url) + '#article',
    headline: truncate(title, 110),
    description: truncate(description, 300),
    url: abs(site, url),
    dateModified: modified,
    articleSection: section,
    inLanguage: site.brand.locale,
    author: { '@type': 'Organization', name: site.author.name, url: abs(site, site.author.url) },
    publisher: { '@id': abs(site, '/#organization') },
    isPartOf: { '@id': abs(site, '/#website') },
  }
}
