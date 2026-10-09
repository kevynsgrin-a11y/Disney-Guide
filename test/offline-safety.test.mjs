import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

async function workerHarness (initialCaches, clients = []) {
  const origin = 'https://coasterready.example'
  const cachesByName = new Map(initialCaches)
  const handlers = {}
  const deleted = []
  const claimed = []
  const keyFor = (request) => new URL(typeof request === 'string' ? request : request.url, origin).href
  const cacheStore = {
    keys: async () => [...cachesByName.keys()],
    delete: async (name) => { deleted.push(name); return cachesByName.delete(name) },
    open: async (name) => {
      if (!cachesByName.has(name)) cachesByName.set(name, new Map())
      const entries = cachesByName.get(name)
      return {
        match: async (request) => entries.get(keyFor(request))?.clone(),
        put: async (request, response) => { entries.set(keyFor(request), response) },
      }
    },
  }
  const self = {
    location: { origin },
    registration: { scope: `${origin}/` },
    clients: { claim: async () => { claimed.push(true) }, matchAll: async () => clients },
    skipWaiting: async () => {},
    addEventListener: (name, handler) => { handlers[name] = handler },
  }
  const source = await readFile(new URL('../assets/sw.js', import.meta.url), 'utf8')
  runInNewContext(source.replace('__VERSION__', 'corrected').replace('__PRECACHE__', '[]'), {
    self, caches: cacheStore, URL, Request, Response, Promise,
    fetch: async () => { throw new Error('Offline') },
  })
  return { origin, handlers, cachesByName, deleted, claimed }
}

test('offline upgrade preserves foreign caches and finishes activation before refreshed navigation completes', async () => {
  let navigations = 0
  const worker = await workerHarness([
    ['rrg-runtime-legacy', new Map()], ['rrg-precache-legacy', new Map()],
    ['rrg-runtime-corrected', new Map()], ['rrg-precache-corrected', new Map()],
    ['another-app-cache', new Map()],
  ], [
    { url: 'https://coasterready.example/tools/height-checker/', navigate: () => { navigations++; return new Promise(() => {}) } },
    { url: 'https://other-app.example/', navigate: () => { throw new Error('A foreign client must not be refreshed') } },
  ])
  let activation
  worker.handlers.activate({ waitUntil: (promise) => { activation = promise } })
  let timer
  try {
    const outcome = await Promise.race([
      activation.then(() => 'activated'),
      new Promise((resolve) => { timer = setTimeout(() => resolve('navigation deadlock'), 250) }),
    ])
    assert.equal(outcome, 'activated', 'controlled navigation must not hold the activating worker open')
  } finally { clearTimeout(timer) }
  assert.equal(navigations, 1)
  assert.equal(worker.claimed.length, 1)
  assert.deepEqual(worker.deleted.sort(), ['rrg-precache-legacy', 'rrg-runtime-legacy'])
  assert.ok(worker.cachesByName.has('another-app-cache'))
  assert.ok(worker.cachesByName.has('rrg-precache-corrected'))
})

test('offline fallback cannot serve obsolete HTML from old or unrelated caches', async () => {
  const pageUrl = 'https://coasterready.example/tools/height-checker/'
  const obsolete = () => new Response('<p>Gold Rusher: any height; X2 open</p>')
  const worker = await workerHarness([
    ['rrg-runtime-legacy', new Map([[pageUrl, obsolete()]])],
    ['another-app-cache', new Map([[pageUrl, obsolete()]])],
    ['rrg-precache-corrected', new Map([['https://coasterready.example/offline/', new Response('<p>Current offline fallback</p>')]])],
  ])
  let response
  worker.handlers.fetch({
    request: { method: 'GET', url: pageUrl, mode: 'navigate', headers: { get: () => 'text/html' } },
    respondWith: (promise) => { response = promise },
    waitUntil: () => {},
  })
  const body = await (await response).text()
  assert.match(body, /Current offline fallback/)
  assert.doesNotMatch(body, /Gold Rusher|X2/)
})
