import { html, raw, paragraphs, inline } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as S from '../lib/schema.mjs'
import { urls } from '../lib/data.mjs'
import { renderParkMap } from '../lib/map.mjs'
import * as f from '../lib/format.mjs'

const crumbs = (park, ...rest) => [...park.breadcrumbTrail, ...rest]

/* ------------------------------------------------------------------ *
 * Park hub
 * ------------------------------------------------------------------ */

export function parkHub (park, data) {
  const { site } = data
  const open = park.attractions.filter((a) => a.isOpen)

  const quickLinks = [
    { href: urls.rides(park), label: `All ${open.length} attractions`, summary: 'The complete list, sortable and filterable' },
    park.bestRides ? { href: urls.bestRides(park), label: 'Best rides, ranked', summary: 'An actual ranking, defended one by one' } : null,
    { href: urls.heights(park), label: 'Height requirements', summary: `${park.heightAttractions.length} rides with a minimum height` },
    { href: urls.dining(park), label: 'Where to eat', summary: `${park.dining.length} restaurants, carts, and lounges` },
    { href: urls.snacks(park), label: 'Best snacks', summary: `${park.food.length} tracked items with prices` },
    { href: urls.map(park), label: 'Park map', summary: 'Printable, works offline' },
    { href: urls.accessibility(park), label: 'Accessibility', summary: 'Transfers, rentals, quiet spaces' },
    { href: urls.firstTimer(park), label: 'First-timer guide', summary: 'A plan you can actually follow' },
  ].filter(Boolean)

  const body = html`
    ${C.breadcrumbs(park.breadcrumbTrail)}
    ${C.hero({
      eyebrow: park.resortInfo ? `${park.resortInfo.name} · ${park.location}` : park.location,
      title: park.name,
      lede: park.tagline || park.summary,
      meta: [
        { label: 'Opened', value: f.humanDate(park.opened) },
        { label: 'Attractions', value: String(open.length) },
        { label: 'Height requirements', value: String(park.heightAttractions.length) },
        park.stats && park.stats.typicalFullDayHours ? { label: 'A full day is', value: park.stats.typicalFullDayHours } : null,
        park.sizeAcres ? { label: 'Size', value: `${park.sizeAcres} acres` } : null,
      ].filter(Boolean),
      actions: [
        { href: urls.firstTimer(park), label: 'Start here: first-timer plan', primary: true },
        { href: urls.heights(park), label: 'Height requirements' },
      ],
    })}

    ${C.section({
      children: html`
        <div class="split">
          <div class="prose prose--lede">
            ${paragraphs(park.intro)}
            ${C.lastVerified(park.lastVerified)}
          </div>
          <div class="split__aside">
            ${C.factPanel([
              { label: 'Best for', value: (park.bestFor || []).join(' · ') },
              { label: 'Less ideal for', value: (park.notIdealFor || []).join(' · ') },
              park.stats && park.stats.minimumDaysRecommended
                ? { label: 'Days needed', value: `${park.stats.minimumDaysRecommended} day${park.stats.minimumDaysRecommended === 1 ? '' : 's'} minimum` }
                : null,
              park.stats && park.stats.tallestRequirement
                ? { label: 'Tallest requirement', value: f.height(park.stats.tallestRequirement) }
                : null,
            ].filter(Boolean), { title: 'At a glance', columns: 1 })}
          </div>
        </div>
      `,
    })}

    ${C.section({
      tone: 'tint',
      title: 'Everything about this park',
      children: C.linkGrid(quickLinks, { columns: 3 }),
    })}

    ${park.headliners.length ? C.section({
      title: 'The rides you plan the day around',
      kicker: 'Headliners',
      intro: 'If you only get a handful of long queues in you, spend them here.',
      children: html`
        ${C.cardGrid(park.headliners.map(C.attractionCard), { columns: 3 })}
        ${park.bestRides ? html`<p class="mt-5"><a class="btn btn--primary" href="${urls.bestRides(park)}">All ${park.name} rides, ranked</a></p>` : ''}
      `,
    }) : ''}

    ${park.lands.length ? C.section({
      tone: 'tint',
      title: 'The lands',
      kicker: `${park.lands.length} distinct areas`,
      intro: 'Walking order from the entrance. Each land page carries its full attraction and dining list.',
      children: C.cardGrid(park.lands.map((land) => C.card({
        href: land.url,
        eyebrow: land.opened ? `Opened ${land.opened}` : '',
        title: land.name,
        summary: land.summary,
        badges: [
          { label: `${land.attractions.filter((a) => a.isOpen).length} attractions` },
          land.dining.length ? { label: `${land.dining.length} places to eat`, tone: 'good' } : null,
        ].filter(Boolean),
        meta: land.anchorInfo ? [{ label: 'Headliner', value: land.anchorInfo.name }] : [],
      })), { columns: 3 }),
    }) : ''}

    ${park.topFood.length ? C.section({
      title: 'What to eat here',
      kicker: 'Food',
      intro: `Our highest-priority items in ${park.name}. Mark them on the tracker and they save to your device.`,
      children: html`
        <div class="food-grid">${park.topFood.slice(0, 6).map((item) => C.foodCard(item, { tracker: true }))}</div>
        <p class="mt-5">
          <a class="btn btn--primary" href="${urls.snacks(park)}">All ${park.food.length} tracked snacks</a>
          <a class="btn btn--ghost" href="${urls.dining(park)}">Full dining guide</a>
        </p>
      `,
    }) : ''}

    ${park.tips && park.tips.length ? C.section({
      tone: 'tint',
      title: 'Things worth knowing before you go',
      children: html`
        <div class="card-grid card-grid--2">
          ${park.tips.map((tip) => C.card({ title: tip.title, summary: tip.body }))}
        </div>
      `,
    }) : ''}

    ${park.gettingThere ? C.section({
      title: 'Getting there',
      children: html`
        <div class="split">
          <div class="prose">
            ${park.gettingThere.parking ? html`<h3>Parking</h3><p>${inline(park.gettingThere.parking)}</p>` : ''}
            ${park.gettingThere.entranceNote ? html`<h3>At the entrance</h3><p>${inline(park.gettingThere.entranceNote)}</p>` : ''}
          </div>
          <div>${C.tipList(park.gettingThere.transportation, { title: 'How to get here', tone: 'plain' })}</div>
        </div>
      `,
    }) : ''}

    ${C.faqSection(park.faqs, { title: `${park.name} questions, answered` })}

    ${C.relatedLinks([
      { href: urls.guide('lightning-lane'), label: 'Lightning Lane, explained', summary: 'Mechanics, booking windows, and whether to bother' },
      { href: urls.guide('is-it-scary'), label: 'Is it scary?', summary: 'What actually frightens small children' },
      { href: urls.heightChecker(), label: 'Height checker', summary: 'One slider, every ride they clear' },
      { href: urls.compare('disney-park-rankings'), label: 'All six parks ranked', summary: 'We commit to an order' },
    ])}
  `

  return {
    url: park.url,
    html: renderPage({
      site,
      page: {
        url: park.url,
        title: `${park.name} guide`,
        titleTail: ': rides, heights & food',
        description: C.truncate(park.summary, 155),
        trail: park.breadcrumbTrail,
        modified: `${park.lastVerified || '2026-07'}-01`,
      },
      body,
      schema: [
        S.place(site, park),
        S.itemList(site, { url: park.url, name: `${park.name} headliner attractions`, items: park.headliners }),
        S.faqPage(site, { url: park.url, faqs: park.faqs }),
      ],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Ride list
 * ------------------------------------------------------------------ */

export function ridesPage (park, data) {
  const { site } = data
  const trail = crumbs(park, { label: 'Attractions', href: urls.rides(park) })
  const open = park.attractions.filter((a) => a.isOpen)

  const rows = open.map((a) => [
    a.hasPage ? html`<a href="${a.url}">${a.name}</a>` : html`<a href="#${a.slug}">${a.name}</a>`,
    a.landInfo ? html`<a href="${a.landInfo.url}">${a.landInfo.name}</a>` : '—',
    f.attractionType(a.type),
    html`<span data-value="${a.heightIn || 0}">${a.heightIn ? `${a.heightIn}"` : 'Any'}</span>`,
    html`<span data-value="${a.intensity || 0}">${f.intensityLabel(a.intensity)}</span>`,
    html`<span data-value="${a.scary && a.scary.score ? a.scary.score : 0}">${a.scary && a.scary.score ? `${a.scary.score}/5` : '—'}</span>`,
    f.lightningLaneShort(a.lightningLane),
  ])

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: park.name,
      title: `Every attraction at ${park.name}`,
      lede: `All ${open.length} operating attractions, shows, and experiences — with height, intensity, scare factor, and Lightning Lane status for each. Sort any column.`,
      tone: 'compact',
      meta: [
        { label: 'Attractions', value: String(open.length) },
        { label: 'No height limit', value: String(park.noHeightAttractions.length) },
        { label: 'Height limits', value: String(park.heightAttractions.length) },
        { label: 'Lands', value: String(park.lands.length) },
      ],
    })}

    ${C.section({
      children: html`
        ${C.dataTable({
          sortable: true,
          className: 'data-table--stack',
          caption: 'Tap any column heading to sort. Height is the minimum to ride.',
          columns: [
            'Attraction', 'Land', 'Type',
            { label: 'Height', align: 'num', sort: 'number' },
            { label: 'Intensity', align: 'center', sort: 'number' },
            { label: 'Scare', align: 'center', sort: 'number' },
            'Lightning Lane',
          ],
          rows,
        })}
        ${C.lastVerified(park.lastVerified)}
      `,
    })}

    ${park.closedAttractions.length ? C.section({
      tone: 'tint',
      title: 'Closed, and what replaced it',
      kicker: 'No longer operating',
      intro: 'These come up constantly in searches and in old guidebooks, so we keep them listed rather than quietly deleting them.',
      children: html`
        ${C.dataTable({
          className: 'data-table--stack',
          columns: ['Attraction', 'Land', 'What happened'],
          rows: park.closedAttractions.map((a) => [
            a.name,
            a.landInfo ? a.landInfo.name : '—',
            a.closedNote || 'Permanently closed.',
          ]),
        })}
      `,
    }) : ''}

    ${park.lands.map((land) => {
      const list = land.attractions.filter((a) => a.isOpen)
      if (!list.length) return ''
      return C.section({
        id: `land-${land.slug}`,
        title: land.name,
        kicker: `${list.length} attraction${list.length === 1 ? '' : 's'}`,
        intro: land.summary,
        children: html`
          ${list.map(C.attractionInline)}
          <p class="mt-5"><a class="btn btn--ghost" href="${land.url}">Everything in ${land.name}</a></p>
        `,
      })
    })}

    ${C.relatedLinks([
      park.bestRides
        ? { href: urls.bestRides(park), label: 'Best rides, ranked', summary: 'Which of these are actually worth it' }
        : { href: urls.heights(park), label: `${park.name} height requirements`, summary: 'The full chart' },
      { href: urls.map(park), label: 'Park map', summary: 'See where these actually are' },
      { href: urls.snacks(park), label: 'Best snacks', summary: 'What to eat between rides' },
      { href: urls.firstTimer(park), label: 'First-timer plan', summary: 'The order to do them in' },
    ])}
  `

  return {
    url: urls.rides(park),
    html: renderPage({
      site,
      page: {
        url: urls.rides(park),
        title: `${park.shortLabel} rides & attractions`,
        titleTail: `: all ${open.length}`,
        description: `The complete ${park.name} attraction list with height requirements, intensity, scare factor, and Lightning Lane status for every ride, show, and experience.`,
        trail,
        modified: `${park.lastVerified || '2026-07'}-01`,
      },
      body,
      schema: [S.itemList(site, { url: urls.rides(park), name: `${park.name} attractions`, items: open })],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Attraction detail
 * ------------------------------------------------------------------ */

export function attractionPage (attraction, data) {
  const { site } = data
  const park = attraction.park
  const trail = crumbs(park,
    { label: 'Attractions', href: urls.rides(park) },
    { label: attraction.name, href: attraction.url })

  const scary = attraction.scary || {}
  const acc = attraction.accessibility || {}
  const related = (attraction.relatedSlugs || [])
    .map((slug) => park.attractionBySlug.get(slug))
    .filter(Boolean)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: `${park.name}${attraction.landInfo ? ` · ${attraction.landInfo.name}` : ''}`,
      title: attraction.name,
      lede: attraction.summary,
      meta: [
        { label: 'Minimum height', value: attraction.heightIn ? f.height(attraction.heightIn) : 'None' },
        attraction.durationMinutes != null ? { label: 'Ride length', value: f.duration(attraction.durationMinutes) } : null,
        { label: 'Lightning Lane', value: f.lightningLaneShort(attraction.lightningLane) },
        attraction.opened ? { label: 'Opened', value: String(attraction.opened) } : null,
      ].filter(Boolean),
      aside: html`
        ${C.factPanel([
          { label: 'Type', value: f.attractionType(attraction.type) },
          { label: 'Height', value: attraction.heightIn ? f.height(attraction.heightIn) : 'Any height', hint: attraction.heightNote },
          { label: 'Intensity', value: f.intensityLabel(attraction.intensity) },
          { label: 'Motion sickness', value: f.motion(attraction.motionSickness) },
          { label: 'Getting wet', value: f.getsWet(attraction.getsWet) },
          { label: 'Indoor / outdoor', value: f.unslug(attraction.indoorOutdoor || 'mixed') },
          { label: 'Air conditioned', value: attraction.airConditioned ? 'Yes' : 'No' },
          attraction.singleRider ? { label: 'Single rider', value: 'Available' } : null,
          { label: 'Rider Switch', value: attraction.riderSwitch ? 'Available' : 'Not offered' },
          attraction.goesUpsideDown ? { label: 'Inversions', value: 'Yes' } : null,
          attraction.goesBackwards ? { label: 'Travels backwards', value: 'Yes' } : null,
        ].filter(Boolean), { title: 'Ride facts', columns: 1 })}
        ${C.lastVerified(attraction.lastVerified)}
      `,
    })}

    ${!attraction.isOpen ? C.section({
      tone: 'tight',
      children: C.callout({ type: 'warning', title: 'Not currently operating', body: attraction.closedNote || 'This attraction is closed.' }),
    }) : ''}

    ${C.section({
      children: html`
        <div class="split">
          <div>
            <div class="doc-section" id="what-it-is">
              <h2>What it is</h2>
              ${paragraphs(attraction.description)}
            </div>

            ${attraction.experience && attraction.experience.length ? html`
              <div class="doc-section" id="what-riding-is-like">
                <h2>What riding it is actually like</h2>
                ${paragraphs(attraction.experience)}
              </div>` : ''}

            ${scary.score ? html`
              <div class="doc-section" id="is-it-scary">
                <h2>Is ${attraction.name} scary?</h2>
                <p>${inline(scary.notes || '')}</p>
                <div class="meter-grid mt-5">
                  ${C.meter('Overall scare factor', scary.score, 5, 'hot')}
                  ${scary.darkness != null ? C.meter('Darkness', scary.darkness) : ''}
                  ${scary.drops != null ? C.meter('Drops', scary.drops) : ''}
                  ${scary.speed != null ? C.meter('Speed', scary.speed) : ''}
                  ${scary.loudness != null ? C.meter('Loudness', scary.loudness) : ''}
                  ${scary.startles != null ? C.meter('Sudden effects', scary.startles) : ''}
                </div>
                <p class="small muted mt-4">Scores are editorial, on a 1–5 scale, judged against what frightens a typical four- to seven-year-old rather than an adult.</p>
              </div>` : ''}

            <div class="doc-section" id="accessibility">
              <h2>Accessibility</h2>
              ${C.factPanel([
                { label: 'Wheelchair', value: f.transfer(acc.transfer) },
                { label: 'Audio description', value: acc.audioDescription ? 'Available' : 'Not offered' },
                { label: 'Handheld captioning', value: acc.handheldCaptioning ? 'Available' : 'Not offered' },
                { label: 'Assistive listening', value: acc.assistiveListening ? 'Available' : 'Not offered' },
                { label: 'Sign language', value: acc.signLanguage ? 'At scheduled performances' : 'Not offered' },
                { label: 'Service animals', value: acc.serviceAnimals ? 'Permitted on board' : 'Must use a kennel or wait with a companion' },
              ], { columns: 1 })}
              ${acc.notes ? html`<p class="mt-4">${inline(acc.notes)}</p>` : ''}
              <p class="small muted"><a href="${urls.accessibility(park)}">Full ${park.name} accessibility guide →</a></p>
            </div>

            ${C.tipList(attraction.tips)}
          </div>

          <div class="split__aside">
            ${C.factPanel([
              attraction.bestTime ? { label: 'Best time to ride', value: attraction.bestTime } : null,
              attraction.typicalWait ? { label: 'Typical wait', value: attraction.typicalWait } : null,
              { label: 'Lightning Lane', value: f.lightningLane(attraction.lightningLane) },
            ].filter(Boolean), { title: 'Timing', columns: 1 })}
            ${attraction.heightIn ? C.callout({
              type: 'tip',
              title: `Not sure they will clear ${attraction.heightIn} inches?`,
              body: `Our [height checker](${urls.heightChecker()}) shows every ride they can and cannot do at ${attraction.heightIn - 2} to ${attraction.heightIn + 2} inches, so you know before you queue.`,
            }) : ''}
            ${attraction.hasSeasonalOverlay ? C.seasonalHandoff(attraction.name) : ''}
          </div>
        </div>
      `,
    })}

    ${C.faqSection(attraction.faqs, { title: `${attraction.name}: common questions` })}

    ${related.length ? C.relatedLinks(related.map((r) => ({
      href: r.url, label: r.name, summary: r.summary,
    })), { title: `More in ${park.name}` }) : ''}
  `

  return {
    url: attraction.url,
    html: renderPage({
      site,
      page: {
        url: attraction.url,
        // The park must appear in the title: Space Mountain, Haunted Mansion, Pirates and a dozen
        // others exist at both resorts, and undifferentiated titles cannibalise each other.
        title: `${attraction.name} (${park.shortLabel})`,
        titleTail: attraction.heightIn ? ': height & scares' : ': is it scary?',
        description: C.truncate(`${attraction.summary} ${attraction.heightIn ? `Minimum height ${attraction.heightIn} inches at ${park.name}.` : `No height requirement at ${park.name}.`}`, 155),
        trail,
        modified: `${attraction.lastVerified || '2026-07'}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        S.touristAttraction(site, attraction),
        S.faqPage(site, { url: attraction.url, faqs: attraction.faqs }),
      ],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Land page
 * ------------------------------------------------------------------ */

export function landPage (land, data) {
  const { site } = data
  const park = land.park
  const trail = crumbs(park, { label: land.name, href: land.url })
  const open = land.attractions.filter((a) => a.isOpen)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: park.name,
      title: land.name,
      lede: land.summary,
      tone: 'compact',
      meta: [
        land.opened ? { label: 'Opened', value: String(land.opened) } : null,
        { label: 'Attractions', value: String(open.length) },
        { label: 'Places to eat', value: String(land.dining.length) },
        land.anchorInfo ? { label: 'Headliner', value: land.anchorInfo.name } : null,
      ].filter(Boolean),
    })}

    ${C.section({
      children: html`
        <div class="split">
          <div class="prose prose--lede">
            ${paragraphs(land.description)}
            ${land.vibe ? C.callout({ type: 'note', title: 'What it feels like standing here', body: land.vibe }) : ''}
          </div>
          <div class="split__aside">
            ${land.highlights && land.highlights.length ? C.tipList(land.highlights, { title: 'Do not miss' }) : ''}
            ${land.tips && land.tips.length ? C.tipList(land.tips, { title: `${land.name} tips` }) : ''}
          </div>
        </div>
      `,
    })}

    ${open.length ? C.section({
      tone: 'tint',
      title: `Attractions in ${land.name}`,
      children: html`${open.map(C.attractionInline)}`,
    }) : ''}

    ${land.dining.length ? C.section({
      title: `Eating in ${land.name}`,
      children: C.cardGrid(land.dining.map(C.diningCard), { columns: 3 }),
    }) : ''}

    ${land.food.length ? C.section({
      tone: 'tint',
      title: `Snacks worth stopping for`,
      children: html`<div class="food-grid">${land.food.slice(0, 6).map((item) => C.foodCard(item, { tracker: true }))}</div>`,
    }) : ''}

    ${C.relatedLinks([
      { href: urls.map(park), label: `${park.name} map`, summary: 'See where this land sits' },
      { href: urls.rides(park), label: 'All attractions', summary: `Every ride in ${park.name}` },
      ...park.lands.filter((l) => l.slug !== land.slug).slice(0, 2).map((l) => ({ href: l.url, label: l.name, summary: l.summary })),
    ], { title: 'Nearby' })}
  `

  return {
    url: land.url,
    html: renderPage({
      site,
      page: {
        url: land.url,
        title: `${land.name} at ${park.shortLabel}`,
        description: C.truncate(`${land.summary} ${open.length} attractions and ${land.dining.length} places to eat.`, 155),
        trail,
        modified: `${park.lastVerified || '2026-07'}-01`,
      },
      body,
      schema: [S.itemList(site, { url: land.url, name: `${land.name} attractions`, items: open })],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Height requirements
 * ------------------------------------------------------------------ */

export function heightsPage (park, data) {
  const { site } = data
  const trail = crumbs(park, { label: 'Height requirements', href: urls.heights(park) })
  const thresholds = [...new Set(park.heightAttractions.map((a) => a.heightIn))].sort((a, b) => a - b)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: park.name,
      title: `${park.name} height requirements`,
      lede: `${park.heightAttractions.length} attractions have a minimum height. ${park.noHeightAttractions.length} do not. Here is exactly where your child stands.`,
      tone: 'compact',
      meta: [
        { label: 'Shortest requirement', value: thresholds.length ? f.height(thresholds[0]) : '—' },
        { label: 'Tallest requirement', value: thresholds.length ? f.height(thresholds[thresholds.length - 1]) : '—' },
        { label: 'No requirement', value: `${park.noHeightAttractions.length} attractions` },
      ],
      actions: [{ href: urls.heightChecker(), label: 'Open the height checker', primary: true }],
    })}

    ${C.section({
      children: html`
        ${C.dataTable({
          sortable: true,
          className: 'data-table--stack',
          caption: `Every ${park.name} attraction with a minimum height, shortest first. Measured with shoes on, hats off, against a fixed stick.`,
          columns: [
            'Attraction',
            { label: 'Height', align: 'num', sort: 'number' },
            'Land', 'Type',
            { label: 'Intensity', align: 'center', sort: 'number' },
            'Lightning Lane',
          ],
          rows: park.heightAttractions.map((a) => [
            a.hasPage ? html`<a href="${a.url}">${a.name}</a>` : a.name,
            html`<span data-value="${a.heightIn}">${a.heightIn}" · ${Math.round(a.heightIn * 2.54)}cm</span>`,
            a.landInfo ? html`<a href="${a.landInfo.url}">${a.landInfo.name}</a>` : '—',
            f.attractionType(a.type),
            html`<span data-value="${a.intensity || 0}">${f.intensityLabel(a.intensity)}</span>`,
            f.lightningLaneShort(a.lightningLane),
          ]),
        })}
        ${C.lastVerified(park.lastVerified)}
      `,
    })}

    ${C.section({
      tone: 'tint',
      title: 'What can my child ride?',
      kicker: 'By height',
      intro: 'Each band below shows what unlocks at that height and what is still out of reach.',
      children: html`
        ${thresholds.map((threshold) => {
          const unlocked = park.heightAttractions.filter((a) => a.heightIn <= threshold)
          const blocked = park.heightAttractions.filter((a) => a.heightIn > threshold)
          const justUnlocked = park.heightAttractions.filter((a) => a.heightIn === threshold)
          return html`
            <div class="doc-section" id="height-${threshold}">
              <h2>At ${threshold} inches (${Math.round(threshold * 2.54)}cm)</h2>
              <p>A child who measures ${threshold} inches can ride <strong>${unlocked.length + park.noHeightAttractions.length}</strong> of the ${park.attractions.filter((a) => a.isOpen).length} attractions at ${park.name} — every one of the ${park.noHeightAttractions.length} with no requirement, plus ${unlocked.length} that do have one.</p>
              <p><strong>Newly unlocked at this height:</strong> ${f.list(justUnlocked.map((a) => a.name))}.</p>
              ${blocked.length
                ? html`<p><strong>Still too short for:</strong> ${f.list(blocked.map((a) => `${a.name} (${a.heightIn}")`))}.</p>`
                : html`<p><strong>Nothing is off limits.</strong> At ${threshold} inches your child clears every height requirement in the park.</p>`}
            </div>
          `
        })}
      `,
    })}

    ${C.section({
      title: `Attractions with no height requirement`,
      kicker: `${park.noHeightAttractions.length} of them`,
      intro: 'Anyone can ride these, at any height — though some still frighten small children. Scare factors are noted where they matter.',
      children: html`
        ${C.dataTable({
          sortable: true,
          className: 'data-table--stack',
          columns: ['Attraction', 'Land', 'Type', { label: 'Scare factor', align: 'center', sort: 'number' }],
          rows: park.noHeightAttractions.map((a) => [
            a.hasPage ? html`<a href="${a.url}">${a.name}</a>` : a.name,
            a.landInfo ? a.landInfo.name : '—',
            f.attractionType(a.type),
            html`<span data-value="${a.scary && a.scary.score ? a.scary.score : 0}">${a.scary && a.scary.score ? `${a.scary.score}/5` : '—'}</span>`,
          ]),
        })}
      `,
    })}

    ${C.section({
      tone: 'tint',
      title: 'How measuring actually works',
      children: html`
        <div class="prose">
          <p>A cast member measures your child against a fixed stick at the entrance to each attraction: shoes on, hats off, standing straight. There is no discretion and no negotiating — the stick decides.</p>
          <p>If your child is borderline, ask for a wristband at the first attraction that measures them. A coloured band means the height has been checked for the day and they will not be re-measured at every queue, which saves a lot of standing around and a lot of disappointment repeated seven times.</p>
          <p>Thick-soled shoes are not cheating; they are simply how the measurement is taken. Hair that adds height is not — expect it to be flattened.</p>
        </div>
        ${C.callout({
          type: 'tip',
          title: 'Measure at home first, honestly',
          body: 'Measure barefoot against a wall with a book flat on their head, then add the sole thickness of the shoes they will actually wear. Round down. A child measured optimistically at home is a child crying at the front of a 50-minute queue.',
        })}
      `,
    })}

    ${C.relatedLinks([
      { href: urls.heightChecker(), label: 'Interactive height checker', summary: 'All six parks, one slider' },
      { href: urls.guide('height-requirements'), label: 'Every US Disney height requirement', summary: 'The master table' },
      { href: urls.guide('rider-switch'), label: 'Rider Switch explained', summary: 'How adults still ride when a child cannot' },
      { href: urls.guide('is-it-scary'), label: 'Is it scary?', summary: 'Height is not the only limit' },
    ])}
  `

  return {
    url: urls.heights(park),
    html: renderPage({
      site,
      page: {
        url: urls.heights(park),
        title: `${park.shortLabel} height requirements`,
        titleTail: ' (2026)',
        description: `All ${park.heightAttractions.length} ${park.name} rides with a minimum height, plus exactly what a child can ride at each height band. Verified July 2026.`,
        trail,
        modified: `${park.lastVerified || '2026-07'}-01`,
      },
      body,
      schema: [S.itemList(site, { url: urls.heights(park), name: `${park.name} height requirements`, items: park.heightAttractions })],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Accessibility
 * ------------------------------------------------------------------ */

export function accessibilityPage (park, data) {
  const { site } = data
  const a = park.accessibility || {}
  const trail = crumbs(park, { label: 'Accessibility', href: urls.accessibility(park) })

  const transferGroups = {
    'wheelchair-accessible': [],
    'ecv-transfer': [],
    'must-transfer': [],
  }
  for (const attraction of park.attractions.filter((x) => x.isOpen)) {
    const key = (attraction.accessibility && attraction.accessibility.transfer) || 'must-transfer'
    if (transferGroups[key]) transferGroups[key].push(attraction)
  }

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: park.name,
      title: `${park.name} accessibility`,
      lede: 'Transfers, rentals, quiet spaces, and the sensory details nobody puts on an official page — laid out so you can plan the day rather than discover problems at the queue.',
      tone: 'compact',
    })}

    ${C.section({
      children: html`
        <div class="split">
          <div class="prose prose--lede">${paragraphs(a.intro)}</div>
          <div class="split__aside">
            ${C.factPanel([
              a.wheelchairRental ? { label: 'Wheelchair rental', value: a.wheelchairRental.available ? a.wheelchairRental.location : 'Not available', hint: a.wheelchairRental.priceNote } : null,
              a.ecvRental ? { label: 'ECV rental', value: a.ecvRental.available ? a.ecvRental.location : 'Not available', hint: a.ecvRental.priceNote } : null,
              a.strollerRental ? { label: 'Stroller rental', value: a.strollerRental.available ? a.strollerRental.location : 'Not available', hint: a.strollerRental.priceNote } : null,
            ].filter(Boolean), { title: 'Rentals in this park', columns: 1 })}
            ${C.lastVerified(park.lastVerified)}
          </div>
        </div>
      `,
    })}

    ${C.section({
      tone: 'tint',
      title: 'Which rides you can stay seated for',
      intro: 'Grouped by what the attraction requires. Where a transfer is needed, plan for who does the lifting before you join the queue.',
      children: html`
        ${Object.entries(transferGroups).filter(([, list]) => list.length).map(([key, list]) => html`
          <div class="doc-section" id="transfer-${key}">
            <h2>${f.transfer(key)} <span class="muted small">(${list.length})</span></h2>
            <ul class="ride-chiplist">
              ${list.map((x) => html`<li>${x.name}</li>`)}
            </ul>
          </div>
        `)}
      `,
    })}

    ${C.section({
      children: html`
        <div class="split split--even">
          <div>
            ${a.sensoryNotes && a.sensoryNotes.length ? C.tipList(a.sensoryNotes, { title: 'Sensory notes' }) : ''}
            ${a.mobilityNotes && a.mobilityNotes.length ? C.tipList(a.mobilityNotes, { title: 'Mobility notes' }) : ''}
          </div>
          <div>
            ${a.visionHearingNotes && a.visionHearingNotes.length ? C.tipList(a.visionHearingNotes, { title: 'Vision and hearing' }) : ''}
            ${a.companionRestrooms && a.companionRestrooms.length ? C.tipList(a.companionRestrooms, { title: 'Companion restrooms' }) : ''}
            ${a.serviceAnimalRelief && a.serviceAnimalRelief.length ? C.tipList(a.serviceAnimalRelief, { title: 'Service animal relief areas' }) : ''}
          </div>
        </div>
      `,
    })}

    ${a.quietSpaces && a.quietSpaces.length ? C.section({
      tone: 'tint',
      title: 'Where to go when it is too much',
      intro: 'Real places in this park to sit down, cool off, and lower the volume.',
      children: C.cardGrid(a.quietSpaces.map((q) => C.card({
        title: q.name, eyebrow: q.where, summary: q.note,
      })), { columns: 3 }),
    }) : ''}

    ${C.section({
      children: C.callout({
        type: 'warning',
        title: 'DAS policy changes — check before you count on it',
        body: 'Disney tightened Disability Access Service eligibility in 2024 and continues to adjust both the criteria and the request process. We cover the durable mechanics in our [accessibility guide](/guides/disability-access-service/), but always confirm the current process on Disney’s official accessibility pages before your trip.',
      }),
    })}

    ${C.relatedLinks([
      { href: urls.guide('disability-access-service'), label: 'DAS and accessibility, explained', summary: 'Both resorts, in depth' },
      { href: urls.guide('rider-switch'), label: 'Rider Switch', summary: 'Everyone rides, nobody queues twice' },
      { href: urls.guide('motion-sickness'), label: 'Motion sickness guide', summary: 'Which rides trigger which kind' },
      { href: urls.map(park), label: `${park.name} map`, summary: 'Plan the walking distances' },
    ])}
  `

  return {
    url: urls.accessibility(park),
    html: renderPage({
      site,
      page: {
        url: urls.accessibility(park),
        title: `${park.shortLabel} accessibility guide`,
        titleTail: '',
        description: `Wheelchair and ECV rentals, ride transfer requirements, quiet spaces, and sensory notes for ${park.name}. Written for planning, not for reassurance.`,
        trail,
        modified: `${park.lastVerified || '2026-07'}-01`,
      },
      body,
    }),
  }
}

/* ------------------------------------------------------------------ *
 * First-timer guide
 * ------------------------------------------------------------------ */

export function firstTimerPage (park, data) {
  const { site } = data
  const ft = park.firstTimer || {}
  const trail = crumbs(park, { label: 'First-timer guide', href: urls.firstTimer(park) })

  const timeline = (items, title) => (items && items.length ? html`
    <div class="doc-section">
      <h2>${title}</h2>
      <div class="timeline">
        ${items.map((item) => html`
          <div class="timeline__item">
            <p class="timeline__time">${item.time}</p>
            <p class="timeline__body">${inline(item.body)}</p>
          </div>
        `)}
      </div>
    </div>
  ` : '')

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: park.name,
      title: `${park.name} for first-timers`,
      lede: 'A plan, not a list of adjectives. What to sort before you go, what order to do things in, and the mistakes that cost first-timers two hours a day.',
      tone: 'compact',
      actions: [
        { href: urls.rides(park), label: 'See every attraction', primary: true },
        { href: urls.map(park), label: 'Printable map' },
      ],
    })}

    ${C.section({
      children: html`
        <div class="doc-layout">
          <div>
            <div class="prose prose--lede">${paragraphs(ft.intro)}</div>

            ${ft.ifYouOnlyHaveOneDay && ft.ifYouOnlyHaveOneDay.length ? html`
              ${C.keyPoints(ft.ifYouOnlyHaveOneDay, 'If you only have one day, do exactly this')}
            ` : ''}

            ${ft.beforeYouGo && ft.beforeYouGo.length ? html`
              <div class="doc-section">
                <h2>Before you go</h2>
                <div class="card-grid card-grid--2">
                  ${ft.beforeYouGo.map((item) => C.card({ title: item.title, summary: item.body }))}
                </div>
              </div>` : ''}

            ${timeline(ft.morningPlan, 'The morning')}
            ${timeline(ft.middayPlan, 'The middle of the day')}
            ${timeline(ft.eveningPlan, 'The evening')}

            ${ft.rookieMistakes && ft.rookieMistakes.length ? html`
              <div class="doc-section">
                <h2>Mistakes first-timers make</h2>
                ${C.bulletList(ft.rookieMistakes)}
              </div>` : ''}

            ${C.affiliateBox(site, {
              kind: park.resort === 'disneyland' ? 'packagesDisneyland' : 'tickets',
              heading: 'Tickets, honestly',
              body: 'Disney does not discount its own tickets. Authorized resellers do, by a little, and the savings are real on multi-day tickets. We use this one; it is where our own money goes.',
            })}
          </div>
          <aside class="doc-layout__aside">
            ${C.factPanel([
              park.stats && park.stats.typicalFullDayHours ? { label: 'Plan for', value: park.stats.typicalFullDayHours } : null,
              park.stats && park.stats.minimumDaysRecommended ? { label: 'Days needed', value: `${park.stats.minimumDaysRecommended}` } : null,
              { label: 'Attractions', value: String(park.attractions.filter((x) => x.isOpen).length) },
              { label: 'Headliners', value: String(park.headliners.length) },
            ].filter(Boolean), { title: park.name, columns: 1 })}
            ${C.linkGrid([
              { href: urls.heights(park), label: 'Height requirements' },
              { href: urls.snacks(park), label: 'Best snacks' },
              { href: urls.dining(park), label: 'Where to eat' },
              { href: urls.accessibility(park), label: 'Accessibility' },
            ], { columns: 1 })}
          </aside>
        </div>
      `,
    })}

    ${C.relatedLinks([
      { href: urls.guide('first-disney-trip'), label: 'Your first Disney trip', summary: 'The resort-level decisions' },
      { href: urls.guide('rope-drop-strategy'), label: 'Rope drop strategy', summary: 'What being early actually buys' },
      { href: urls.guide('lightning-lane'), label: 'Lightning Lane', summary: 'Worth it here, or not' },
      { href: urls.guide('what-to-pack'), label: 'What to pack', summary: 'The bag that survives a full day' },
    ])}
  `

  return {
    url: urls.firstTimer(park),
    html: renderPage({
      site,
      page: {
        url: urls.firstTimer(park),
        title: `${park.shortLabel} first-timer guide`,
        titleTail: ': a plan that works',
        description: `A hour-by-hour first-visit plan for ${park.name}: what to book, what order to ride, where to eat, and the rookie mistakes that cost you two hours.`,
        trail,
        modified: `${park.lastVerified || '2026-07'}-01`,
        ogType: 'article',
      },
      body,
      schema: [S.article(site, {
        url: urls.firstTimer(park),
        title: `${park.name} first-timer guide`,
        description: park.summary,
        modified: `${park.lastVerified || '2026-07'}-01`,
        section: 'Planning',
      })],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Map
 * ------------------------------------------------------------------ */

export function mapPage (park, data) {
  const { site } = data
  const trail = crumbs(park, { label: 'Map', href: urls.map(park) })
  const rendered = renderParkMap(park)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: park.name,
      title: `${park.name} map`,
      lede: rendered && rendered.synthetic
        ? 'A schematic showing how the lands sit relative to one another and the entrance. Drawn by us, prints on one page, and works with the network off.'
        : 'Our own schematic map — no clutter, no ads baked into the image, every marker clickable. It prints on one page in black and white and works with the network off.',
      tone: 'compact',
      actions: [
        { href: urls.rides(park), label: 'Every attraction', primary: true },
        { href: urls.snacks(park), label: 'Snacks by land' },
      ],
    })}

    ${C.section({
      wide: true,
      children: html`
        <div class="split">
          <div>
            <div class="parkmap-wrap">
              ${rendered ? rendered.svg : html`<p class="muted">Map coming soon for this park.</p>`}
            </div>
            <div class="map-legend" aria-hidden="true">
              <span><i style="background:var(--accent)"></i> Headliner attraction</span>
              <span><i style="background:var(--surface);border:2px solid var(--ink)"></i> Other attraction</span>
              <span><i style="background:var(--brand-2)"></i> Notable food</span>
              <span><i style="background:var(--brand)"></i> Entrance</span>
            </div>
            <div class="mt-4" data-print-hide>
              <button class="btn btn--ghost btn--small" type="button" data-map-zoom="in">Zoom in</button>
              <button class="btn btn--ghost btn--small" type="button" data-map-zoom="out">Zoom out</button>
              <button class="btn btn--ghost btn--small" type="button" data-map-reset hidden>Reset</button>
              <button class="btn btn--ghost btn--small" type="button" onclick="window.print()">Print this map</button>
            </div>
            <p class="map-attribution">
              Map drawn by ${site.brand.name} from open geographic data, including data © OpenStreetMap
              contributors, available under the Open Database Licence. Positions are schematic and are
              not to scale. This is not an official park map and is not affiliated with or endorsed by
              The Walt Disney Company.
            </p>
          </div>
          <div class="split__aside">
            ${C.factPanel(park.lands.map((land) => ({
              label: land.name,
              value: html`<a href="${land.url}" data-land-link="${land.slug}">${land.attractions.filter((x) => x.isOpen).length} attractions</a>`,
              hint: land.anchorInfo ? `Headliner: ${land.anchorInfo.name}` : null,
            })), { title: 'The lands', columns: 1 })}
            ${C.callout({
              type: 'tip',
              title: 'Save it before you go',
              body: 'Open this page once on the hotel WiFi and it stays available on your phone with no signal at all — as does your saved [food list](/tools/food-tracker/).',
            })}
          </div>
        </div>
      `,
    })}

    ${C.relatedLinks([
      { href: urls.rides(park), label: 'All attractions', summary: 'The full list' },
      { href: urls.dining(park), label: 'Where to eat', summary: 'By land' },
      { href: urls.accessibility(park), label: 'Accessibility', summary: 'Distances and transfers' },
      { href: urls.firstTimer(park), label: 'First-timer plan', summary: 'A route through the park' },
    ])}
  `

  return {
    url: urls.map(park),
    html: renderPage({
      site,
      page: {
        url: urls.map(park),
        title: `${park.shortLabel} map`,
        titleTail: ' (printable & offline)',
        description: `A clean, printable schematic map of ${park.name} showing every land and its headliner attractions. Works offline once you have opened it.`,
        trail,
        modified: `${park.lastVerified || '2026-07'}-01`,
      },
      body,
      scripts: ['/assets/js/map.js'],
    }),
  }
}

/* ------------------------------------------------------------------ *
 * Best rides — a ranked editorial page, not a re-sorted list
 * ------------------------------------------------------------------ */

export function bestRidesPage (park, data) {
  const { site } = data
  const doc = park.bestRides
  const trail = crumbs(park, { label: 'Best rides', href: urls.bestRides(park) })
  const resolve = (slug) => park.attractionBySlug.get(slug) || null

  const ranked = (doc.ranking || [])
    .map((entry) => ({ ...entry, attraction: resolve(entry.slug) }))
    .filter((entry) => entry.attraction)
    .sort((a, b) => a.rank - b.rank)

  const named = (list) => (list || [])
    .map((entry) => ({ ...entry, attraction: resolve(entry.slug) }))
    .filter((entry) => entry.attraction)

  const overrated = named(doc.overrated)
  const underrated = named(doc.underrated)

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({
      eyebrow: park.name,
      title: `The best rides at ${park.name}`,
      lede: doc.criteria,
      tone: 'compact',
      meta: [
        { label: 'Ranked', value: `${ranked.length} attractions` },
        { label: 'Best in park', value: ranked.length ? ranked[0].attraction.name : '—' },
        { label: 'Last verified', value: f.humanDate(doc.lastVerified) },
      ],
      actions: [
        { href: urls.rides(park), label: `All ${park.attractions.filter((a) => a.isOpen).length} attractions`, primary: true },
        { href: urls.heights(park), label: 'Height requirements' },
      ],
    })}

    ${C.section({
      children: html`
        <div class="prose prose--lede">${paragraphs(doc.intro)}</div>
        ${C.callout({
          type: 'note',
          title: 'How we ranked these',
          body: `${doc.criteria} Queue length and Lightning Lane status are noted on each entry but do not move anything up or down — a great ride with a bad queue is still a great ride.`,
        })}
      `,
    })}

    ${C.section({
      tone: 'tint',
      title: 'The ranking',
      children: html`
        <div class="rank-list">
          ${ranked.map((entry) => {
            const a = entry.attraction
            return html`
              <article class="rank-item" id="rank-${entry.rank}">
                <div class="rank-item__head">
                  <span class="rank-item__num">${entry.rank}</span>
                  <h3 class="rank-item__name">${a.hasPage ? html`<a href="${a.url}">${a.name}</a>` : a.name}</h3>
                  ${C.heightBadge(a.heightIn)}
                </div>
                <p class="rank-item__headline">${inline(entry.headline)}</p>
                <p class="inline-attraction__meta">
                  ${a.landInfo ? html`<a href="${a.landInfo.url}">${a.landInfo.name}</a> · ` : ''}
                  ${f.attractionType(a.type)}
                  ${a.durationMinutes != null ? html` · ${f.duration(a.durationMinutes)}` : ''}
                  · ${f.lightningLaneShort(a.lightningLane)}
                  ${a.scary && a.scary.score ? html` · Scare factor ${a.scary.score}/5` : ''}
                </p>
                ${paragraphs(entry.why)}
                ${entry.skipIf ? html`<p class="small muted"><strong>Skip it if:</strong> ${inline(entry.skipIf)}</p>` : ''}
              </article>
            `
          })}
        </div>
      `,
    })}

    ${overrated.length || underrated.length ? C.section({
      title: 'The honest bit',
      intro: 'Every ranking is also a set of arguments. Here are the two we expect to get mail about.',
      children: html`
        <div class="split split--even">
          ${overrated.length ? html`
            <div>
              <h3 class="mb-4">Overrated relative to the queue</h3>
              <div class="stack">
                ${overrated.map((entry) => C.card({
                  href: entry.attraction.hasPage ? entry.attraction.url : null,
                  title: entry.attraction.name,
                  summary: entry.why,
                  eyebrow: entry.attraction.landInfo ? entry.attraction.landInfo.name : '',
                }))}
              </div>
            </div>` : ''}
          ${underrated.length ? html`
            <div>
              <h3 class="mb-4">Underrated and routinely walked past</h3>
              <div class="stack">
                ${underrated.map((entry) => C.card({
                  href: entry.attraction.hasPage ? entry.attraction.url : null,
                  title: entry.attraction.name,
                  summary: entry.why,
                  eyebrow: entry.attraction.landInfo ? entry.attraction.landInfo.name : '',
                }))}
              </div>
            </div>` : ''}
        </div>
        ${C.lastVerified(doc.lastVerified)}
      `,
    }) : ''}

    ${C.faqSection(doc.faqs, { title: `Best rides at ${park.name}: common questions` })}

    ${C.relatedLinks([
      { href: urls.rides(park), label: 'Every attraction', summary: 'The full list, sortable' },
      { href: urls.heights(park), label: 'Height requirements', summary: 'What your child clears' },
      { href: urls.firstTimer(park), label: 'First-timer plan', summary: 'The order to do them in' },
      { href: urls.compare('disney-park-rankings'), label: 'All six parks ranked', summary: 'Zoom out' },
    ])}
  `

  return {
    url: urls.bestRides(park),
    html: renderPage({
      site,
      page: {
        url: urls.bestRides(park),
        title: `Best rides at ${park.shortLabel}`,
        titleTail: ', ranked',
        description: C.truncate(`Our ranking of the ${ranked.length} best rides at ${park.name}, defended one by one — plus the ones we think are overrated and the ones everyone walks past.`, 155),
        trail,
        modified: `${doc.lastVerified || '2026-07'}-01`,
        ogType: 'article',
      },
      body,
      schema: [
        S.itemList(site, {
          url: urls.bestRides(park),
          name: `Best rides at ${park.name}`,
          items: ranked.map((entry) => entry.attraction),
        }),
        S.faqPage(site, { url: urls.bestRides(park), faqs: doc.faqs }),
        S.article(site, {
          url: urls.bestRides(park),
          title: `The best rides at ${park.name}`,
          description: doc.criteria,
          modified: `${doc.lastVerified || '2026-07'}-01`,
          section: 'Rides',
        }),
      ],
    }),
  }
}
