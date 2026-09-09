/**
 * POST /api/report — an anonymous, unverified guest report of a ride being closed.
 *
 * What this accepts: { park, ride, client, token? }. `client` is a random daily id made in
 * the visitor's browser. `token`, when present, is a Turnstile token verified server-side.
 * What it stores: the park, the ride, a one-way hash of (client id + day), a one-way hash
 * of (IP + day), and a timestamp. No IP, no agent, no body, nothing else — by design.
 *
 * Abuse control: Turnstile (bot check) plus a 30-minute cooldown per IP+ride, and slugs are
 * validated against the build-time manifest so the endpoint cannot be used to write junk.
 */

async function sha (text) {
  const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(data)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function json (status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

export async function onRequestPost ({ request, env }) {
  let body
  try { body = await request.json() } catch { return json(400, { error: 'bad request' }) }
  const park = String(body.park || '').replace(/[^a-z-]/g, '')
  const ride = String(body.ride || '').replace(/[^a-z0-9-]/g, '')
  const client = String(body.client || 'anonymous').slice(0, 64)
  const token = body.token ? String(body.token) : null
  if (!park || !ride) return json(400, { error: 'bad request' })

  // Valid slugs only — the manifest is a build artifact, so the endpoint and the pages agree.
  const manifestResp = await env.ASSETS.fetch(new Request('https://local/data/status-manifest.json'))
  if (manifestResp.ok) {
    const manifest = await manifestResp.json()
    if (!manifest[park] || !manifest[park].includes(ride)) return json(400, { error: 'unknown ride' })
  } else {
    return json(503, { error: 'manifest unavailable' })
  }

  // Turnstile, when configured. Where the secret exists the token is required - an absent
  // token must never be the bypass. Previews without the secret run rate-limit-only.
  if (env.TURNSTILE_SECRET) {
    if (!token) return json(403, { error: 'verification required' })
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token }),
    })
    const verdict = await verify.json().catch(() => ({}))
    if (!verdict.success) return json(403, { error: 'verification failed' })
  }

  const day = new Date().toISOString().slice(0, 10)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const clientHash = await sha(client + ':' + day)
  const ipHash = await sha(ip + ':' + day)
  const now = Date.now()
  const cooldown = now - 30 * 60 * 1000

  try {
    const recent = await env.DB.prepare(
      'SELECT id FROM reports WHERE ip_hash = ? AND park = ? AND ride = ? AND ts > ? LIMIT 1'
    ).bind(ipHash, park, ride, cooldown).first()
    if (recent) return json(200, { error: 'duplicate' })

    await env.DB.prepare(
      'INSERT INTO reports (park, ride, client_hash, ip_hash, ts) VALUES (?, ?, ?, ?, ?)'
    ).bind(park, ride, clientHash, ipHash, now).run()
    return json(200, { ok: true })
  } catch (e) {
    return json(500, { error: 'unavailable' })
  }
}

export async function onRequest () {
  return new Response('Method not allowed', { status: 405 })
}
