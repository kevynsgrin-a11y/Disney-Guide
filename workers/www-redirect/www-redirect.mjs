// One purpose: 301 www.<host> to the apex, preserving path and query string.
// Attached as a Workers Custom Domain to each site's www hostname, because the
// vault API token carries Pages/DNS/Workers edit but not zone rulesets edit —
// so a Redirect Rule is out of reach and this worker is the redirect.
export default {
  async fetch(request) {
    const url = new URL(request.url)
    if (url.hostname.startsWith('www.')) {
      const location = `https://${url.hostname.slice(4)}${url.pathname}${url.search}`
      return new Response(null, {
        status: 301,
        headers: { Location: location, 'Cache-Control': 'public, max-age=86400' },
      })
    }
    return new Response('Not found', { status: 404 })
  },
}
