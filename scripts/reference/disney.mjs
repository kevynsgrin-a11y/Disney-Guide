/**
 * Disney reference tables — the second source of truth the fact checker asserts against.
 *
 * These are hard-coded on purpose and duplicate what is in data/disney/. Checking a dataset against
 * itself proves only that it agrees with itself; the point is a second copy that has to be edited
 * deliberately, in the same commit, when reality changes.
 *
 * One file per operator. A new operator brings its own tables rather than editing anyone else's,
 * which keeps "verified July 2026" a claim about a specific dataset rather than about the network.
 */

export const HEIGHTS = {
  'magic-kingdom': {
    'tomorrowland speedway': 32,
    'barnstormer': 35,
    'seven dwarfs mine train': 38,
    'big thunder mountain': 38,
    "tiana's bayou adventure": 40,
    'space mountain': 44,
    'tron lightcycle': 48,
  },
  epcot: {
    "soarin'": 40,
    'test track': 40,
    'guardians of the galaxy': 42,
  },
  'hollywood-studios': {
    'alien swirling saucers': 32,
    'slinky dog dash': 38,
    'millennium falcon': 38,
    'star tours': 40,
    'rise of the resistance': 40,
    'tower of terror': 40,
    "rock 'n' roller coaster": 48,
  },
  'animal-kingdom': {
    'kali river rapids': 38,
    'avatar flight of passage': 44,
    'expedition everest': 44,
  },
  'disneyland-park': {
    'autopia': 32,
    "gadget's go coaster": 35,
    'big thunder mountain': 40,
    'space mountain': 40,
    "tiana's bayou adventure": 40,
    'rise of the resistance': 40,
    'millennium falcon': 40,
    'matterhorn bobsleds': 42,
    'indiana jones adventure': 46,
  },
  'california-adventure': {
    'jumpin jellyfish': 40,
    'silly symphony swings': 40,
    'inside out emotional whirlwind': 40,
    'mission: breakout': 40,
    'radiator springs racers': 40,
    "goofy's sky school": 42,
    'grizzly river run': 42,
    'golden zephyr': 42,
    'incredicoaster': 48,
  },
}

/**
 * Heights that are plausible at these parks.
 *
 * Anything outside this set is flagged for a second look rather than failed — it is a typo detector,
 * not a fact. Disney's restrictions cluster tightly; Universal's do not, which is why this lives per
 * operator instead of in the checker.
 */
export const PLAUSIBLE_HEIGHTS = [32, 35, 38, 40, 42, 44, 46, 48]

/**
 * Attractions that legitimately carry two heights, because they are two experiences behind one name.
 * Mission: SPACE splits Green at 40in and Orange at 44in.
 */
export const DUAL_HEIGHTS = {
  epcot: { 'mission: space': [40, 44] },
}

/** Queue-tier assignments that are specifically easy to get wrong. */
export const QUEUE_ASSIGNMENT = {
  // Test Track moved to Multi Pass with its 2025 rebuild and is still widely written up as Single Pass.
  epcot: { 'test track': 'multi-pass' },
}

/** Attractions permitted to claim a virtual queue. Disney runs none permanently as of mid-2026. */
export const VIRTUAL_QUEUE_ALLOWED = []

/** Claims the Lightning Lane guide must, should, and must not make. */
export const QUEUE_CLAIMS = {
  require: [
    { re: /as of (july )?2026|july 2026/, message: 'no "as of July 2026" framing — dynamic prices must never read as fixed' },
  ],
  expect: [
    { re: /\$34/, message: 'does not mention the $34 Disneyland Multi Pass starting price' },
  ],
  forbid: [
    {
      re: /genie\+/,
      unless: /replaced|until|formerly|used to/,
      message: 'refers to Genie+ without noting it was replaced in July 2024',
    },
  ],
}

/** Attractions that must be present AND marked closed. */
export const MUST_BE_CLOSED = {
  'magic-kingdom': ['rivers of america', 'tom sawyer island', 'liberty belle'],
  // "muppet vision", not "muppet" — Rock 'n' Roller Coaster Starring The Muppets is operating.
  'hollywood-studios': ['muppet vision'],
  'animal-kingdom': ['dinosaur'],
  'california-adventure': ['mike & sulley'],
}

/** Attractions that must be present AND operating. */
export const MUST_BE_OPEN = {
  'magic-kingdom': ['big thunder mountain', 'buzz lightyear'],
  epcot: ['test track', 'guardians of the galaxy'],
  'hollywood-studios': ["rock 'n' roller coaster"],
  'disneyland-park': ['tom sawyer island', 'mark twain', 'indiana jones adventure', 'matterhorn'],
}

/** Verified snack prices. A dataset price must match, or be explained by a different location. */
export const SNACK_PRICES = [
  { match: 'mickey pretzel', parks: ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom'], price: 8.5 },
  { match: 'churro', parks: ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom'], price: 5.5 },
  { match: 'ronto wrap', parks: ['hollywood-studios'], price: 13.99 },
  { match: 'ronto wrap', parks: ['disneyland-park'], price: 14.49 },
  { match: 'chili cone queso', parks: ['california-adventure'], price: 11.49 },
]

/**
 * Seasonal content that must not appear on an evergreen page.
 *
 * The two kinds of content share a site but not a data tree, and this is what keeps one canonical
 * owner per topic: an evergreen page naming a party night has quietly become a second owner of a
 * fact that will move without it.
 */
export const SEASONAL = [
  'not-so-scary', 'not so scary', 'very merry', 'food & wine festival', 'food and wine festival',
  'flower & garden', 'flower and garden', 'festival of the arts', 'festival of the holidays',
  'oogie boogie bash', 'haunted mansion holiday', 'ghost galaxy', 'hyperspace mountain',
  'jingle cruise',
]
