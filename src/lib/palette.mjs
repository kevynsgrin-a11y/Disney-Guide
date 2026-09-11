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

  // Per-operator display face: a self-hosted OFL webfont, declared and wired through the
  // existing --font-display token, so a face swap never touches the shared stylesheet.
  const font = site.brand.font
  if (font) {
    lines.push(`  --font-display: '${font.family}', ${font.fallback};`)
  }

  let css = `/* Operator palette — ${site.brand.name}. Generated from data/${site.operator}/site.json at\n` +
    `   build time; overrides the house tokens in main.css. Order matters: main.css, this, print.css. */\n` +
    (font ? `@font-face {\n  font-family: '${font.family}';\n  font-style: normal;\n  font-weight: ${font.weight};\n  font-display: swap;\n  src: url('${font.file}') format('${font.format}');\n}\n\n` : '') +
    `:root {\n${lines.join('\n')}\n}\n`

  // The steel motif: trackline rules, marquee bulbs, spec-plate data styling. Emitted only for
  // operators that opt in — coaster-park identity without a shared-template branch.
  if (site.brand.motif === 'trackline') {
    css += `
/* Trackline motif — ${site.brand.name}'s visual signature. The rule under every section
   title is a track: a rail bar, a gap, and a wheel dot. The hero carries a marquee bulb
   strip that chases only when motion is welcome. Cards read as spec plates. */
.band__head h2::after, .hero__title::after {
  content: ''; display: block; width: 4.6rem; height: 3px; margin-top: var(--space-3);
  background: linear-gradient(90deg,
    var(--accent) 0 2.2rem,
    transparent 2.2rem 2.85rem,
    var(--accent-2) 2.85rem 3rem,
    transparent 3rem);
}

.hero:not(.hero--photo)::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 10px; z-index: 2;
  /* Two spacings layered — ride lighting is irregular, and irregular reads as texture
     where a uniform strip reads as a pier arcade. */
  background-image:
    radial-gradient(circle at 6px 5px, var(--accent) 0 2.2px, transparent 2.9px),
    radial-gradient(circle at 17px 5px, var(--accent-2) 0 1.8px, transparent 2.5px);
  background-size: 26px 10px, 19px 10px;
  opacity: .55;
}
@media (prefers-reduced-motion: no-preference) {
  .hero:not(.hero--photo)::before { animation: trackline-marquee 2.4s linear infinite; }
  @keyframes trackline-marquee { to { background-position: 26px 0, 19px 0; } }
}

/* Single-weight display face: normalize the serif-era weights and spacing.
   Balance the rag — a stacked poster headline wants composed breaks, not accidents. */
h1, h2, h3, .hero__title, .brandmark__name, .brandmark__name * { font-weight: 400; letter-spacing: 0; }
.hero__title { text-transform: uppercase; line-height: .96; letter-spacing: .012em; text-wrap: balance; }
.band__head h2 { text-transform: uppercase; letter-spacing: .012em; }

/* Signal red is strictly interactive; data reads as deep white, never as an alert.
   The 800 weights come from multi-weight display faces — under a single-weight face
   they only trigger synthetic bold. */
.hero__meta-value { color: var(--ink); }
.stat-row__value, .food-card__price { color: var(--ink); font-weight: 400; }

/* Spec plates: data reads as engineering. */
.card { border-top: 3px solid var(--accent); }
.card__meta { font-family: var(--font-mono); font-size: .66rem; letter-spacing: .05em; text-transform: uppercase; }
.card__badges { font-family: var(--font-mono); font-size: .68rem; }
.data-table th { font-family: var(--font-mono); font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; }

::selection { background: var(--accent); color: #241a08; }
`
  }
  return css
}
