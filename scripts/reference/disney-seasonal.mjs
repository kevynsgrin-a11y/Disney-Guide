/**
 * Disney seasonal reference tables — the second source of truth for the dated dataset.
 *
 * Same principle as the evergreen tables in ./disney.mjs: hard-coded on purpose, edited deliberately
 * in the same commit reality changes, and scoped to one operator so a new one brings its own rather
 * than editing these.
 */

export const EVENTS = {
  'mickeys-not-so-scary-halloween-party': { resort: 'walt-disney-world', park: 'magic-kingdom', category: 'hard-ticket' },
  'mickeys-very-merry-christmas-party': { resort: 'walt-disney-world', park: 'magic-kingdom', category: 'hard-ticket' },
  'disney-jollywood-nights': { resort: 'walt-disney-world', park: 'hollywood-studios', category: 'hard-ticket' },
  'epcot-food-and-wine-festival': { resort: 'walt-disney-world', park: 'epcot', category: 'festival' },
  'epcot-festival-of-the-arts': { resort: 'walt-disney-world', park: 'epcot', category: 'festival' },
  'epcot-flower-and-garden-festival': { resort: 'walt-disney-world', park: 'epcot', category: 'festival' },
  'epcot-festival-of-the-holidays': { resort: 'walt-disney-world', park: 'epcot', category: 'festival' },
  'disney-after-hours': { resort: 'walt-disney-world', park: null, category: 'after-hours' },
  'oogie-boogie-bash': { resort: 'disneyland', park: 'california-adventure', category: 'hard-ticket' },
  'halloween-time-at-the-disneyland-resort': { resort: 'disneyland', park: null, category: 'overlay' },
  'holidays-at-the-disneyland-resort': { resort: 'disneyland', park: null, category: 'overlay' },
  'lunar-new-year-at-disney-california-adventure': { resort: 'disneyland', park: 'california-adventure', category: 'festival' },
  'disney-california-adventure-food-and-wine-festival': { resort: 'disneyland', park: 'california-adventure', category: 'festival' },
  'disneyland-after-dark': { resort: 'disneyland', park: null, category: 'after-hours' },
}

/*
 * §7.2  Typical windows.
 *
 * `starts`/`ends` are alternatives — the authored prose must contain at least one. More than one is
 * allowed because a window can be named honestly in more than one way: Very Merry ends "shortly
 * before Christmas", which is better copy than "late December" and describes the same fortnight.
 */
export const WINDOWS = {
  'mickeys-not-so-scary-halloween-party': { starts: ['august'], ends: ['november', 'halloween'], nights: [30, 40] },
  'mickeys-very-merry-christmas-party': { starts: ['november'], ends: ['december', 'christmas'], nights: [20, 26] },
  'disney-jollywood-nights': { starts: ['november'], ends: ['december'], nights: [8, 14] },
  'epcot-food-and-wine-festival': { starts: ['ugust', 'july'], ends: ['november'] },
  'epcot-festival-of-the-arts': { starts: ['january'], ends: ['february'] },
  'epcot-flower-and-garden-festival': { starts: ['arch', 'ebruary'], ends: ['july'] },
  'epcot-festival-of-the-holidays': { starts: ['november'], ends: ['december'] },
  'oogie-boogie-bash': { starts: ['august'], ends: ['october', 'halloween'], nights: [25, 30] },
  'halloween-time-at-the-disneyland-resort': { starts: ['august'], ends: ['october', 'halloween'] },
  'holidays-at-the-disneyland-resort': { starts: ['november'], ends: ['january'] },
  'lunar-new-year-at-disney-california-adventure': { starts: ['january'], ends: ['february'] },
  'disney-california-adventure-food-and-wine-festival': { starts: ['ebruary', 'arch'], ends: ['april'] },
}

/* §7.3  Price bands. The authored range must sit inside the verified band, not merely overlap it. */
export const PRICE_BANDS = {
  'mickeys-not-so-scary-halloween-party': [119, 219],
  'mickeys-very-merry-christmas-party': [169, 219],
  'disney-jollywood-nights': [159, 209],
  'oogie-boogie-bash': [154, 224],
  'disney-after-hours': [139, 209],
}

/** Per-item festival food prices, by resort. */
export const FOOD_BANDS = { 'walt-disney-world': [5, 13], disneyland: [6, 15] }

/**
 * Attraction and booth names that genuinely end in an exclamation mark.
 *
 * House style bans exclamation marks in prose, but several of these things are actually called
 * this. Scrubbing the real names before the sweep is the only way to keep the rule strict without
 * forcing an author to misname a ride.
 */
export const NAME_EXCLAMATIONS = [
  'Mission: BREAKOUT!',
  'Pop Eats!',
  "L'Chaim! Holiday Kitchen",
  "L'Chaim!",
  'Fantasmic!',
  'Turtle Talk!',
  'Wonderful World of Animation!',
  'The Bar at Pop Eats!',
]
