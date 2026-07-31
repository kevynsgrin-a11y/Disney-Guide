/**
 * Minimal static server for local preview of a built site.
 *
 * Takes the directory as an argument so the same server previews both sites:
 *   node scripts/serve.mjs            → dist/
 *   node scripts/serve.mjs dist-seasonal
 * Resolves pretty URLs to index.html, serves _headers-style caching for assets, and returns
 * the built 404 page. Node built-ins only — nothing to install.
 */

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = process.argv[2] || 'dist'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', DIR)
const PORT = Number(process.env.PORT || 4321)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
}

async function resolve (pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0])
  if (clean.includes('..')) return null
  const candidates = extname(clean)
    ? [join(ROOT, clean)]
    : [join(ROOT, clean, 'index.html'), join(ROOT, clean.replace(/\/$/, '') + '.html')]
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate)
      if (info.isFile()) return candidate
    } catch { /* try the next candidate */ }
  }
  return null
}

createServer(async (req, res) => {
  const file = await resolve(new URL(req.url, 'http://localhost').pathname)
  if (!file) {
    const notFound = join(ROOT, '404.html')
    try {
      res.writeHead(404, { 'content-type': TYPES['.html'] })
      res.end(await readFile(notFound))
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('Not found')
    }
    return
  }
  const ext = extname(file)
  res.writeHead(200, {
    'content-type': TYPES[ext] || 'application/octet-stream',
    'cache-control': file.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  res.end(await readFile(file))
}).listen(PORT, () => {
  console.log(`\n  Serving ${DIR}/ at http://localhost:${PORT}\n`)
})
