import test from 'node:test'
import assert from 'node:assert/strict'
import { stat as statUrl } from 'node:fs/promises'

import { loadData, operators } from '../src/lib/data.mjs'
import { renderPage } from '../src/templates/layout.mjs'
import { html } from '../src/lib/html.mjs'
import { PALETTE_TOKENS, hasPalette, hasChrome, paletteCss, chromeCss, palettePaper } from '../src/lib/palette.mjs'
import { faviconSvg, iconPngs, HOUSE_FAVICON } from '../src/lib/icons.mjs'

const allOperators = await operators()
const paletteOperators = []
for (const o of allOperators) {
  const data = await loadData(o.slug)
  if (hasPalette(data.site)) paletteOperators.push({ slug: o.slug, site: data.site })
}

test('at least one operator declares a palette and disney ships the house tokens', async () => {
  assert.ok(paletteOperators.length >= 1, 'expected at least one operator with a brand palette')
  const disney = await loadData('disney')
  assert.equal(hasPalette(disney.site), false, 'disney defines the house tokens and needs no override')
})

/* WCAG relative luminance and contrast ratio, 2.4-gamma, as in the spec. */
function luminance (hex) {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio (fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (l1 + 0.05) / (l2 + 0.05)
}

for (const { slug, site } of paletteOperators) {
  test(`${slug}: the palette declares every token exactly once, as hex colors`, () => {
    const palette = site.brand.palette
    assert.deepEqual(
      Object.keys(palette).sort(),
      Object.keys(PALETTE_TOKENS).sort(),
      'palette keys must be exactly the known token set'
    )
    for (const [key, value] of Object.entries(palette)) {
      assert.match(value, /^#[0-9a-fA-F]{6}$/, `palette.${key} must be a #rrggbb color`)
    }
    assert.equal(palettePaper(site), palette.paper)
  })

  test(`${slug}: every text pairing the component library makes holds to WCAG AA`, () => {
    const p = site.brand.palette
    // fg, bg, minimum — pairs mirror real usage in main.css: body and secondary text on the
    // surface ladder, links in brand-2, eyebrows in accent, chips (soft bg + hue fg), primary
    // buttons and verdict boxes (#061310 on brand gradients), the must-ride pill (#241a08 on
    // accent), white band text, and the focus ring as a non-text boundary.
    const pairs = [
      ['ink', 'paper', 4.5], ['ink', 'surface', 4.5], ['ink', 'surface2', 4.5], ['ink', 'surface3', 4.5],
      ['ink2', 'paper', 4.5], ['ink2', 'surface', 4.5], ['ink2', 'surface2', 4.5],
      ['muted', 'paper', 4.5], ['muted', 'surface', 4.5], ['muted', 'surface2', 4.5],
      ['muted', 'surface3', 4.5], ['muted', 'brandSoft', 4.5],
      ['brand2', 'paper', 4.5], ['brand2', 'surface', 4.5], ['brand2', 'brandSoft', 4.5],
      ['brand3', 'paper', 4.5],
      ['accent', 'paper', 4.5], ['accent', 'surface', 4.5], ['accent', 'accentSoft', 4.5],
      ['good', 'goodSoft', 4.5], ['warn', 'warnSoft', 4.5], ['danger', 'dangerSoft', 4.5],
      ['good', 'paper', 3], ['danger', 'paper', 3], ['warn', 'paper', 3],
      ['#061310', 'brand', 4.5], ['#061310', 'brand2', 4.5], ['#241a08', 'accent', 4.5],
      ['#ffffff', 'brand', 3], ['#ffffff', 'brand2', 3],
      ['focus', 'paper', 3],
    ]
    for (const [fg, bg, min] of pairs) {
      const fgHex = fg.startsWith('#') ? fg : p[fg]
      const bgHex = bg.startsWith('#') ? bg : p[bg]
      const measured = ratio(fgHex, bgHex)
      assert.ok(
        measured >= min,
        `${slug}: ${fg} on ${bg} measures ${measured.toFixed(2)}, needs ${min} — nudge the hue's luminance, not the pairing`
      )
    }
  })

  test(`${slug}: paletteCss emits one :root override per token and refuses partial or unknown palettes`, () => {
    const css = paletteCss(site)
    for (const cssName of Object.values(PALETTE_TOKENS)) {
      assert.match(css, new RegExp(`${cssName.replace(/-/g, '\\-')}\\s*:`), `missing ${cssName}`)
    }
    assert.match(css, /^:root \{/m)

    const partial = { brand: { palette: { paper: p0(site) } } }
    assert.throws(() => paletteCss(partial), /missing token/)
    const unknown = { brand: { palette: { ...site.brand.palette, sparkle: '#ffffff' } } }
    assert.throws(() => paletteCss(unknown), /unknown token/)
  })

  test(`${slug}: the layout links operator.css between main.css and print.css, and tints to the palette paper`, () => {
    const u = renderPage({ site, page: { url: '/', title: 'Test' }, body: html`<p>x</p>` })
    const mainAt = u.indexOf('/assets/css/main.css')
    const operatorAt = u.indexOf('/assets/css/operator.css')
    const printAt = u.indexOf('/assets/css/print.css')
    assert.ok(operatorAt > -1, 'operator.css must be linked when a palette exists')
    assert.ok(mainAt > -1 && mainAt < operatorAt && operatorAt < printAt,
      'override must load after main.css (wins on screen) and before print.css (paper still wins in print)')
    assert.match(u, new RegExp(`<meta name="theme-color" content="${site.brand.palette.paper}">`))
  })

  test(`${slug}: the icon set is generated from the palette and the logoMark's letters`, () => {
    const uSvg = faviconSvg(site)
    assert.ok(uSvg.includes(site.brand.themeColor), 'favicon field is the declared brand color')
    assert.ok(uSvg.includes(site.brand.palette.accent2), 'favicon letters are the palette accent')
    assert.notEqual(uSvg, HOUSE_FAVICON)

    const pngs = iconPngs(site)
    assert.deepEqual(pngs.map((p) => p.name).sort(),
      ['icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'].sort())
    for (const png of pngs) {
      assert.deepEqual(png.buffer.subarray(0, 8),
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        `${png.name} is not a PNG`)
      const size = png.buffer.readUInt32BE(16)
      assert.ok(size >= 180, `${png.name} IHDR reports ${size}px`)
    }
  })

  // The steel pass: an operator may declare a display face and the trackline motif;
  // both live in the generated override stylesheet, never the shared one.
  if (site.brand.font) {
    test(`${slug}: the declared display face is declared and wired through the font token`, async () => {
      const css = paletteCss(site)
      assert.match(css, /@font-face\s*{[^}]*font-family: 'Archivo Black'/)
      assert.match(css, /--font-display: 'Archivo Black'/)
      const fontFile = new URL('..' + site.brand.font.file, import.meta.url)
      const stat = await statUrl(fontFile)
      assert.ok(stat && stat.size > 10000, 'the webfont file actually exists on disk')
      // Serif-era weights normalize — a single-weight face must not be faux-bolded.
      if (site.brand.motif === 'trackline') {
        assert.match(css, /font-weight: 400; letter-spacing: 0;/)
      }
    })
  }
  if (site.brand.motif === 'trackline') {
    test(`${slug}: the trackline motif ships with its motion discipline`, () => {
      const css = paletteCss(site)
      assert.match(css, /band__head h2::after, \.hero__title::after/)
      assert.match(css, /prefers-reduced-motion: no-preference/, 'the marquee chases only when motion is welcome')
      assert.match(css, /trackline-marquee/)
      assert.match(css, /::selection/)
    })

    test(`${slug}: the marquee is texture, not a pier arcade — two spacings, dimmed`, () => {
      const css = paletteCss(site)
      assert.match(css, /background-size: 26px 10px, 19px 10px;/,
        'two bulb spacings layered keep the strip from reading as a uniform arcade row')
      assert.match(css, /opacity: \.55;/, 'the strip is dimmed to sit under the headline')
    })

    test(`${slug}: poster headlines get a composed rag and data never reads as an alert`, () => {
      const css = paletteCss(site)
      assert.match(css, /\.hero__title \{[^}]*text-wrap: balance;/,
        'the display headline balances its own line breaks')
      assert.match(css, /\.hero__meta-value \{ color: var\(--ink\); \}/,
        'signal red stays interactive; hero data reads as deep white')
      assert.match(css, /\.stat-row__value, \.food-card__price \{ color: var\(--ink\); font-weight: 400; \}/,
        'stat numerals and prices are data — deep white, never faux-bolded alert red')
    })
  }
}

function p0 (site) { return site.brand.palette.paper }

test('disney ships the house tokens and floats on glass chrome instead', async () => {
  const disney = await loadData('disney')
  assert.equal(hasPalette(disney.site), false, 'disney defines the house tokens and needs no palette override')
  assert.equal(hasChrome(disney.site), true, 'disney opts into the float-glass masthead')
  assert.equal(paletteCss(disney.site), null)
  assert.equal(faviconSvg(disney.site), HOUSE_FAVICON, 'chrome changes the masthead, not the mark')
  assert.deepEqual(iconPngs(disney.site), [])

  const glass = chromeCss(disney.site)
  assert.ok(glass.includes("site-header[data-chrome='float-glass']"))
  assert.ok(glass.includes('position: fixed'), 'the static bar leaves the document flow')
  assert.ok(glass.includes('backdrop-filter'), 'the pill is glass, not paint')

  const d = renderPage({ site: disney.site, page: { url: '/', title: 'Test' }, body: html`<p>x</p>` })
  const mainAt = d.indexOf('/assets/css/main.css')
  const operatorAt = d.indexOf('/assets/css/operator.css')
  const printAt = d.indexOf('/assets/css/print.css')
  assert.ok(operatorAt > -1, 'chrome-only operators still get the override stylesheet')
  assert.ok(mainAt > -1 && mainAt < operatorAt && operatorAt < printAt, 'cascade order: main, chrome, print')
  assert.ok(d.includes('data-chrome="float-glass"'), 'the header carries its chrome for CSS and JS')
  assert.match(d, /<meta name="theme-color" content="#100f0c">/)
})

test('the glass chrome guards its motion and pays its layout debt', async () => {
  const disney = await loadData('disney')
  const glass = chromeCss(disney.site)

  const noPref = glass.match(/@media \(prefers-reduced-motion: no-preference\)/g) || []
  assert.ok(noPref.length >= 2, 'both the duck and smooth scrolling sit behind the motion gate')
  assert.ok(glass.includes('[data-hidden]'), 'scrolling down ducks the pill via data-hidden')
  assert.ok(glass.includes('scroll-behavior: smooth'))
  assert.ok(glass.includes('main { padding-top:'), 'pages that are not full-bleed get their space back')
  assert.ok(glass.includes('main:has(> .hero--photo:first-child)'), 'a photographic hero runs to the top of the screen')
  assert.ok(glass.includes('pointer-events: none;'), 'the transparent frame never eats a click meant for the page')
})

test('an unknown chrome value fails the build instead of styling nothing', async () => {
  const disney = await loadData('disney')
  const typo = structuredClone(disney.site)
  typo.brand.chrome = 'frost-glass'
  assert.throws(() => chromeCss(typo), /Unknown brand\.chrome/)
})

test('an operator with neither palette nor chrome renders the pure house shell', async () => {
  const disney = await loadData('disney')
  const plain = structuredClone(disney.site)
  delete plain.brand.chrome
  assert.equal(hasChrome(plain), false)
  assert.equal(chromeCss(plain), null)
  const d = renderPage({ site: plain, page: { url: '/', title: 'Test' }, body: html`<p>x</p>` })
  assert.equal(d.indexOf('/assets/css/operator.css'), -1, 'no override without a palette or a chrome')
  assert.equal(d.indexOf('data-chrome'), -1)
  assert.match(d, /<meta name="theme-color" content="#100f0c">/)
})
