/**
 * Universal reference tables — the second source of truth the fact checker asserts against.
 *
 * READ THIS BEFORE TRUSTING A GREEN BUILD.
 *
 * The Disney tables in ./disney.mjs are a genuine second opinion: they were written from a separate
 * research pass, so when the dataset and the table disagree, one of two independent sources is
 * wrong and a human has to decide which. These tables do not have that property yet. They and the
 * Universal dataset were both produced from the same model's knowledge, so agreement between them
 * is evidence of *consistency*, not of *correctness*. A green fact check here means the dataset
 * contains no internal contradiction. It does not mean a child who is 47 inches tall will be let
 * onto Hagrid's.
 *
 * Two things make it worth having anyway:
 *
 *   1. It was written blind — before any park data existed, and before the authoring agents
 *      reported — so it is at least a separate draw rather than a transcription of the dataset.
 *      A disagreement is therefore real signal.
 *   2. It is deliberately thin. Only facts worth staking a build on are listed. An omission here
 *      is an honest "not verified", which is more useful than a confident wrong number.
 *
 * Everything below is a launch gate, not a launch. See docs/LAUNCH-UNIVERSAL.md — the operator stays
 * status:"draft" in data/operators.json until a human has checked these against the parks' own
 * published figures, and heights, closures and prices are the three that matter most.
 */

/**
 * Height requirements, in inches.
 *
 * Confidence is marked per park. Attractions I would not stake a build on are absent rather than
 * guessed — the fact checker only asserts what is listed, so an omission costs coverage while a
 * wrong entry costs trust.
 */
export const HEIGHTS = {
  /* Reasonable confidence — a long-stable line-up. */
  'universal-studios-florida': {
    'hollywood rip ride rockit': 51,
    'revenge of the mummy': 48,
    'men in black': 42,
    'escape from gringotts': 42,
    'despicable me': 40,
    // "transformers: the ride", not "transformers" — the bare word also matches the character
    // meet-and-greet, which has no height stick and should not have one asserted against it.
    'transformers: the ride': 40,
    'the simpsons ride': 40,
    // Written blind as "woody woodpecker", which the dataset did not have: the coaster was rethemed
    // with DreamWorks Land. Both sources independently put it at 36, so the number is corroborated
    // and only the name moved.
    'trolls trollercoaster': 36,
    'e.t. adventure': 34,
  },

  /* Reasonable confidence — likewise stable, and the thrill tier is well documented. */
  'islands-of-adventure': {
    'incredible hulk': 54,
    'doctor doom': 52,
    velocicoaster: 51,
    hagrid: 48,
    'forbidden journey': 48,
    'ripsaw falls': 44,
    'bilge-rat barges': 42,
    'jurassic park river adventure': 42,
    'spider-man': 40,
    'flight of the hippogriff': 36,
    'cat in the hat': 36,
    'reign of kong': 34,
  },

  /*
   * LOWEST CONFIDENCE ON THE SITE. Epic Universe opened in May 2025, so there is no long tail of
   * corroborating coverage behind these, and the four listed are the only ones I would put in a
   * checker at all. The rest of the park's height data is unasserted on purpose: see the launch doc.
   */
  'epic-universe': {
    'stardust racers': 48,
    'mario kart': 40,
    'mine-cart madness': 42,
    yoshi: 34,
  },

  /*
   * Note the deliberate difference from Orlando: Flight of the Hippogriff is a different installation
   * here and carries a different minimum. Two parks, one ride name, two numbers is exactly the kind
   * of fact a shared table would flatten, and exactly the kind that strands a family at a gate.
   */
  'universal-studios-hollywood': {
    'revenge of the mummy': 48,
    'forbidden journey': 48,
    'jurassic world': 42,
    'mario kart': 40,
    'transformers: the ride': 40,
    'despicable me': 40,
    'flight of the hippogriff': 39,
    'secret life of pets': 34,
  },
}

/**
 * Heights that are plausible at these parks.
 *
 * Wider and higher than Disney's, which is the single most load-bearing difference between the two
 * operators for a family with a small child: Universal's thrill tier starts where Disney's tops out.
 * 51, 52 and 54 are real numbers here and would be typos there.
 */
export const PLAUSIBLE_HEIGHTS = [34, 36, 39, 40, 42, 44, 46, 48, 51, 52, 54]

/** No Universal attraction is known to carry two legitimate minimums. */
export const DUAL_HEIGHTS = {}

/**
 * Queue-tier assignments that are specifically easy to get wrong.
 *
 * Universal's product is close to binary — an attraction either takes Express or it does not — so
 * the trap is different from Disney's. It is the handful of headliners that famously do *not* take
 * it, which is the fact that decides whether Express is worth buying at all.
 */
export const QUEUE_ASSIGNMENT = {
  'islands-of-adventure': {
    // Hagrid's has never accepted Express. Writing otherwise sells someone a $200 pass on a promise
    // the park will not honour, which is the most expensive single error this site could make.
    hagrid: 'none',
  },
}

/**
 * Attractions permitted to claim a virtual queue.
 *
 * Unlike Disney, Universal genuinely runs a Virtual Line product, so an empty list would be wrong
 * here. It is still short: Hagrid's is the one I am confident has used it as standing policy.
 * Anything else marked virtualQueue:true fails the build and gets a human, which is the intent —
 * Epic Universe's virtual-queue policy in particular is a launch-gate item, not a settled fact.
 */
export const VIRTUAL_QUEUE_ALLOWED = ['hagrid']

/**
 * Claims the Express Pass guide must, should, and must not make.
 *
 * The hotel-inclusion rule is the reason this check exists. "Express Pass is included with an
 * on-site stay" is true at three hotels and false at the other seven, it is repeated as though it
 * were true everywhere, and a reader who believes it books the wrong hotel and loses the entire
 * value of the trade. Requiring the word "premier" forces the guide to name the tier.
 */
export const QUEUE_CLAIMS = {
  require: [
    {
      re: /as of (july )?2026|july 2026/,
      message: 'no "as of July 2026" framing — Express Pass is dynamically priced by date and must never read as a fixed number',
    },
    {
      re: /premier/,
      message: 'never names the Premier hotel tier — "Express Pass comes with an on-site stay" is true at three of the ten hotels, and a reader who believes it generally books the wrong one',
    },
  ],
  expect: [
    {
      re: /unlimited/,
      message: 'does not distinguish Express Pass from Express Unlimited — they are different products at different prices, and the difference is the whole decision',
    },
  ],
  forbid: [
    {
      re: /included with (any|every|all) (on-?site |universal )?hotel/,
      message: 'says Express Pass comes with any on-site hotel — it is the three Premier hotels only',
    },
    {
      re: /express (pass )?is free/,
      message: 'calls Express Pass free — it is bundled into a higher room rate, which is not the same thing and should be priced as what it is',
    },
  ],
}

/**
 * Attractions that must be present AND marked closed.
 *
 * Empty on purpose. I could not name a 2025/26 Universal closure I would stake a build on, and a
 * guessed closure is worse than no closure check: it fails the build for a ride that is running,
 * which trains everyone to ignore the checker. Filling this in is a launch-gate item.
 */
export const MUST_BE_CLOSED = {}

/** Attractions that must be present AND operating. Headliners only — omission is the failure mode. */
export const MUST_BE_OPEN = {
  'universal-studios-florida': ['escape from gringotts', 'revenge of the mummy', 'hollywood rip ride rockit', 'transformers: the ride'],
  'islands-of-adventure': ['incredible hulk', 'velocicoaster', 'hagrid', 'forbidden journey'],
  'epic-universe': ['stardust racers', 'mario kart'],
  'universal-studios-hollywood': ['studio tour', 'revenge of the mummy', 'forbidden journey'],
}

/**
 * Snack prices. Low confidence, and mismatches here are notes rather than failures.
 *
 * Butterbeer is the one item worth pinning: it is the most-searched food at either resort, it is
 * priced identically across the Wizarding Worlds within a coast, and the cold/frozen split is the
 * detail everyone gets wrong. Treat a note from this table as "go look", not as "this is wrong".
 */
export const SNACK_PRICES = [
  { match: 'frozen butterbeer', parks: ['universal-studios-florida', 'islands-of-adventure'], price: 9.99 },
  { match: 'butterbeer', parks: ['universal-studios-florida', 'islands-of-adventure'], price: 8.99 },
]

/**
 * Seasonal content that must not appear on an evergreen page.
 *
 * Same rule as Disney's, different names. Halloween Horror Nights is the risk: it is the biggest
 * thing Universal does, it is enormously tempting to mention on a park overview, and its dates,
 * houses and prices change every single year. One canonical owner, under data/universal/seasonal/.
 */
/**
 * Recorded disagreements between this table and the dataset that a human has not settled.
 *
 * Both were written from the same model's knowledge, but independently and in that order — the table
 * first, blind, before any park data existed. Where they agree that is weak evidence. Where they
 * disagree it is a genuine flag, and resolving it by editing either side would throw away the only
 * signal the arrangement produces.
 *
 * So both values are recorded and the row goes on the launch checklist. This is not a suppression
 * mechanism: an operator cannot go live with a non-empty list, and a row that stops matching is
 * reported as stale rather than quietly ignored.
 */
export const CONFLICTS = [
  {
    park: 'islands-of-adventure',
    attraction: 'Skull Island: Reign of Kong',
    field: 'heightIn',
    reference: 34,
    dataset: 36,
    note: 'Two inches apart, and two inches is exactly the width of a bad day at a height stick. Check the operator\'s own published figure and delete this row.',
  },
  {
    park: 'epic-universe',
    attraction: "Yoshi's Adventure",
    field: 'heightIn',
    reference: 34,
    dataset: null,
    note: 'The table asserts 34in. The dataset states no figure and carries a heightNote saying any minimum is low or supervision-based and unverified — which is the instructed behaviour, not an omission. So the two sources agree a restriction may exist and disagree on whether it is 34in. Epic Universe is the least-corroborated park on the site; resolve this from the operator directly.',
  },
]

/**
 * Proper names containing a word the filler sweep bans, scrubbed from prose before that sweep runs.
 *
 * House style bans "magical" as filler. Universal sells a ride called Hagrid's Magical Creatures
 * Motorbike Adventure. Without this list, one park file reported thirteen filler hits of which twelve
 * were the ride's own name — and a check that is mostly false positives is one everybody learns to
 * scroll past, which costs you the one real hit hiding among them.
 */
export const PROPER_NAMES = [
  "Hagrid's Magical Creatures Motorbike Adventure",
  'Magical Creatures Motorbike Adventure',
]

export const SEASONAL = [
  'halloween horror nights', 'halloween horror', 'hhn',
  'mardi gras', 'grinchmas', 'holidays at universal',
  'christmas in the wizarding world', 'rock the universe',
]
