/* Launch step 3 (corrected): HRG project recreation with domain detach first, DNS with full
   zone IDs resolved by name. Vault credentials read at moment of use; names/statuses only. */
import { readFileSync } from 'node:fs'

const env = readFileSync('C:/Users/Dell/.ops-vault/cloudflare.env', 'utf8')
const kv = Object.fromEntries(env.split(/\r?\n/).filter((l) => l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
const account = kv.CLOUDFLARE_ACCOUNT_ID
const headers = { Authorization: `Bearer ${kv.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' }
const cf = (url, init) => fetch(url, { headers, ...init }).then((r) => r.json())
const pages = (path, init) => cf(`https://api.cloudflare.com/client/v4/accounts/${account}/pages${path}`, init)

// HRG: detach domains, delete direct-upload project, recreate git-connected, re-attach.
for (const domain of ['hollywoodrideguide.com', 'www.hollywoodrideguide.com']) {
  const r = await pages(`/projects/hollywoodrideguide/domains/${domain}`, { method: 'DELETE' })
  console.log(`detach ${domain}:`, r.success ? 'OK' : JSON.stringify(r.errors))
}
const del = await pages('/projects/hollywoodrideguide', { method: 'DELETE' })
console.log('delete old project:', del.success ? 'OK' : JSON.stringify(del.errors))

if (del.success) {
  const created = await pages('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'hollywoodrideguide',
      production_branch: 'main',
      source: {
        type: 'github',
        config: {
          owner: 'kevynsgrin-a11y',
          repo_name: 'Disney-Guide',
          production_branch: 'main',
          deployments_enabled: true,
          production_deployments_enabled: true,
        },
      },
      build_config: { build_command: 'npm run build', destination_dir: 'dist/universal', root_dir: '' },
    }),
  })
  console.log('recreate git-connected:', created.success ? 'OK' : JSON.stringify(created.errors))
  for (const domain of ['hollywoodrideguide.com', 'www.hollywoodrideguide.com']) {
    const r = await pages('/projects/hollywoodrideguide/domains', { method: 'POST', body: JSON.stringify({ name: domain }) })
    console.log(`attach ${domain}:`, r.success ? 'OK' : JSON.stringify(r.errors))
  }
  const trig = await pages('/projects/hollywoodrideguide/deployments', { method: 'POST', body: '{}' })
  console.log('trigger deployment:', trig.success ? 'started' : JSON.stringify((trig.errors || []).map((e) => e.code)))
}

// DNS with full zone IDs resolved by name.
for (const [zone, target] of [['hollywoodrideguide.com', 'hollywoodrideguide.pages.dev'], ['coasterready.com', 'coasterready.pages.dev']]) {
  const z = await cf(`https://api.cloudflare.com/client/v4/zones?name=${zone}`)
  if (!z.success || !z.result.length) { console.log(`zone ${zone}: NOT FOUND`); continue }
  const zoneId = z.result[0].id
  for (const name of ['@', 'www']) {
    const r = await cf(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify({ type: 'CNAME', name, content: target, proxied: true, ttl: 1 }),
    })
    console.log(`dns ${zone} ${name} -> ${target}:`, r.success ? 'OK' : JSON.stringify(r.errors))
  }
}
