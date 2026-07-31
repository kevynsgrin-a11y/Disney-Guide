/** Presentation-layer formatters. Pure functions, no I/O. */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

/** 44 -> "44in (112cm)" */
export function height (inches) {
  if (inches == null) return 'Any height'
  return `${inches}in (${Math.round(inches * 2.54)}cm)`
}

/** 44 -> "44 inches" — for prose and alt text. */
export function heightWords (inches) {
  if (inches == null) return 'no height requirement'
  return `${inches} inches`
}

/** 6.49 -> "$6.49"; 12 -> "$12"; null -> "—" */
export function price (value) {
  if (value == null || Number.isNaN(value)) return '—'
  const n = Number(value)
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
}

/** 2.5 -> "2½ min"; 12 -> "12 min" */
export function duration (minutes) {
  if (minutes == null) return '—'
  const n = Number(minutes)
  if (!Number.isFinite(n)) return '—'
  const whole = Math.floor(n)
  const frac = n - whole
  let fracLabel = ''
  if (frac >= 0.7) fracLabel = '¾'
  else if (frac >= 0.4) fracLabel = '½'
  else if (frac >= 0.2) fracLabel = '¼'
  if (!whole && fracLabel) return `${fracLabel} min`
  return `${whole}${fracLabel} min`
}

/** ISO 8601 duration for schema.org, e.g. 2.5 -> "PT2M30S" */
export function isoDuration (minutes) {
  if (minutes == null) return undefined
  const total = Math.round(Number(minutes) * 60)
  if (!Number.isFinite(total) || total <= 0) return undefined
  const m = Math.floor(total / 60)
  const s = total % 60
  return `PT${m ? `${m}M` : ''}${s ? `${s}S` : ''}` || undefined
}

/** "2026-07" -> "July 2026"; "1971-10-01" -> "October 1, 1971" */
export function humanDate (value) {
  if (!value) return ''
  const parts = String(value).split('-')
  const year = Number(parts[0])
  const month = MONTHS[Number(parts[1]) - 1]
  if (!month) return String(year || value)
  if (parts.length < 3) return `${month} ${year}`
  return `${month} ${Number(parts[2])}, ${year}`
}

/** Sentence-case a kebab-case slug: "table-service" -> "Table service" */
export function unslug (slug) {
  if (!slug) return ''
  const words = String(slug).replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Title-case a kebab-case slug: "date-night" -> "Date Night" */
export function titleize (slug) {
  if (!slug) return ''
  return String(slug).split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function pluralize (count, singular, plural) {
  return `${count} ${count === 1 ? singular : (plural || singular + 's')}`
}

/** Join a list into readable prose: ["a","b","c"] -> "a, b, and c" */
export function list (items, conjunction = 'and') {
  const arr = (items || []).filter(Boolean)
  if (!arr.length) return ''
  if (arr.length === 1) return String(arr[0])
  if (arr.length === 2) return `${arr[0]} ${conjunction} ${arr[1]}`
  return `${arr.slice(0, -1).join(', ')}, ${conjunction} ${arr[arr.length - 1]}`
}

const LL_LABEL = {
  'multi-pass': 'Lightning Lane Multi Pass',
  'single-pass': 'Lightning Lane Single Pass',
  none: 'Standby only',
}
export function lightningLane (value) { return LL_LABEL[value] || 'Standby only' }

const LL_SHORT = { 'multi-pass': 'Multi Pass', 'single-pass': 'Single Pass', none: 'Standby only' }
export function lightningLaneShort (value) { return LL_SHORT[value] || 'Standby only' }

const TRANSFER_LABEL = {
  'wheelchair-accessible': 'Stay in your wheelchair or ECV',
  'ecv-transfer': 'Transfer from ECV to a wheelchair',
  'must-transfer': 'Must transfer to the ride vehicle',
}
export function transfer (value) { return TRANSFER_LABEL[value] || 'Check with a cast member' }

const SERVICE_LABEL = {
  'table-service': 'Table service',
  'quick-service': 'Quick service',
  'snack-cart': 'Snack cart',
  lounge: 'Lounge',
  bakery: 'Bakery',
  'food-truck': 'Food truck',
}
export function service (value) { return SERVICE_LABEL[value] || unslug(value) }

const RESERVATION_LABEL = {
  essential: 'Reservations essential',
  recommended: 'Reservations recommended',
  'walk-up-ok': 'Walk-ups usually fine',
  'not-accepted': 'No reservations',
}
export function reservations (value) { return RESERVATION_LABEL[value] || unslug(value) }

const TYPE_LABEL = {
  'roller-coaster': 'Roller coaster',
  'dark-ride': 'Dark ride',
  'water-ride': 'Water ride',
  simulator: 'Simulator',
  spinner: 'Spinner',
  show: 'Show',
  'stage-show': 'Stage show',
  film: 'Film',
  parade: 'Parade',
  fireworks: 'Nighttime spectacular',
  walkthrough: 'Walkthrough',
  transportation: 'Transportation',
  'play-area': 'Play area',
  'character-meet': 'Character meet',
  'animal-experience': 'Animal experience',
  'interactive-game': 'Interactive game',
  train: 'Train',
  'boat-ride': 'Boat ride',
}
export function attractionType (value) { return TYPE_LABEL[value] || unslug(value) }

const WET_LABEL = { none: 'Stay dry', light: 'You may get splashed', soaked: 'You will get soaked' }
export function getsWet (value) { return WET_LABEL[value] || WET_LABEL.none }

const MOTION_LABEL = { none: 'No motion risk', low: 'Low motion risk', moderate: 'Moderate motion risk', high: 'High motion risk' }
export function motion (value) { return MOTION_LABEL[value] || MOTION_LABEL.none }

/** 1–5 score to a short human label. */
export function intensityLabel (score) {
  return ['', 'Very gentle', 'Gentle', 'Moderate', 'Intense', 'Extreme'][score] || 'Moderate'
}
export function scaryLabel (score) {
  return ['', 'Not scary', 'Barely scary', 'Somewhat scary', 'Scary for many kids', 'Genuinely frightening'][score] || 'Somewhat scary'
}
export function mustTryLabel (score) {
  return ['', 'If you happen by', 'Worth a detour', 'Plan for it', 'Near the top of the list', 'Do not leave without it'][score] || ''
}

const CATEGORY_LABEL = {
  sweet: 'Sweet', savory: 'Savory', snack: 'Snack', drink: 'Drink',
  breakfast: 'Breakfast', 'treat-cart': 'Treat cart',
}
export function foodCategory (value) { return CATEGORY_LABEL[value] || unslug(value) }

const DIET_LABEL = {
  vegan: 'Vegan', vegetarian: 'Vegetarian', 'gluten-free': 'Gluten-friendly',
  'dairy-free': 'Dairy-free', 'nut-free': 'Nut-free',
  'allergy-friendly-menu': 'Allergy-friendly menu',
}
export function diet (value) { return DIET_LABEL[value] || unslug(value) }
