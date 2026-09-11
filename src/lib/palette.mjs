/**
 * Per-operator color identity.
 *
 * assets/css/main.css owns one token system — the house dark register the component library is
 * written against. An operator that needs its own identity does not fork the stylesheet; it
 * declares a `palette` inside `site.json`'s brand block and the build emits a small override
 * stylesheet, dist/<operator>/assets/css/operator.css, that re-declares exactly these tokens on
 * :root. The layout links it after main.css (so it wins on screen) and before print.css (so the
 * print reset, which re-declares the same tokens for paper, still wins in print media).
 *
 * A palette must keep the luminance relationships of the house register, not just the hue: the
 * component library pairs --brand with hardcoded text colors (#fff on bands, #061310 on primary
 * buttons and verdict boxes), --brand-2 with body-size link text, --accent with eyebrow text.
 * A deep saturated "brand" navy passes no such pairing, which is why the declared deep color
 * lives in themeColor/brand-soft surfaces while --brand stays an interactive mid-bright hue.
 * test/operator-palette.test.mjs holds every pairing to WCAG AA.
 */

/** camelCase site.json key → CSS custom property it overrides. */
export const PALETTE_TOKENS = {
  paper: '--paper',
  surface: '--surface',
  surface2: '--surface-2',
  surface3: '--surface-3',
  ink: '--ink',
  ink2: '--ink-2',
  muted: '--muted',
  line: '--line',
  lineStrong: '--line-strong',
  brand: '--brand',
  brand2: '--brand-2',
  brand3: '--brand-3',
  brandSoft: '--brand-soft',
  accent: '--accent',
  accent2: '--accent-2',
  accentSoft: '--accent-soft',
  danger: '--danger',
  dangerSoft: '--danger-soft',
  warn: '--warn',
  warnSoft: '--warn-soft',
  good: '--good',
  goodSoft: '--good-soft',
  focus: '--focus',
}

export function hasPalette (site) {
  return Boolean(site?.brand?.palette && Object.keys(site.brand.palette).length > 0)
}

/**
 * The operator's ground color, for <meta name="theme-color">. Falls back to the house paper the
 * header previously hardcoded, so operators without a palette keep today's address-bar tint.
 */
export function palettePaper (site) {
  return hasPalette(site) ? site.brand.palette.paper : null
}

/**
 * Render the override stylesheet. Every declared key must be a known token — an unrecognized key
 * would silently style nothing, which is the one failure mode this file exists to prevent.
 */
export function paletteCss (site) {
  if (!hasPalette(site)) return null
  const palette = site.brand.palette
  const unknown = Object.keys(palette).filter((k) => !(k in PALETTE_TOKENS))
  if (unknown.length) {
    throw new Error(`brand.palette has unknown token${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}`)
  }
  const missing = Object.keys(PALETTE_TOKENS).filter((k) => !(k in palette))
  if (missing.length) {
    throw new Error(`brand.palette is missing token${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}`)
  }
  const lines = Object.entries(PALETTE_TOKENS).map(([key, cssName]) => `  ${cssName}: ${palette[key]};`)
  return `/* Operator palette — ${site.brand.name}. Generated from data/${site.operator}/site.json at\n` +
    `   build time; overrides the house tokens in main.css. Order matters: main.css, this, print.css. */\n` +
    `:root {\n${lines.join('\n')}\n}\n`
}
