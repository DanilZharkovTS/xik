# XIK Homepage Art Direction

Status: Phase 1 visual contract. Production implementation is blocked until the
required reference exports and production sprite assets in
`homepage-asset-contract.md` are present and approved.

## Reference hierarchy

The visual source of truth is, in descending order:

1. approved character sheets;
2. approved light and dark hero-scene references;
3. the approved homepage composition board;
4. this written contract;
5. the current website only for layout, content, accessibility, and interaction
   behavior that the new artwork must preserve.

The current programmatic `HeroWorld`, `DeveloperSprite`, and
`AIDinosaurSprite` are explicitly rejected as character-art references. Their
geometry must not be incrementally polished or used to infer missing anatomy.

### Reference inventory at the Phase 1 gate

| Reference | Status | Permitted use |
|---|---|---|
| `docs/references/homepage/homepage-layout-reference.png` | Present; approved 1536 × 1024 composite board | Composition, tone, density, state, and asset-export guidance |
| `docs/references/homepage/homepage-layout-reference-variant-2-approved.png` | Present; user-selected 1536 × 1024 combined board | Character design and generated sprite source of truth |
| `docs/references/homepage/hero-dark-reference.png` | Missing | Required visual approval target for the dark hero |
| `docs/references/homepage/hero-light-reference.png` | Missing | Required visual approval target for the light hero |
| `docs/references/homepage/developer-character-reference.png` | Missing | Required source of truth for anatomy, mask, and animation poses |
| `docs/references/homepage/ai-dino-character-reference.png` | Missing | Required source of truth for dinosaur anatomy, machinery, and states |
| `public/welcome-anon-dino.png` | Present; flattened 410 × 609 legacy artwork | Temporary no-JavaScript or emergency fallback only |

The composite board includes reduced examples of the missing scenes and
character states, but it is not a pixel-native production sheet. Cropping or
upscaling those examples would introduce interpolation, incomplete silhouettes,
and unknown registration points. It must not be cut into production sprites.

## Current implementation baseline

The current rejected hero was inspected in a local production build at
1440 × 900:

- rendered scene: approximately 640 × 637 CSS pixels;
- programmatic SVG view box: 1280 × 1120;
- layout: two-column desktop hero with a large scene;
- theme source: the existing `data-theme` value on the root element;
- interaction: idle, scanning, linked, boosted, and ready states;
- lifecycle: `IntersectionObserver`, document visibility handling, and reduced
  motion support;
- legacy fallback: `public/welcome-anon-dino.png`.

The scene size and application behavior are useful implementation constraints.
The generated character design is not. The art-direction failure is caused by
weak anatomy, silhouettes, expression, and composition rather than insufficient
SVG resolution.

The latest repository performance record lists the Home production-lab baseline
as Performance 97, Accessibility 100, Best Practices 100, SEO 100, LCP
2,612 ms, CLS 0, TBT 3.5 ms, and 175,784 bytes of transferred JavaScript.
These remain comparison values, not field Core Web Vitals.

## Pixel-art density

The target is detailed, monochrome, 16-bit-inspired pixel art:

- use a 336 × 280 logical scene canvas;
- render near 2× on desktop where the layout permits, producing a scene around
  560–680 CSS pixels wide;
- render near 1× on narrow mobile screens;
- use logical character canvases in the approximate 96 × 128 to 192 × 256
  range;
- keep every authored edge on integer source pixels;
- use nearest-neighbor scaling and `image-rendering: pixelated`;
- preserve hard one-pixel details in the source art;
- reserve two- and three-pixel source clusters for structural outlines;
- avoid isolated noise pixels that do not improve silhouette or material.

The visual hierarchy is intentionally not one universal pixel size:

- hero characters use the densest and most expressive source art;
- environment assets use slightly quieter detail;
- UI icons use compact, readable pixel grids;
- the XIK mark stays small and square;
- ScrollChomper uses a medium, clearly visible pixel scale;
- body text prioritizes readability over decorative pixel density.

Responsive scaling may not always be an exact integer because the page must fit
all viewports. Assets still require integer source geometry, stable intrinsic
dimensions, nearest-neighbor rendering, and breakpoint-specific removal of
non-essential micro-detail before essential characters become unreadable.

## Hero composition

The approved composition board establishes this hierarchy:

- developer on the left;
- two monitors and keyboard in the center;
- AI dinosaur on the right;
- broad window behind the workstation;
- shelves and small studio objects framing, not competing with, the characters;
- desk creating a strong horizontal base;
- character silhouettes filling the scene rather than floating inside a card.

Desktop hero proportions:

- text column: approximately 48–55%;
- artwork column: approximately 45–52%;
- artwork width: approximately 560–680 CSS pixels;
- characters and desk must occupy most of the artwork frame.

Tablet artwork should remain approximately 440–540 CSS pixels wide. Mobile
artwork should fill the available content width. On narrow screens, books,
small wall marks, and secondary effects may be removed before the developer,
dinosaur, monitors, window, or activation control are reduced.

## Developer direction

The developer is an original masked builder, not a traced film character or a
copy of an existing Guy Fawkes illustration.

Required silhouette and proportions:

- readable hood mass around the head and shoulders;
- seated posture that clearly connects hands to the keyboard;
- forearms and hands with distinct typing poses;
- head that remains identifiable at mobile size;
- body and chair shapes separated through grayscale value, not blur.

Required mask qualities:

- original theatrical hacker-mask interpretation;
- controlled, symmetrical resting shape with deliberate small asymmetries in
  animation frames;
- readable eyes, brows, nose bridge, moustache, mouth, chin, and cheek planes;
- attractive and calm rather than grotesque, skeletal, or melted;
- enough facial detail to carry a blink and head turn without becoming
  photorealistic;
- no direct tracing of a commercial mask, film still, or third-party pixel art.

The mask should read first as a face, then as a hacker motif. It must not be
constructed from a few oversized rectangles or arbitrary polygons.

## AI dinosaur direction

The AI dinosaur must read first as a dinosaur and second as a cybernetic system.

Required anatomy:

- clear head and snout;
- separate upper and lower jaw;
- readable teeth without a solid white saw edge;
- neck connecting naturally to the torso;
- small front arms;
- planted rear legs with visible mechanical joints;
- long segmented tail with a clear taper;
- stable center of mass in idle and activation poses.

Required cybernetic traits:

- high-contrast AI eye or core;
- processor/status panel;
- armor plates that follow anatomy;
- small circuits and data ports;
- segmented mechanical tail;
- antenna or sensor;
- cable or data-pulse relationship to the monitor;
- readable scan, linked, boosted, and ready states.

Cybernetic detail must reinforce the silhouette rather than cover it with random
symbols. The character should feel capable and friendly, not like a generic
cartoon dinosaur with labels pasted on top.

## Environment

The environment supports the developer–dinosaur relationship:

- monitors remain the central data surface;
- terminal lines are short decorative blocks, never important client-only text;
- keyboard rows are readable without one large square per key;
- desk edge, cup, mouse, books, plant, and shelves use controlled secondary
  contrast;
- the window creates the dominant theme change;
- wall details and effects must not reduce face or dinosaur legibility.

Environment layers may be simplified on mobile, but the desk, monitor cluster,
window, developer, and dinosaur stay present.

## Grayscale palette

Artwork must use a deliberately limited grayscale ramp. The production exports
may use alpha plus these approved target values:

| Role | Value |
|---|---|
| Absolute ink | `#050505` |
| Deep surface | `#111111` |
| Dark structure | `#292929` |
| Mid structure | `#5e5e5e` |
| Light structure | `#bdbdbd` |
| Highlight | `#f5f5f5` |

Equivalent token values already owned by the design system should be used where
the rendered scene is theme-colored in CSS. No hue, colored glow, soft gradient,
blur, or semitransparent antialias fringe is allowed.

## Theme direction

### Dark theme

- deep night sky;
- pixel moon with a stepped silhouette;
- sparse stars grouped with visual rhythm;
- room surfaces remain visible in at least two dark values;
- monitors and AI core carry the brightest local highlights;
- character outlines remain separate from the background.

### Light theme

- light grayscale sky;
- pixel sun with a stepped silhouette;
- two or three block clouds;
- room objects remain differentiated rather than becoming black cutouts;
- monitor content remains readable;
- developer mask and dinosaur armor keep their internal value hierarchy.

Theme state must come from the existing root `data-theme`; no duplicate theme
store is allowed. Theme changes should be immediate under reduced motion and
may use only a short stepped transition otherwise.

## Animation direction

Animation changes approved sprite frames; it does not redraw, stretch, rotate,
or distort character art.

- use CSS `steps()` for deterministic loops;
- use Motion only for orchestration already justified by the application;
- keep translations on integer CSS pixels;
- no smooth floating, rubber easing, blur animation, or continuous filter work;
- idle movement is one or two logical pixels;
- activation lasts approximately 1.5–3 seconds;
- no rapid flashing and no sound;
- pause offscreen and when the document is hidden;
- reduced motion selects a static ready frame and disables decorative loops;
- no per-frame React state, Canvas, PixiJS, GSAP, or new animation dependency.

## Homepage consistency

The remaining homepage should support the hero rather than imitate its exact
sprite density:

- keep the square XIK mark and compact cursor;
- use original medium-density pixel glyphs in Principles and Tech Stack;
- retain the tattoo motifs: theatrical mask, irregular hex cells, circuits,
  code, and binary;
- use block bars and discrete states in System Status;
- retain hard two- and four-pixel UI borders and shadows;
- keep readable text spacing and visible focus states;
- preserve native scrolling and the original ScrollChomper behavior.

## Prohibited visual patterns

The following fail visual acceptance even if automated tests pass:

- giant coarse pixels;
- crude block faces;
- generic cartoon dinosaurs;
- smooth corporate vector illustration;
- grotesque mask geometry;
- visually unreadable character silhouettes;
- random SVG geometry not grounded in approved references;
- traced commercial mask artwork;
- copied third-party pixel characters;
- copyrighted game sprites;
- lossy sprite compression;
- colored accents or glow;
- soft blur, glassmorphism, or glossy SaaS treatment;
- anatomy changed by CSS transforms;
- production sprites cropped from the composite reference board.

## Visual acceptance gate

Before Phase 2 can be accepted, side-by-side review must confirm:

- the developer resembles the approved character sheet;
- the mask is attractive, readable, original, and non-grotesque;
- the dinosaur matches its approved sheet and has readable anatomy;
- the scene matches the approved light and dark compositions;
- pixel density is detailed while visibly pixel-based;
- neither character looks like engineering-generated SVG geometry;
- the hero remains visually dominant;
- mobile preserves face, dinosaur, monitors, and window;
- theme variants are unambiguous;
- reduced motion retains a polished static composition.

Passing lint, tests, accessibility checks, or Lighthouse does not replace this
visual approval.
