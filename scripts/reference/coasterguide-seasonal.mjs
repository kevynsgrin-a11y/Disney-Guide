/**
 * Coaster Guide seasonal reference tables — the second source of truth for the dated dataset.
 *
 * Same caveat as ./coasterguide.mjs, and it bites harder here: dated facts rot fastest, these
 * tables are model-derived, and the haunt events below changed their line-ups and pricing every
 * single year running. The bands are wide on purpose — wide still catches the errors that matter
 * (an event in the wrong park, a price off by a factor, a window in the wrong season) without
 * failing a build over ten plausible dollars.
 *
 * Two-way contract: every slug listed here MUST have a data file, and every data file MUST be
 * listed here. Adding an event is a deliberate two-file act, in one commit, on purpose.
 */

/**
 * §7.1 — which resort and park each event actually belongs to.
 *
 * Fright Fest is four separate entries, not one: it is one brand across four Six Flags parks, but
 * the dates, mazes and upcharges differ by park, exactly like Halloween Horror Nights' two
 * coasts on the sister site. Howl-O-Scream is three entries for the same reason.
 */
export const EVENTS = {
  'fright-fest-magic-mountain': { resort: 'southern-california', park: 'magic-mountain', category: 'overlay' },
  'fright-fest-over-texas': { resort: 'texas', park: 'six-flags-over-texas', category: 'overlay' },
  'fright-fest-great-adventure': { resort: 'new-jersey', park: 'great-adventure', category: 'overlay' },
  'fright-fest-great-america': { resort: 'chicago', park: 'great-america', category: 'overlay' },
  'knotts-scary-farm': { resort: 'southern-california', park: 'knotts-berry-farm', category: 'hard-ticket' },
  'howl-o-scream-san-diego': { resort: 'southern-california', park: 'seaworld-san-diego', category: 'hard-ticket' },
  'howl-o-scream-san-antonio': { resort: 'texas', park: 'seaworld-san-antonio', category: 'hard-ticket' },
  'howl-o-scream-orlando': { resort: 'orlando', park: 'seaworld-orlando', category: 'hard-ticket' },
  'brick-or-treat-legoland-california': { resort: 'southern-california', park: 'legoland-california', category: 'overlay' },
}

/**
 * §7.2 — typical windows. `starts`/`ends` are alternatives the authored prose must contain at
 * least one of. Nights bands are wide and low-confidence; several of these events have grown
 * their runs most years running.
 */
export const WINDOWS = {
  'fright-fest-magic-mountain': { starts: ['september'], ends: ['november', 'halloween'] },
  'fright-fest-over-texas': { starts: ['september'], ends: ['november', 'halloween'] },
  'fright-fest-great-adventure': { starts: ['september'], ends: ['november', 'halloween'] },
  'fright-fest-great-america': { starts: ['september'], ends: ['november', 'halloween'] },
  'knotts-scary-farm': { starts: ['september'], ends: ['november', 'halloween'], nights: [20, 40] },
  'howl-o-scream-san-diego': { starts: ['september'], ends: ['november', 'halloween'], nights: [8, 25] },
  'howl-o-scream-san-antonio': { starts: ['september'], ends: ['november', 'halloween'], nights: [8, 25] },
  'howl-o-scream-orlando': { starts: ['september'], ends: ['november', 'halloween'], nights: [10, 30] },
  'brick-or-treat-legoland-california': { starts: ['september', 'october'], ends: ['november', 'halloween'] },
}

/**
 * §7.3 — price bands. Only separately-ticketed events are banded; the authored range must sit
 * inside the band, not merely overlap it. Fright Fest runs on day admission, so it is not banded
 * here — its data files carry model "included" with a spend range, which the renderer labels as
 * in-park spend, not a ticket.
 */
export const PRICE_BANDS = {
  'knotts-scary-farm': [40, 140],
  'howl-o-scream-san-diego': [35, 130],
  'howl-o-scream-san-antonio': [30, 120],
  'howl-o-scream-orlando': [35, 140],
}

/** Per-item haunt-season food prices, by resort. */
export const FOOD_BANDS = {
  'southern-california': [6, 20],
  texas: [6, 18],
  orlando: [6, 20],
  'new-jersey': [7, 20],
  chicago: [7, 20],
}

/**
 * Names that genuinely end in an exclamation mark. House style bans exclamation marks in prose;
 * these are names, not prose. None known for this operator's events yet.
 */
export const NAME_EXCLAMATIONS = []
