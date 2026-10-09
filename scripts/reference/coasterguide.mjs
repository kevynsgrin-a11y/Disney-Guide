/**
 * Coaster Guide reference tables — the second source of truth the fact checker asserts against.
 *
 * THE SAME CAVEAT AS UNIVERSAL'S TABLES, AND IT IS NOT A FOOTNOTE. These were written blind —
 * before any coasterguide park data existed — but from the same model's knowledge that later
 * authored the dataset. Agreement between table and dataset is evidence of *consistency*, not of
 * *correctness*. A green fact check here means the dataset contains no internal contradiction; it
 * does not mean a 47-inch child will be let onto Twisted Colossus.
 *
 * Two things make it worth having anyway:
 *
 *   1. It was written first and blind, so it is a separate draw rather than a transcription. A
 *      disagreement is real signal — and if one shows up, it goes in CONFLICTS rather than being
 *      edited away on either side.
 *   2. It is deliberately thin. Only heights I would stake a build on are listed; everything else
 *      is an honest omission, which costs coverage while a wrong entry costs a family a trip.
 *      This operator spans different park brands and park-specific products. Six Flags and Cedar
 *      Fair completed their merger July 1, 2024; Six Flags Entertainment Corporation is the combined
 *      current parent, including Knott's. Merlin and United Parks & Resorts remain distinct.
 *      Source: https://investors.sixflags.com/investor-resources/pre-merger-archive/cedar-fair-lp/default.aspx
 */

/**
 * Height requirements, in inches. Needle must be a substring of the attraction's name.
 *
 * Six Flags parks in particular have been retheming and retiring rides since the 2024 merger, so
 * the Six Flags rows are the ones most likely to need a human's second look. Where a ride is
 * listed here AND retired in the dataset, that disagreement is a CONFLICT, not a footnote.
 */
export const HEIGHTS = {
  /* Valencia, California. Targeted corrections reviewed October 9, 2026 from supplied official
     sources: /magicmountain/attractions/gold-rusher and /west-coast-racers. X2 and Superman
     retain historical heights only; MUST_BE_CLOSED excludes them from current operation. */
  'magic-mountain': {
    x2: 48,
    tatsu: 54,
    goliath: 48,
    'twisted colossus': 48,
    'full throttle': 54,
    'superman: escape from krypton': 48,
    'west coast racers': 54,
    'gold rusher': 48,
    viper: 54,
    'batman: the ride': 54,
    "riddler's revenge": 54,
    ninja: 42,
  },

  /* Arlington, Texas. */
  'six-flags-over-texas': {
    'new texas giant': 48,
    titan: 48,
    'mr. freeze': 54,
    'shock wave': 42,
  },

  /* Jackson, New Jersey. Kingda Ka's 48 is asserted even though the dataset records it as
     permanently closed — if it ever reappears as operating, that is a fact worth catching. */
  'great-adventure': {
    'el toro': 48,
    nitro: 54,
    'kingda ka': 48,
    'batman: the ride': 54,
    'superman: ultimate flight': 54,
    'dark knight': 48,
    'jersey devil': 48,
  },

  /* Gurnee, Illinois. */
  'great-america': {
    'raging bull': 54,
    goliath: 48,
    'batman: the ride': 54,
    'superman: ultimate flight': 54,
    'american eagle': 48,
    whizzer: 42,
  },

  /* Buena Park, California. */
  'knotts-berry-farm': {
    ghostrider: 48,
    xcelerator: 48,
    hangtime: 48,
    jaguar: 42,
  },

  /*
   * Legoland parks: NO heights asserted, on purpose. Legoland's minimums are low, frequently
   * supervision-based rather than stick-measured, and I would not stake a build on any specific
   * figure. The dataset should carry no heightIn for Legoland attractions and let "not stated"
   * send the reader to the park — that is the instructed behaviour, not an omission.
   */
  'legoland-california': {},
  'legoland-florida': {},

  /* San Diego, California. */
  'seaworld-san-diego': {
    emperor: 54,
    'electric eel': 54,
  },

  /* San Antonio, Texas. */
  'seaworld-san-antonio': {
    'great white': 54,
    'steel eel': 48,
  },

  /* Orlando, Florida. */
  'seaworld-orlando': {
    mako: 54,
    kraken: 54,
    manta: 54,
    'ice breaker': 48,
    pipeline: 54,
  },
}

/**
 * Heights that are plausible at these parks. Coaster-park minimums run higher and wider than
 * Disney's, and 52/54/56 are real numbers here that would be typos on a Disney table.
 */
export const PLAUSIBLE_HEIGHTS = [36, 38, 40, 42, 44, 46, 48, 52, 54, 56]

/** No attraction at these parks is known to carry two legitimate minimums. */
export const DUAL_HEIGHTS = {}

/**
 * Queue-tier assignments that are specifically easy to get wrong.
 *
 * Empty on purpose: covered parks publish park-specific line-skip products (Fast Lane at Six Flags parks and
 * Knott's — with park-specific product formats and participating rides — Quick
 * Queue at SeaWorld, and Fastrack at both US LEGOLAND parks), and I would not stake a
 * build on which specific attractions each of those covers in 2026. The dataset carries authoring
 * judgement, flagged as such in the launch doc; per-attraction coverage is a human verification
 * gate, not a settled fact.
 */
export const QUEUE_ASSIGNMENT = {}

/**
 * Attractions permitted to claim a virtual queue. None is asserted: no coasterguide park is known
 * to run a standing virtual-queue product in 2026. Anything marked virtualQueue:true fails the
 * build and gets a human, which is the intent.
 */
export const VIRTUAL_QUEUE_ALLOWED = []

/**
 * Claims the line-skip guide must, should, and must not make.
 *
 * With several park-specific products covered here, an easy wrong move is letting one park's
 * product name, packages or participation terms bleed onto another park.
 * The guide must name each real product, must frame prices as of a date, and must never speak a
 * competitor's vocabulary.
 *
 * Updated October 9, 2026 from the official Magic Mountain Fast Lane FAQ and program update:
 * the current all-day products are Fast Lane Reserve and Fast Lane Ultimate, with one
 * reservation at a time. Do not enforce a generic three-tier model or a chain-wide rename
 * story; THE FLASH Pass is mentioned only as previous-program context. Park admission and
 * Fright Fest Haunted Attractions are excluded. Product names are not universal queue tiers.
 */
export const QUEUE_CLAIMS = {
  require: [
    {
      re: /as of (?:september |october 9, )?2026|september 2026|october 9, 2026/i,
      message: 'no dated 2026 framing — product terms and dynamic prices must be tied to their observation date',
    },
    {
      re: /Fast Lane Reserve/i,
      message: 'does not name Magic Mountain’s current Fast Lane Reserve product',
    },
    {
      re: /Fast Lane Ultimate/i,
      message: 'does not name Magic Mountain’s current Fast Lane Ultimate product',
    },
    {
      re: /one reservation at a time/i,
      message: 'does not explain the verified single active reservation rule',
    },
    {
      re: /fast lane/i,
      message: 'never names Fast Lane, the line-skip product at the Six Flags and Knott\'s parks',
    },
    {
      re: /quick queue/i,
      message: 'never names Quick Queue, the SeaWorld product',
    },
  ],
  expect: [
    {
      re: /Fastrack/i,
      message: 'does not name the verified Fastrack product at both US LEGOLAND parks, whose packages and coverage must be checked separately',
    },
  ],
  forbid: [
    {
      re: /lightning lane|genie\+?/i,
      message: 'speaks Disney vocabulary — Lightning Lane and Genie+ are the sister site\'s products, not these parks\'',
    },
    {
      re: /universal express|express pass at universal/i,
      message: 'speaks Universal product vocabulary; Magic Mountain’s official Haunted Attractions Express Pass is separate and valid terminology',
    },
    {
      re: /fastpass/i,
      message: 'FastPass is a retired Disney product name and wrong at every park this site covers',
    },
  ],
}

/**
 * Attractions that must be present AND marked closed.
 *
 * Six Flags Great Adventure retired Kingda Ka and Zumanjaro: Drop of Doom at the end of the 2024
 * season — one of the most-reported park stories of the decade, and the highest-confidence
 * closure on this site. If the dataset lists either as operating, that is a hard failure.
 */
export const MUST_BE_CLOSED = {
  // X2: official Six Flags retirement announcement. Superman: March 28, 2025 reporting describes
  // Jeff Harris confirming permanent closure to The Orange County Register; the legacy official ride page is not the source.
  'magic-mountain': ['x2', 'superman: escape from krypton'],
  'great-adventure': ['kingda ka', 'zumanjaro'],
}

/** Attractions that must be present AND operating. Headliners only — omission is the failure mode. */
export const MUST_BE_OPEN = {
  'magic-mountain': ['twisted colossus', 'goliath', 'tatsu', 'gold rusher', 'west coast racers'],
  'six-flags-over-texas': ['new texas giant', 'titan'],
  'great-adventure': ['el toro', 'nitro'],
  'great-america': ['raging bull', 'goliath'],
  'knotts-berry-farm': ['ghostrider', 'xcelerator'],
  'legoland-california': ['coastersaurus'],
  'legoland-florida': ['the dragon'],
  'seaworld-san-diego': ['emperor', 'electric eel'],
  // Iron Rattler is at Six Flags Fiesta Texas, not a SeaWorld San Antonio inventory requirement.
  // Source: https://www.sixflags.com/fiestatexas/attractions/iron-rattler
  'seaworld-san-antonio': ['great white', 'steel eel'],
  'seaworld-orlando': ['mako', 'kraken', 'manta'],
}

/**
 * Snack prices. None pinned, on purpose: no single food item here has the cross-park,
 * most-searched status of a Dole Whip or a Butterbeer, and a weakly-pinned price that fires
 * notes on four items is noise. Filling this in with real, dated figures is a launch-gate item.
 */
export const SNACK_PRICES = []

/**
 * Seasonal content that must not appear on an evergreen page.
 *
 * Halloween is this site's biggest seasonal draw too — Knott's Scary Farm is the original American
 * haunt and gets an enormous amount of search. Its dates, mazes and prices change every year, so
 * one canonical owner, under data/coasterguide/seasonal/.
 */
// Evergreen travel and queue advice may link to the canonical event page; event details stay there.
export const SEASONAL_REFERENCES = { 'fright fest': '/events/fright-fest-magic-mountain/' }

export const SEASONAL = [
  "knott's scary farm", 'knotts scary farm', 'scary farm',
  'fright fest',
  'howl-o-scream', 'howl o scream',
  'brick-or-treat', 'brick or treat',
  'holiday in the park', 'winterfest', "knots merry farm", "knott's merry farm",
]

/**
 * Recorded disagreements between this table and the dataset that a human has not settled.
 *
 * Empty as written — both sides were drawn blind from the same knowledge, so where they agree
 * that is weak evidence and where they disagree a human decides. Rows appear here, not as silent
 * edits on either side.
 */
export const CONFLICTS = []

/** Proper names containing a word the filler sweep bans. None known for this operator yet. */
export const PROPER_NAMES = []
