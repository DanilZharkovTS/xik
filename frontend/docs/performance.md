# XIK Performance Record

This document records local production measurements for the public XIK routes.
The numbers are lab results, not field Core Web Vitals.

## Measurement environment

- Date: 2026-07-27
- Baseline runtime: Node.js 23.11.0 with npm 10.9.2
- Phase 3 runtime: Node.js 24.18.0 with npm 11.16.0
- Framework: Next.js 16.2.12 with Turbopack
- Browser: Chromium 150.0.7871.184
- Lighthouse: 13.4.1, default mobile simulation
- Server: local `next start` production server on `127.0.0.1`
- Field INP and field Core Web Vitals: not available

The baseline and Phase 3 runs used the same machine, browser, Lighthouse
version, routes, and production-server setup. Local Lighthouse results can
still vary between runs, so they should be treated as directional.

## Route rendering

| Route | Rendering |
|---|---|
| `/` | Static |
| `/products` | Static |
| `/about` | Static |
| `/products/ai-code-helper` | SSG |
| `/products/content-genius` | SSG |
| `/robots.txt` | Static |
| `/sitemap.xml` | Static |
| `/manifest.webmanifest` | Static |
| `/opengraph-image` | Static |

## Public image inventory

| Asset | Dimensions | Format | Baseline source | Phase 3 source | Public use | Rendered size | Semantics | LCP / loading | Pixel art |
|---|---:|---|---:|---:|---|---|---|---|---|
| `public/welcome-anon-dino.png` | 410 × 609 | PNG | 264,762 B | 218,628 B | Home hero | Up to 410 px wide | Decorative; adjacent text contains the value proposition | Home LCP; eager with high fetch priority | Yes |
| `public/about-anon.png` | 365 × 684 | PNG | 112,942 B | 93,558 B | About panel | 288 px mobile, up to 320 px desktop | Decorative | Not LCP; lazy | Yes |
| `public/navbar-dino.png` | 500 × 500 | PNG | 76,787 B | 57,341 B | Site brand mark | 48 px mobile, 56 px desktop | Decorative inside the named Home link | Not LCP; native loading | Yes |
| `public/not-found-castle.png` | 668 × 373 | PNG | 279,848 B | 260,636 B | 404 scene | Up to its 668 px intrinsic width | Decorative | Not preloaded; lazy | Yes |
| `public/product-placeholder.jpg` | 448 × 335 | JPEG | 27,507 B | 27,507 B | Product preview placeholder | Content width, up to the product aside | Decorative; visible caption provides the meaning | Not LCP; lazy | No |
| `app/favicon.ico` | 16, 32, 48, and 256 px frames | ICO | 25,931 B | 25,931 B | Browser icon and manifest icon | Browser-controlled | Brand icon | Browser-controlled | No |
| `app/opengraph-image.tsx` | 1200 × 630 | Generated PNG | 39,587 B response | 39,587 B response | Social preview | Metadata-only | Meaningful social preview | Not a page LCP resource | Code-generated pixel composition |

All PNG source changes in Phase 3 are lossless recompressions. Decoded RGBA
pixel hashes were compared before replacement and remained identical.
No referenced public asset is missing. The extensionless product placeholder
was renamed to `product-placeholder.jpg` without changing its bytes.

## Lighthouse comparison

| Route | Stage | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | Initial | 94 | 100 | 100 | 100 | 3,045 ms | 0 | 3.5 ms |
| `/` | Phase 3 | 95 | 100 | 100 | 100 | 2,897 ms | 0 | 3.5 ms |
| `/products` | Initial | 98 | 100 | 100 | 100 | 2,313 ms | 0 | 3.5 ms |
| `/products` | Phase 3 | 98 | 100 | 100 | 100 | 2,310 ms | 0 | 3.0 ms |
| `/products/ai-code-helper` | Initial | 98 | 100 | 100 | 100 | 2,318 ms | 0 | 4.5 ms |
| `/products/ai-code-helper` | Phase 3 | 98 | 100 | 100 | 100 | 2,316 ms | 0 | 4.0 ms |
| `/about` | Initial | 98 | 100 | 100 | 100 | 2,387 ms | 0 | 3.5 ms |
| `/about` | Phase 3 | 98 | 100 | 100 | 100 | 2,312 ms | 0 | 3.5 ms |

Lighthouse identified the Home hero image as the Home LCP element. The other
measured routes used visible text as their LCP element. Phase 3 applies a high
fetch priority only to the Home image and removes forced eager loading from the
About and product images.

## Transfer and execution comparison

| Route | Stage | Total transfer | JavaScript transfer | CSS transfer | Image transfer | Long tasks over 50 ms |
|---|---|---:|---:|---:|---:|---:|
| `/` | Initial | 299,618 B | 160,288 B | 5,998 B | 81,473 B | 1 |
| `/` | Phase 3 | 298,982 B | 160,288 B | 6,000 B | 80,783 B | 1 |
| `/products` | Initial | 224,409 B | 160,288 B | 5,998 B | 3,628 B | 1 |
| `/products` | Phase 3 | 223,755 B | 160,288 B | 6,000 B | 2,936 B | 1 |
| `/products/ai-code-helper` | Initial | 223,038 B | 160,288 B | 5,998 B | 7,513 B | 1 |
| `/products/ai-code-helper` | Phase 3 | 222,370 B | 160,288 B | 6,000 B | 6,827 B | 1 |
| `/about` | Initial | 246,823 B | 160,288 B | 5,998 B | 36,752 B | 1 |
| `/about` | Phase 3 | 246,128 B | 160,288 B | 6,000 B | 36,061 B | 1 |

The shared initial JavaScript did not change in Phase 3. No route-specific
client boundary was added. The only current Client Components remain the
desktop active-navigation state and the interactive mobile menu.

## Performance budgets

- LCP: at or below 2.5 seconds in the default Lighthouse mobile simulation
  where practical; the Home lab result remains 2.90 seconds and needs field
  validation after deployment.
- CLS: at or below 0.1; current measured value is 0.
- INP: at or below 200 milliseconds in field data; unavailable locally.
- TBT laboratory proxy: below 200 milliseconds; current measured maximum is
  5.5 milliseconds after Phase 5.
- Shared initial JavaScript: do not materially exceed the Phase 3 transfer
  baseline of 160,288 bytes without a measured feature benefit.
- Decorative animation: no continuous offscreen work and no idle long tasks.
- Images: no missing dimensions, no unjustified preload, and no source artwork
  displayed beyond its intrinsic CSS width when avoidable.

## Phase 3 decisions

- Kept Next.js image optimization because its responsive WebP output remains
  smaller than the tested lossless WebP alternatives.
- Kept the existing PNG artwork because lossless WebP source files were smaller
  on disk but produced no route-transfer advantage through the current Next.js
  optimizer.
- Replaced Home `preload` with an explicit eager load and
  `fetchpriority="high"`. Lighthouse now confirms that the LCP priority hint is
  applied.
- Tightened responsive `sizes` values and capped the Home and 404 artwork at
  their intrinsic widths.
- Preserved the single Jersey 10 weight loaded through `next/font`; no unused
  font family or weight was found.
- Preserved Server Component page content. No global client provider or
  animation dependency was introduced in Phase 3.

## Phase 5 animation cost

The Phase 5 measurements used the same local production environment and
default Lighthouse mobile simulation as the previous stages. Runs were
executed sequentially to avoid competing Lighthouse sessions.

| Route | Phase 4 LCP | Phase 5 LCP | Phase 4 JS | Phase 5 JS | Phase 5 CLS | Phase 5 TBT |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 2,617 ms | 2,619 ms | 165,884 B | 175,784 B | 0 | 5.5 ms |
| `/products` | 2,165 ms | 2,309 ms | 165,884 B | 173,626 B | 0 | 2.5 ms |
| `/products/ai-code-helper` | 2,169 ms | 2,313 ms | 160,369 B | 167,883 B | 0 | 4 ms |
| `/about` | 2,320 ms | 2,388 ms | 160,369 B | 167,883 B | 0 | 4 ms |

Accessibility, Best Practices, and SEO scored 100 on all four Phase 5 runs.
The Phase 5 Home Performance score was 97; the other measured routes scored
98. The additional JavaScript is route-appropriate scroll behavior, with a
further focused hero controller on Home. No primary content moved to client
rendering.

The first ScrollChomper prototype dynamically imported Motion's complete
namespace and raised non-Home JavaScript transfer above 210 KB. It was not
accepted. The committed architecture dynamically loads a tree-shaken
controller and keeps the non-Home increase between 7,514 and 7,742 bytes.

During browser verification, an offscreen Hero and an idle ScrollChomper had
zero running animations. A two-second offscreen idle observation recorded no
task over 50 milliseconds. These local checks do not replace field Core Web
Vitals after production deployment.

## Phase 6 final measurement

Phase 6 added only development dependencies and test files. The final local
production measurement retained the Phase 5 route transfer totals.

| Route | Performance | LCP | CLS | TBT | JavaScript |
|---|---:|---:|---:|---:|---:|
| `/` | 97 | 2,612 ms | 0 | 3.5 ms | 175,784 B |
| `/products` | 98 | 2,310 ms | 0 | 3.5 ms | 173,626 B |
| `/products/ai-code-helper` | 98 | 2,311 ms | 0 | 3 ms | 167,883 B |
| `/about` | 98 | 2,385 ms | 0 | 2.5 ms | 167,883 B |

Accessibility, Best Practices, and SEO remained 100 on all four Lighthouse
runs. Complete test, endpoint, audit, and release-readiness details are in
`docs/quality-assurance.md`.
