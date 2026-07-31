/**
 * JSON-LD for the dated pages.
 *
 * ./schema.mjs explains the 2026 rich-result landscape; this module only covers what dated content
 * adds. One choice dominates it:
 *
 *   **We emit an `Event` node only when we hold confirmed dates.**
 *
 * Google's Event rich result requires `startDate`, and an `Event` without one is either ignored or,
 * worse, filled in with a guess. Every competing seasonal page solves this by asserting dates it
 * does not have. We will not, so a pattern page whose confidence is `expected` or `historical`
 * publishes as an `Article` about a recurring event rather than as the event itself, and only a
 * confirmed edition gets the full node.
 *
 * That costs us rich results on roughly half the event pages for part of each year. It is the right
 * trade: the alternative is structured data that says something we cannot stand behind, and a
 * structured-data penalty is far more expensive than a missing one.
 *
 * The second choice: `offers` is dropped from any node whose page has gone stale. A price is the
 * fastest-decaying fact on this site and the one a search surface is most likely to quote back.
 */

import { truncate, plain } from './html.mjs'

const abs = (site, path) => `${site.brand.origin}${path}`

const STATUS = {
  announced: 'https://schema.org/EventScheduled',
  expected: 'https://schema.org/EventScheduled',
  past: 'https://schema.org/EventScheduled',
  cancelled: 'https://schema.org/EventCancelled',
}

const TYPE_BY_CATEGORY = {
  'hard-ticket': ['Event', 'SocialEvent'],
  festival: ['Event', 'Festival'],
  overlay: ['Event'],
  'after-hours': ['Event', 'SocialEvent'],
  run: ['Event', 'SportsEvent'],
}

/**
 * The full Event node. Returns null unless the edition is genuinely confirmed — callers should treat
 * null as "fall back to `seasonalArticle`" rather than as an error.
 */
export function event (site, ev, edition, { stale = false } = {}) {
  if (!edition || edition.status !== 'announced') return null
  if (!edition.startDate || !edition.endDate) return null

  const location = ev.parkName
    ? {
        '@type': 'AmusementPark',
        name: ev.parkName,
        url: ev.parkUrl ? abs(site, ev.parkUrl) : undefined,
        address: { '@type': 'PostalAddress', addressLocality: ev.locality || undefined },
      }
    : {
        '@type': 'Place',
        name: ev.resortName || 'Disney Parks',
        address: { '@type': 'PostalAddress', addressLocality: ev.locality || undefined },
      }

  return {
    '@type': TYPE_BY_CATEGORY[ev.category] || 'Event',
    '@id': abs(site, ev.editionUrl || ev.url) + '#event',
    name: `${ev.name} ${edition.year}`,
    url: abs(site, ev.editionUrl || ev.url),
    description: truncate(plain(ev.summary), 300),
    startDate: edition.startDate,
    endDate: edition.endDate,
    eventStatus: STATUS[edition.status] || STATUS.announced,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location,
    isAccessibleForFree: ev.pricing && ev.pricing.model === 'included',
    organizer: undefined, // Deliberately absent: we are not the organiser and will not imply it.
    // Prices decay fastest and are the most likely thing to be quoted back at a reader, so a page
    // past its review date publishes no offer at all.
    offers: !stale && Array.isArray(edition.priceRangeUsd)
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: edition.priceRangeUsd[0],
          highPrice: edition.priceRangeUsd[1],
          availability: 'https://schema.org/LimitedAvailability',
        }
      : undefined,
  }
}

/**
 * The fallback for a pattern page: an article *about* a recurring event, which is what an
 * unconfirmed page honestly is.
 */
export function seasonalArticle (site, { url, title, description, modified, section }) {
  return {
    '@type': 'Article',
    '@id': abs(site, url) + '#article',
    headline: truncate(title, 110),
    description: truncate(plain(description), 300),
    url: abs(site, url),
    dateModified: modified,
    articleSection: section,
    inLanguage: site.brand.locale,
    author: { '@type': 'Organization', name: site.author.name, url: abs(site, site.author.url) },
    publisher: { '@id': abs(site, '/#organization') },
    isPartOf: { '@id': abs(site, '/#website') },
  }
}

/**
 * A price page's table as an ItemList of AggregateOffers.
 *
 * Every row is a range, never a point, because that is what the data contract permits — and because
 * a single figure would be wrong within weeks.
 */
export function priceList (site, { url, name, rows }, { stale = false } = {}) {
  const usable = (rows || []).filter((r) => Array.isArray(r.rangeUsd) && r.rangeUsd.length === 2)
  if (!usable.length || stale) return null
  return {
    '@type': 'ItemList',
    '@id': abs(site, url) + '#prices',
    name,
    numberOfItems: usable.length,
    itemListElement: usable.map((row, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: row.label,
      item: {
        '@type': 'AggregateOffer',
        name: row.label,
        priceCurrency: 'USD',
        lowPrice: row.rangeUsd[0],
        highPrice: row.rangeUsd[1],
        description: row.note ? truncate(plain(row.note), 200) : undefined,
      },
    })),
  }
}
