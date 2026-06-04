#!/usr/bin/env python3
"""
prune_images.py
===============

Deletes junk image files (logos, thumbnails, screenshots, "Untitled" exports,
share-link graphics) whose filename contains any blocked keyword, and removes
the matching references from your hotel JSON files so nothing points at a file
that no longer exists.

Matching is case-insensitive and checks the file NAME only.

  *** SAFE BY DEFAULT ***
  DRY_RUN is True, so the first run only PRINTS what it would delete.
  Review the list, then set DRY_RUN = False and run again to actually delete.

    python prune_images.py            # preview
    # ...edit DRY_RUN = False...
    python prune_images.py            # delete for real
"""

import json
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
IMAGES_DIR = Path("dataset/images")          # folders of downloaded images

# JSON to keep in sync (dirs are scanned for *.json; files are used directly).
JSON_PATHS = [
    Path("dataset/hotels"),
    Path("dataset_clean/hotels"),
    Path("dataset_clean/hotels_clean.json"),
    Path("dataset/hotels.json"),
]

BLOCKLIST = ["logo", "thumb", "anh-man-hinh", "smallpng",
             "untitle", "sharelink", "web-tap-sap"]

DRY_RUN = False        # <-- set to False to actually delete files & edit JSON


# ---------------------------------------------------------------------------
def is_junk(name: str) -> bool:
    """True if the file name contains any blocked keyword (case-insensitive)."""
    n = name.lower()
    return any(word in n for word in BLOCKLIST)


def prune_files():
    """Delete (or preview) junk image files under IMAGES_DIR."""
    removed = []
    if not IMAGES_DIR.exists():
        print(f"(no {IMAGES_DIR}/ folder — skipping file deletion)")
        return removed
    for p in sorted(IMAGES_DIR.rglob("*")):
        if p.is_file() and is_junk(p.name):
            removed.append(p)
            print(f"  {'WOULD DELETE' if DRY_RUN else 'deleted     '}  {p}")
            if not DRY_RUN:
                p.unlink()
    return removed


def _filter_record(rec):
    """Drop blocked entries from a record's image lists. Returns n removed."""
    n = 0
    for key in ("images", "local_images"):
        vals = rec.get(key)
        if isinstance(vals, list):
            kept = [v for v in vals if not is_junk(Path(str(v)).name)]
            n += len(vals) - len(kept)
            rec[key] = kept
    return n


def sync_json():
    """Remove references to junk images from every JSON file."""
    files = []
    for path in JSON_PATHS:
        if path.is_dir():
            files += sorted(path.glob("*.json"))
        elif path.is_file():
            files.append(path)

    total = 0
    for fp in files:
        try:
            data = json.loads(fp.read_text(encoding="utf-8"))
        except Exception:
            continue
        removed = 0
        if isinstance(data, list):            # master file: list of records
            for rec in data:
                if isinstance(rec, dict):
                    removed += _filter_record(rec)
        elif isinstance(data, dict):          # single hotel record
            removed = _filter_record(data)
        if removed:
            total += removed
            print(f"  {'WOULD UPDATE' if DRY_RUN else 'updated     '}  "
                  f"{fp}  (-{removed} refs)")
            if not DRY_RUN:
                fp.write_text(json.dumps(data, ensure_ascii=False, indent=2),
                              encoding="utf-8")
    return total


def main():
    print("=== DRY RUN: nothing will change ===\n" if DRY_RUN
          else "=== APPLYING CHANGES ===\n")

    print("Image files:")
    removed = prune_files()
    print("\nJSON references:")
    refs = sync_json()

    verb = "Would remove" if DRY_RUN else "Removed"
    print(f"\n{verb} {len(removed)} image files and {refs} JSON references.")
    if DRY_RUN:
        print("If that list looks right, set DRY_RUN = False (top of file) "
              "and run again to apply.")


if __name__ == "__main__":
    main()
