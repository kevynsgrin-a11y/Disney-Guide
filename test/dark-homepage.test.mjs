import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

import { loadData } from '../src/lib/data.mjs'
import { loadSeasonal } from '../src/lib/seasonal-data.mjs'
import { homePage } from '../src/pages/core.mjs'
import { ganttBands, bandCovers, BUILD_MONTH_NUMBER } from '../src/seasonal/core.mjs'

const root = new URL('..', import.meta.url)
const css = await readFile(new URL('./assets/css/main.css', root), 'utf8')
const layout = await readFile(new URL('./src/templates/layout.mjs', root), 'utf8')

test('the site has one complete warm dark-only token system', () => {
  for (const token of [
    '--paper', '--surface', '--surface-2', '--surface-3', '--ink', '--ink-2', '--muted',
    '--line', '--line-strong', '--brand', '--brand-2', '--brand-3', '--brand-soft',
    '--accent', '--accent-2', '--accent-soft', '--font-sans', '--font-display', '--font-mono',
    '--space-1', '--space-9', '--step--2', '--step-5', '--shell', '--gutter',
  ]) assert.match(css, new RegExp(`${token}\\s*:`), `missing ${token}`)

  assert.doesNotMatch(css, /data-theme|prefers-color-scheme|data-lamp|palette--dawn/)
  assert.doesNotMatch(layout, /data-theme|THEME_BOOTSTRAP|light dark/)
})

test('the home page renders the configured confirmed Halloween spotlight and non-blocking landing bats', async () => {
  const data = await loadData('disney')
  const seasonal = await loadSeasonal('disney', data)
  const running = ganttBands(seasonal).filter((band) => bandCovers(band, BUILD_MONTH_NUMBER)).map((band) => band.event)
  const page = homePage(data, seasonal).html

  assert.match(page, /data-landing-bats aria-hidden="true"/)
  assert.match(page, /Halloween is already here at both resorts/)
  assert.equal((page.match(/spotlight__status--confirmed/g) || []).length, 3)

  const entries = [
    'Halloween Time',
    'Not-So-Scary',
    'Oogie Boogie Bash',
  ].map((label) => page.indexOf(label))
  assert.ok(entries.every((index) => index >= 0), 'configured Halloween cards were not rendered')
  assert.deepEqual(entries.slice().sort((a, b) => a - b), entries, 'spotlight card order drifted')
  assert.equal(running.filter((event) => event.season === 'halloween').length >= 3, true)
})

test('landing bats remain decorative and clear after their three-second sequence', () => {
  assert.match(css, /\.landing-bats\s*\{[^}]*pointer-events:\s*none/s)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\), \(prefers-contrast: more\) \{ \.landing-bats \{ display: none; \} \}/)
})
