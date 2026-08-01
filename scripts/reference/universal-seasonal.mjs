/**
 * Universal seasonal reference tables — the second source of truth for the dated dataset.
 *
 * The same caveat as ./universal.mjs applies and applies harder: these are model-derived rather
 * than independently researched, so a green run proves internal consistency, not correctness. Dated
 * facts also rot faster than evergreen ones, which is why the bands below are deliberately wide.
 * A wide band still catches the errors that matter — an event in the wrong park, a price off by a
 * factor, a window in the wrong season — without failing a build over a plausible ten dollars.
 *
 * Note the two-way contract: every slug listed here MUST have a data file, and every data file MUST
 * be listed here. Adding an event is a deliberate two-file act, in one commit, on purpose.
 */

/**
 * §7.1 — which resort and park each event actually belongs to.
 *
 * Halloween Horror Nights appears twice because it genuinely is two events. Orlando's and
 * Hollywood's run on different dates, at different prices, with different houses, and collapsing
 * them into one page would put California dates in front of a Florida reader. Separate slugs, one
 * per coast, is the only honest shape.
 */
export const EVENTS = {
  'halloween-horror-nights-orlando': { resort: 'universal-orlando', park: 'universal-studios-florida', category: 'hard-ticket' },
  'halloween-horror-nights-hollywood': { resort: 'universal-hollywood', park: 'universal-studios-hollywood', category: 'hard-ticket' },
  'universal-orlando-mardi-gras': { resort: 'universal-orlando', park: 'universal-studios-florida', category: 'festival' },
  'holidays-at-universal-orlando': { resort: 'universal-orlando', park: null, category: 'overlay' },
  'grinchmas-at-universal-hollywood': { resort: 'universal-hollywood', park: 'universal-studios-hollywood', category: 'overlay' },
}

/**
 * §7.2 — typical windows.
 *
 * `starts`/`ends` are alternatives: the authored prose must contain at least one. More than one is
 * allowed because a window can be described honestly in more than one way, and "runs to the first
 * weekend of November" is better copy than "November" for the same fortnight.
 *
 * `nights` bands are wide and low-confidence. Halloween Horror Nights has grown its run most years
 * running, so a tight band would fail a build for a fact that simply moved.
 */
export const WINDOWS = {
  'halloween-horror-nights-orlando': { starts: ['august', 'september'], ends: ['november', 'halloween'], nights: [35, 60] },
  'halloween-horror-nights-hollywood': { starts: ['september', 'august'], ends: ['november', 'halloween'], nights: [20, 45] },
  'universal-orlando-mardi-gras': { starts: ['january', 'february'], ends: ['march', 'april'] },
  'holidays-at-universal-orlando': { starts: ['november'], ends: ['january', 'december'] },
  'grinchmas-at-universal-hollywood': { starts: ['november', 'december'], ends: ['january', 'december'] },
}

/**
 * §7.3 — price bands. The authored range must sit inside the band, not merely overlap it.
 *
 * Only the hard-ticket events are banded. Universal prices Halloween Horror Nights by date more
 * aggressively than Disney prices its parties, so the spread between a September Wednesday and the
 * Saturday before Halloween is genuinely enormous, and the band has to hold both ends.
 */
export const PRICE_BANDS = {
  'halloween-horror-nights-orlando': [70, 200],
  'halloween-horror-nights-hollywood': [65, 190],
}

/** Per-item festival food prices, by resort. */
export const FOOD_BANDS = { 'universal-orlando': [5, 18], 'universal-hollywood': [6, 20] }

/**
 * Names that genuinely end in an exclamation mark.
 *
 * House style bans exclamation marks in prose. These are not prose — they are what the thing is
 * called — and scrubbing them before the sweep is the only way to keep the rule strict without
 * forcing an author to misname a show.
 */
export const NAME_EXCLAMATIONS = [
  'Animal Actors on Location!',
]
