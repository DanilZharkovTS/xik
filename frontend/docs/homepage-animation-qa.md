# Homepage Animation QA

This record covers the five-phase XIK System Boot homepage animation upgrade.
Measurements are local lab results from the production build; they do not
claim field performance, production deployment, or real-time monitoring.

## Acceptance summary

| Area | Result | Evidence |
|---|---|---|
| Boot lifecycle | Approved | Full first-session boot, session skip, timer cleanup, stable reduced-motion state |
| Server rendering | Approved | Primary copy, process steps, products, links, and status text remain present without JavaScript |
| Module animation | Approved | Finite viewport entry, hover/focus parity, typed technology states, no idle module loops |
| Product workflow | Approved | MotionValue progress, boundary-only states, reverse scroll, static reduced-motion equivalent |
| Theme transition | Approved | 300 ms stepped transition, immediate reduced-motion switch, focus retained |
| ScrollChomper | Approved | Seven section modes, native scroll, idle mouth stop, narrow-mobile hide, `COMPLETE` end state |
| Accessibility | Approved | 13 Axe states pass with no rule exclusions |
| Responsive layout | Approved | 320, 390, 768, 1024, and 1440 px tests pass without horizontal overflow |
| Performance | Approved | Home five-run median 99; Accessibility, Best Practices, and SEO 100; CLS 0 |

## Viewport acceptance

| Viewport | Light | Dark | Reduced motion | Result |
|---|---|---|---|---|
| 390×844 | [Capture](./homepage-animation-qa/viewport-390-light.png) | [Capture](./homepage-animation-qa/viewport-390-dark.png) | Stable content, no boot or section motion | Approved |
| 768×1024 | [Capture](./homepage-animation-qa/viewport-768-light.png) | Covered by automated theme/layout tests | Stable content, no scroll-linked motion | Approved |
| 1440×900 | [Capture](./homepage-animation-qa/viewport-1440-light.png) | [Capture](./homepage-animation-qa/viewport-1440-dark.png) | Stable content, final module states | Approved |

The 320, 1024, and 1440 px overflow assertions run in Playwright. The 320 px
layout hides ScrollChomper, while 390 px retains it outside the content gutter.

## Animation-state acceptance

| State | Expected visual state | Implementation | Difference | Reduced-motion equivalent | Status |
|---|---|---|---|---|---|
| Boot terminal | Partial transparent system panel; content remains available | [Capture](./homepage-animation-qa/state-boot-terminal.png) | None | Panel skipped; final logo and READY state shown | Approved |
| Principles active | Stable cards with exact 4 px focus displacement and one status line | [Capture](./homepage-animation-qa/state-principles-active.png) | Entry border/glyph sequence is finite and not retained in the still | Immediate final cards; static focus emphasis | Approved |
| Workflow BUILD | DISCOVER/DESIGN done, BUILD active, IMPROVE waiting | [Capture](./homepage-animation-qa/state-workflow-build.png) | None | All steps shown as a completed semantic list | Approved |
| Tech scan complete | Twelve canonical technologies in FOUND state | [Capture](./homepage-animation-qa/state-tech-scan-complete.png) | None | Final labels shown immediately | Approved |
| System status complete | Truthful final rows, full stepped chart, no live-monitoring implication | [Capture](./homepage-animation-qa/state-system-status-complete.png) | None | Final values and chart shown immediately | Approved |
| ScrollChomper 50% | Section-aware track and numeric progress | [Capture](./homepage-animation-qa/state-scroll-50.png) | Pixel snapping can make the visible value differ by one percentage point | Hidden under reduced motion | Approved |
| Page complete | End-of-track state with `COMPLETE` readout | [Capture](./homepage-animation-qa/state-page-complete.png) | None | ScrollChomper hidden; content remains complete | Approved |

## Accessibility verification

Axe ran without disabled rules or broad exclusions on:

- every public route and the custom 404;
- Home initial state and completed boot;
- a keyboard-focused principle card;
- the BUILD-active product workflow;
- completed System Status;
- dark and light themes;
- reduced motion;
- the open mobile navigation dialog.

Additional tests verify one page-level `h1`, semantic ordered process steps,
stable screen-reader copy, real links, focus restoration, no focus trap, no
duplicate boot announcements, and no JavaScript content parity regression.

## Lighthouse comparison

Lighthouse 13.4.1 used its default mobile simulation against `next start`.
Home values are medians of five sequential runs. The initial build was
reconstructed from commit `35e983da58a38fa3bafe45be080ddd739399fbac`
in an isolated temporary directory with the same dependencies.

| Metric | Initial | Final | Difference |
|---|---:|---:|---:|
| Performance | 94 | 99 | +5 |
| Accessibility | 100 | 100 | 0 |
| Best Practices | 100 | 100 | 0 |
| SEO | 100 | 100 | 0 |
| FCP | 1,065 ms | 1,089 ms | +24 ms |
| LCP | 3,080 ms | 2,192 ms | −888 ms |
| CLS | 0 | 0 | 0 |
| TBT | 7 ms | 10 ms | +3 ms |

Home final Performance ranged from 93 to 100 across five runs; the median was
99. The Home LCP range was 1,429–3,236 ms. This variance is recorded rather
than selecting only the fastest run.

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Home (median) | 99 | 100 | 100 | 100 | 1,089 ms | 2,192 ms | 0 | 10 ms |
| Products | 100 | 100 | 100 | 100 | 792 ms | 1,092 ms | 0 | 14 ms |
| About | 100 | 100 | 100 | 100 | 765 ms | 1,223 ms | 0 | 8 ms |
| AI Code Helper | 98 | 100 | 100 | 100 | 933 ms | 2,444 ms | 0 | 22 ms |

## Bundle and transfer impact

| Metric | Initial | Final | Difference |
|---|---:|---:|---:|
| All generated JavaScript chunks | 705,370 B | 742,201 B | +36,831 B (+5.2%) |
| All generated CSS chunks | 77,265 B | 97,212 B | +19,947 B (+25.8%) |
| Home browser JavaScript | 174,780 B | 184,463 B | +9,683 B (+5.5%) |
| Home browser CSS | 12,114 B | 15,011 B | +2,897 B (+23.9%) |
| Home browser total encoded resources | 506,980 B | 520,814 B | +13,834 B (+2.7%) |

The CSS increase contains the boot, module, workflow, theme, and seven track
states. The initial full `motion.section` implementation increased raw JS by
21.3%; it was replaced with a normal server-rendered section whose existing
`useScroll` MotionValue writes the CSS progress variable directly. The final
raw JS increase is 5.2%.

## CPU and lifecycle verification

- Boot timers and visibility listeners are cleared on completion or unmount.
- Section observers unobserve after activation; finite timers are cleared.
- Workflow React state is not updated per scroll frame; MotionValue writes the
  CSS variable directly and DOM states change only at stage boundaries.
- ScrollChomper section mode changes come from IntersectionObserver boundaries.
- At idle page end, no decorative CSS animation remains active except the
  explicitly approved XIK logo cursor.
- A warmed post-boot full-page scroll plus theme change produced no
  reproducible long task; the test repeats the interaction if parallel-run
  renderer contention produces an initial sample.
- Lighthouse recorded one initialization task over 50 ms per audited route
  (61–78 ms); no persistent idle task or interaction-specific task was found.
- Browser and Playwright runs reported no hydration or console errors.

## Performance decisions

The Hero `h1` no longer uses the legacy opacity/translate SectionReveal after
hydration, because it was the LCP element and the boot already provides the
entry hierarchy. Jersey 10 uses `display: optional` without high-priority font
preload so the font does not compete with critical CSS under slow-network
simulation. A normal production-browser load still resolves the computed font
to Jersey 10.

## Remaining limitations

- Lighthouse is a local simulated lab test and varies between runs.
- Screenshots capture representative states, not every animation frame.
- The approved logo cursor is the only persistent compositor animation.
- Production field Core Web Vitals and hidden-tab CPU require post-deployment
  observation; this record does not claim them.
