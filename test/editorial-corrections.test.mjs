import test from 'node:test'
import assert from 'node:assert/strict'
import { loadData, urls } from '../src/lib/data.mjs'
import { legalPages } from '../src/pages/legal.mjs'
import { careerLadderPage, dayBlueprintPage, foodTrackerPage } from '../src/pages/tools.mjs'

test('misassigned SeaWorld URLs survive as corrections without ride eligibility or attraction schema', async () => {
  const data = await loadData('coasterguide')
  const pages = legalPages(data)
  for (const url of ['/texas/seaworld-san-antonio/rides/iron-rattler/', '/texas/seaworld-san-antonio/lands/crackaxle-canyon/']) {
    const page = pages.find((page) => page.url === url)
    assert.ok(page, `preserve ${url}`)
    assert.match(page.html, /Six Flags Fiesta Texas/)
    assert.match(page.html, /https:\/\/www\.sixflags\.com\/fiestatexas\/attractions\/iron-rattler/)
    assert.doesNotMatch(page.html, /"@type":"TouristAttraction"|data-height-in|data-rider-restrictions/)
  }
  assert.ok(!data.parkBySlug.get('seaworld-san-antonio').attractions.some((ride) => ride.slug === 'iron-rattler'))
  assert.match(careerLadderPage(data).html, /creditCorrections/)
})

test('editorial copy separates independence, source checks, planned visits and written media permission', async () => {
  const data = await loadData('coasterguide')
  const pages = legalPages(data)
  const about = pages.find((page) => page.url === urls.about()).html
  const editorial = pages.find((page) => page.url === urls.editorial()).html
  const privacy = pages.find((page) => page.url === urls.privacy()).html
  assert.match(about, /independent, unofficial/)
  assert.match(about, /no expectation of complimentary admission, compensation, promotion or reciprocal coverage/)
  assert.match(about, /scheduled visit is not a completed visit or tasting/)
  assert.match(about, /illustrative, including generated assets/)
  assert.doesNotMatch(about, /will still be true in 2031|submit nothing here for anybody/)
  assert.match(editorial, /scheduled email is not permission/)
  assert.match(editorial, /Cameras of any kind are prohibited on rides at all times/)
  assert.match(editorial, /prohibited inside haunted mazes/)
  assert.match(editorial, /source-check date records the check actually performed/)
  assert.match(privacy, /rider-profiles/)
  assert.match(privacy, /career-credits/)
  assert.match(privacy, /Blocked or full storage/)
})

test('tool metadata describes conditional storage and cached offline access without obsolete park counts', async () => {
  const data = await loadData('coasterguide')
  for (const page of [foodTrackerPage(data), dayBlueprintPage(data)]) {
    assert.match(page.html, /offline access requires a previously cached page/i)
    assert.doesNotMatch(page.html, /all six US parks|all of it keeps working|Free, offline, no account/)
  }
})
