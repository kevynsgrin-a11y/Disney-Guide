import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { serviceWorkerVersion } from '../src/build.mjs'

test('same-count accuracy corrections and script/style changes invalidate offline content revisions', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'coasterready-cache-revision-'))
  try {
    await mkdir(join(dist, 'assets', 'js'), { recursive: true })
    await mkdir(join(dist, 'assets', 'css'), { recursive: true })
    await writeFile(join(dist, 'assets', 'js', 'height-checker.js'), 'const height = 48')
    await writeFile(join(dist, 'assets', 'css', 'main.css'), 'body { color: black }')
    const data = { operator: 'coasterguide' }
    const pages = [{ url: '/rides/', html: 'Gold Rusher 48' }, { url: '/', html: 'Home' }]
    const revision = () => serviceWorkerVersion(data, pages, dist, 'worker-template')
    const original = await revision()
    assert.equal(await serviceWorkerVersion(data, [...pages].reverse(), dist, 'worker-template'), original)
    pages[0].html = 'Gold Rusher 49'
    assert.notEqual(await revision(), original, 'same page count cannot retain obsolete height HTML')
    pages[0].html = 'Gold Rusher 48'
    await writeFile(join(dist, 'assets', 'js', 'height-checker.js'), 'const height = 54')
    const changedScript = await revision()
    assert.notEqual(changedScript, original, 'corrected scripts require a new cache')
    await writeFile(join(dist, 'assets', 'css', 'main.css'), 'body { color: navy }')
    const changedStyle = await revision()
    assert.notEqual(changedStyle, changedScript, 'changed styles require a new cache')
    await writeFile(join(dist, 'search-index.json'), '[{"name":"Gold Rusher"}]')
    const changedSearch = await revision()
    assert.notEqual(changedSearch, changedStyle, 'search or status data changes require a new cache')
    await mkdir(join(dist, 'maps'))
    await writeFile(join(dist, 'maps', 'magic-mountain-map.svg'), '<svg><title>Coverage diagram</title></svg>')
    assert.notEqual(await revision(), changedSearch, 'map corrections require a new cache')
    assert.notEqual(await serviceWorkerVersion(data, pages, dist, 'changed-worker'), await revision())
  } finally {
    await rm(dist, { recursive: true, force: true })
  }
})
