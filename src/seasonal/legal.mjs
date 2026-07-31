/**
 * Site 2's editorial and legal documents.
 *
 * Six static pages sharing one shell. The editorial policy is the flagship rather than the
 * boilerplate: the freshness contract is the only thing this site sells that the competition does not
 * already give away, and a contract a reader cannot read is a marketing claim. So that page describes
 * checks that actually run — a reader who disbelieves us can find a page past its review date and
 * watch it carry the banner.
 *
 * The copy is written fresh rather than adapted from src/pages/legal.mjs. Two domains under one
 * publisher running near-identical legal prose is duplicate content in the plainest sense, and the
 * entire argument for splitting the sites is that each one owns its own material.
 */

import { html, paragraphs } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import * as SS from '../lib/seasonal-schema.mjs'
import { urls } from '../lib/seasonal-data.mjs'

/**
 * Hard-coded rather than derived from BUILD_MONTH.
 *
 * "Last updated" on a legal page has to mean "last edited by a person". Wiring it to the build month
 * would restamp every one of these documents on a rebuild that changed nothing in them, which is the
 * same species of quiet lie the rest of this site exists to refuse.
 */
const UPDATED = '2026-07-01'

/**
 * Absolute link to the evergreen sister site.
 *
 * The origin comes from data/seasonal/site.json rather than a constant so a domain move is one edit
 * in one file. Only the root is ever built here — deep links into Site 1 belong in `crossLinks`,
 * where the loader can check that the target actually exists.
 */
const sister = (site, path = '/') => `${site.brand.sisterSite.origin}${path}`

/** Shared shell for the static editorial and legal documents. Mirrors Site 1's, deliberately. */
function docPage (data, { url, title, titleTail, h1, description, lede, sections, toc, noindex, updated = UPDATED }) {
  const { site } = data
  const trail = [{ label: 'Home', href: urls.home() }, { label: h1, href: url }]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({ eyebrow: site.brand.name, title: h1, lede, tone: 'compact' })}
    ${C.section({
      children: html`
        <div class="shell--narrow legal-page">
          <p class="legal-page__updated">Last updated ${new Date(updated + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
          ${toc ? C.tableOfContents(sections) : ''}
          ${sections.map((s) => html`
            ${s.heading ? html`<h2 id="${s.id || ''}">${s.heading}</h2>` : ''}
            ${paragraphs(s.body)}
            ${s.list ? C.bulletList(s.list, { style: s.listStyle || 'bullet' }) : ''}
            ${s.table ? C.dataTable(s.table) : ''}
            ${s.callout ? C.callout(s.callout) : ''}
          `)}
        </div>
      `,
    })}
  `

  return {
    url,
    html: renderPage({
      site,
      page: { url, title, titleTail, description, trail, modified: updated, noindex },
      body,
      // These are the pages where a reader goes to work out what the two domains are to each other,
      // so they are the ones where the relationship is worth stating in the graph as well as in prose.
      schema: [SS.siteRelationship(site)].filter(Boolean),
    }),
  }
}

export function legalPages (data) {
  const { site } = data
  const pages = []

  /* ---------------- About ---------------- */
  pages.push(docPage(data, {
    url: urls.about(),
    title: `About ${site.brand.name}`,
    h1: 'About this site',
    description: 'What Park Season Guide covers, why the seasonal and evergreen halves live on separate domains, and why every dated claim here carries a confidence level.',
    lede: 'The seasonal half of a two-site project: what is on, when to go, what it costs, and how much of that anyone has actually announced.',
    sections: [
      {
        body: [
          `${site.brand.name} covers the part of a Disney trip that moves. Party nights and hard-ticket events, festivals and seasonal overlays, ticket and Lightning Lane pricing, refurbishment walls, and the question underneath all of it — which month to go at all.`,
          'Every one of those facts has a shelf life measured in months, and that shapes the whole site. Each dated claim carries the month a person last checked it, how confident we are in it, and the month it has to be checked again. Once that month passes, the page says so on its own, without waiting for anyone here to remember.',
        ],
      },
      {
        heading: 'Two sites, and why they are not one',
        id: 'two-sites',
        body: [
          `This is one half of a pair. [${site.brand.sisterSite.name}](${sister(site)}) is the other half, and it owns everything permanent: height requirements, ride-by-ride detail, what each attraction is actually like, accessibility mechanics, year-round restaurants, and park maps.`,
          'The split is structural rather than cosmetic. Combining the two damages both halves. Seasonal churn undermines a reader\'s confidence in the permanent facts, because pages that change every few weeks teach people to treat everything on the domain as provisional. Permanent stability makes the seasonal material look abandoned, because a Halloween page nobody has touched since 2024 sits alongside a height chart that has been correct the entire time and drags it down with it.',
          'So each topic has exactly one owner. There are no height requirements on this site and no party-night pricing on that one. Where a page here needs a permanent fact, it links across instead of restating it, and the build fails if that link points at a page the other site does not publish.',
        ],
        callout: {
          type: 'note',
          title: site.brand.sisterSite.name,
          body: site.brand.sisterSite.note,
        },
      },
      {
        heading: 'What this site owns',
        id: 'scope',
        body: [
          'Anything with a season attached to it, at Walt Disney World and the Disneyland Resort:',
        ],
        list: [
          '**Hard-ticket events** — the Halloween and Christmas party nights, after-hours events, and the separately ticketed evenings that are not included with a park ticket. What you get, what you do not, and whether the price holds up.',
          '**Festivals and overlays** — the EPCOT festivals, the seasonal decoration and entertainment layers at both resorts, and the food worth queueing for at each.',
          '**When to go** — all twelve months graded, with crowd shape, cost level, climate normals, and the specific weeks worth targeting or avoiding inside each one.',
          '**What things cost** — ticket, Lightning Lane, parking, and pass pricing, always as a range and always with the cycle the range describes.',
          '**Closures and refurbishments** — what is behind a wall at each resort, and how firm the reopening actually is.',
          '**Timing tools** — the year-at-a-glance calendar and a trip-timing ranker that reorders the months against what you personally care about.',
        ],
      },
      {
        heading: 'What we deliberately leave alone',
        id: 'boundary',
        body: [
          `Permanent facts are not here. Height requirements, ride mechanics, accessibility provisions, year-round dining, and park maps live on [${site.brand.sisterSite.name}](${sister(site)}), and we link to them rather than keep a second copy that could drift out of step with the first.`,
          'We also do not publish daily crowd predictions or live wait times. Both have to be right today to be worth anything, and a static site rebuilt on a schedule cannot be right today. The operator\'s own app does that job, and it does it with data we do not have.',
        ],
      },
      {
        heading: 'How it is written',
        id: 'standards',
        body: [
          'Answer first. The opening sentence of a section states the conclusion and the rest of it argues for that conclusion, because a reader standing in a park with a phone should not have to read three paragraphs to find out what we think.',
          'Verdicts are committed. Every month carries a letter grade, every event page says who should skip it, and every event page carries a list of what the ticket does not get you. A guide that never says "skip this" is an advertisement with a different layout.',
          `The full rules, including what each confidence level permits us to state, are on the [editorial policy](${urls.editorial()}).`,
        ],
      },
      {
        heading: 'How it is paid for',
        id: 'funding',
        body: [
          `A small number of affiliate links, and nothing else at present. Most of what this site covers cannot be bought through anyone but the operator, so most pages here earn nothing at all. The full accounting is on the [affiliate disclosure](${urls.affiliate()}).`,
        ],
      },
      {
        heading: 'Independence',
        id: 'independence',
        body: [
          site.legal.disclaimer,
          'We hold no press access, receive no complimentary tickets, and submit nothing here for anyone\'s approval. We pay for our own admission, our own party tickets, and our own festival food, which is the only arrangement under which the price question can be answered honestly.',
        ],
      },
    ],
  }))

  /* ---------------- Editorial policy ---------------- */
  pages.push(docPage(data, {
    url: urls.editorial(),
    title: 'Editorial policy',
    titleTail: ': Confidence Levels & Corrections',
    h1: 'Editorial policy',
    description: 'The three confidence levels, what each one permits us to state, why the staleness banner cannot be switched off by an author, and what all of it costs us.',
    lede: 'What we are allowed to state at each confidence level, who decides, and what the rules cost us in traffic.',
    toc: true,
    sections: [
      {
        body: [
          'This site does not sell dates. Dates are commodity information: the operator announces them, and within the hour they are on fifty sites. What is scarce is knowing which of those fifty pages checked, and which one is running last year\'s figures with the year swapped.',
          'That is what the rules below are for. Most of them are not editorial preferences at all. They are checks that run in the build, and a page that breaks one does not publish.',
        ],
      },
      {
        heading: 'The problem this site is built around',
        id: 'problem',
        body: [
          'Search for the dates of any Disney hard-ticket party in February, months before anyone has announced anything, and the first page of results will state them anyway. Some of those pages are last year\'s dates with the year edited. Some are last year\'s dates with nothing edited. Some are a genuine extrapolation from the pattern, written by somebody who knows the event well, which is closer to honest and is still presented to the reader as fact.',
          'None of them mark which. The omission is the part worth being uncomfortable about, because the omission is what makes it work: a page that said "these are last year\'s dates and this year is unannounced" would lose the click to the page that simply stated them, so nobody says it. The incentive runs one way and the whole category has followed it.',
          'We mark it. Every dated claim here says which of three things it is, and the labeling is not a footnote — it renders next to the claim, in color, on the page.',
        ],
      },
      {
        heading: 'The three confidence levels',
        id: 'confidence',
        body: [
          'Every dated claim on this site carries one of three labels. The label describes what has actually been announced, not how sure we feel.',
        ],
        table: {
          caption: 'What each confidence level permits us to state.',
          columns: [{ label: 'Level' }, { label: 'What it means' }, { label: 'What we may state' }, { label: 'How it renders' }],
          rows: [
            ['Confirmed', 'The operator has announced it, and we record which announcement', 'Exact dates and exact prices', 'Green, reading "Confirmed"'],
            ['Expected', 'Nobody has announced it, but the pattern has held for at least three consecutive cycles', 'Windows and ranges only, never an exact date', 'Amber, reading "Expected — not yet announced"'],
            ['Historical', 'The last cycle we could confirm; this cycle is unannounced or unclear', 'Prior-cycle figures, labeled with the cycle they belong to', 'Gray, reading "Last confirmed cycle"'],
          ],
        },
      },
      {
        heading: 'Confirmed has to name its source',
        id: 'confirmed',
        body: [
          'A confirmed label is a claim that somebody with the authority to set the date has published it. So the entry has to carry a source note saying what that announcement was, and the note renders on the page where a reader can weigh it rather than sitting in a file only we can see.',
          'A confirmed entry with no source note is a validation error and the build stops. That is a low bar and it is set low on purpose: the label is the strongest thing we say anywhere on this site, and the cost of being able to apply it casually is that it stops meaning anything.',
        ],
      },
      {
        heading: 'Expected is where the real work is',
        id: 'expected',
        body: [
          'Expected means the pattern, not the date. An event that has opened in mid-August for six consecutive years will almost certainly open in mid-August again, and that is genuinely enough to book flights around. What it is not is a date, and the gap between those two things is where every seasonal site in this category quietly cheats.',
          'So an expected entry may tell you the window it typically occupies, roughly how many nights it usually runs, which nights of the week it usually falls on, and what the last confirmed cycle charged. It may not tell you that the first night is the fifteenth. A fact checker greps our data files for date shapes in any entry that is not confirmed, and a single one fails the build.',
          'This is a harder page to write than the alternative. Stating the pattern well takes more research than stating a date badly, and it converts worse. It is also the only version of the page that is still true in six weeks.',
        ],
      },
      {
        heading: 'Historical is not a downgrade of the writing',
        id: 'historical',
        body: [
          'Historical is the label most of the site wears in the quiet months. It means the last cycle we could stand behind, with its year attached — a party that ran thirty-eight nights and charged between one hundred nineteen and two hundred nineteen dollars in the 2025 season, stated as exactly that rather than as what this year will cost.',
          'The analysis on a historical page is as good as it will ever be. What the event is like, who it suits, which nights are worth paying for and which are a waste — none of that decays. Only the numbers do, and the label is attached to the numbers.',
        ],
      },
      {
        heading: 'Money is always a range, and the range carries a date',
        id: 'prices',
        body: [
          'No single price appears anywhere on this site. Every monetary claim is a range with the cycle it describes attached, and the component that renders a price will not render one without the as-of, which makes the pairing structural rather than a habit somebody could forget.',
          'A single figure implies a precision that seasonal pricing does not have. Party nights are priced night by night, and the cheapest night and the priciest night of the same event can be a hundred dollars apart. Quoting one number for both is not more useful than a range. It is just wrong in two directions at once.',
        ],
      },
      {
        heading: 'The staleness banner is computed, not authored',
        id: 'staleness',
        body: [
          'Every dated entry declares the month by which it must be rechecked. At build time the site compares that month against the month the build is for, and if the review month has passed, three things happen with nobody deciding: a banner appears above the content saying details on the page are past their review date, the page drops out of the high-priority band of the sitemap, and its structured data stops publishing a price.',
          'There is no field in our data files that suppresses the banner. There is no editor setting, no override, and no "reviewed, still looks fine" checkbox. The only way to remove it is to recheck the facts and move the review date, which is precisely the work the banner exists to ask for.',
          'This is deliberately hostile to us. The person most likely to want the banner turned off is the person who forgot to do the check, which is the exact case it was built to catch, and a control that trusted an author to be honest about their own diligence would be a control that does nothing. An entry that arrives with no freshness block at all resolves to stale as well, because an unstamped page is more likely to be wrong than a stamped one, not less.',
        ],
        callout: {
          type: 'note',
          title: 'Why the build compares against a fixed month',
          body: 'The comparison runs against a month set in the code, not against the system clock. A build that read today\'s date would produce different output from the same commit on different days, so a page could slip into stale in production with no change, no review, and nothing for anyone to notice. Bumping that month is a deliberate edit, which means somebody has looked.',
        },
      },
      {
        heading: 'What these rules cost us',
        id: 'cost',
        body: [
          'Search engines reward specificity, and the specific answer is the one we refuse to invent. An event page that will not assert a start date cannot carry the rich result that requires one, so for a stretch of every year about half our event pages publish as ordinary articles while competing pages carry a date-stamped result they earned by making something up.',
          'We also lose the reader who wanted a date and got a window. Some of them go to the page that gave them a date, and most of them never find out it was wrong, because by the time the real dates land nobody goes back to check who called it.',
          'The compensating asset is the only one available: when the announcement finally comes, our page is the one that was not wrong for six months, and the reader who opened the operator\'s own site in the next tab found us telling the truth. That is a slower asset than a rich result and a more durable one.',
        ],
      },
      {
        heading: 'Sourcing, and what we do not claim',
        id: 'sourcing',
        body: [
          'The operator\'s own published information is the primary source for dates, prices, hours, and closures. Where an independent tracker and the operator disagree, the operator wins and the disagreement gets a note. Where we are reasoning from a pattern rather than reading a source, the confidence level says so, which is the entire reason for having one.',
          'We do not claim attendance we did not have. You will not find "when we visited last October" on a page where nobody visited last October. Writing from documented fact and stated reasoning is a weaker rhetorical position than a first-person anecdote and it has the advantage of being checkable.',
          'We do not republish another site\'s text, tables, or datasets. Where we rely on somebody else\'s open data, it is credited on the page that uses it.',
        ],
      },
      {
        heading: 'Money cannot move a date, a grade, or a confidence level',
        id: 'money',
        body: [
          'This site carries a small number of affiliate links. No seller, operator, hotel, or brand can buy a place on a list, a better month grade, a softer verdict, or inclusion of any kind. We decline sponsored posts, paid reviews, and paid link insertions, and those requests are declined without a reply.',
          'The confidence level deserves its own sentence, because it is the one a payment would be most valuable to move. Confidence is a factual claim about whether an announcement exists. It is not an opinion, it is not for sale, and there is no mechanism through which a commercial relationship could reach it — the level is set against a source note in a data file that a fact checker reads on every build.',
          `The commercial arrangements themselves are listed in full on the [affiliate disclosure](${urls.affiliate()}).`,
        ],
      },
      {
        heading: 'Month grades are opinions, and we commit to them',
        id: 'grades',
        body: [
          'Every month page carries a letter grade, and the grades are spread across the range because a guide that awards all twelve months a B is not a guide. September at Walt Disney World and the week after Christmas are not the same trip and should not receive the same letter.',
          'The grade is ours and it is arguable. What it is not is hedged. Where it depends on who you are — and it usually does, because a retired couple and a family tied to a school calendar are looking at different years — the page names the cases and answers each one, and the trip-timing tool re-ranks all twelve months against whichever of them applies to you.',
        ],
      },
      {
        heading: 'Corrections',
        id: 'corrections',
        body: [
          'A correction changes the data file rather than the page. Every page that used the figure picks up the fix on the next build, and the entry\'s verified month moves to the month somebody rechecked it, so the ribbon on the page reflects the new check instead of the old one.',
          `Where we cannot confirm a correction quickly, the claim drops to a lower confidence level or comes out until we can. An unresolved doubt does not get to sit underneath a green ribbon. The full handling standard, including how long we take, is on the [contact page](${urls.contact()}).`,
        ],
      },
      {
        heading: 'How AI is used here',
        id: 'ai',
        body: [
          'AI tooling is used in producing this site, in the way most publishers now use it: drafting, structuring, and checking a large dataset for consistency faster than a person can read it. It does not set a grade, a verdict, or a confidence level, and it is never the source of a fact.',
          'That last restriction is the one that matters most here, and it is not a general principle about machines. A model trained on the open web has read tens of thousands of pages confidently asserting unannounced Disney dates, and it will reproduce them fluently and without hesitation. On the single question this site exists to answer correctly, it is the worst available source.',
          'So every dated claim is checked by a person against the operator\'s own published information before it publishes, and the freshness block records the month that person did it. We say all this because the alternative is pretending otherwise, and the pretense collapses the first time anyone looks closely. The standard we are asking to be judged on is whether the page is accurate, original, and useful.',
        ],
      },
      {
        heading: 'What never appears here',
        id: 'never',
        body: [
          `No logos, wordmarks, character art, official artwork, official photography, or official park maps appear on this site. Park, event, attraction, restaurant, and character names appear because there is no other way to identify the thing being written about. The full position is on the [terms of use](${urls.terms()}).`,
        ],
      },
    ],
  }))

  /* ---------------- Affiliate disclosure ---------------- */
  pages.push(docPage(data, {
    url: urls.affiliate(),
    title: 'Affiliate disclosure',
    h1: 'Affiliate disclosure',
    description: 'Which links on Park Season Guide earn a commission, why most pages here earn nothing, and what a commission is structurally unable to change.',
    lede: 'Some links here earn a commission. None of them can move a date, a price, a grade, or a confidence level.',
    sections: [
      {
        body: [
          site.legal.affiliateDisclosure,
          'The US Federal Trade Commission requires a material connection between a publisher and a seller to be disclosed clearly and conspicuously, close to the recommendation it affects. A page like this one, reachable from the footer, does not satisfy that on its own and is not intended to.',
        ],
      },
      {
        heading: 'The disclosure renders above the link, not only here',
        id: 'placement',
        body: [
          'On any page that carries an affiliate link, the disclosure appears immediately above it, in the same block, before you have read the recommendation.',
          'That is enforced in code rather than by habit. Affiliate links on this site are drawn by a single component, `affiliateBox()`, which emits the disclosure paragraph as the first thing inside the block it renders. There is no path through the templates that produces the link without the disclosure, because a writer has no way to place one without the other.',
        ],
      },
      {
        heading: 'Who we have relationships with',
        id: 'partners',
        list: [
          `**${site.affiliates.tickets.label}** — an authorized reseller of tickets for both resorts. We earn a commission on ticket sales made through our links.`,
          `**${site.affiliates.packagesDisneyland.label}** — Disneyland Resort tickets and hotel packages. We earn a commission on bookings made through our links.`,
          `**${site.affiliates.gear.label} Associates** — seasonal gear on the packing recommendations. We earn a small percentage of qualifying purchases.`,
        ],
        body: [
          'That is the entire list. If it changes, this page changes in the same commit.',
        ],
      },
      {
        heading: 'Most of what we cover cannot be bought through us',
        id: 'limits',
        body: [
          'Hard-ticket event nights are sold by the operator and effectively nowhere else. The Halloween and Christmas parties, the after-hours events, Oogie Boogie Bash — none of them can be bought through a link on this site, and those pages are the bulk of the site.',
          'A month page earns nothing. A festival page earns nothing. A closure tracker earns nothing. The pricing pages earn nothing on the figures themselves. That is worth knowing when you read our answer to whether a party night is worth its price, because on that specific question there is no version of the answer that pays us better than another.',
        ],
      },
      {
        heading: 'What a commission cannot do',
        id: 'independence',
        body: [
          'Inclusion, ranking, month grades, and verdicts are settled before any commercial consideration and are never revisited in light of one. Where the honest answer is that a product is poor value for a particular trip, we publish that on the page carrying the link.',
          'Confidence levels are worth stating separately. A confidence level is a factual claim about whether the operator has announced something, checked against a source note on every build. No payment could raise one, and there is no editorial process through which a payment could be applied to one.',
          'You pay the same price through our link that you would pay without it. Commission comes out of the seller\'s margin, not out of your total.',
        ],
      },
      {
        heading: 'Advertising',
        id: 'advertising',
        body: [
          'No display advertising runs on this site at present, and no advertising script is loaded on any page.',
          'If that changes, it will be described here before it ships rather than after. Any ad slot will reserve fixed space so the page does not move under you while you read, density will stay low on the calendar and the trip-timing tool because those are the pages people use while standing somewhere, and a consent tool will be in place first where the law requires one.',
        ],
      },
    ],
  }))

  /* ---------------- Privacy ---------------- */
  pages.push(docPage(data, {
    url: urls.privacy(),
    title: 'Privacy policy',
    h1: 'Privacy policy',
    description: 'What Park Season Guide stores, which two values stay in your browser, what our host necessarily sees, and what happens before any analytics or advertising is added.',
    lede: 'No accounts, no sign-in, no forms, and nothing about you on anything we run. Here is the specific version.',
    sections: [
      {
        body: [
          `This describes how ${site.brand.name} handles information when you use ${site.brand.domain}. There are no user accounts, nothing is sold directly, and no page on this site asks you for a name, an email address, or a payment detail.`,
        ],
        callout: {
          type: 'warning',
          title: 'A good-faith draft, not legal advice',
          body: 'This page describes the site as it is actually built, written in good faith by the people who built it. It is not legal advice, it is not a lawyer\'s work product, and nothing here should be read as a claim that any particular statute has been assessed against this site by a qualified professional.',
        },
      },
      {
        heading: 'What this site is, technically',
        id: 'what',
        body: [
          'Every page here is a static file, generated ahead of time and served as it was written. There is no application server, no database, no login, and no form that submits anything back to us. Nothing you do while reading is recorded by anything we operate.',
          'That is not a privacy feature so much as a consequence of how the site is built, but it does mean the honest answer to most questions on this page is "nothing".',
        ],
      },
      {
        heading: 'What is stored on your device',
        id: 'local',
        body: [
          'Two features save data in your browser\'s localStorage. Both stay on the device, neither is transmitted anywhere, and we have no means of reading either.',
        ],
        list: [
          '**Trip timing tool** (`psg-timing`) — the resort you selected and which of the four priority checkboxes you left ticked. Nothing else is written, and the tool works without it.',
          '**Theme preference** (`rrg-theme`) — the light or dark color scheme you picked, and nothing beyond that.',
        ],
      },
      {
        heading: 'The theme key is shared with the sister site, the value is not',
        id: 'shared-key',
        body: [
          'Both sites run the same script bundle, so both use the same storage key name for the theme. localStorage is scoped to an origin, which means the value stored under that key on this domain belongs to this domain alone. Neither site can read the other\'s copy, and choosing dark mode on one does not carry across to the other.',
          'Clearing site data for this domain in your browser removes everything described above.',
        ],
      },
      {
        heading: 'Cookies',
        id: 'cookies',
        body: [
          'We set none. Not for preferences, not for measurement, not for advertising. The theme and the trip-timing settings use localStorage precisely because it is not sent with every request the way a cookie is.',
          'A seller you reach through an affiliate link may set its own cookie on its own domain, so that it can attribute a purchase. That cookie is theirs, it is governed by their privacy policy, and it carries no personal information from us because we hold none to pass on.',
        ],
      },
      {
        heading: 'Offline storage',
        id: 'offline',
        body: [
          'This site registers a service worker, which stores copies of pages and assets in your browser\'s cache so the site keeps working on a weak connection or none at all. That cache contains only the public content of this site, it lives on your device, and clearing your browser\'s site data removes it.',
        ],
      },
      {
        heading: 'Analytics',
        id: 'analytics',
        body: [
          site.analytics.enabled
            ? 'Privacy-focused analytics run here, reporting in aggregate only: how many people opened a page and roughly where they arrived from. No tracking cookie is set, no profile is assembled across sites, and no individual visitor is identified.'
            : 'No analytics are loaded on this site. Not a self-hosted script, not a privacy-focused one, not a tag firing quietly on page load. If that changes, this section is updated before the script ships rather than after.',
        ],
      },
      {
        heading: 'The order we will do this in',
        id: 'consent',
        body: [
          'Before any analytics or advertising script is added to this site, a consent management platform goes in first, and the section above is rewritten first.',
          'The order is worth committing to in public because it is the order the industry routinely gets backwards. The tag ships, the consent tool arrives some months later, and the gap in between is never disclosed to anyone. Committing to the sequence now, while there is nothing to lose by committing to it, is cheaper than deciding it under pressure later.',
        ],
      },
      {
        heading: 'What our host necessarily sees',
        id: 'logs',
        body: [
          'Serving a page requires a server to receive a request. Our hosting provider and the network in front of it process your IP address, the page requested, your browser\'s user agent string, and a timestamp, in order to deliver the page and to defend against abuse.',
          'That is inherent to how the web works rather than something we collect on top of it. We do not join it to anything, we do not use it to build a profile, and we do not export it.',
        ],
      },
      {
        heading: 'Your rights, and what there is to exercise them against',
        id: 'rights',
        body: [
          'Data protection law in the European Union, the United Kingdom, California, and a growing number of other US states gives readers rights to know what personal information is held about them, to have it corrected, to have it deleted, and to object to particular uses of it. Those rights are real and they matter.',
          'The honest position for this site is that there is almost nothing here for them to reach. We hold no account, no email address, no profile, and no record of your visit beyond the delivery logs described above, which our host keeps and we do not query for anything else. A request to produce or erase what we hold about you would, today, be answered by saying that we hold nothing about you.',
          'Two things follow. The data described further up this page is entirely within your control and is removed by clearing your browser\'s site data. And if analytics or advertising is ever added here, the corresponding controls appear alongside them and this page is updated before they load.',
          `Questions about any of this go through the [contact page](${urls.contact()}).`,
        ],
      },
      {
        heading: 'Children',
        id: 'children',
        body: [
          'This site is written for adults planning trips. It is not directed at children under 13, and we do not knowingly collect personal information from anyone, which necessarily includes them.',
        ],
      },
      {
        heading: 'Changes to this policy',
        id: 'changes',
        body: [
          'Changes are reflected here with a new date at the top of the page. A change that alters what the site actually does — a script added, a storage key introduced — lands here in the same commit that makes the change, not afterward.',
        ],
      },
    ],
  }))

  /* ---------------- Terms ---------------- */
  pages.push(docPage(data, {
    url: urls.terms(),
    title: 'Terms of use',
    h1: 'Terms of use',
    description: 'The terms that apply to using Park Season Guide, including the accuracy position, the trademark position, and what you may do with the content.',
    lede: 'The conditions of using this site, kept as short as the subject allows.',
    sections: [
      {
        body: [
          `These terms apply to ${site.brand.domain}. Using the site means they apply to you.`,
        ],
        callout: {
          type: 'warning',
          title: 'A good-faith draft',
          body: 'These terms were written in good faith by the people who run the site and describe how it is actually operated. They are not legal advice and have not been drafted or reviewed by a lawyer.',
        },
      },
      {
        heading: 'Accuracy and reliance',
        id: 'accuracy',
        body: [
          site.legal.accuracyNote,
          'The confidence labels are a description of what we know, not a warranty of what will happen. An entry marked expected is our reading of a pattern and may be wrong. An entry marked confirmed was accurate against an announcement at the time somebody checked it, and operators move dates, change prices, and cancel events without notice.',
          'Anything that would ruin a trip if it turned out to be wrong — a party night you are flying in for, a price you are budgeting against, an attraction you are going specifically to ride — should be confirmed with the operator before you commit money to it. We accept no liability for decisions taken on the basis of what is published here.',
        ],
      },
      {
        heading: 'Trademarks and nominative use',
        id: 'trademarks',
        body: [
          site.legal.disclaimer,
          'Park, resort, event, attraction, restaurant, and character names appear on this site because there is no other way to identify what is being described. Using a trademark to refer to the thing it names, in the course of writing about that thing, is nominative use. It does not imply permission, sponsorship, endorsement, approval, or any relationship whatever with the trademark owner.',
          'No logos, wordmarks, character art, official artwork, official photography, or official park maps appear anywhere on this site or on its sister site. That is a standing editorial rule rather than a description of the current state of the pages, and it applies to anything published here in future.',
        ],
      },
      {
        heading: 'Our content',
        id: 'content',
        body: [
          `Text, data, tables, and design on this site are © ${site.brand.founded} ${site.legal.copyrightHolder} unless stated otherwise. You are welcome to link to any page, to quote a short passage with attribution and a link, and to print pages for your own trip.`,
          'Republishing substantial portions, or scraping the underlying dataset to reassemble it elsewhere, is not permitted. The freshness and confidence labels are part of that dataset, and reproducing our figures without them attached would strip out the only thing that makes the figures safe to rely on, which is a worse outcome than the copying itself.',
        ],
      },
      {
        heading: 'Third-party links',
        id: 'links',
        body: [
          'We link to external sites, including a small number of affiliate links and, throughout, to operators\' own pages. None of them is under our control, and what those sites publish, charge, or do with a visitor is their responsibility rather than ours.',
        ],
      },
      {
        heading: 'No warranty',
        id: 'warranty',
        body: [
          'The site is provided as it is, without warranties of any kind, to the fullest extent permitted by law. We do not guarantee that it will be available, complete, current, or free of error, and the freshness contract described in the editorial policy is a working practice rather than a promise of correctness.',
        ],
      },
      {
        heading: 'Changes to these terms',
        id: 'changes',
        body: [
          'These terms may change, and the date at the top of the page moves when they do. The revised version applies from the moment it is published, and reading the site afterward is what accepts it.',
        ],
      },
    ],
  }))

  /* ---------------- Contact ---------------- */
  {
    // Both addresses have to be live before launch. A site whose entire editorial claim is that it
    // dates and rechecks its facts, publishing a correction route that bounces, would be making a
    // promise with no mechanism behind it — which is the specific failure the freshness contract
    // exists to avoid everywhere else.
    const corrections = `corrections@${site.brand.domain}`
    const hello = `hello@${site.brand.domain}`

    pages.push(docPage(data, {
      url: urls.contact(),
      title: 'Contact & corrections',
      h1: 'Contact and corrections',
      description: 'How to report an error on Park Season Guide, what happens to it, and how long each step takes.',
      lede: 'Corrections first. A site that promises to date and recheck its facts needs somewhere to send the ones that are wrong.',
      sections: [
        {
          body: [
            `Corrections go to [${corrections}](mailto:${corrections}). Everything else goes to [${hello}](mailto:${hello}).`,
            'A correction is the most useful thing anyone sends us. It changes a data file rather than a page, so it improves every page that used the figure at once, and it is the only external check this site has on whether the freshness contract is doing its job.',
          ],
        },
        {
          heading: 'What to include',
          id: 'include',
          list: [
            'The page, or the specific claim on it.',
            'What is wrong, and what it should say instead.',
            'Where you saw the correct version, if you have it. An operator\'s own page is the strongest thing you can send and it settles most cases immediately.',
            'When you saw it. A price checked yesterday and a price checked last spring are different pieces of evidence.',
          ],
          body: [
            'A correction with none of that is still worth sending. It just takes us longer.',
          ],
        },
        {
          heading: 'What happens to it',
          id: 'standard',
          body: [
            'This is the standard we hold ourselves to, and it is written down here so you can hold us to it.',
          ],
          listStyle: 'number',
          list: [
            'We acknowledge every correction within three working days, including the ones we end up disagreeing with. Silence is not one of the outcomes.',
            'We check it against the operator\'s own published information rather than against our own previous reasoning, which is the mistake that keeps an error alive.',
            'A confirmed error is fixed in the underlying data within two working days of confirmation, and reaches every page that used it on the next build.',
            'The entry\'s verified month moves to the month we rechecked it, so the ribbon on the page shows the new check rather than the old one. A correction that did not move the date would leave the page claiming a diligence it had not performed.',
            'Where we cannot confirm your correction quickly, the claim drops to a lower confidence level or comes out of the page until we can. An unresolved doubt does not sit underneath a green ribbon while we work out who is right.',
            'A material correction — a date, a price, a park, a closure — is noted on the page rather than silently swapped, because a reader who relied on the old figure deserves to know it moved.',
          ],
        },
        {
          heading: 'What we cannot do',
          id: 'cannot',
          body: [
            'We cannot book anything, change a reservation, resolve a problem with a ticket, or raise anything with an operator on your behalf. We hold no relationship with any of them and have no channel to escalate into. The operator\'s own support line is the only route for those, and it is a better one than we could offer.',
            'We also cannot tell you this year\'s dates before they are announced. If we could, they would already be on the page with a green ribbon over them.',
          ],
        },
        {
          heading: 'What we decline',
          id: 'decline',
          body: [
            'Sponsored posts, paid reviews, paid link insertions, guest posts written to place a link, link exchanges, and requests to remove or soften an unflattering verdict on commercial grounds. These are declined without a reply.',
            `Why, at length, is on the [editorial policy](${urls.editorial()}).`,
          ],
        },
      ],
    }))
  }

  return pages
}
