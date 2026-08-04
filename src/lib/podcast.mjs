/**
 * Podcast feed for the monthly audio briefs.
 *
 * WHY AN EPISODE HAS TO PROVE ITSELF
 *
 * Audio is hosted off this repository — 34 MB of MP3 in git would bloat every clone, and audio in
 * the service-worker precache would falsify the "works on park WiFi" claim the home page makes. So
 * the build cannot check the file exists on disk the way it can for photography.
 *
 * The forcing function is `bytes`. RSS requires a real byte length on the enclosure, and you only
 * know a file's byte length if the file exists and you have looked at it. An episode declared
 * without `bytes` and `durationSeconds` is therefore an episode nobody has actually produced, and it
 * is dropped rather than published.
 *
 * That matters more here than elsewhere. A broken image is a gap on a page; a broken enclosure is a
 * download failure inside somebody's podcast app, which several clients cache and stop retrying.
 *
 * WHY THE GUID IS TIED TO THE VERIFICATION MONTH
 *
 * A podcast episode is the least recallable thing this site can publish. Once downloaded it sits on
 * a device, beyond any correction, saying whatever it said. The spoken freshness statement is the
 * first mitigation; this is the second.
 *
 * The GUID carries the month the underlying facts were verified. Re-verify March and the GUID
 * changes, so subscribers receive it as a new episode rather than keeping a stale download that no
 * client would ever refetch. Republishing on a real correction is the point, not a side effect.
 */

const RFC822_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const RFC822_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * 'YYYY-MM-DD' → RFC 822, which is what RSS requires and what podcast clients sort on.
 *
 * Built from the authored date rather than the clock, so a rebuild never reorders the feed. A
 * timestamp that moves on every build makes every episode look new and re-notifies every subscriber.
 */
function rfc822 (isoDate) {
  const [y, m, d] = String(isoDate).split('-').map(Number)
  if (!y || !m || !d) return null
  const day = RFC822_DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  const dd = String(d).padStart(2, '0')
  return `${day}, ${dd} ${RFC822_MONTHS[m - 1]} ${y} 09:00:00 +0000`
}

/** HH:MM:SS, which more clients parse correctly than a bare seconds count. */
function duration (seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

function xmlEscape (s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

/** Absolute URL for an episode's media, whether audioBase carries a trailing slash or not. */
function mediaUrl (base, file) {
  if (/^https?:\/\//i.test(file)) return file
  return `${String(base).replace(/\/$/, '')}/${String(file).replace(/^\//, '')}`
}

/**
 * Which declared episodes are real enough to publish, and why the others were dropped.
 *
 * Returns { episodes, skipped } so the build can report the skips rather than silently shipping a
 * shorter feed than the author expected.
 */
export function resolveEpisodes (site, seasonal) {
  const config = site.podcast || {}
  const declared = config.episodes || []
  const episodes = []
  const skipped = []

  for (const ep of declared) {
    const month = seasonal.monthByNumber ? seasonal.monthByNumber.get(ep.month) : null
    if (!month) { skipped.push(`month ${ep.month}: no month page to describe it`); continue }
    if (!ep.file) { skipped.push(`${month.name}: no file`); continue }
    if (!(Number(ep.bytes) > 0)) { skipped.push(`${month.name}: no byte length — the file has not been produced`); continue }
    if (!(Number(ep.durationSeconds) > 0)) { skipped.push(`${month.name}: no duration`); continue }
    const pub = rfc822(ep.published)
    if (!pub) { skipped.push(`${month.name}: "published" must be YYYY-MM-DD`); continue }

    const verified = (month.freshness && month.freshness.verified) || 'unknown'
    episodes.push({
      month,
      url: mediaUrl(config.audioBase, ep.file),
      bytes: Number(ep.bytes),
      durationSeconds: Number(ep.durationSeconds),
      pubDate: pub,
      sort: String(ep.published),
      // Verification month in the GUID: a re-verified brief republishes rather than sitting stale.
      guid: `${site.brand.origin}/audio/${month.slug}/${verified}`,
      verified,
    })
  }

  episodes.sort((a, b) => (a.sort < b.sort ? 1 : a.sort > b.sort ? -1 : 0))
  return { episodes, skipped }
}

/**
 * The feed, or null.
 *
 * Null when there is nothing real to publish. An empty channel is a worse artefact than no feed at
 * all: it validates, it can be submitted to a directory, and it presents as a podcast that exists
 * and has no episodes.
 */
export function buildPodcastFeed (site, seasonal) {
  const config = site.podcast || {}
  if (!config.audioBase || !config.email) return null

  const { episodes } = resolveEpisodes(site, seasonal)
  if (!episodes.length) return null

  const origin = site.brand.origin
  const title = config.title || `${site.brand.name} Monthly Brief`
  const description = config.description ||
    'A dated, sourced three-minute brief on what each month is actually like at the parks — crowds, weather, cost, and what is running. Independent and unofficial.'

  const items = episodes.map((ep) => {
    const m = ep.month
    const grade = m.verdict && m.verdict.grade ? ` Grade: ${m.verdict.grade}.` : ''
    const summary = `${m.summary || ''}${grade} Facts checked ${ep.verified}.`
    return `    <item>
      <title>${xmlEscape(`${m.name}: crowds, weather, cost`)}</title>
      <link>${xmlEscape(`${origin}/when-to-go/${m.slug}/`)}</link>
      <guid isPermaLink="false">${xmlEscape(ep.guid)}</guid>
      <pubDate>${ep.pubDate}</pubDate>
      <description>${xmlEscape(summary)}</description>
      <itunes:summary>${xmlEscape(summary)}</itunes:summary>
      <itunes:duration>${duration(ep.durationSeconds)}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
      <enclosure url="${xmlEscape(ep.url)}" length="${ep.bytes}" type="audio/mpeg"/>
    </item>`
  }).join('\n')

  const artwork = config.artwork ? `    <itunes:image href="${xmlEscape(config.artwork)}"/>\n` : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${xmlEscape(title)}</title>
    <link>${xmlEscape(origin)}/</link>
    <atom:link href="${xmlEscape(origin)}/podcast.xml" rel="self" type="application/rss+xml"/>
    <language>${xmlEscape(site.brand.locale || 'en-US')}</language>
    <description>${xmlEscape(description)}</description>
    <copyright>${xmlEscape(site.legal.copyrightHolder || site.brand.name)}</copyright>
    <itunes:author>${xmlEscape(config.author || site.brand.name)}</itunes:author>
    <itunes:summary>${xmlEscape(description)}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>false</itunes:explicit>
    <itunes:owner>
      <itunes:name>${xmlEscape(config.author || site.brand.name)}</itunes:name>
      <itunes:email>${xmlEscape(config.email)}</itunes:email>
    </itunes:owner>
    <itunes:category text="${xmlEscape(config.category || 'Society &amp; Culture')}">
      <itunes:category text="${xmlEscape(config.subcategory || 'Places &amp; Travel')}"/>
    </itunes:category>
${artwork}${items}
  </channel>
</rss>
`
}
