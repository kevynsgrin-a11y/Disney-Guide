import { html, raw, paragraphs, inline } from '../lib/html.mjs'
import { renderPage } from '../templates/layout.mjs'
import * as C from '../templates/components.mjs'
import { urls } from '../lib/data.mjs'

const UPDATED = '2026-07-01'

/** Shared shell for the static editorial and legal documents. */
function docPage (data, { url, title, h1, description, lede, sections, noindex, updated = UPDATED }) {
  const { site } = data
  const trail = [{ label: 'Home', href: '/' }, { label: h1, href: url }]

  const body = html`
    ${C.breadcrumbs(trail)}
    ${C.hero({ eyebrow: site.brand.name, title: h1, lede, tone: 'compact' })}
    ${C.section({
      children: html`
        <div class="shell--narrow legal-page">
          <p class="legal-page__updated">Last updated ${new Date(updated + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
          ${sections.map((s) => html`
            ${s.heading ? html`<h2 id="${s.id || ''}">${s.heading}</h2>` : ''}
            ${paragraphs(s.body)}
            ${s.list ? C.bulletList(s.list, { style: s.listStyle || 'bullet' }) : ''}
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
      page: { url, title, description, trail, modified: updated, noindex },
      body,
    }),
  }
}

export function legalPages (data) {
  const { site } = data
  const pages = []

  /* ---------------- About ---------------- */
  pages.push(docPage(data, {
    url: urls.about(),
    title: 'About Ride Ready Guide',
    h1: 'About this site',
    description: 'Who writes Ride Ready Guide, how it is funded, what it refuses to do, and why every page carries a verification date.',
    lede: 'An independent guide to the six US Disney parks, written by people who buy their own tickets.',
    sections: [
      {
        body: [
          `${site.brand.name} exists because theme-park planning content has a quality problem. Most of it is either an official page that will never tell you something is disappointing, or a listicle assembled by someone who has not been in years and cannot tell you which side of the boat to sit on.`,
          'This site is built around three ideas. First, the durable facts — heights, ride mechanics, accessibility, what a snack costs — are worth getting exactly right and stamping with a date. Second, the interpretive stuff — is it scary, is it worth the queue, is that restaurant overpriced — is worth an actual opinion. Third, a tool that works in your hand in the park beats an article about the tool every time.',
        ],
      },
      {
        heading: 'What we cover, and what we deliberately do not',
        id: 'scope',
        body: [
          'We cover the evergreen layer: every attraction at all six US Disney parks, every height requirement, ride-by-ride scare and motion assessments, accessibility detail, restaurants and their standing character, curated snack lists with dated prices, printable maps, and the planning mechanics that stay true from year to year.',
          'We deliberately do not cover party nights, festival menus, seasonal ride overlays, refurbishment news, or today’s Lightning Lane price. Those change every few weeks. An evergreen page that pretends to track them is simply a page that is wrong most of the year, and we would rather send you to the park’s own app for live detail than be confidently out of date.',
        ],
      },
      {
        heading: 'How we keep it accurate',
        id: 'accuracy',
        body: [
          'Every data page carries a “last verified” month. That is not decoration — it is the honest statement of when a human last checked the numbers on it. Height requirements, ride systems, and closures are checked against the parks’ own published information. Prices come from in-park verification and are cross-checked against the independent trackers that do this full time; where sources disagree, we take the most recently verifiable figure and date it.',
          'When something changes — a height requirement drops, an attraction closes, a price moves — the fix goes into the underlying dataset and every page that uses it updates at once. That is the entire reason this site is built from structured data rather than hand-written pages.',
        ],
        callout: {
          type: 'note',
          title: 'Found something wrong?',
          body: 'Corrections are genuinely welcome and genuinely useful. See the [contact page](/contact/).',
        },
      },
      {
        heading: 'Independence',
        id: 'independence',
        body: [
          site.legal.disclaimer,
          'We are not a Disney partner, we receive no press access, and nothing on this site is reviewed or approved by anyone at The Walt Disney Company. We pay for our own tickets, our own food, and our own hotel rooms.',
        ],
      },
    ],
  }))

  /* ---------------- Editorial policy ---------------- */
  pages.push(docPage(data, {
    url: urls.editorial(),
    title: 'Editorial policy',
    h1: 'Editorial policy',
    description: 'How Ride Ready Guide decides what to recommend, how commercial relationships are kept away from rankings, and how AI assistance is used.',
    lede: 'The rules we hold ourselves to, written down so you can hold us to them.',
    sections: [
      {
        heading: 'Money never buys placement',
        id: 'placement',
        body: [
          'This site carries display advertising and a small number of affiliate links. No restaurant, hotel, ticket reseller, tour operator, or brand can pay to appear on a list, to rank higher on one, or to be described more kindly. There is no sponsored content, no paid review, and no paid link insertion — we decline those requests.',
          'Where we earn a commission, it is disclosed immediately above the link, not only in the footer. We keep affiliate links on pages where a purchase is genuinely the next step — ticket and planning pages — and off pages like height charts, where somebody is looking for a fact rather than a product.',
        ],
      },
      {
        heading: 'We say when something is not worth it',
        id: 'honesty',
        body: [
          'A guide that likes everything is useless. Our snack dataset includes items we call overrated. Our restaurant pages include verdicts that amount to “eat somewhere else.” Our comparison pages pick a side. If a headliner attraction has a queue that is not worth its payoff, we say that on the attraction’s own page.',
          'This applies to things we would earn money from. If a ticket product is bad value for a particular trip shape, we say so on the page that carries the ticket link.',
        ],
      },
      {
        heading: 'Sourcing and verification',
        id: 'sourcing',
        body: [
          'Factual claims — heights, opening dates, ride systems, closures, accessibility provisions — are checked against the parks’ own published information first. Prices are verified in park and cross-checked against independent trackers. Construction timelines are reported only as far as Disney has officially stated them; anything beyond that is labelled as an estimate, because it is.',
          'We do not republish other sites’ text, photographs, or datasets. Where we rely on open data — as with the geographic data underlying our maps — it is credited on the page that uses it.',
        ],
      },
      {
        heading: 'Corrections',
        id: 'corrections',
        body: [
          'When we get something wrong, we fix the underlying data, which corrects every page that used it, and we update the verification date. We do not quietly delete pages about attractions that have closed — those are exactly what people search for, so they stay, marked as closed, with a factual note about what replaced them.',
        ],
      },
      {
        heading: 'How AI is used here',
        id: 'ai',
        body: [
          'We use AI tooling in the production of this site the way most publishers now do: for drafting, structuring, and consistency checks across a large dataset. It does not decide what we recommend, and it is not permitted to be the source of a factual claim. Every height, price, closure, and mechanic on this site is checked by a person against a primary source before it publishes.',
          'We mention this because the alternative — pretending otherwise — is the kind of thing that erodes trust the moment anyone notices. What matters is whether the page is accurate, original, and actually useful. That is the standard we are asking to be judged on.',
        ],
      },
      {
        heading: 'What we will not publish',
        id: 'never',
        body: [
          'We do not reproduce Disney’s artwork, logos, typefaces, character imagery, or official maps. We do not use photography whose primary subject is a copyrighted character. We do not imply affiliation or endorsement. Park, attraction, restaurant, and character names appear here only to identify what we are describing, which is what they are for.',
        ],
      },
    ],
  }))

  /* ---------------- Affiliate disclosure ---------------- */
  pages.push(docPage(data, {
    url: urls.affiliate(),
    title: 'Affiliate disclosure',
    h1: 'Affiliate disclosure',
    description: 'Which links on Ride Ready Guide earn a commission, how much, and what that does and does not influence.',
    lede: 'The plain-English version: some links earn us money, none of them change what we recommend.',
    sections: [
      {
        body: [
          site.legal.affiliateDisclosure,
          'The US Federal Trade Commission requires this disclosure to be clear and conspicuous. We put it directly above the first affiliate link on every page that has one, rather than relying on this page or the footer to carry it.',
        ],
      },
      {
        heading: 'Who we have relationships with',
        id: 'partners',
        list: [
          '**Undercover Tourist** — an authorized reseller of Walt Disney World and Disneyland tickets. We earn a commission on ticket sales made through our links.',
          '**Get Away Today** — a Disneyland-focused ticket and package seller. We earn a commission on bookings made through our links.',
          '**Amazon Associates** — for park gear on our packing guide. We earn a small percentage of qualifying purchases.',
          '**Display advertising** — the ads on this site are served by a third-party advertising network. We are paid on impressions and clicks, and we do not choose or approve individual advertisers.',
        ],
      },
      {
        heading: 'What this does not affect',
        id: 'independence',
        body: [
          'Rankings, verdicts, recommendations, and inclusion on any list are decided before any commercial consideration and are never adjusted for it. We recommend against buying things we would earn a commission on when that is the honest answer, and you will find examples of exactly that throughout the site.',
          'Prices are never higher because you used our link. Affiliate commissions are paid by the seller out of their margin.',
        ],
        callout: {
          type: 'note',
          title: 'Ads and page speed',
          body: 'Advertising is the main thing that can make a page slow. We reserve fixed space for every ad slot so nothing jumps around while you read, we lazy-load anything below the fold, and we keep ad density low on the tool and map pages, which are the ones you use in the park.',
        },
      },
    ],
  }))

  /* ---------------- Privacy ---------------- */
  pages.push(docPage(data, {
    url: urls.privacy(),
    title: 'Privacy policy',
    h1: 'Privacy policy',
    description: 'What Ride Ready Guide stores, what stays on your device, what third parties can see, and how to exercise your rights under the CCPA/CPRA and GDPR.',
    lede: 'Short version: your food list and height setting never leave your device, and we do not ask you for anything.',
    sections: [
      {
        body: [
          `This policy explains how ${site.brand.name} handles information when you use ${site.brand.domain}. We do not operate user accounts, we do not sell products directly, and we do not ask you for your name, email address, or payment details anywhere on this site.`,
        ],
        callout: {
          type: 'warning',
          title: 'Template notice',
          body: 'This policy accurately describes the site as currently built. Before launch, have it reviewed by a qualified attorney against the advertising, analytics, and email tooling actually deployed, and update the controller details and contact routes below.',
        },
      },
      {
        heading: 'Information stored on your device',
        id: 'local',
        body: [
          'Three features save data locally in your browser using localStorage. This data is stored on your device only. It is never transmitted to us, and we have no way to read it.',
        ],
        list: [
          '**Food Tracker** (`rrg-food`) — the want / tried / skip status you set against each item, plus a schema version number.',
          '**Height Checker** (`rrg-height`) — the last height you set on the slider.',
          '**Theme preference** (`rrg-theme`) — whether you chose the light or dark colour scheme.',
        ],
      },
      {
        heading: 'Share links',
        id: 'share',
        body: [
          'When you use “Copy share link” in the Food Tracker, your list is encoded into the URL itself. That means the list travels inside the link and is never stored on a server. Anyone you send that link to can see the list it encodes, so treat it the way you would treat any link you share.',
        ],
      },
      {
        heading: 'Offline storage',
        id: 'offline',
        body: [
          'This site registers a service worker that caches pages and assets so it keeps working with a poor connection or none at all. That cache lives in your browser and contains only the public content of this site. Clearing your browser’s site data removes it, along with everything listed above.',
        ],
      },
      {
        heading: 'Analytics',
        id: 'analytics',
        body: [
          site.analytics.enabled
            ? 'We use privacy-focused analytics to understand which pages are useful. It records aggregate page views and referrers. It does not use cookies for tracking, does not build cross-site profiles, and does not identify individual visitors.'
            : 'No analytics are currently loaded on this site. If that changes, this section and the cookie notice will be updated before any analytics script ships, and the choice will be disclosed here.',
        ],
      },
      {
        heading: 'Advertising and cookies',
        id: 'advertising',
        body: [
          'When display advertising is active, a third-party advertising network serves the ads and may set cookies or similar identifiers to measure and personalise them. Those cookies are set by the ad network, not by us, and are governed by that network’s own privacy policy. A consent management platform will be presented where the law requires one, and your choices there control what the ad network may do.',
          'Affiliate links may set a cookie recording that you arrived from this site, so the seller can attribute a purchase. That cookie contains no personal information from us.',
        ],
      },
      {
        heading: 'Your rights',
        id: 'rights',
        body: [
          '**If you are in California:** the California Consumer Privacy Act, as amended by the CPRA, gives you the right to know what personal information is collected, to delete it, to correct it, and to opt out of its sale or sharing. Because personalised advertising can constitute “sharing”, a **Do Not Sell or Share My Personal Information** control is provided through the consent tool wherever advertising is active.',
          '**If you are in the EU, EEA, or UK:** the GDPR and UK GDPR give you rights of access, rectification, erasure, restriction, portability, and objection. Where we rely on consent — which for advertising and any non-essential cookies we do — you can withdraw it at any time through the consent tool.',
          'To exercise any of these rights, or to ask what is held, use the [contact page](/contact/).',
        ],
      },
      {
        heading: 'Children',
        id: 'children',
        body: [
          'This site is written for adults planning family trips. It is not directed at children under 13 and we do not knowingly collect personal information from them.',
        ],
      },
      {
        heading: 'Changes to this policy',
        id: 'changes',
        body: [
          'Material changes will be reflected here with a new “last updated” date at the top of the page. Continuing to use the site after a change means the updated policy applies.',
        ],
      },
    ],
  }))

  /* ---------------- Terms ---------------- */
  pages.push(docPage(data, {
    url: urls.terms(),
    title: 'Terms of use',
    h1: 'Terms of use',
    description: 'The terms that apply to using Ride Ready Guide, including the accuracy disclaimer and the trademark position.',
    lede: 'The conditions of using this site, in as few words as we can manage.',
    sections: [
      {
        heading: 'Accuracy and reliance',
        id: 'accuracy',
        body: [
          site.legal.accuracyNote,
          'We take real care with the data here, and it is still a guide rather than a guarantee. Heights, prices, operating status, menus, and policies change without notice, sometimes on the day. Anything that would ruin your trip if it were wrong should be confirmed with the park’s official site or app before you rely on it. We accept no liability for decisions made on the basis of information here.',
        ],
      },
      {
        heading: 'Trademarks',
        id: 'trademarks',
        body: [
          site.legal.disclaimer,
          'Names of parks, resorts, attractions, restaurants, and characters appear on this site solely to identify and comment on the things being described. That is nominative use, and it does not imply any relationship with or endorsement by the trademark owner.',
        ],
      },
      {
        heading: 'Our content',
        id: 'content',
        body: [
          `Text, data, maps, and design on this site are © ${site.brand.founded} ${site.legal.copyrightHolder} unless stated otherwise. You are welcome to link to any page, quote a short passage with attribution, and print pages for your own trip. Republishing substantial portions, or scraping the datasets to rebuild them elsewhere, is not permitted.`,
          'Map artwork on this site is our own, drawn using open geographic data including data © OpenStreetMap contributors, available under the Open Database Licence. The rendered maps are produced works; the underlying open data remains available under its own licence from its source.',
        ],
      },
      {
        heading: 'Third-party links',
        id: 'links',
        body: [
          'We link to external sites, some of them affiliate links. We do not control those sites and are not responsible for their content, their pricing, or their privacy practices.',
        ],
      },
    ],
  }))

  /* ---------------- Contact ---------------- */
  pages.push(docPage(data, {
    url: urls.contact(),
    title: 'Contact & corrections',
    h1: 'Contact and corrections',
    description: 'How to send a correction, a question, or a press enquiry to Ride Ready Guide.',
    lede: 'Corrections are the most useful thing you can send us. They make the dataset better for everyone using it.',
    sections: [
      {
        heading: 'Corrections',
        id: 'corrections',
        body: [
          'If a height, a price, an opening status, or an accessibility detail on this site is wrong, tell us. Include the page, what is wrong, and — if you have it — when you saw the correct version. Corrections go into the underlying dataset, which updates every page that used the figure, and the verification date moves with it.',
        ],
        callout: {
          type: 'note',
          title: 'Set your contact route before launch',
          body: 'Replace this block with a real email address or contact form before the site goes live. A published site with no correction route undermines the accuracy promise the rest of the site makes.',
        },
      },
      {
        heading: 'What we do not do',
        id: 'no',
        body: [
          'We do not accept sponsored posts, paid link insertions, paid reviews, or guest posts written to place a link. We do not sell placement in any list or ranking. Requests of that kind are declined without a reply.',
        ],
      },
    ],
  }))

  /* ---------------- Offline fallback ---------------- */
  {
    const url = '/offline/'
    const body = html`
      ${C.section({
        children: html`
          <div class="error-page">
            <p class="error-page__code">Offline</p>
            <h1>You are offline, and this page was not saved</h1>
            <p class="muted mt-4">Pages you have already opened still work, including your food list and any park map you have viewed.</p>
            <p class="mt-5">
              <a class="btn btn--primary" href="${urls.foodTracker()}">Your food list</a>
              <a class="btn btn--ghost" href="/">Home</a>
            </p>
          </div>
        `,
      })}
    `
    pages.push({
      url,
      html: renderPage({
        site,
        page: { url, title: 'Offline', description: 'You are offline.', noindex: true },
        body,
      }),
    })
  }

  /* ---------------- 404 ---------------- */
  {
    const url = '/404.html'
    const body = html`
      ${C.section({
        children: html`
          <div class="error-page">
            <p class="error-page__code">404</p>
            <h1>That page does not exist</h1>
            <p class="muted mt-4">It may have moved, or an attraction may have closed and taken its page with it. Try a search, or start from a park.</p>
            <p class="mt-5">
              <button class="btn btn--primary" type="button" data-search-open>Search the site</button>
              <a class="btn btn--ghost" href="${urls.parksIndex()}">All six parks</a>
            </p>
          </div>
        `,
      })}
    `
    pages.push({
      url,
      html: renderPage({
        site,
        page: { url: '/404.html', title: 'Page not found', description: 'That page does not exist.', noindex: true },
        body,
      }),
    })
  }

  return pages
}
