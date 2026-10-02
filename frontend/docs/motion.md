# XIK Motion Policy

This document defines the animation architecture and reduced-motion behavior
for XIK. Decorative motion must never be required to read or use the site.

## Package decision

- Direct dependency: `motion@12.42.2`
- Supported project peers: React 19.2.4 and React DOM 19.2.4
- Primary Phase 4 API: `animate` from `motion/mini`
- Not installed: GSAP, Lenis, React Spring, Rive, Lottie, or PixiJS

Motion's mini API is the lightest appropriate feature configuration for the
current reveal effect. It uses the browser Web Animations API and is loaded
through a route-local dynamic import. This is the bundle-conscious equivalent
of using `LazyMotion` for a declarative component tree, without loading the
larger declarative feature bundle for one short imperative animation.

## Responsibilities

Motion handles:

- one-time, in-view section reveal orchestration;
- short transform and opacity keyframes;
- cancellation when an animated island unmounts.

CSS handles:

- the short monochrome heading glitch;
- product-card border flicker;
- product-icon displacement;
- product-card status transitions;
- all reduced-motion overrides for CSS animation.

Native browser APIs handle:

- intersection detection;
- the reduced-motion media query;
- Web Animations scheduling.

No route transition is included. A transition was optional in Phase 4 and
would add focus and navigation risk without improving the current task.

## Progressive enhancement

`SectionReveal` renders its children at full opacity in server HTML. The
animation enhancer is loaded only after hydration and briefly applies a small
four-pixel stepped reveal when the section enters the viewport.

If JavaScript is disabled, all headings, descriptions, links, and cards remain
visible and usable. The animation never controls whether content exists.

The enhancer:

1. checks the reduced-motion preference;
2. observes one section;
3. disconnects after the first intersection;
4. runs one 280 millisecond animation;
5. stops the animation and observer during cleanup.

There is no frame-by-frame React state.

## Reduced-motion behavior

When `prefers-reduced-motion: reduce` is active:

- `SectionReveal` does not create an observer or animation;
- glitch duplicate layers are not rendered visually;
- product-card border and icon keyframes do not run;
- status changes remain immediate and readable;
- content stays at full opacity with no translate movement;
- navigation and focus behavior remain unchanged.

The global reduced-motion base rules in `app/globals.css` remain a final safety
net for future decorative animation.

## Accessibility behavior

- Glitch duplicate layers use `aria-hidden="true"`.
- The accessible heading contains one copy of its text.
- Product status microcopy is decorative and hidden from assistive technology.
- Product cards retain one standard Next.js link and contain no nested
  interactive element.
- Hover behavior has `focus-within` parity.
- Effects finish within 480 milliseconds and do not loop.
- No color flash or rapid full-screen luminance change is used.

## Phase 4 bundle measurement

Measured against a local production server in a fresh Chromium context:

| Route | Phase 3 JavaScript | Phase 4 JavaScript | Change |
|---|---:|---:|---:|
| `/` | 160,288 B | 165,884 B | +5,596 B |
| `/products` | 160,288 B | 165,884 B | +5,596 B |
| `/products/ai-code-helper` | 160,288 B | 160,369 B | +81 B |
| `/about` | 160,288 B | 160,369 B | +81 B |

The Home and Products figures are Lighthouse transfer totals. A fresh-browser
resource measurement attributed 5,324 bytes to the two route-local motion
chunks. The small difference is measurement and build-output overhead.

Header and breadcrumb prefetch is intentionally disabled so visiting an
animation-free route does not fetch Home or Products animation code. Links
remain crawlable standard Next.js links and native navigation behavior is
unchanged.

## Phase 4 Lighthouse result

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 97 | 100 | 100 | 100 | 2,617 ms | 0 | 4 ms |
| `/products` | 99 | 100 | 100 | 100 | 2,165 ms | 0 | 4 ms |
| `/products/ai-code-helper` | 99 | 100 | 100 | 100 | 2,169 ms | 0 | 4.5 ms |
| `/about` | 98 | 100 | 100 | 100 | 2,320 ms | 0 | 3 ms |

These are local simulated measurements, not field Core Web Vitals.

## Phase 5 hero scene

The existing `public/welcome-anon-dino.png` is a single flattened image. It
does not contain independent developer, hand, eye, dinosaur, or tail layers.
The implementation therefore keeps that approved image static and
server-rendered, then adds only non-destructive monochrome overlays:

- slowly stepped pixel noise;
- five deterministic terminal messages;
- a stepped terminal cursor.

A focused Client Component controls only activity. It observes the server
rendered scene, pauses the overlay when the scene leaves the viewport, and
pauses it when the document is hidden. Reduced motion leaves the approved
static image and one terminal message visible. It does not use React state per
frame.

The production layer and frame requirements are documented in
`docs/hero-asset-specification.md`. Independent typing, blinking, and tail
movement remain deferred until matching source layers exist.

## Phase 5 ScrollChomper

`ScrollChomper` is an original two-frame circular SVG sprite. It uses no game
assets, names, audio, or maze artwork. It is mounted once in the root layout
and remains decorative with `aria-hidden="true"` and
`pointer-events: none`.

- Motion's `scroll` function supplies native document progress.
- A small local controller statically imports only `scroll`, allowing the
  dynamic chunk to be tree-shaken instead of loading Motion's full namespace.
- CSS custom properties update the pixel-snapped transform and track mask.
- A repeating radial gradient draws the track without one DOM node per dot.
- Direction changes only after a two-pixel threshold.
- Three mouth frames produce a wide-open, half-bite, and closed chewing cycle.
  The cycle responds to scroll speed and stops 420 milliseconds after
  scrolling ends.
- A `ResizeObserver` updates travel distance for viewport and document-height
  changes.
- Pages too short to scroll retain a compact `IDLE` sprite without showing a
  misleading progress track.
- Viewports below 360 pixels and reduced-motion environments hide the
  component.

The implementation does not replace native scrolling, install a smooth-scroll
library, or create a separate persistent animation-frame loop.

## Phase 5 bundle measurement

| Route | Phase 4 JavaScript | Phase 5 JavaScript | Change |
|---|---:|---:|---:|
| `/` | 165,884 B | 175,784 B | +9,900 B |
| `/products` | 165,884 B | 173,626 B | +7,742 B |
| `/products/ai-code-helper` | 160,369 B | 167,883 B | +7,514 B |
| `/about` | 160,369 B | 167,883 B | +7,514 B |

The global delta is the focused scroll observer and ScrollChomper controller.
Home also loads the focused hero activity controller. An initial dynamic
namespace import of `motion` transferred more than 210 KB of JavaScript on
non-Home routes; it was rejected before commit and replaced with the
tree-shaken controller above.

## Phase 5 Lighthouse result

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 97 | 100 | 100 | 100 | 2,619 ms | 0 | 5.5 ms |
| `/products` | 98 | 100 | 100 | 100 | 2,309 ms | 0 | 2.5 ms |
| `/products/ai-code-helper` | 98 | 100 | 100 | 100 | 2,313 ms | 0 | 4 ms |
| `/about` | 98 | 100 | 100 | 100 | 2,388 ms | 0 | 4 ms |

These are sequential Lighthouse 13.4.1 runs against a local production server
with its default mobile simulation. They are lab measurements, not field Core
Web Vitals. The Home LCP remains 119 milliseconds above the 2.5-second target
in this run.

## Phase 5 runtime verification

- Touch input scrolled a 390-pixel viewport while the indicator followed
  document progress.
- Down and up directions produced the correct orientation.
- Dynamic document growth retained exact computed progress.
- The mouth had no running animation 220 milliseconds after scroll stopped.
- The offscreen hero had zero running animations during a two-second idle
  sample, and that sample recorded no long task.
- The visibility-change handler paused all hero overlay animations.
- The component produced no horizontal overflow at 320, 375, 390, 768, 1024,
  or 1440 pixels.
- The custom 404 at 1440 pixels was too short to scroll and rendered the
  compact `IDLE` state.
- Mobile navigation remained above the indicator and restored focus and body
  scrolling after Escape.
