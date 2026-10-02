# XIK Quality Assurance Record

This document records the current repeatable local production checks.
It does not claim production deployment, external indexing, or field Core Web
Vitals.

Homepage animation-specific screenshots, lifecycle evidence, baseline
comparison, and reduced-motion equivalents are recorded in
[`homepage-animation-qa.md`](./homepage-animation-qa.md).

## Tooling


- Node.js: 24.18.0
- npm: 11.16.0
- Next.js: 16.2.12
- Playwright Test: 1.62.0
- Playwright Chrome for Testing: 151.0.7922.34
- `@axe-core/playwright`: 4.12.1
- Lighthouse: 13.4.1

Playwright uses one Chromium project and a local `next start` production
server. When `PLAYWRIGHT_BASE_URL` is not set, the Playwright configuration
builds and starts the application automatically. Failure traces, screenshots,
and video are retained only when configured by the runner for a failed test.

## Automated coverage

The suite covers:

- Home, Products, About, every static product, invalid products, and unknown
  routes;
- real 404 status codes and the custom 404 content;
- desktop active navigation and the skip link;
- mobile menu focus containment, Escape, focus restoration, route close, and
  body-scroll restoration;
- 320, 390, 768, 1024, and 1440 pixel layouts plus mobile landscape;
- image loading, horizontal overflow, mobile content parity, and About image
  overlap;
- JavaScript-disabled primary content;
- reduced motion, product-card keyboard effects, offscreen Hero pausing, and
  ScrollChomper progress, direction, mouth, and idle behavior;
- titles, descriptions, canonical URLs, Open Graph, Twitter, robots, sitemap,
  manifest, Open Graph image, JSON-LD, noindex, and 404 canonical behavior;
- Axe scans on every public page, the custom 404, and the open mobile menu.
- boot/session lifecycle, module activation, product workflow thresholds and
  reverse scroll, theme transition, section-aware ScrollChomper modes, and
  animation idle cleanup;
- Axe scans after boot, with a focused principle, during the product workflow,
  after System Status completion, and under reduced motion.

No Axe rule is disabled or excluded.

## Automated result

The final complete Playwright run executes 78 tests with five workers:

| Suite | Tests | Result |
|---|---:|---|
| Navigation, responsive, SEO, and animation behavior | 65 | Passed |
| Axe accessibility | 13 | Passed |
| Complete suite | 78 | Passed |

The terminal printed a test-runner environment warning that `NO_COLOR` was
ignored because `FORCE_COLOR` was set. This is not an application browser or
server error.

## Final Lighthouse result

Lighthouse ran sequentially against `next start` using its default mobile
simulation. These are local lab measurements.

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` (five-run median) | 99 | 100 | 100 | 100 | 2,192 ms | 0 | 10 ms |
| `/products` | 100 | 100 | 100 | 100 | 1,092 ms | 0 | 14 ms |
| `/products/ai-code-helper` | 98 | 100 | 100 | 100 | 2,444 ms | 0 | 22 ms |
| `/about` | 100 | 100 | 100 | 100 | 1,223 ms | 0 | 8 ms |

Home exceeds the Performance target in the five-run median and CLS is zero on
every measured route. Lighthouse recorded one 61–78 millisecond task per route
as part of application initialization; the post-boot scroll/theme lifecycle
test recorded no reproducible long task and no idle animation loop beyond the
logo cursor.

## Transfer result

| Route | Total | JavaScript | CSS | Images |
|---|---:|---:|---:|---:|
| `/` | 590,960 B | 189,688 B | 15,778 B | 338,002 B |
| `/products` | 207,919 B | 176,314 B | 9,269 B | 0 B |
| `/products/ai-code-helper` | 198,109 B | 170,570 B | 9,269 B | 3,890 B |
| `/about` | 226,544 B | 170,570 B | 9,269 B | 33,124 B |

No dependency was added for the animation system. Home includes the existing
hero sprite assets; route-level JavaScript increased by 5.5% and total encoded
Home resources increased by 2.7% from the recorded pre-animation baseline.

## Production endpoint smoke result

The local production server returned:

- HTTP 200 for Home, Products, About, both current products, robots, sitemap,
  manifest, and the Open Graph image;
- HTTP 404 for an invalid product and an unknown route;
- the expected content types for HTML, plain-text robots, XML sitemap, web
  manifest JSON, and PNG Open Graph image;
- no server-console error during the production checks.

## Dependency audit

`npm audit --omit=dev` exits with three high-severity production advisories:

- three PostCSS advisories are grouped under the PostCSS dependency bundled by
  Next.js;
- one sharp advisory entry covers inherited libvips vulnerabilities.

The current project already uses the latest stable Next.js release, 16.2.12.
The audit-proposed forced remediation would install Next.js 9.3.3, which is a
breaking and invalid downgrade for this App Router project. No force fix,
override, framework downgrade, or unsupported preview release was applied.
These advisories remain a release risk to monitor for an upstream stable Next
update.

## Local commands

Run the complete gate with Node.js 24:

```sh
npm ci
npm run lint
npm run typecheck
npm run build
npm run test
git diff --check
```

Focused suites are available as:

```sh
npm run test:e2e
npm run test:a11y
```

`npm audit --omit=dev` is expected to remain non-zero until an upstream
compatible dependency fix is available.

## External limitations

Local verification cannot establish:

- production deployment or HTTPS behavior;
- Google Search Console or Bing Webmaster Tools ownership;
- search-engine crawling or indexing;
- Google Rich Results approval;
- social network cache behavior;
- field LCP, CLS, or INP.

Complete those checks only after a production deployment by following
`docs/production-release-checklist.md`.
