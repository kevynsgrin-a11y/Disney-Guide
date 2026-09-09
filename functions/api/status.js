/**
 * GET /api/status?park=<slug> — the rolling guest-report aggregates for one park.
 *
 * Returns { reports: [{ ride, count2h, count12h }] } computed live from the window, so
 * nothing older than twelve hours can ever appear — the rolling window IS the reset.
 * Rows older than a day are swept opportunistically on each read.
 */

function json (status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

export async function onRequestGet ({ request, env }) {
  const park = (new URL(request.url)).searchParams.get('park')?.replace(/[^a-z-]/g, '') || ''
  if (!park) return json(400, { error: 'park required' })
  const now = Date.now()
  const window2h = now - 2 * 60 * 60 * 1000
  const window12h = now - 12 * 60 * 60 * 1000

  try {
    const rows = await env.DB.prepare(
      `SELECT ride,
              SUM(CASE WHEN ts > ? THEN 1 ELSE 0 END) AS count2h,
              COUNT(*) AS count12h
       FROM reports WHERE park = ? AND ts > ?
       GROUP BY ride`
    ).bind(window2h, park, window12h).all()

    // Opportunistic sweep: the window guarantees freshness; this keeps the table small.
    if (Math.random() < 0.05) {
      await env.DB.prepare('DELETE FROM reports WHERE ts < ?').bind(now - 24 * 60 * 60 * 1000).run()
    }

    const reports = (rows.results || []).map(r => ({ ride: r.ride, count2h: r.count2h, count12h: r.count12h }))
    return json(200, { park, reports, asOf: new Date(now).toISOString() })
  } catch {
    return json(200, { park, reports: [], asOf: new Date(now).toISOString(), degraded: true })
  }
}

export async function onRequest () {
  return new Response('Method not allowed', { status: 405 })
}
