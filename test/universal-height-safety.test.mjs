import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const data = new URL('../data/universal/', import.meta.url)

async function json (path) {
  return JSON.parse(await readFile(new URL(path, data), 'utf8'))
}

test('Universal rider minima match verified operator rules for the corrected rides', async () => {
  const [florida, islands, epic] = await Promise.all([
    json('parks/universal-studios-florida/attractions.json'),
    json('parks/islands-of-adventure/attractions.json'),
    json('parks/epic-universe/attractions.json'),
  ])
  const ride = (park, slug) => park.attractions.find((a) => a.slug === slug)
  const examples = [
    [ride(florida, 'fast-and-furious-supercharged'), 40],
    [ride(islands, 'flight-of-the-hippogriff'), 36],
    [ride(islands, 'high-in-the-sky-seuss-trolley-train-ride'), 36],
    [ride(epic, 'harry-potter-and-the-battle-at-the-ministry'), 40],
  ]
  for (const [attraction, minimum] of examples) {
    assert.equal(attraction.heightIn, minimum, attraction.name)
    assert.match(attraction.heightNote, /supervising companion/i, attraction.name)
    assert.match(attraction.heightNote, /^Universal .*Source: https:\/\/www\.universalorlando\.com\//, attraction.name)
  }

  const fyreDrill = ride(epic, 'fyre-drill')
  assert.equal(fyreDrill.heightIn, null)
  assert.match(fyreDrill.heightNote, /no numerical minimum/i)
  assert.match(fyreDrill.heightNote, /under 48 inches require a supervising companion/i)
  assert.match(fyreDrill.heightNote, /hand-held infants are not permitted/i)
})

test('Universal height guide rows and cumulative bands agree with attraction data', async () => {
  const [guide, ...parks] = await Promise.all([
    json('guides/height-requirements.json'),
    ...['universal-studios-florida', 'islands-of-adventure', 'epic-universe', 'universal-studios-hollywood']
      .map((slug) => json(`parks/${slug}/attractions.json`)),
  ])
  const rides = parks.flatMap((park) => park.attractions)
    .filter((attraction) => attraction.status === 'open' && attraction.heightIn != null)
  const rows = guide.sections
    .filter((section) => section.id === 'orlando-table' || section.id === 'hollywood-table')
    .flatMap((section) => section.table.rows)
  assert.equal(rows.length, rides.length)

  const expected = new Map()
  for (const attraction of rides) expected.set(attraction.heightIn, (expected.get(attraction.heightIn) || 0) + 1)
  const actual = new Map()
  for (const row of rows) {
    const height = Number.parseInt(row[2], 10)
    actual.set(height, (actual.get(height) || 0) + 1)
  }
  assert.deepEqual(actual, expected)

  let cleared = 0
  for (const [heightLabel, atStick, cumulative] of guide.sections.find((section) => section.id === 'what-each-inch-buys').table.rows) {
    const height = Number.parseInt(heightLabel, 10)
    assert.equal(Number(atStick), expected.get(height), heightLabel)
    cleared += Number(atStick)
    assert.equal(Number(cumulative), cleared, heightLabel)
  }
  assert.equal(cleared, 42)
})
