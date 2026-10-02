from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
MASTER_DIR = (
    ROOT / "docs" / "references" / "homepage" / "generated-masters"
)
OUTPUT_DIR = ROOT / "public" / "sprites"
PREVIEW_DIR = (
    ROOT / "docs" / "references" / "homepage" / "generated-previews"
)
MANIFEST_PATH = (
    ROOT / "docs" / "references" / "homepage" / "sprite-manifest.json"
)
PALETTE = (5, 17, 41, 94, 189, 245)
CHECKER_COLORS = ((28, 28, 28, 255), (52, 52, 52, 255))


@dataclass(frozen=True)
class SheetSpec:
    source_name: str
    destination: Path
    frame_count: int
    frame_width: int
    frame_height: int
    bottom_margin: int = 4
    side_margin: int = 3


@dataclass(frozen=True)
class ActionAtlasSpec:
    source_name: str
    row_count: int
    actions: tuple[tuple[str, int], ...]
    destination_dir: Path
    destination_prefix: str
    frame_count: int = 4
    frame_width: int = 192
    frame_height: int = 192
    bottom_margin: int = 4
    side_margin: int = 3


SPECS = (
    SheetSpec(
        "developer-idle.png",
        OUTPUT_DIR / "developer" / "developer-idle.png",
        4,
        192,
        192,
    ),
    SheetSpec(
        "developer-typing.png",
        OUTPUT_DIR / "developer" / "developer-typing.png",
        6,
        192,
        192,
    ),
    SheetSpec(
        "developer-mask-blink.png",
        OUTPUT_DIR / "developer" / "developer-mask-blink.png",
        3,
        192,
        192,
    ),
    SheetSpec(
        "developer-head-turn.png",
        OUTPUT_DIR / "developer" / "developer-head-turn.png",
        4,
        192,
        192,
    ),
    SheetSpec(
        "developer-activate.png",
        OUTPUT_DIR / "developer" / "developer-activate.png",
        6,
        192,
        192,
    ),
    SheetSpec(
        "ai-dino-idle.png",
        OUTPUT_DIR / "ai-dino" / "ai-dino-idle.png",
        4,
        256,
        176,
    ),
    SheetSpec(
        "ai-dino-blink.png",
        OUTPUT_DIR / "ai-dino" / "ai-dino-blink.png",
        3,
        256,
        176,
    ),
    SheetSpec(
        "ai-dino-tail.png",
        OUTPUT_DIR / "ai-dino" / "ai-dino-tail.png",
        6,
        256,
        176,
    ),
    SheetSpec(
        "ai-dino-scan.png",
        OUTPUT_DIR / "ai-dino" / "ai-dino-scan.png",
        6,
        256,
        176,
    ),
    SheetSpec(
        "ai-dino-linked.png",
        OUTPUT_DIR / "ai-dino" / "ai-dino-linked.png",
        4,
        256,
        176,
    ),
    SheetSpec(
        "ai-dino-boosted.png",
        OUTPUT_DIR / "ai-dino" / "ai-dino-boosted.png",
        6,
        256,
        176,
    ),
    SheetSpec(
        "ai-dino-ready.png",
        OUTPUT_DIR / "ai-dino" / "ai-dino-ready.png",
        4,
        256,
        176,
    ),
)

ACTION_ATLASES = (
    ActionAtlasSpec(
        "primary-random-actions.png",
        4,
        (
            ("scratch", 0),
            ("hands-up", 1),
            ("clap", 2),
            ("laugh", 3),
        ),
        OUTPUT_DIR / "developer",
        "developer",
    ),
    ActionAtlasSpec(
        "secondary-random-actions.png",
        5,
        (
            ("typing", 0),
            ("scratch", 1),
            ("hands-up", 2),
            ("clap", 3),
        ),
        OUTPUT_DIR / "developer-secondary",
        "secondary",
    ),
    ActionAtlasSpec(
        "secondary-laugh.png",
        1,
        (("laugh", 0),),
        OUTPUT_DIR / "developer-secondary",
        "secondary",
    ),
)


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value >= 32 else 0).getbbox()
    if bbox is None:
        raise ValueError("Frame contains no opaque pixels")

    return bbox


def quantize_monochrome(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()

    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha < 64:
                pixels[x, y] = (0, 0, 0, 0)
                continue

            luminance = round(0.2126 * red + 0.7152 * green + 0.0722 * blue)
            grayscale = min(PALETTE, key=lambda value: abs(value - luminance))
            pixels[x, y] = (grayscale, grayscale, grayscale, 255)

    return rgba


def occupied_spans(
    image: Image.Image,
    axis: str,
    expected_count: int,
) -> list[tuple[int, int]]:
    alpha = image.getchannel("A")
    width, height = image.size
    samples: list[int] = []

    if axis == "x":
        for x in range(width):
            samples.append(
                sum(
                    1
                    for y in range(height)
                    if alpha.getpixel((x, y)) >= 64
                )
            )
    elif axis == "y":
        for y in range(height):
            samples.append(
                sum(
                    1
                    for x in range(width)
                    if alpha.getpixel((x, y)) >= 64
                )
            )
    else:
        raise ValueError(f"Unsupported projection axis: {axis}")

    spans: list[tuple[int, int]] = []
    start: int | None = None

    for index, sample in enumerate((*samples, 0)):
        if sample > 3 and start is None:
            start = index
        elif sample <= 3 and start is not None:
            spans.append((start, index))
            start = None

    merged_spans: list[tuple[int, int]] = []

    for span_start, span_end in spans:
        previous_width = (
            merged_spans[-1][1] - merged_spans[-1][0]
            if merged_spans
            else 0
        )
        current_width = span_end - span_start

        if (
            merged_spans
            and span_start - merged_spans[-1][1] <= 12
            and (previous_width < 24 or current_width < 24)
        ):
            previous_start, _ = merged_spans[-1]
            merged_spans[-1] = (previous_start, span_end)
        else:
            merged_spans.append((span_start, span_end))

    spans = merged_spans

    if len(spans) != expected_count:
        raise ValueError(
            f"{axis}-axis contains {len(spans)} occupied spans; "
            f"expected {expected_count}: {spans}"
        )

    return spans


def frame_anchor_x(frame: Image.Image, bbox: tuple[int, int, int, int]) -> float:
    left, top, right, bottom = bbox
    alpha = frame.getchannel("A")
    band_top = max(top, bottom - max(12, (bottom - top) // 5))
    xs: list[int] = []

    for y in range(band_top, bottom):
        for x in range(left, right):
            if alpha.getpixel((x, y)) >= 64:
                xs.append(x)

    if not xs:
        return (left + right) / 2

    xs.sort()
    return float(xs[len(xs) // 2])


def normalize_sheet(spec: SheetSpec) -> None:
    character_dir = (
        "developer" if spec.source_name.startswith("developer-") else "ai-dino"
    )
    source_path = MASTER_DIR / character_dir / spec.source_name
    source = Image.open(source_path).convert("RGBA")

    column_spans = occupied_spans(source, "x", spec.frame_count)
    source_frames = [
        source.crop((left, 0, right, source.height))
        for left, right in column_spans
    ]
    bboxes = [alpha_bbox(frame) for frame in source_frames]
    content_width = max(right - left for left, _, right, _ in bboxes)
    content_height = max(bottom - top for _, top, _, bottom in bboxes)
    available_width = spec.frame_width - spec.side_margin * 2
    available_height = spec.frame_height - spec.bottom_margin - 3
    scale = min(
        available_width / content_width,
        available_height / content_height,
    )

    destination_sheet = Image.new(
        "RGBA",
        (spec.frame_width * spec.frame_count, spec.frame_height),
        (0, 0, 0, 0),
    )
    final_bboxes: list[tuple[int, int, int, int]] = []

    for index, (frame, bbox) in enumerate(zip(source_frames, bboxes)):
        left, top, right, bottom = bbox
        cropped = frame.crop(bbox)
        resized_width = max(1, round(cropped.width * scale))
        resized_height = max(1, round(cropped.height * scale))
        resized = cropped.resize(
            (resized_width, resized_height),
            Image.Resampling.NEAREST,
        )
        resized = quantize_monochrome(resized)

        source_anchor = frame_anchor_x(frame, bbox)
        scaled_anchor = (source_anchor - left) * scale
        destination_anchor = spec.frame_width / 2
        x = round(destination_anchor - scaled_anchor)
        y = spec.frame_height - spec.bottom_margin - resized_height
        x = max(
            spec.side_margin,
            min(
                x,
                spec.frame_width - spec.side_margin - resized_width,
            ),
        )

        frame_canvas = Image.new(
            "RGBA",
            (spec.frame_width, spec.frame_height),
            (0, 0, 0, 0),
        )
        frame_canvas.alpha_composite(resized, (x, y))
        destination_sheet.alpha_composite(
            frame_canvas,
            (index * spec.frame_width, 0),
        )
        final_bboxes.append(alpha_bbox(frame_canvas))

    spec.destination.parent.mkdir(parents=True, exist_ok=True)
    destination_sheet.save(spec.destination, optimize=True)

    bounds = ", ".join(
        f"{left}:{top}:{right}:{bottom}"
        for left, top, right, bottom in final_bboxes
    )
    print(
        f"{spec.destination.relative_to(ROOT)} "
        f"{destination_sheet.width}x{destination_sheet.height} "
        f"scale={scale:.4f} bboxes=[{bounds}]"
    )


def action_sheet_specs() -> tuple[SheetSpec, ...]:
    return tuple(
        SheetSpec(
            f"{atlas.destination_prefix}-{action}.png",
            atlas.destination_dir
            / f"{atlas.destination_prefix}-{action}.png",
            atlas.frame_count,
            atlas.frame_width,
            atlas.frame_height,
            atlas.bottom_margin,
            atlas.side_margin,
        )
        for atlas in ACTION_ATLASES
        for action, _ in atlas.actions
    )


def normalize_action_atlas(atlas: ActionAtlasSpec) -> None:
    source_path = MASTER_DIR / "developer-actions" / atlas.source_name
    source = Image.open(source_path).convert("RGBA")
    column_spans = occupied_spans(source, "x", atlas.frame_count)
    row_spans = occupied_spans(source, "y", atlas.row_count)
    action_frames: dict[str, list[Image.Image]] = {}
    all_frames: list[Image.Image] = []

    for action, row_index in atlas.actions:
        row_top, row_bottom = row_spans[row_index]
        frames = [
            source.crop((left, row_top, right, row_bottom))
            for left, right in column_spans
        ]
        action_frames[action] = frames
        all_frames.extend(frames)

    bboxes = [alpha_bbox(frame) for frame in all_frames]
    content_width = max(right - left for left, _, right, _ in bboxes)
    content_height = max(bottom - top for _, top, _, bottom in bboxes)
    available_width = atlas.frame_width - atlas.side_margin * 2
    available_height = atlas.frame_height - atlas.bottom_margin - 3
    scale = min(
        available_width / content_width,
        available_height / content_height,
    )

    atlas.destination_dir.mkdir(parents=True, exist_ok=True)

    for action, frames in action_frames.items():
        destination = (
            atlas.destination_dir
            / f"{atlas.destination_prefix}-{action}.png"
        )
        destination_sheet = Image.new(
            "RGBA",
            (atlas.frame_width * atlas.frame_count, atlas.frame_height),
            (0, 0, 0, 0),
        )
        final_bboxes: list[tuple[int, int, int, int]] = []

        for index, frame in enumerate(frames):
            bbox = alpha_bbox(frame)
            left, top, right, bottom = bbox
            cropped = frame.crop(bbox)
            resized_width = max(1, round(cropped.width * scale))
            resized_height = max(1, round(cropped.height * scale))
            resized = cropped.resize(
                (resized_width, resized_height),
                Image.Resampling.NEAREST,
            )
            resized = quantize_monochrome(resized)

            source_anchor = frame_anchor_x(frame, bbox)
            scaled_anchor = (source_anchor - left) * scale
            destination_anchor = atlas.frame_width / 2
            x = round(destination_anchor - scaled_anchor)
            y = atlas.frame_height - atlas.bottom_margin - resized_height
            x = max(
                atlas.side_margin,
                min(
                    x,
                    atlas.frame_width
                    - atlas.side_margin
                    - resized_width,
                ),
            )

            frame_canvas = Image.new(
                "RGBA",
                (atlas.frame_width, atlas.frame_height),
                (0, 0, 0, 0),
            )
            frame_canvas.alpha_composite(resized, (x, y))
            destination_sheet.alpha_composite(
                frame_canvas,
                (index * atlas.frame_width, 0),
            )
            final_bboxes.append(alpha_bbox(frame_canvas))

        destination_sheet.save(destination, optimize=True)
        bounds = ", ".join(
            f"{left}:{top}:{right}:{bottom}"
            for left, top, right, bottom in final_bboxes
        )
        print(
            f"{destination.relative_to(ROOT)} "
            f"{destination_sheet.width}x{destination_sheet.height} "
            f"scale={scale:.4f} bboxes=[{bounds}]"
        )


def checkerboard(width: int, height: int, cell_size: int = 8) -> Image.Image:
    background = Image.new("RGBA", (width, height), CHECKER_COLORS[0])
    draw = ImageDraw.Draw(background)

    for y in range(0, height, cell_size):
        for x in range(0, width, cell_size):
            color_index = (x // cell_size + y // cell_size) % 2
            draw.rectangle(
                (
                    x,
                    y,
                    min(width, x + cell_size) - 1,
                    min(height, y + cell_size) - 1,
                ),
                fill=CHECKER_COLORS[color_index],
            )

    return background


def create_contact_sheet(
    specs: tuple[SheetSpec, ...],
    destination: Path,
) -> None:
    label_width = 176
    row_gap = 16
    row_height = max(spec.frame_height for spec in specs) + row_gap * 2
    sheet_width = max(
        spec.frame_width * spec.frame_count
        for spec in specs
    )
    preview = Image.new(
        "RGBA",
        (label_width + sheet_width + row_gap * 2, row_height * len(specs)),
        (5, 5, 5, 255),
    )
    draw = ImageDraw.Draw(preview)

    for row, spec in enumerate(specs):
        sheet = Image.open(spec.destination).convert("RGBA")
        row_y = row * row_height
        background = checkerboard(sheet.width, sheet.height)
        background.alpha_composite(sheet)
        preview.alpha_composite(background, (label_width + row_gap, row_y + row_gap))
        draw.text(
            (row_gap, row_y + row_gap),
            spec.source_name.removesuffix(".png").upper(),
            fill=(245, 245, 245, 255),
        )
        draw.text(
            (row_gap, row_y + row_gap + 18),
            (
                f"{spec.frame_count} FRAMES  "
                f"{spec.frame_width}x{spec.frame_height}"
            ),
            fill=(189, 189, 189, 255),
        )

    destination.parent.mkdir(parents=True, exist_ok=True)
    preview.save(destination, optimize=True)


def sheet_frames(spec: SheetSpec) -> list[Image.Image]:
    sheet = Image.open(spec.destination).convert("RGBA")
    return [
        sheet.crop(
            (
                frame_index * spec.frame_width,
                0,
                (frame_index + 1) * spec.frame_width,
                spec.frame_height,
            )
        )
        for frame_index in range(spec.frame_count)
    ]


def create_animation_preview(
    specs: tuple[SheetSpec, ...],
    destination: Path,
    duration_ms: int,
) -> None:
    frames: list[Image.Image] = []

    for spec in specs:
        for frame in sheet_frames(spec):
            background = checkerboard(spec.frame_width, spec.frame_height)
            background.alpha_composite(frame)
            frames.append(
                background.convert("RGB").resize(
                    (spec.frame_width * 2, spec.frame_height * 2),
                    Image.Resampling.NEAREST,
                )
            )

    destination.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        destination,
        save_all=True,
        append_images=frames[1:],
        duration=duration_ms,
        loop=0,
        optimize=False,
    )


def validate_sheet(spec: SheetSpec) -> dict[str, object]:
    sheet = Image.open(spec.destination).convert("RGBA")
    expected_size = (
        spec.frame_width * spec.frame_count,
        spec.frame_height,
    )

    if sheet.size != expected_size:
        raise ValueError(
            f"{spec.destination} has {sheet.size}, expected {expected_size}"
        )

    allowed_colors = {
        (value, value, value)
        for value in PALETTE
    }
    used_alpha: set[int] = set()
    used_colors: set[tuple[int, int, int]] = set()

    for red, green, blue, alpha in sheet.getdata():
        used_alpha.add(alpha)
        if alpha:
            used_colors.add((red, green, blue))

    if not used_alpha.issubset({0, 255}):
        raise ValueError(
            f"{spec.destination} contains partial alpha values: {used_alpha}"
        )

    if not used_colors.issubset(allowed_colors):
        raise ValueError(
            f"{spec.destination} contains colors outside the XIK palette"
        )

    frame_bounds = [alpha_bbox(frame) for frame in sheet_frames(spec)]
    horizontal_alpha_margins = [
        min(left, spec.frame_width - right)
        for left, _, right, _ in frame_bounds
    ]
    minimum_horizontal_alpha_margin = min(horizontal_alpha_margins)

    if (
        spec.destination.parent.name == "ai-dino"
        and minimum_horizontal_alpha_margin < 8
    ):
        raise ValueError(
            f"{spec.destination} contains alpha too close to a frame edge; "
            "a neighboring dinosaur may have leaked into the frame"
        )

    file_hash = sha256(spec.destination.read_bytes()).hexdigest()

    return {
        "file": str(spec.destination.relative_to(ROOT)),
        "frameCount": spec.frame_count,
        "frameWidth": spec.frame_width,
        "frameHeight": spec.frame_height,
        "sheetWidth": sheet.width,
        "sheetHeight": sheet.height,
        "bytes": spec.destination.stat().st_size,
        "sha256": file_hash,
        "alphaValues": sorted(used_alpha),
        "grayscaleValues": sorted({red for red, _, _ in used_colors}),
        "minimumHorizontalAlphaMargin": minimum_horizontal_alpha_margin,
    }


def main() -> None:
    for spec in SPECS:
        normalize_sheet(spec)

    for atlas in ACTION_ATLASES:
        normalize_action_atlas(atlas)

    developer_specs = tuple(
        spec for spec in SPECS if spec.source_name.startswith("developer-")
    )
    dinosaur_specs = tuple(
        spec for spec in SPECS if spec.source_name.startswith("ai-dino-")
    )
    primary_action_specs = tuple(
        spec
        for spec in action_sheet_specs()
        if spec.destination.parent.name == "developer"
    )
    secondary_action_specs = tuple(
        spec
        for spec in action_sheet_specs()
        if spec.destination.parent.name == "developer-secondary"
    )

    create_contact_sheet(
        developer_specs,
        PREVIEW_DIR / "developer-sprite-sheets.png",
    )
    create_contact_sheet(
        dinosaur_specs,
        PREVIEW_DIR / "ai-dino-sprite-sheets.png",
    )
    create_animation_preview(
        developer_specs,
        PREVIEW_DIR / "developer-animation-preview.gif",
        150,
    )
    create_animation_preview(
        dinosaur_specs,
        PREVIEW_DIR / "ai-dino-animation-preview.gif",
        170,
    )
    create_contact_sheet(
        primary_action_specs,
        PREVIEW_DIR / "developer-actions" / "primary-actions.png",
    )
    create_contact_sheet(
        secondary_action_specs,
        PREVIEW_DIR / "developer-actions" / "secondary-actions.png",
    )
    create_animation_preview(
        primary_action_specs,
        PREVIEW_DIR / "developer-actions" / "primary-actions.gif",
        220,
    )
    create_animation_preview(
        secondary_action_specs,
        PREVIEW_DIR / "developer-actions" / "secondary-actions.gif",
        220,
    )

    manifest = {
        "sourceReference": (
            "docs/references/homepage/"
            "homepage-layout-reference-variant-2-approved.png"
        ),
        "generatedWith": "OpenAI built-in image generation",
        "backgroundRemoval": "Chroma key converted to alpha",
        "actionSources": [
            str(
                (
                    MASTER_DIR
                    / "developer-actions"
                    / atlas.source_name
                ).relative_to(ROOT)
            )
            for atlas in ACTION_ATLASES
        ],
        "palette": list(PALETTE),
        "sheets": [
            validate_sheet(spec)
            for spec in (*SPECS, *action_sheet_specs())
        ],
    }
    MANIFEST_PATH.write_text(
        f"{json.dumps(manifest, indent=2)}\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
