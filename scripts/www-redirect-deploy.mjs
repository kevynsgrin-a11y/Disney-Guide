/* Deploy the www->apex 301: upload workers/www-redirect, then for each listed
   site detach www from the Pages project, drop the www CNAME, and reattach www
   as a Workers Custom Domain on the redirect worker (which recreates DNS +
   cert itself). Vault credentials read at moment of use; names/statuses only.

   Run: node scripts/www-redirect-deploy.mjs hollywoodrideguide.com coasterready.com
   (default: both). Re-runnable; each step is idempotent or fails harmlessly. */
import { readFileSync } from 'node:fs'

const sites = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['hollywoodrideguide.com', 'coasterready.com']

const env = readFileSync('C:/Users/Dell/.ops-vault/cloudflare.env', 'utf8')
const kv = Object.fromEntries(env.split(/\r?\n/).filter((l) => l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
const account = kv.CLOUDFLARE_ACCOUNT_ID
if (!account || !kv.CLOUDFLARE_API_TOKEN) throw new Error('cloudflare.env incomplete (needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID)')
const H = { Authorization: `Bearer ${kv.CLOUDFLARE_API_TOKEN}` }
const cf = (path, init) => fetch(`https://api.cloudflare.com/client/v4${path}`, { headers: H, ...init }).then((r) => r.json())
const pages = (p, init) => cf(`/accounts/${account}/pages${p}`, init)

// 1. Upload the worker (module worker, multipart metadata + entry).
const script = readFileSync(new URL('../workers/www-redirect/www-redirect.mjs', import.meta.url), 'utf8')
const form = new FormData()
form.append('metadata', new Blob([JSON.stringify({ main_module: 'www-redirect.mjs', compatibility_date: '2026-09-01' })], { type: 'application/json' }), 'metadata.json')
form.append('www-redirect.mjs', new Blob([script], { type: 'application/javascript+module' }), 'www-redirect.mjs')
const up = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/www-redirect`, {
  method: 'PUT', headers: H, body: form,
}).then((r) => r.json())
console.log('upload worker:', up.success ? 'OK' : JSON.stringify(up.errors))
if (!up.success) process.exit(1)

for (const site of sites) {
  const www = `www.${site}`
  const pagesProject = site === 'hollywoodrideguide.com' ? 'hollywoodrideguide' : site === 'coasterready.com' ? 'coasterready' : site.replace(/\./g, '-')
  const z = await cf(`/zones?name=${site}`)
  if (!z.result?.length) { console.log(`${site}: zone NOT FOUND, skipped`); continue }
  const zoneId = z.result[0].id

  // 2a. Detach www from the Pages project (Pages edit).
  const det = await pages(`/projects/${pagesProject}/domains/${www}`, { method: 'DELETE' })
  console.log(`${site}: detach www from Pages —`, det.success ? 'OK' : det.errors?.[0]?.code === 8000007 ? 'was not attached' : JSON.stringify(det.errors))

  // 2b. Drop the existing www record so the custom-domain attach owns it (DNS edit).
  const recs = await cf(`/zones/${zoneId}/dns_records?name=${www}`)
  for (const rec of recs.result || []) {
    const del = await cf(`/zones/${zoneId}/dns_records/${rec.id}`, { method: 'DELETE' })
    console.log(`${site}: delete www ${rec.type} record —`, del.success ? 'OK' : JSON.stringify(del.errors))
  }

  // 2c. Attach www to the worker as a custom domain (Workers edit; recreates DNS + cert).
  const att = await cf(`/accounts/${account}/workers/domains`, {
    method: 'PUT',
    headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ environment: 'production', hostname: www, service: 'www-redirect', zone_id: zoneId }),
  })
  console.log(`${site}: attach www to redirect worker —`, att.success ? 'OK' : JSON.stringify(att.errors))
}
console.log('done — verify with: curl -sI https://www.<site>/ | head -1 (expect 301 to apex once the cert is issued, usually < 1 min)')
