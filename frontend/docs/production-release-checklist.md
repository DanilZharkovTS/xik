# XIK Production Release Checklist

Use this checklist after the local quality gate passes. Do not mark external
steps complete based only on local output.

## Before deployment

- [ ] Use Node.js 24 LTS and the committed npm lockfile.
- [ ] Run `npm ci`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `npm run test`.
- [ ] Run `npm audit --omit=dev` and review the documented upstream
      advisories.
- [ ] Confirm `git diff --check` passes.
- [ ] Confirm the intended release commit and a clean working tree.
- [ ] Confirm no secrets or production credentials are present in public
      configuration.

## Deployment verification

- [ ] Deploy the verified commit to the approved production platform.
- [ ] Confirm `https://xik.app` uses valid HTTPS with no redirect loop.
- [ ] Confirm the canonical host resolves consistently.
- [ ] Verify Home, Products, About, every product URL, and the custom 404.
- [ ] Verify invalid product and unknown URLs return HTTP 404, not HTTP 200.
- [ ] Verify there are no browser-console or server-console errors.
- [ ] Verify all public images load and no production asset returns HTTP 404.
- [ ] Verify mobile navigation, keyboard focus, reduced motion, Hero behavior,
      and ScrollChomper on production.
- [ ] Re-run the Playwright suite against the production origin by setting
      `PLAYWRIGHT_BASE_URL=https://xik.app`.

## Search and indexing

- [ ] Verify `https://xik.app/robots.txt`.
- [ ] Verify `https://xik.app/sitemap.xml`.
- [ ] Verify `https://xik.app/manifest.webmanifest`.
- [ ] Verify `https://xik.app/opengraph-image`.
- [ ] Inspect rendered titles, descriptions, canonicals, Open Graph, Twitter,
      and JSON-LD on production.
- [ ] Confirm public pages are indexable and 404 pages are `noindex`.
- [ ] Add and verify the `xik.app` domain property in Google Search Console.
- [ ] Submit `https://xik.app/sitemap.xml` in Google Search Console.
- [ ] Inspect Home, Products, About, and every product URL.
- [ ] Request indexing only after the production responses are verified.
- [ ] Test eligible structured data with Google Rich Results Test.
- [ ] Add and verify the site in Bing Webmaster Tools.
- [ ] Monitor coverage, crawl errors, duplicate canonicals, and sitemap
      processing.

## Social and field performance

- [ ] Verify share previews on the social platforms that matter to XIK.
- [ ] Run production Lighthouse checks with the same documented settings.
- [ ] Monitor Chrome UX Report or Search Console field Core Web Vitals after
      enough traffic exists.
- [ ] Monitor field LCP, CLS, and INP without adding analytics until tracking
      has been separately approved.
- [ ] Recheck low-power mobile behavior and idle CPU on production.

## Deferred product systems

- [ ] Keep payments, licensing, authentication, accounts, CMS, databases, and
      analytics out of the release until each has an approved implementation
      phase.
