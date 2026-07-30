import { html, raw, escapeHtml, truncate, plain } from '../lib/html.mjs'
import * as S from '../lib/schema.mjs'
import { urls } from '../lib/data.mjs'

const ASSET_VERSION = '1'
const v = (path) => `${path}?v=${ASSET_VERSION}`

/**
 * Runs before first paint so a stored theme choice never flashes. Kept to one statement and
 * inlined deliberately — an external file here would be a guaranteed flash of the wrong theme.
 */
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem('rrg-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`

function metaTags (site, page) {
  const title = page.title
    ? `${page.title} | ${site.meta.defaultTitleSuffix}`
    : site.meta.defaultTitleSuffix
  const description = truncate(page.description || site.meta.defaultDescription, 300)
  const canonical = `${site.brand.origin}${page.url}`
  return html`
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="${page.ogType || 'website'}">
    <meta property="og:title" content="${page.title || site.brand.name}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:site_name" content="${site.brand.name}">
    <meta property="og:locale" content="en_US">
    <meta name="twitter:card" content="summary_large_image">
    ${site.meta.twitterSite ? html`<meta name="twitter:site" content="${site.meta.twitterSite}">` : ''}
    ${page.noindex ? html`<meta name="robots" content="noindex,follow">` : ''}
  `
}

function siteHeader (site, page) {
  return html`
    <header class="site-header" data-nav>
      <div class="shell site-header__inner">
        <a class="brandmark" href="/">
          <span class="brandmark__mark" aria-hidden="true">${site.brand.logoMark}</span>
          <span class="brandmark__text">
            <span class="brandmark__name">${site.brand.name}</span>
            <span class="brandmark__tag">Independent &amp; unofficial</span>
          </span>
        </a>

        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">
          <span class="nav-toggle__bars" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="visually-hidden">Menu</span>
        </button>

        <nav class="primary-nav" id="primary-nav" aria-label="Primary">
          <ul>
            ${site.nav.primary.map((item) => html`
              <li><a href="${item.href}"${raw(page.url.startsWith(item.href) && item.href !== '/' ? ' aria-current="true"' : '')}>${item.label}</a></li>
            `)}
          </ul>
        </nav>

        <div class="header-actions">
          <button class="icon-button" type="button" data-search-open aria-label="Search the site">
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="9" cy="9" r="6"/><path d="M13.5 13.5 18 18"/></svg>
          </button>
          <button class="icon-button" type="button" data-theme-toggle aria-label="Switch colour theme">
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="icon-sun"><circle cx="10" cy="10" r="4"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M16.5 3.5l-1.4 1.4M4.9 15.1l-1.4 1.4"/></svg>
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="icon-moon"><path d="M16 12.5A7 7 0 0 1 7.5 4a7 7 0 1 0 8.5 8.5Z"/></svg>
          </button>
        </div>
      </div>
    </header>
  `
}

function searchDialog () {
  return html`
    <div class="search-overlay" data-search-overlay hidden>
      <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search Ride Ready Guide">
        <div class="search-panel__field">
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="9" cy="9" r="6"/><path d="M13.5 13.5 18 18"/></svg>
          <input type="search" data-search-input placeholder="Search rides, restaurants, snacks, guides…" autocomplete="off" spellcheck="false" aria-label="Search">
          <button type="button" class="search-panel__close" data-search-close aria-label="Close search">Esc</button>
        </div>
        <div class="search-panel__results" data-search-results role="listbox" aria-label="Search results">
          <p class="search-panel__hint">Start typing — every ride, restaurant, snack, and guide on the site is searchable.</p>
        </div>
      </div>
    </div>
  `
}

function siteFooter (site) {
  const year = 2026
  return html`
    <footer class="site-footer">
      <div class="shell">
        <div class="site-footer__grid">
          <div class="site-footer__brand">
            <a class="brandmark brandmark--footer" href="/">
              <span class="brandmark__mark" aria-hidden="true">${site.brand.logoMark}</span>
              <span class="brandmark__name">${site.brand.name}</span>
            </a>
            <p class="site-footer__tagline">${site.brand.tagline}</p>
            <p class="site-footer__note">${site.legal.accuracyNote}</p>
          </div>
          ${site.nav.footer.map((column) => html`
            <nav class="site-footer__col" aria-label="${column.heading}">
              <h2>${column.heading}</h2>
              <ul>
                ${column.links.map((link) => html`<li><a href="${link.href}">${link.label}</a></li>`)}
              </ul>
            </nav>
          `)}
        </div>
        <div class="site-footer__legal">
          <p class="disclaimer">${site.legal.disclaimer}</p>
          <p class="copyright">© ${year} ${site.legal.copyrightHolder}. Independent editorial. <a href="${urls.editorial()}">How we work</a> · <a href="${urls.affiliate()}">Affiliate disclosure</a> · <a href="${urls.privacy()}">Privacy</a></p>
        </div>
      </div>
    </footer>
  `
}

/**
 * @param {object} opts
 * @param {object} opts.site      site.json
 * @param {object} opts.page      { url, title, description, ogType?, noindex?, bodyClass? }
 * @param {import('../lib/html.mjs').Raw} opts.body
 * @param {Array}  [opts.schema]  JSON-LD nodes to merge into the graph
 * @param {string[]} [opts.scripts] extra deferred script srcs
 */
export function renderPage ({ site, page, body, schema = [], scripts = [] }) {
  const graph = [
    S.organization(site),
    S.website(site),
    S.webPage(site, {
      url: page.url,
      title: page.title || site.brand.name,
      description: page.description || site.meta.defaultDescription,
      trail: page.trail,
      modified: page.modified,
    }),
    page.trail && page.trail.length > 1 ? S.breadcrumbs(site, page.trail) : null,
    ...schema,
  ].filter(Boolean)

  const jsonLd = S.serialize(graph)

  return '<!doctype html>\n' + html`<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${site.brand.themeColor}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0f0d" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
${metaTags(site, page)}
<script>${raw(THEME_BOOTSTRAP)}</script>
<link rel="stylesheet" href="${v('/assets/css/main.css')}">
<link rel="stylesheet" href="${v('/assets/css/print.css')}" media="print">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/icon-180.png">
<link rel="sitemap" type="application/xml" href="/sitemap.xml">
<script type="application/ld+json">${raw(jsonLd)}</script>
</head>
<body class="${page.bodyClass || ''}">
<a class="skip-link" href="#main">Skip to content</a>
${siteHeader(site, page)}
<main id="main" tabindex="-1">
${body}
</main>
${siteFooter(site)}
${searchDialog()}
<script defer src="${v('/assets/js/app.js')}"></script>
${scripts.map((src) => html`<script defer src="${v(src)}"></script>`)}
</body>
</html>
`.toString()
}

export { escapeHtml, plain }
