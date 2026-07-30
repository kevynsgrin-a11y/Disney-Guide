/**
 * Schematic park map renderer.
 *
 * Maps are our own artwork. Geometry is authored from open geographic data and public aerial
 * imagery — where an attraction physically sits is a fact and is not copyrightable. Nothing here
 * is traced from, derived from, or styled after any official park map, and no character or logo
 * artwork appears. The rendered SVG is a "Produced Work" in ODbL terms: we credit OpenStreetMap
 * contributors, and the artwork itself carries no share-alike obligation.
 *
 * Output is plain inline SVG: no runtime library, no tile server, no network requests, prints
 * cleanly in black and white, and works with the network off.
 */

import { html, raw, escapeHtml } from './html.mjs'

/* A calm, colour-blind-safe land palette. Deliberately muted so labels and markers stay legible. */
const LAND_COLORS = [
  '#cfe0d4', '#e4dcc6', '#d6dbe8', '#e6d4d0', '#d3e2e4',
  '#e0dbe9', '#dbe4cd', '#e8ded1', '#cfdde3', '#e5dce6',
]

const pointsAttr = (points) => points.map(([x, y]) => `${round(x)},${round(y)}`).join(' ')
const round = (n) => Math.round(Number(n) * 10) / 10

function pathD (points) {
  if (!points || points.length < 2) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(p[0])} ${round(p[1])}`).join(' ')
}

function centroid (points) {
  let x = 0
  let y = 0
  for (const p of points) { x += p[0]; y += p[1] }
  return [x / points.length, y / points.length]
}

/**
 * Fallback geometry: a hub-and-spoke schematic derived from the park's declared land order.
 * Honest but generic — used only when a park has no authored map.json yet, and labelled as a
 * layout diagram rather than a map.
 */
function syntheticMap (park) {
  const lands = park.lands || []
  if (!lands.length) return null
  const W = 1000
  const H = 820
  const cx = W / 2
  const cy = H / 2 - 20
  const inner = 120
  const outer = 330
  const step = (Math.PI * 2) / lands.length
  const start = -Math.PI / 2 - step / 2

  const wedge = (i) => {
    const a0 = start + step * i
    const a1 = a0 + step * 0.94
    const pts = []
    for (let t = 0; t <= 1.001; t += 0.125) pts.push([cx + Math.cos(a0 + (a1 - a0) * t) * outer, cy + Math.sin(a0 + (a1 - a0) * t) * outer])
    for (let t = 1; t >= -0.001; t -= 0.25) pts.push([cx + Math.cos(a0 + (a1 - a0) * t) * inner, cy + Math.sin(a0 + (a1 - a0) * t) * inner])
    return pts
  }

  return {
    synthetic: true,
    viewBox: [0, 0, W, H],
    note: 'Layout diagram — relative land positions only, not to scale.',
    lands: lands.map((land, i) => {
      const mid = start + step * i + step / 2
      return {
        slug: land.slug,
        label: land.name,
        points: wedge(i),
        labelAt: [cx + Math.cos(mid) * ((inner + outer) / 2), cy + Math.sin(mid) * ((inner + outer) / 2)],
      }
    }),
    markers: [{ kind: 'entrance', at: [cx, cy + outer + 55], label: 'Main entrance' }],
    paths: [],
    water: [],
  }
}

function wrapLabel (text, max = 16) {
  const words = String(text).split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    if ((line + ' ' + word).trim().length > max && line) { lines.push(line); line = word }
    else line = (line + ' ' + word).trim()
  }
  if (line) lines.push(line)
  return lines
}

function renderMarker (marker, park) {
  const [x, y] = marker.at
  const kind = marker.kind || 'attraction'
  const radius = kind === 'entrance' ? 9 : kind === 'headliner' ? 8 : 6
  const target = marker.slug
    ? (park.attractionBySlug.get(marker.slug) || park.diningBySlug.get(marker.slug) || null)
    : null
  const label = marker.label || (target ? target.name : '')
  const lines = wrapLabel(label, kind === 'entrance' ? 22 : 18)
  const classes = `marker marker--${kind}`

  const glyph = html`
    <g class="${classes}">
      <circle cx="${round(x)}" cy="${round(y)}" r="${radius}"/>
      ${lines.map((line, i) => html`<text x="${round(x)}" y="${round(y + radius + 12 + i * 11)}">${line}</text>`)}
      <circle class="marker-hit" cx="${round(x)}" cy="${round(y)}" r="22"/>
    </g>
  `

  if (target && target.hasPage) {
    return html`<a href="${target.url}" aria-label="${label}">${glyph}</a>`
  }
  return glyph
}

/**
 * @param {object} park  a park record from loadData()
 * @returns {{svg: import('./html.mjs').Raw, synthetic: boolean, note: string}|null}
 */
export function renderParkMap (park) {
  const map = park.map || syntheticMap(park)
  if (!map) return null

  const [vx, vy, vw, vh] = map.viewBox || [0, 0, 1000, 820]
  const lands = map.lands || []

  const svg = html`
    <svg class="parkmap" viewBox="${`${vx} ${vy} ${vw} ${vh}`}" role="img"
         aria-label="Schematic map of ${park.name} showing each land and its main attractions"
         xmlns="http://www.w3.org/2000/svg">
      <title>${park.name} — schematic park map</title>
      <desc>${map.note || 'Schematic layout of each land and its major attractions. Not to scale.'}</desc>

      <g class="lands">
        ${lands.map((land, i) => html`
          <polygon class="land-shape" data-land="${land.slug || ''}"
                   points="${pointsAttr(land.points)}"
                   fill="${land.color || LAND_COLORS[i % LAND_COLORS.length]}"/>
        `)}
      </g>

      ${(map.water || []).length ? html`
        <g class="waters">
          ${(map.water || []).map((w) => html`<polygon class="water" points="${pointsAttr(w.points)}"/>`)}
        </g>` : ''}

      ${(map.paths || []).length ? html`
        <g class="paths">
          ${(map.paths || []).map((p) => html`<path class="path-line" d="${pathD(p.points)}"/>`)}
        </g>` : ''}

      <g class="land-labels">
        ${lands.map((land) => {
          const at = land.labelAt || centroid(land.points)
          const lines = wrapLabel(land.label, 18)
          return html`
            <text class="land-label" x="${round(at[0])}" y="${round(at[1] - (lines.length - 1) * 8)}">
              ${lines.map((line, i) => html`<tspan x="${round(at[0])}" dy="${i === 0 ? 0 : 17}">${line}</tspan>`)}
            </text>
          `
        })}
      </g>

      <g class="markers">
        ${(map.markers || []).map((m) => renderMarker(m, park))}
      </g>
    </svg>
  `

  return { svg, synthetic: Boolean(map.synthetic), note: map.note || '' }
}

export { LAND_COLORS }
