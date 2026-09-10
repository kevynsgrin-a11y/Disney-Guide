import test from 'node:test'
import assert from 'node:assert/strict'

import { loadData } from '../src/lib/data.mjs'
import { renderPage } from '../src/templates/layout.mjs'
import { html } from '../src/lib/html.mjs'
import { PALETTE_TOKENS, hasPalette, paletteCss, palettePaper } from '../src/lib/palette.mjs'
import { faviconSvg, iconPngs, HOUSE_FAVICON } from '../src/lib/icons.mjs'

const universal = await loadData('universal')
const disney = await loadData('disney')

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

test('the universal palette declares every token exactly once, as hex colors', () => {
  const palette = universal.site.brand.palette
  assert.ok(hasPalette(universal.site), 'universal should declare a brand palette')
  assert.deepEqual(
    Object.keys(palette).sort(),
    Object.keys(PALETTE_TOKENS).sort(),
    'palette keys must be exactly the known token set'
  )
  for (const [key, value] of Object.entries(palette)) {
    assert.match(value, /^#[0-9a-fA-F]{6}$/, `palette.${key} must be a #rrggbb color`)
  }
})

test('universal has a palette, disney ships the house tokens', () => {
  assert.equal(hasPalette(universal.site), true)
  assert.equal(hasPalette(disney.site), false)
  assert.equal(palettePaper(universal.site), universal.site.brand.palette.paper)
  assert.equal(palettePaper(disney.site), null)
})

test('the palette holds every text pairing the component library makes to WCAG AA', () => {
  const p = universal.site.brand.palette
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
      `${fg} on ${bg} measures ${measured.toFixed(2)}, needs ${min} — nudge the hue's luminance, not the pairing`
    )
  }
})

test('paletteCss emits one :root override per token and refuses partial or unknown palettes', () => {
  const css = paletteCss(universal.site)
  for (const cssName of Object.values(PALETTE_TOKENS)) {
    assert.match(css, new RegExp(`${cssName.replace(/-/g, '\\-')}\\s*:`), `missing ${cssName}`)
  }
  assert.match(css, /^:root \{/m)
  assert.equal(paletteCss(disney.site), null)

  const partial = { brand: { palette: { paper: '#07111D' } } }
  assert.throws(() => paletteCss(partial), /missing token/)
  const unknown = { brand: { palette: { ...universal.site.brand.palette, sparkle: '#ffffff' } } }
  assert.throws(() => paletteCss(unknown), /unknown token/)
})

test('the layout links operator.css between main.css and print.css, and tints to the palette paper', () => {
  const u = renderPage({ site: universal.site, page: { url: '/', title: 'Test' }, body: html`<p>x</p>` })
  const mainAt = u.indexOf('/assets/css/main.css')
  const operatorAt = u.indexOf('/assets/css/operator.css')
  const printAt = u.indexOf('/assets/css/print.css')
  assert.ok(operatorAt > -1, 'operator.css must be linked when a palette exists')
  assert.ok(mainAt > -1 && mainAt < operatorAt && operatorAt < printAt,
    'override must load after main.css (wins on screen) and before print.css (paper still wins in print)')
  assert.match(u, new RegExp(`<meta name="theme-color" content="${universal.site.brand.palette.paper}">`))

  const d = renderPage({ site: disney.site, page: { url: '/', title: 'Test' }, body: html`<p>x</p>` })
  assert.equal(d.indexOf('/assets/css/operator.css'), -1, 'no override without a palette')
  assert.match(d, /<meta name="theme-color" content="#100f0c">/)
})

test('an operator with a palette gets its own icon set; disney keeps the house mark untouched', () => {
  const uSvg = faviconSvg(universal.site)
  assert.ok(uSvg.includes(universal.site.brand.themeColor), 'favicon field is the declared brand color')
  assert.ok(uSvg.includes(universal.site.brand.palette.accent2), 'favicon letters are the palette accent')
  assert.notEqual(uSvg, HOUSE_FAVICON)

  assert.equal(faviconSvg(disney.site), HOUSE_FAVICON)
  assert.deepEqual(iconPngs(disney.site), [])

  const pngs = iconPngs(universal.site)
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
