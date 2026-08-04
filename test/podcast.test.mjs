import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildPodcastFeed, resolveEpisodes } from '../src/lib/podcast.mjs'

/**
 * The feed is inert until someone produces audio, which may be months away. That is precisely why it
 * needs tests now: code that first executes long after it was written, in front of podcast clients
 * that cache failures, is the worst possible thing to ship unexercised.
 */

const SITE = {
  brand: { name: 'Ride Ready Guide', origin: 'https://ridereadyguide.com', locale: 'en-US' },
  legal: { copyrightHolder: 'Ride Ready Guide' },
  podcast: {
    title: 'Ride Ready Monthly',
    description: 'A dated brief.',
    author: 'Ride Ready Guide',
    email: 'hello@ridereadyguide.com',
    audioBase: 'https://audio.ridereadyguide.com/',
    artwork: 'https://audio.ridereadyguide.com/art-3000.jpg',
    episodes: [],
  },
}

const MARCH = {
  month: 3, name: 'March', slug: 'march',
  summary: 'Best weather, worst crowd structure.',
  verdict: { grade: 'C+' },
  freshness: { verified: '2026-07' },
}
const APRIL = {
  month: 4, name: 'April', slug: 'april',
  summary: 'Easter decides everything.',
  verdict: { grade: 'C' },
  freshness: { verified: '2026-07' },
}

const seasonal = (months) => ({ monthByNumber: new Map(months.map((m) => [m.month, m])) })

const withEpisodes = (episodes) => ({
  ...SITE, podcast: { ...SITE.podcast, episodes },
})

const GOOD = { month: 3, file: '2026-07/03-march.mp3', bytes: 2914560, durationSeconds: 188, published: '2026-07-15' }

test('no feed at all when nothing can prove it exists', () => {
  // An empty channel validates, can be submitted to a directory, and presents as a podcast with no
  // episodes. That is a worse artefact than no feed.
  assert.equal(buildPodcastFeed(withEpisodes([]), seasonal([MARCH])), null)
})

test('no feed without an owner email — Apple rejects the submission and the feed is unowned', () => {
  const site = { ...SITE, podcast: { ...SITE.podcast, email: '', episodes: [GOOD] } }
  assert.equal(buildPodcastFeed(site, seasonal([MARCH])), null)
})

test('an episode with no byte length is dropped, because nobody has produced the file', () => {
  const { episodes, skipped } = resolveEpisodes(
    withEpisodes([{ ...GOOD, bytes: undefined }]), seasonal([MARCH]))
  assert.equal(episodes.length, 0)
  assert.match(skipped[0], /byte length/)
})

test('an episode with no duration is dropped', () => {
  const { episodes } = resolveEpisodes(
    withEpisodes([{ ...GOOD, durationSeconds: 0 }]), seasonal([MARCH]))
  assert.equal(episodes.length, 0)
})

test('an episode for a month that does not exist is dropped rather than crashing', () => {
  const { episodes, skipped } = resolveEpisodes(
    withEpisodes([{ ...GOOD, month: 13 }]), seasonal([MARCH]))
  assert.equal(episodes.length, 0)
  assert.equal(skipped.length, 1)
})

test('a real episode produces a well-formed enclosure', () => {
  const xml = buildPodcastFeed(withEpisodes([GOOD]), seasonal([MARCH]))
  assert.ok(xml)
  // The byte length is what clients use to show progress; a wrong one breaks scrubbing.
  assert.match(xml, /<enclosure url="https:\/\/audio\.ridereadyguide\.com\/2026-07\/03-march\.mp3" length="2914560" type="audio\/mpeg"\/>/)
  assert.match(xml, /<itunes:duration>3:08<\/itunes:duration>/)
  assert.match(xml, /<pubDate>Wed, 15 Jul 2026 09:00:00 \+0000<\/pubDate>/)
})

test('audioBase joins correctly with or without a trailing slash', () => {
  const noSlash = { ...SITE, podcast: { ...SITE.podcast, audioBase: 'https://a.example.com', episodes: [GOOD] } }
  const xml = buildPodcastFeed(noSlash, seasonal([MARCH]))
  assert.match(xml, /url="https:\/\/a\.example\.com\/2026-07\/03-march\.mp3"/)
  assert.ok(!xml.includes('a.example.com//'), 'doubled slash in the media URL')
})

test('the GUID carries the verification month, so a re-verified brief republishes', () => {
  /*
   * A downloaded episode is beyond correction — it sits on a device saying whatever it said. A GUID
   * tied to the facts' verification month means re-verifying March issues it as a new episode
   * rather than leaving subscribers with a stale file no client would refetch.
   */
  const a = buildPodcastFeed(withEpisodes([GOOD]), seasonal([MARCH]))
  const reverified = { ...MARCH, freshness: { verified: '2027-01' } }
  const b = buildPodcastFeed(withEpisodes([GOOD]), seasonal([reverified]))

  assert.match(a, /<guid isPermaLink="false">https:\/\/ridereadyguide\.com\/audio\/march\/2026-07<\/guid>/)
  assert.match(b, /<guid isPermaLink="false">https:\/\/ridereadyguide\.com\/audio\/march\/2027-01<\/guid>/)
})

test('episodes are ordered newest first', () => {
  const { episodes } = resolveEpisodes(withEpisodes([
    { ...GOOD, month: 3, published: '2026-07-15' },
    { ...GOOD, month: 4, file: '2026-08/04-april.mp3', published: '2026-08-15' },
  ]), seasonal([MARCH, APRIL]))
  assert.deepEqual(episodes.map((e) => e.month.name), ['April', 'March'])
})

test('the feed declares itself and its channel requirements', () => {
  const xml = buildPodcastFeed(withEpisodes([GOOD]), seasonal([MARCH]))
  assert.match(xml, /<atom:link href="https:\/\/ridereadyguide\.com\/podcast\.xml" rel="self"/)
  assert.match(xml, /<itunes:email>hello@ridereadyguide\.com<\/itunes:email>/)
  assert.match(xml, /<itunes:explicit>false<\/itunes:explicit>/)
  assert.match(xml, /<itunes:image href=/)
  assert.match(xml, /<itunes:category text=/)
})

test('the spoken verification month also reaches the episode description', () => {
  // The audio says it; the feed text has to as well, for anyone reading show notes rather than
  // listening from the top.
  const xml = buildPodcastFeed(withEpisodes([GOOD]), seasonal([MARCH]))
  assert.match(xml, /Facts checked 2026-07/)
})

test('ampersands and angle brackets in authored copy do not break the XML', () => {
  const nasty = { ...MARCH, summary: 'Crowds & cost <rise> — "sharply"' }
  const xml = buildPodcastFeed(withEpisodes([GOOD]), seasonal([nasty]))
  assert.ok(!/<rise>/.test(xml), 'raw angle brackets leaked into the feed')
  assert.match(xml, /Crowds &amp; cost/)
})
