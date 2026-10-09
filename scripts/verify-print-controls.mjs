/** Native-click regression under the generated production CSP. Requires an explicit local browser. */
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright-core'
import { buildHeaders } from '../src/build.mjs'
import { loadData, ROOT } from '../src/lib/data.mjs'
import { mapPage } from '../src/pages/park.mjs'
import { dayBlueprintPage, roadTripPage } from '../src/pages/tools.mjs'

const executablePath = process.argv[2] || process.env.COASTERREADY_CHROMIUM_EXECUTABLE
if (!executablePath) throw new Error('Usage: node scripts/verify-print-controls.mjs /path/to/chromium [report.json]')

const data = await loadData('coasterguide')
const pages = [mapPage(data.parkBySlug.get('magic-mountain'), data), dayBlueprintPage(data), roadTripPage(data)]
const rendered = new Map(pages.map((page) => [page.url, page.html]))
const csp = buildHeaders().split('\n').find((line) => line.includes('Content-Security-Policy:')).split(': ').slice(1).join(': ').trim()
const scriptPolicy = csp.split(';').find((directive) => directive.trim().startsWith('script-src '))
assert.match(scriptPolicy, /'self'/)
assert.doesNotMatch(scriptPolicy, /unsafe-inline|unsafe-hashes|unsafe-eval/)

const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname
  response.setHeader('Content-Security-Policy', csp)
  if (rendered.has(path)) {
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(rendered.get(path))
    return
  }
  if (path.startsWith('/assets/')) {
    try {
      const body = await readFile(join(ROOT, path))
      const mime = path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream'
      response.setHeader('Content-Type', mime)
      response.end(body)
      return
    } catch { /* Missing optional assets must not hide a handler failure. */ }
  }
  response.statusCode = 404
  response.end('Not found')
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
let browser
const report = { verifiedAt: new Date().toISOString(), browserExecutable: executablePath, csp, checks: [], inlineHandlerViolations: [] }
try {
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] })
  const context = await browser.newContext({ serviceWorkers: 'block' })
  await context.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
  await context.addInitScript(() => {
    window.__printCalls = 0
    window.print = () => { window.__printCalls++ }
  })
  const page = await context.newPage()
  page.on('console', (message) => {
    if (/inline event handler.*Content Security Policy/i.test(message.text())) report.inlineHandlerViolations.push(message.text())
  })

  for (const renderedPage of pages) {
    const response = await page.goto(origin + renderedPage.url)
    assert.equal(response.headers()['content-security-policy'], csp)
    if (renderedPage.url.endsWith('/map/')) {
      await page.getByRole('button', { name: 'Print this map', exact: true }).click()
      assert.equal(await page.evaluate(() => window.__printCalls), 1)
      report.checks.push({ path: renderedPage.url, nativePrintClicks: 1, printCalls: 1 })
    } else {
      const blueprint = renderedPage.url.includes('day-blueprint')
      if (blueprint) await page.locator('select[name="park"]').selectOption({ label: 'Six Flags Magic Mountain' })
      else {
        await page.locator('input[name="park"][value="magic-mountain"]').check()
        await page.locator('input[name="park"][value="knotts-berry-farm"]').check()
      }
      for (let expected = 1; expected <= 2; expected++) {
        await page.getByRole('button', { name: blueprint ? 'Build the plan' : 'Combine', exact: true }).click()
        await page.getByRole('button', { name: blueprint ? 'Print this plan' : 'Print the itinerary', exact: true }).click()
        assert.equal(await page.evaluate(() => window.__printCalls), expected, 'regenerated output must bind its current print button exactly once')
      }
      report.checks.push({ path: renderedPage.url, nativePrintClicks: 2, printCalls: 2, regenerationChecked: true })
    }
  }
  assert.deepEqual(report.inlineHandlerViolations, [])
  report.passed = true
  if (process.argv[3]) await writeFile(process.argv[3], JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally {
  if (browser) await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
