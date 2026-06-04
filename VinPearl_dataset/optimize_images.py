#!/usr/bin/env python3
"""
optimize_images.py
==================

Shrinks the image dataset WITHOUT reducing visible quality, by re-encoding to
WebP:
  * PNG / GIF / BMP (graphics, logos-leftovers, screenshots) -> LOSSLESS WebP
    => pixel-for-pixel identical, just a smaller file.
  * JPEG / WebP (photos) -> WebP at quality 90 (method 6)
    => visually indistinguishable from the original, typically 25-60% smaller.

Resolution is never changed, so nothing is downscaled.

A file is only replaced when the new WebP is actually SMALLER; otherwise the
original is kept untouched. When a file is converted (e.g. .jpg -> .webp), the
`local_images` paths in your JSON files are updated to match.

  *** SAFE BY DEFAULT ***
  DRY_RUN is True -> first run only REPORTS the savings, changes nothing.
  Set DRY_RUN = False and run again to apply.

    pip install pillow
    python optimize_images.py        # preview savings
    # ...set DRY_RUN = False...
    python optimize_images.py        # apply

Run this AFTER prune_images.py (no point optimizing junk you're deleting).
"""

import io
import json
from pathlib import Path

from PIL import Image

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE = Path(__file__).resolve().parent       # run from anywhere; paths anchored here

# Auto-detect the images folder (it may sit under dataset_clean/ or dataset/).
IMAGES_DIR = next((p for p in (BASE / "dataset_clean" / "images",
                               BASE / "dataset" / "images", BASE / "images")
                   if p.exists()), BASE / "dataset_clean" / "images")

# Missing entries are skipped automatically, so this works in any layout.
JSON_PATHS = [
    BASE / "dataset_clean" / "hotels",
    BASE / "dataset_clean" / "hotels_clean.json",
    BASE / "dataset" / "hotels",
    BASE / "dataset" / "hotels.json",
]

PHOTO_QUALITY = 90          # WebP quality for photos (90 = visually lossless)
GRAPHIC_EXTS = {".png", ".gif", ".bmp"}     # -> lossless WebP
PHOTO_EXTS = {".jpg", ".jpeg", ".webp"}     # -> quality WebP

DRY_RUN = True              # <-- set to False to actually rewrite files


# ---------------------------------------------------------------------------
def human(n):
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}TB"


def encode_webp(path):
    """Return (webp_bytes, was_lossless) for an image, or None if unreadable."""
    ext = path.suffix.lower()
    try:
        im = Image.open(path)
        # skip animated images (keep them as-is)
        if getattr(im, "n_frames", 1) > 1:
            return None
        im.load()
    except Exception:
        return None

    lossless = ext in GRAPHIC_EXTS
    buf = io.BytesIO()
    if lossless:
        if im.mode in ("P", "LA"):
            im = im.convert("RGBA")
        im.save(buf, "WEBP", lossless=True, method=6)
    else:
        if im.mode in ("P", "RGBA", "LA"):
            im = im.convert("RGB")
        im.save(buf, "WEBP", quality=PHOTO_QUALITY, method=6)
    return buf.getvalue(), lossless


def optimize():
    """Re-encode images; return {old_relpath: new_relpath} for converted files."""
    renames = {}
    saved_before = saved_after = 0
    n_done = 0

    if not IMAGES_DIR.exists():
        print(f"(no {IMAGES_DIR}/ folder found)")
        return renames

    for path in sorted(IMAGES_DIR.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in GRAPHIC_EXTS | PHOTO_EXTS:
            continue
        result = encode_webp(path)
        if result is None:
            continue
        data, lossless = result
        old_size = path.stat().st_size
        new_size = len(data)
        if new_size >= old_size:          # never make a file bigger
            continue

        new_path = path.with_suffix(".webp")
        saved_before += old_size
        saved_after += new_size
        n_done += 1
        tag = "lossless" if lossless else f"q{PHOTO_QUALITY}"
        print(f"  {human(old_size):>8} -> {human(new_size):>8}  ({tag:8}) {path.name}")

        if not DRY_RUN:
            data_path = new_path
            data_path.write_bytes(data)
            if path != new_path:          # extension changed: remove the old file
                path.unlink()
        if path != new_path:
            renames[path.as_posix()] = new_path.as_posix()

    pct = (1 - saved_after / saved_before) * 100 if saved_before else 0
    verb = "Would shrink" if DRY_RUN else "Shrank"
    print(f"\n{verb} {n_done} images: {human(saved_before)} -> "
          f"{human(saved_after)}  ({pct:.0f}% smaller)")
    return renames


def sync_json(renames):
    """Update local_images paths for any file whose extension changed."""
    if not renames:
        return
    files = []
    for p in JSON_PATHS:
        files += sorted(p.glob("*.json")) if p.is_dir() else ([p] if p.is_file() else [])

    def fix(rec):
        n = 0
        vals = rec.get("local_images")
        if isinstance(vals, list):
            for i, v in enumerate(vals):
                key = Path(str(v)).as_posix()
                if key in renames:
                    vals[i] = renames[key]
                    n += 1
        return n

    for fp in files:
        try:
            data = json.loads(fp.read_text(encoding="utf-8"))
        except Exception:
            continue
        changed = (sum(fix(r) for r in data if isinstance(r, dict))
                   if isinstance(data, list)
                   else fix(data) if isinstance(data, dict) else 0)
        if changed:
            print(f"  {'WOULD UPDATE' if DRY_RUN else 'updated'}  {fp}  ({changed} paths)")
            if not DRY_RUN:
                fp.write_text(json.dumps(data, ensure_ascii=False, indent=2),
                              encoding="utf-8")


def main():
    print("=== DRY RUN: nothing will change ===\n" if DRY_RUN
          else "=== APPLYING CHANGES ===\n")
    renames = optimize()
    if renames:
        print("\nJSON path updates:")
        sync_json(renames)
    if DRY_RUN:
        print("\nLooks good? Set DRY_RUN = False (top of file) and run again to apply.")


if __name__ == "__main__":
    main()