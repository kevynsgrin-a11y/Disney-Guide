import test from 'node:test'
import assert from 'node:assert/strict'
import { loadSeasonal, assertIntegrity } from '../src/lib/seasonal-data.mjs'
import { eventPage, editionPage } from '../src/seasonal/events.mjs'

function visibleMain (page) {
  const main = page.html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)
  assert.ok(main, 'the event page must render a visible main section')
  return main[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
}

test('October 15 Fright Fest pages distinguish the checked park hours, opening ceremony and event block', async () => {
  const data = assertIntegrity(await loadSeasonal('coasterguide'))
  const event = data.eventBySlug.get('fright-fest-magic-mountain')
  const edition = event.editions.find((entry) => entry.year === 2026)
  for (const page of [eventPage(event, data), editionPage(event, edition, data)]) {
    const text = visibleMain(page)
    assert.match(text, /October 15[^.]*10:30 a\.m\. to 11 p\.m\. PDT/)
    assert.match(text, /America\/Los_Angeles/)
    assert.match(text, /October 14[^.]*closed/)
    assert.match(text, /Unleashed[^.]*6:30 p\.m\.[\s\S]*Fright Fest event block[^.]*7 to 11 p\.m\./)
    assert.match(text, /not (?:a promise|promise)[^.]*every maze opens at 6:30/)
    assert.match(text, /official app for individual times|official Six Flags app for individual/)
    assert.match(page.html, /https:\/\/www\.sixflags\.com\/magicmountain\/park-hours\?date=2026-10-15/)
  }
})

test('Fright Fest pages separate park admission, maze admission and Express without quoting a generic October 15 price', async () => {
  const data = assertIntegrity(await loadSeasonal('coasterguide'))
  const event = data.eventBySlug.get('fright-fest-magic-mountain')
  const edition = event.editions.find((entry) => entry.year === 2026)
  for (const page of [eventPage(event, data), editionPage(event, edition, data)]) {
    const text = visibleMain(page)
    assert.match(text, /park admission|paid admission ticket/i)
    assert.match(text, /Haunted Attractions Pass/)
    assert.match(text, /bundle explicitly includes|explicitly includes park admission|selected bundle explicitly includes/)
    assert.match(text, /Express[^.]*separate|Maze Express is a separate/)
    assert.match(text, /ordinary ride Fast Lane does not establish maze/i)
    assert.match(text, /not recommended for children under 13/)
    assert.match(text, /not a stated[^.]*prohibition|not a stated[^.]*admission ban|not a stated admission prohibition/)
    assert.match(text, /Re-entry is not permitted after 9 p\.m\./)
    assert.match(text, /No October 15 checkout (?:price|total)[^.]*verified/)
    assert.doesNotMatch(text, /\$(?:25|74|69)\b/)
  }
})
