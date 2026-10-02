# XIK Hero Sprite Asset Specification

The current production hero asset, `public/welcome-anon-dino.png`, is a single
flattened 410 × 609 PNG. It contains the developer, hands, dinosaur, tail,
monitors, terminal, room, plants, shelves, and background in one raster.

Independent hand, blink, tail, or head animation cannot be produced faithfully
from this file without inventing hidden pixels or using destructive crops.
The current implementation therefore preserves the source intact and adds only
non-destructive overlays:

- a small monochrome pixel-noise layer;
- a terminal message layer;
- a stepped terminal cursor.

The flattened source itself remains static. Moving the entire LCP image would
not represent a real character animation and would add unnecessary rendering
work.

## Required layered source

Future character animation should be supplied on one shared transparent canvas
whose aspect ratio matches the current hero. Every layer must use identical
canvas dimensions and registration points so frames can be exchanged without
layout movement.

Preferred native canvas:

- 410 × 609 pixels when authored at the current resolution; or
- 820 × 1218 pixels when every original pixel is represented by an exact 2 × 2
  block.

Do not submit arbitrary retina resampling. Scaling must use nearest-neighbor
integer multiples.

## Required layers and frames

| Layer | Minimum frames | Purpose |
|---|---:|---|
| Room background | 1 | Window, shelves, desk, plants, and static environment |
| Developer base | 1 | Hoodie, torso, chair, and non-moving silhouette |
| Developer left arm and hand | 3 | Rest, key press, and return |
| Developer right arm and hand | 3 | Rest, key press, and return |
| Developer head or eye layer | 2 | Neutral and blink or small head shift |
| Dinosaur base | 1 | Body excluding blink and moving tail |
| Dinosaur eyes | 2 | Open and blink |
| Dinosaur tail | 4 | Neutral, two stepped offsets, and return |
| Monitor bezel | 1 | Static screen border and hardware |
| Terminal screen mask | 1 | Opaque monochrome region for HTML text overlay |
| Foreground occlusion | 1 | Objects that must remain in front of moving parts |

## Export rules

- Use transparent PNG or lossless WebP.
- Preserve a permanent black, white, and gray palette.
- Do not add colored pixels, gradients, blur, glow, or sub-pixel antialiasing.
- Keep frame edges aligned to integer source pixels.
- Keep each sprite frame the same dimensions.
- Name files in English with stable frame numbers, for example
  `developer-left-arm-01.png`.
- Include one composited reference frame that matches the current approved
  scene.
- Include the editable layered source file used to produce the exports.

## Timing reference

- Typing: three or four frames at 6–8 frames per second.
- Blink: two frames, shown briefly every 4–7 seconds.
- Tail: four frames at 4–6 frames per second.
- Idle movement: no more than one or two source pixels.
- All frame changes use stepped timing.

With these assets, the fallback can be upgraded without replacing the page
layout, accessible description, terminal overlay, or reduced-motion policy.
