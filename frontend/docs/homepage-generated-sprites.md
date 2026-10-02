# XIK Generated Character Sprites

Status: production PNG sheets have been generated, technically validated, and
wired into the homepage hero. Visual approval of the final scene composition
is still required before release.

## Source selection

The user selected:

`docs/references/homepage/homepage-layout-reference-variant-2-approved.png`

The source is a 1536 × 1024 RGB reference board. It was used only as a design
reference. No runtime sprite was cropped from the board.

The other supplied boards are retained for comparison:

- `docs/references/homepage/homepage-layout-reference.png`;
- `docs/references/homepage/homepage-layout-reference-variant-1.png`.

## Generation mode

- tool mode: OpenAI built-in image generation;
- intent: new raster generation from a style and character reference;
- transparency workflow: uniform chroma-key generation followed by local alpha
  extraction;
- CLI/API fallback: not used;
- true-native transparency model: not used;
- new application dependency: none.

## Prompt contract

Every sheet used this shared prompt contract:

```text
Use case: stylized-concept
Asset type: production 16-bit pixel-art sprite sheet for the XIK homepage
Input image 1: the user-selected Variant 2 board as the approved design source
Input image 2, when present: the generated idle sheet as the strict identity,
anatomy, scale, camera, baseline, and registration reference
Style: detailed professional monochrome 16-bit pixel art; crisp hard pixel
clusters; grayscale only; no smooth vector rendering
Layout: equal cells in one horizontal row; identical cell dimensions and
registration; no labels, borders, grid, floor, shadow, or unrelated props
Backdrop: perfectly flat uniform #00ff00 chroma-key background with no
variation; green prohibited inside the subject
Character constraints: full silhouette visible; no cropping; no identity
drift; no commercial mask tracing; no generic dinosaur redesign; no watermark
```

Each call added the exact sequence below.

| Sheet | Sequence |
|---|---|
| Developer idle | neutral, inhale, hold, exhale |
| Developer typing | neutral, left press, center press, right press, return, neutral |
| Developer mask blink | eyes open, closed, open |
| Developer head turn | center, quarter turn, side glance, center |
| Developer activate | rest, lift, reach, panel contact, retract, rest |
| AI dino idle | neutral, core low, core high, neutral |
| AI dino blink | eye open, shutter closed, eye open |
| AI dino tail | center, rise one, rise two, center, drop one, drop two |
| AI dino scan | wake, sensor up, scan start, scan extend, lock, hold |
| AI dino linked | link start, data travel, synchronized core, hold |
| AI dino boosted | brace, armor one, armor two, core high, sparks, hold |
| AI dino ready | settle, nod, ready, ready hold |

The later two-developer interaction pass added:

| Character | Sheet | Sequence |
|---|---|---|
| Primary developer | Scratch | rest, scratch one, scratch two, rest |
| Primary developer | Hands up | rest, raise, hold, rest |
| Primary developer | Clap | open, contact, open, rest |
| Primary developer | Laugh | rest, lean, laugh, rest |
| Secondary developer | Typing | neutral, left press, right press, neutral |
| Secondary developer | Scratch | rest, scratch one, scratch two, rest |
| Secondary developer | Hands up | rest, raise, hold, rest |
| Secondary developer | Clap | open, contact, open, rest |
| Secondary developer | Laugh | rest, lean, laugh, rest |

The secondary character is a separate production design rather than a recolor:
light-gray hood and sleeves, dark utility vest, cargo trousers, fingerless
gloves, knee panels, and combat boots.

## Transparent masters

The generated 2172 × 724 sources were converted from chroma-key RGB to RGBA
using the installed image-generation skill helper with:

```text
--auto-key border
--soft-matte
--transparent-threshold 12
--opaque-threshold 220
--despill
```

The transparent high-resolution masters are retained under:

```text
docs/references/homepage/generated-masters/developer/
docs/references/homepage/generated-masters/ai-dino/
docs/references/homepage/generated-masters/developer-actions/
```

These masters preserve more source detail than the runtime sheets and are the
starting point for any future normalization or frame correction.

The original RGB chroma-key generations are also retained, as requested, under:

```text
docs/references/homepage/generated-chroma-sources/developer/
docs/references/homepage/generated-chroma-sources/ai-dino/
docs/references/homepage/generated-chroma-sources/developer-actions/
```

They are source records only and are never served by the website.

## Runtime sheets

Developer frames:

- frame size: 192 × 192;
- palette: six approved grayscale values;
- alpha: binary 0 or 255;
- anchor: bottom/foot registration;
- total runtime transfer on disk: approximately 171 KB.

AI-dinosaur frames:

- frame size: 256 × 176;
- palette: six approved grayscale values;
- alpha: binary 0 or 255;
- anchor: bottom/foot registration;
- total runtime transfer on disk: approximately 304 KB.

Random developer gesture frames:

- primary additions: four 768 × 192 sheets, approximately 116 KB on disk;
- secondary character: five 768 × 192 sheets, approximately 160 KB on disk;
- palette and alpha rules: identical to the original production sprites;
- anchor: stable bottom/foot registration.

Exact dimensions, hashes, frame counts, palette values, and byte sizes are in:

`docs/references/homepage/sprite-manifest.json`

The deterministic normalization pipeline is:

`scripts/process-home-sprites.py`

It requires Pillow in the execution environment but does not add Pillow to the
website dependencies.

## Homepage integration

The hero now renders the transparent runtime sheets as registered CSS sprite
layers:

- the previous programmatic developer and dinosaur SVG geometry is no longer
  rendered;
- the environment remains a lightweight, theme-aware inline SVG;
- the scene uses the approved landscape composition;
- CSS frame selection uses discrete sprite positions;
- the existing interaction controller drives `idle`, `scanning`, `linked`,
  `boosted`, and `ready` states;
- animations pause offscreen and in a hidden tab;
- reduced motion renders a static final state;
- two developer outfits render from separate production sheets;
- scratch, hands-up, clap, and laugh gestures are scheduled independently;
- the two characters avoid performing the same random gesture together when
  another choice is available;
- random gesture timers stop offscreen, in hidden tabs, during the AI-dinosaur
  activation sequence, and under reduced motion;
- no additional animation or canvas dependency is used.

## Visual previews

Static contact sheets:

- `docs/references/homepage/generated-previews/developer-sprite-sheets.png`;
- `docs/references/homepage/generated-previews/ai-dino-sprite-sheets.png`;
- `docs/references/homepage/generated-previews/developer-actions/primary-actions.png`;
- `docs/references/homepage/generated-previews/developer-actions/secondary-actions.png`.

Stepped animation previews:

- `docs/references/homepage/generated-previews/developer-animation-preview.gif`;
- `docs/references/homepage/generated-previews/ai-dino-animation-preview.gif`;
- `docs/references/homepage/generated-previews/developer-actions/primary-actions.gif`;
- `docs/references/homepage/generated-previews/developer-actions/secondary-actions.gif`.

## Validation performed

The processing script verifies:

- expected sheet dimensions;
- exact frame counts;
- non-empty frames;
- grayscale-only RGB values;
- binary transparency;
- SHA-256 for each runtime sheet;
- stable bottom registration;
- nearest-neighbor resizing.

## Visual approval notes

The generated art is substantially more detailed and character-driven than the
rejected programmatic SVG. The following items still require human review
before homepage integration:

- mask identity consistency between independently generated animation sheets;
- the front-facing frame inside the developer head-turn cycle;
- minor silhouette variation between dinosaur state sheets;
- desired strength of the scan beam and boosted sparks;
- final character scale inside the complete office scene.

If any item is rejected, edit the corresponding transparent master and rerun
the processing script. Do not repair the character by returning to
programmatic SVG geometry.
