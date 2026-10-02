# XIK Homepage Asset Contract

Status: the developer and AI-dinosaur sprite handoff has been generated and
technically validated. Phase 2 integration remains gated by user visual
approval plus the missing environment and static-scene assets.

## Phase gate

The user selected
`homepage-layout-reference-variant-2-approved.png` as the character source of
truth and explicitly authorized generating new production sheets from it. The
reference board was not cropped into runtime art. New character frames were
generated on chroma-key backgrounds, converted to alpha, normalized to stable
frame cells, quantized to the approved grayscale palette, and validated.

Do not:

- crop production sprites from the composite board;
- upscale its character examples;
- reconstruct missing frames in SVG;
- infer hidden hands, legs, tails, or background pixels;
- substitute the rejected programmatic character components;
- begin scene integration before the generated character sheets receive visual
  approval.

## Required reference files

References stay under `docs/` and are never served as public assets.

| File | Required | Current status | Approval purpose |
|---|---:|---|---|
| `docs/references/homepage/homepage-layout-reference.png` | Yes | Present, 1536 × 1024 | Overall composition, UI density, and state board |
| `docs/references/homepage/homepage-layout-reference-variant-2-approved.png` | Yes | Present, 1536 × 1024; user-selected | Approved combined character and scene source |
| `docs/references/homepage/hero-dark-reference.png` | Yes | Missing | Pixel-native dark-scene target at final composition ratio |
| `docs/references/homepage/hero-light-reference.png` | Yes | Missing | Pixel-native light-scene target at final composition ratio |
| `docs/references/homepage/developer-character-reference.png` | Preferred | Missing as a standalone export; combined approved board present | Full character turnaround, mask closeups, and approved poses |
| `docs/references/homepage/ai-dino-character-reference.png` | Preferred | Missing as a standalone export; combined approved board present | Anatomy, cybernetic detail, and approved states |

The four missing references may be exported from the same approved editable
source as the composite board, but each must retain native nearest-neighbor
pixels and enough resolution for art review. A screenshot crop is not an
acceptable export.

## Shared production coordinate system

- logical scene canvas: 336 × 280 pixels;
- desktop target display: 560–680 CSS pixels wide, normally close to 2×;
- mobile target display: approximately 300–360 CSS pixels wide, normally close
  to 1×;
- origin: top-left `(0, 0)`;
- all frame rectangles and anchors: integer logical pixels;
- sheet direction: horizontal, left to right;
- frame spacing: none;
- transparent sprites: straight-alpha RGBA PNG;
- static office scenes: RGB or RGBA PNG as appropriate;
- source palette: only the approved six grayscale values plus transparent;
- source pixel aspect ratio: 1:1.

The scene canvas is a registration system, not a requirement to place every
sprite on a 336 × 280 transparent frame. Character and effect sheets use
compact frames plus the scene placements below.

## Developer sprite specification

All developer frames use a 192 × 192 logical canvas. The unchanged frame
anchor is `(96, 188)` and maps to scene point `(96, 272)`. Therefore each frame
is placed at scene origin `(0, 84)`.

| File | Frames | Sheet size | Frame order | Reduced-motion frame |
|---|---:|---:|---|---:|
| `public/sprites/developer/developer-idle.png` | 4 | 768 × 192 | neutral, inhale, hold, exhale | 0 |
| `public/sprites/developer/developer-typing.png` | 6 | 1152 × 192 | neutral, left press, center press, right press, center return, neutral | 0 |
| `public/sprites/developer/developer-mask-blink.png` | 3 | 576 × 192 | eyes open, eyes closed, eyes open | 0 |
| `public/sprites/developer/developer-head-turn.png` | 4 | 768 × 192 | center, quarter turn, side glance, center | 0 |
| `public/sprites/developer/developer-activate.png` | 6 | 1152 × 192 | rest, lift, reach, panel contact, retract, rest | 5 |
| `public/sprites/developer/developer-scratch.png` | 4 | 768 × 192 | rest, scratch one, scratch two, rest | 0 |
| `public/sprites/developer/developer-hands-up.png` | 4 | 768 × 192 | rest, raise, hold, rest | 0 |
| `public/sprites/developer/developer-clap.png` | 4 | 768 × 192 | open, contact, open, rest | 3 |
| `public/sprites/developer/developer-laugh.png` | 4 | 768 × 192 | rest, lean, laugh, rest | 0 |

Every frame contains the complete developer registration silhouette required by
that animation. If an exporter instead supplies isolated overlay sheets, it
must also provide an approved composited proof for every frame and preserve the
same anchor. Phase 2 must not invent missing base pixels.

The developer export must retain:

- complete hood outline;
- original approved mask;
- separate readable eyes, nose, moustache, mouth, chin, and cheek values;
- both forearms and hands;
- seated posture and keyboard relationship;
- no copied commercial mask geometry.

## Secondary developer sprite specification

The second developer uses a separate original outfit so the two characters do
not read as clones. The outfit combines a light-gray hood and sleeves, dark
technical utility vest, cargo trousers, fingerless gloves, knee panels, and
combat boots. The theatrical mask remains consistent with the approved XIK
character language.

All secondary frames use the same 192 × 192 logical canvas, bottom anchor, six
value grayscale palette, and binary-alpha rules as the primary developer.

| File | Frames | Sheet size | Frame order | Reduced-motion frame |
|---|---:|---:|---|---:|
| `public/sprites/developer-secondary/secondary-typing.png` | 4 | 768 × 192 | neutral, left press, right press, neutral | 0 |
| `public/sprites/developer-secondary/secondary-scratch.png` | 4 | 768 × 192 | rest, scratch one, scratch two, rest | 0 |
| `public/sprites/developer-secondary/secondary-hands-up.png` | 4 | 768 × 192 | rest, raise, hold, rest | 0 |
| `public/sprites/developer-secondary/secondary-clap.png` | 4 | 768 × 192 | open, contact, open, rest | 3 |
| `public/sprites/developer-secondary/secondary-laugh.png` | 4 | 768 × 192 | rest, lean, laugh, rest | 0 |

The gesture controller chooses independently between scratch, hands-up, clap,
and laugh. It does not choose the same gesture for both developers at the same
moment when another action is available. Random gesture timers stop when the
scene is offscreen, the document is hidden, the AI-dinosaur sequence takes
control, or reduced motion is requested.

## AI dinosaur sprite specification

All dinosaur frames use a 256 × 176 logical canvas. The unchanged frame anchor
is `(128, 172)` and maps to scene point `(208, 272)`. Therefore each frame is
placed at scene origin `(80, 100)`.

| File | Frames | Sheet size | Frame order | Reduced-motion frame |
|---|---:|---:|---|---:|
| `public/sprites/ai-dino/ai-dino-idle.png` | 4 | 1024 × 176 | neutral, core low, core high, neutral | 0 |
| `public/sprites/ai-dino/ai-dino-blink.png` | 3 | 768 × 176 | eye open, eye closed, eye open | 0 |
| `public/sprites/ai-dino/ai-dino-tail.png` | 6 | 1536 × 176 | center, rise one, rise two, center, drop one, drop two | 0 |
| `public/sprites/ai-dino/ai-dino-scan.png` | 6 | 1536 × 176 | wake, sensor up, scan one, scan two, lock, hold | 5 |
| `public/sprites/ai-dino/ai-dino-linked.png` | 4 | 1024 × 176 | link start, link pulse, linked, linked hold | 3 |
| `public/sprites/ai-dino/ai-dino-boosted.png` | 6 | 1536 × 176 | brace, armor one, armor two, core high, boosted, hold | 5 |
| `public/sprites/ai-dino/ai-dino-ready.png` | 4 | 1024 × 176 | settle, nod, ready, ready hold | 3 |

Every state must preserve the approved dinosaur silhouette and registration.
The export must retain:

- recognizable snout, jaw, neck, torso, front arm, rear legs, and tapered tail;
- AI eye/core;
- processor panel;
- segmented mechanical tail;
- armor that follows anatomy;
- circuits, data port, and antenna or sensor;
- stable feet and no state-to-state scale change.

## Environment asset specification

| File | Frame size | Frames / total size | Scene placement | Alpha | Purpose |
|---|---:|---:|---:|---:|---|
| `public/scenes/home/hero-static-light.png` | 336 × 280 | 1 / 336 × 280 | `(0, 0)` | Optional | Approved complete light fallback |
| `public/scenes/home/hero-static-dark.png` | 336 × 280 | 1 / 336 × 280 | `(0, 0)` | Optional | Approved complete dark fallback |
| `public/sprites/environment/office-base-light.png` | 336 × 280 | 1 / 336 × 280 | `(0, 0)` | No | Static light office without characters |
| `public/sprites/environment/office-base-dark.png` | 336 × 280 | 1 / 336 × 280 | `(0, 0)` | No | Static dark office without characters |
| `public/sprites/environment/window-day.png` | 128 × 88 | 1 / 128 × 88 | `(142, 18)` | Yes | Sun, clouds, and day skyline/window interior |
| `public/sprites/environment/window-night.png` | 128 × 88 | 1 / 128 × 88 | `(142, 18)` | Yes | Moon, stars, and night skyline/window interior |
| `public/sprites/environment/monitor-overlay.png` | 168 × 104 | 5 / 840 × 104 | `(78, 116)` | Yes | idle, scanning, linked, boosted, ready screens |
| `public/sprites/environment/data-pulse.png` | 112 × 24 | 6 / 672 × 24 | `(164, 176)` | Yes | monitor-to-dinosaur stepped pulse |
| `public/sprites/environment/pixel-effects.png` | 96 × 72 | 6 / 576 × 72 | `(218, 80)` | Yes | sparse activation sparks and status accents |

Static fallbacks must be composited from the same approved source layers as the
sprites. The legacy `public/welcome-anon-dino.png` may remain only until both
new static fallbacks are verified.

If the artist needs a different compact-frame size to preserve approved
artwork, stop and update this contract before implementation. Do not silently
resample or crop the art to force these dimensions.

## Export rules

- export transparent sprites as non-interlaced PNG;
- do not use JPEG, lossy WebP, animated WebP, GIF, or base64 source embedding;
- lossless WebP may be evaluated only after pixel-equivalence and transfer-size
  comparison;
- disable smoothing, antialiasing, blur, color management that changes palette
  values, and fractional transforms in the source;
- keep each sheet frame exactly the same dimensions;
- keep one-pixel transparent padding only where the approved silhouette needs
  it; do not add arbitrary gutters;
- use nearest-neighbor scaling for previews;
- preserve source-layer names in English;
- provide the editable layered source used for export outside `public/`;
- include no hidden copyrighted source art;
- do not bake text that is primary page content into an image.

## File integrity and provenance

The asset handoff must include, in the pull request or delivery note:

- artist or source owner;
- confirmation that XIK may use and modify the work;
- confirmation that no third-party game character or commercial mask artwork
  was traced;
- export date;
- source canvas dimensions;
- frame dimensions and counts;
- SHA-256 for every delivered PNG;
- approval name or explicit user approval message.

Assets with unknown provenance do not pass the Phase 2 gate.

## Technical validation

Before Phase 2 begins, validate every delivered file:

1. path and exact case match this contract;
2. dimensions match the relevant table;
3. PNG format and expected alpha channel are present;
4. no unexpected RGB hue exists;
5. frame count equals sheet width divided by frame width;
6. frame anchors do not move;
7. transparent padding does not clip animation;
8. nearest-neighbor previews match the approved references;
9. the static light and dark composites align pixel-for-pixel with the same
   source layers;
10. assets are readable at 320, 390, 768, 1024, and 1440 viewport widths.

Automated validation does not replace visual approval.

## Loading and performance contract

- do not preload every sprite sheet;
- preload only the actual initial hero/LCP resource after measurement;
- load one theme-appropriate environment by default;
- defer activation-only sheets until the hero is near the viewport or the user
  requests activation;
- reserve intrinsic scene space to preserve CLS 0;
- use responsive `sizes` for composited fallbacks;
- keep sprite playback in CSS and orchestration in the focused client boundary;
- pause offscreen and hidden-tab animation;
- do not add Canvas, PixiJS, GSAP, or another animation dependency.

Phase 2 must compare transfer size, decoded image cost, LCP, and Home JavaScript
against the recorded baseline.

## Missing-assets table

| Gate item | Current state | Blocks |
|---|---|---|
| Dark hero reference | Missing | Dark scene approval and theme integration |
| Light hero reference | Missing | Light scene approval and theme integration |
| Developer character sheet | Missing | Developer visual approval and all sprite exports |
| AI dinosaur character sheet | Missing | Dinosaur visual approval and all sprite exports |
| Developer production sheets | Present and technically validated; visual approval pending | Phase 3 until approved |
| AI dinosaur production sheets | Present and technically validated; visual approval pending | Phase 3 until approved |
| Light/dark office and window assets | Missing | Phase 2 |
| Static light/dark fallback scenes | Missing | No-JavaScript and reduced-motion production fallback |
| Monitor, data-pulse, and effect sheets | Missing | Phase 3 activation sequence |
| Provenance and usage approval | User authorized generation from Variant 2; source-board rights confirmation remains external | Final legal acceptance |

## Phase 2 entry checklist

Phase 2 may begin only when all statements are true:

- the selected Variant 2 combined reference and the final scene references have
  explicit user approval;
- generated developer and AI-dinosaur previews have explicit visual approval;
- every required production PNG exists;
- automated dimension, alpha, palette, and frame-count checks pass;
- sprite registration is stable;
- provenance and usage rights are recorded;
- dark and light static composites are visually approved;
- the working tree is clean after the Phase 1 commit.

Until then, the correct implementation state is to preserve the current
production UI and stop at the Phase 1 asset gate.
