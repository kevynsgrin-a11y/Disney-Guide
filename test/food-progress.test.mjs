import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

async function tracker (storage = new Map()) {
  const source = await readFile(new URL('../assets/js/food-tracker.js', import.meta.url), 'utf8')
  const testable = source.replace('(function () {', 'return (function () {')
    .replace(/  ready\(function \(\) \{[\s\S]*$/, `  return {
      counts: function (inputCards, savedState, shareOrder) {
        cards = inputCards; state = savedState; order = shareOrder; return counts()
      }, read: read, write: write, encode: encode, decode: decode
    }
  })()`)
  return new Function('localStorage', testable)({
    getItem (key) { return storage.get(key) ?? null },
    setItem (key, value) { storage.set(key, value) },
  })
}

const card = (id) => ({ getAttribute () { return id } })

test('food progress counts unique active rendered IDs and excludes saved tombstones', async () => {
  const api = await tracker()
  const state = { live: 'tried', wanted: 'want', skipped: 'skip', removed: 'tried', 'removed-want': 'want' }
  const saved = structuredClone(state)
  const counts = api.counts([card('live'), card('live'), card('wanted'), card('skipped'), card('unset')], state, ['live', 'removed', 'wanted', 'skipped', 'unset', 'removed-want'])
  assert.deepEqual(counts, { total: 4, tried: 1, want: 1, skip: 1 })
  assert.deepEqual(state, saved, 'counting does not delete removed-food saved state')
  assert.deepEqual(api.counts([], state, ['removed']), { total: 0, tried: 0, want: 0, skip: 0 })
})

test('food tombstones keep their local storage state and append-only share positions', async () => {
  const storage = new Map()
  const api = await tracker(storage)
  const state = { removed: 'tried', live: 'want' }
  api.write(state)
  const loaded = api.read()
  assert.deepEqual(loaded, state)
  const oldOrder = ['removed', 'live']
  const token = api.encode(oldOrder, loaded)
  assert.deepEqual(api.decode([...oldOrder, 'new-food'], token), state)
  assert.deepEqual(api.counts([card('live'), card('new-food')], loaded, [...oldOrder, 'new-food']), { total: 2, tried: 0, want: 1, skip: 0 })
  assert.deepEqual(JSON.parse(storage.get('rrg-food')).state, state, 'active progress leaves the saved tombstone intact')
})
