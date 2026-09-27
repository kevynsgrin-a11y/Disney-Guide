// These resort slugs are the locations used by the three US park guides.
// A missing slug deliberately leaves the build's static date label in place.
const ZONE_BY_RESORT = Object.freeze({
  'walt-disney-world': 'America/New_York',
  disneyland: 'America/Los_Angeles',
  'universal-orlando': 'America/New_York',
  'universal-hollywood': 'America/Los_Angeles',
  'southern-california': 'America/Los_Angeles',
  orlando: 'America/New_York',
  texas: 'America/Chicago',
  'new-jersey': 'America/New_York',
  chicago: 'America/Chicago',
})

const ZONE_ORDER = ['America/New_York', 'America/Chicago', 'America/Los_Angeles']

export function parkTimeZone (resort) { return ZONE_BY_RESORT[resort] || '' }

// When a band contains parks in multiple US zones, keep it until the last park's
// local calendar day is over. Unknown locations fail open instead of hiding content early.
export function latestParkTimeZone (events) {
  if (!events.length) return ''
  const zones = events.map((event) => parkTimeZone(event.resort))
  if (zones.some((zone) => !zone)) return ''
  return zones.sort((a, b) => ZONE_ORDER.indexOf(a) - ZONE_ORDER.indexOf(b)).at(-1)
}
