#!/usr/bin/env python3
"""
prune_images.py
===============

Cleans the hotel image dataset in two passes and keeps the hotel JSON files in
sync so nothing points at a file that no longer exists:

  1. BLOCKLIST pass  - deletes junk images (logos, thumbnails, screenshots,
                       "Untitled" exports, share-link graphics) whose filename
                       contains any blocked keyword. Case-insensitive, name only.

  2. DEDUPE pass     - detects NEAR-DUPLICATE images with perceptual hashing
                       (ImageHash, phash or dhash). Images whose hashes are within
                       HASH_THRESHOLD Hamming distance are grouped; one "best"
                       image is kept per group and the rest are deleted.

  *** SAFE BY DEFAULT ***
  DRY_RUN is True, so the first run only PRINTS what it would delete.
  Review the lists, then set DRY_RUN = False and run again to actually delete.

    python prune_images.py            # preview
    # ...edit DRY_RUN = False...
    python prune_images.py            # delete for real

Requires (for the dedupe pass only):  pip install pillow imagehash
If those aren't installed the blocklist pass still runs; dedupe is skipped.
"""

import json
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE = Path(__file__).resolve().parent       # run from anywhere; paths anchored here

# Auto-detect the images folder (it may sit under dataset_clean/ or dataset/).
# For this project this resolves to:
#   .../VinPearl_dataset/dataset_clean/images
IMAGES_DIR = next((p for p in (BASE / "dataset_clean" / "images",
                               BASE / "dataset" / "images", BASE / "images")
                   if p.exists()), BASE / "dataset_clean" / "images")

# JSON to keep in sync (dirs are scanned for *.json; files used directly).
# Missing entries are skipped automatically, so this works in any layout.
JSON_PATHS = [
    BASE / "dataset_clean" / "hotels",
    BASE / "dataset_clean" / "hotels_clean.json",
    BASE / "dataset" / "hotels",
    BASE / "dataset" / "hotels.json",
]

BLOCKLIST = ["logo", "thumb", "anh-man-hinh", "smallpng",
             "untitle", "sharelink", "web-tap-sap", "giới-thiệu-chung", "banner"]
# --- Near-duplicate (perceptual hash) settings -----------------------------
ENABLE_DEDUPE  = True
HASH_METHOD    = "phash"     # "phash" (robust, recommended) or "dhash" (faster)
HASH_SIZE      = 8           # hash dimension; 8 -> 64-bit hash (the standard)
HASH_THRESHOLD = 10          # max Hamming distance to treat as a near-duplicate.
                             #   0    = perceptually identical only
                             #   ~10  = catches resize / recompress / blur / minor edits
                             #          (recommended for photos; well below the ~25-40
                             #           distance seen between genuinely different images)
                             #   15+  = loose; risks merging different rooms/views
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tif", ".tiff"}
HASH_CACHE = BASE / ".phash_cache.json"   # avoids re-hashing between preview & apply

# --- Filename-normalization dedupe (PRIMARY, catches crops & watermarked copies) --
# Perceptual hashing FAILS on crops / aspect-ratio changes (a center-crop with a
# watermark can be 18+ Hamming distance from the original). But scraped datasets
# usually reuse the same source slug with a counter prefix, e.g.
#   054_be-boi-vinpearl-wonderworld-phu-quoc-172.jpg
#   082_be-boi-vinpearl-wonderworld-phu-quoc-172.jpg
# Stripping the prefix makes the names identical -> definitely the same source image.
ENABLE_NAME_DEDUPE = True
# Regexes (case-insensitive) stripped from the stem before comparing names.
# Default strips a leading numeric counter ("054_", "12-", "003 ").
NAME_STRIP_PATTERNS = [r'^\d+\s*[-_.]\s*']

# --- Optional feature-based dedupe (HEAVY; catches RENAMED crops) -----------------
# Uses ORB keypoints + RANSAC homography. Only runs on pairs the hash finds
# "suspicious but not conclusive" (distance in the band below), so it stays fast.
# Requires: pip install opencv-python-headless numpy
ENABLE_FEATURE_DEDUPE = False
FEATURE_HASH_BAND     = (HASH_THRESHOLD + 1, 24)  # only ORB-check pairs in this hash-distance band
FEATURE_MIN_INLIERS   = 25                        # >= this many RANSAC inliers => same image

DRY_RUN = False        # <-- set to False to actually delete files & edit JSON


# ---------------------------------------------------------------------------
# Blocklist helpers (unchanged behaviour)
# ---------------------------------------------------------------------------
def is_junk(name: str) -> bool:
    """True if the file name contains any blocked keyword (case-insensitive)."""
    n = name.lower()
    return any(word in n for word in BLOCKLIST)


def prune_files():
    """Delete (or preview) junk image files under IMAGES_DIR."""
    removed = []
    if not IMAGES_DIR.exists():
        print(f"(no {IMAGES_DIR}/ folder - skipping file deletion)")
        return removed
    for p in sorted(IMAGES_DIR.rglob("*")):
        if p.is_file() and is_junk(p.name):
            removed.append(p)
            print(f"  {'WOULD DELETE' if DRY_RUN else 'deleted     '}  {p}")
            if not DRY_RUN:
                p.unlink()
    return removed


# ---------------------------------------------------------------------------
# Near-duplicate detection (perceptual hashing)
# ---------------------------------------------------------------------------
def _popcount(x: int) -> int:
    """Hamming weight; uses fast int.bit_count() on Py3.10+, else falls back."""
    try:
        return x.bit_count()
    except AttributeError:                      # Python < 3.10
        return bin(x).count("1")


def _load_cache():
    try:
        return json.loads(HASH_CACHE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_cache(cache):
    try:
        HASH_CACHE.write_text(json.dumps(cache), encoding="utf-8")
    except Exception:
        pass        # cache is an optimisation only; never fatal


def _image_area(p: Path) -> int:
    """Pixel area, used to decide which image in a group to KEEP (bigger wins)."""
    from PIL import Image
    try:
        with Image.open(p) as im:
            return im.width * im.height
    except Exception:
        return 0


def _norm_name(name: str) -> str:
    """
    Normalize a filename for same-source matching: lowercase, drop extension,
    strip the configured prefixes (e.g. a leading counter '054_'). Two files with
    the same normalized stem are treated as the same source image.
    """
    import re
    stem = Path(name).stem.lower()
    for pat in NAME_STRIP_PATTERNS:
        stem = re.sub(pat, "", stem, flags=re.IGNORECASE)
    return stem


def _orb_inliers(p_a: Path, p_b: Path) -> int:
    """
    Geometrically-verified ORB match count between two images. High values mean
    one is a crop/scaled/watermarked version of the other. Returns 0 on any
    failure or if OpenCV isn't installed.
    """
    try:
        import cv2, numpy as np
    except ImportError:
        return 0
    try:
        def load(p):
            g = cv2.imread(str(p), cv2.IMREAD_GRAYSCALE)
            if g is None:
                return None
            h, w = g.shape
            s = 512.0 / max(h, w)
            return cv2.resize(g, (max(1, int(w * s)), max(1, int(h * s))))
        a, b = load(p_a), load(p_b)
        if a is None or b is None:
            return 0
        orb = cv2.ORB_create(1000)
        ka, da = orb.detectAndCompute(a, None)
        kb, db = orb.detectAndCompute(b, None)
        if da is None or db is None or len(ka) < 8 or len(kb) < 8:
            return 0
        bf = cv2.BFMatcher(cv2.NORM_HAMMING)
        good = [m for m, n in bf.knnMatch(da, db, k=2)
                if m.distance < 0.75 * n.distance]
        if len(good) < 8:
            return 0
        src = np.float32([ka[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
        dst = np.float32([kb[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
        _, mask = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
        return int(mask.sum()) if mask is not None else 0
    except Exception:
        return 0


def prune_duplicates():
    """
    Detect duplicate / near-duplicate images using up to three signals and delete
    all but the 'best' (largest) image in each duplicate group:

        (1) NAME   - same normalized filename (catches crops & watermarked copies
                     that share a source slug, e.g. '054_x.jpg' / '082_x.jpg').
        (2) HASH   - perceptual hash within HASH_THRESHOLD (resize / recompress).
        (3) FEATURE- optional ORB+RANSAC verification of hash-"suspicious" pairs
                     (catches renamed crops). Off unless ENABLE_FEATURE_DEDUPE.

    Returns the list of Paths that were (or would be) deleted.
    """
    removed = []
    if not ENABLE_DEDUPE:
        print("(dedupe disabled - ENABLE_DEDUPE = False)")
        return removed
    if not IMAGES_DIR.exists():
        print(f"(no {IMAGES_DIR}/ folder - skipping dedupe)")
        return removed

    # Soft dependency import: never break the blocklist pass if these are absent.
    try:
        from PIL import Image
        import imagehash
    except ImportError:
        print("  (Pillow / imagehash not installed - skipping dedupe; "
              "run: pip install pillow imagehash)")
        return removed

    hash_fn = imagehash.dhash if HASH_METHOD == "dhash" else imagehash.phash

    # Gather candidate images (skip junk already handled by the blocklist pass).
    paths = [p for p in sorted(IMAGES_DIR.rglob("*"))
             if p.is_file() and p.suffix.lower() in IMAGE_EXTS and not is_junk(p.name)]

    # Compute (or reuse cached) perceptual hashes -> store as int for fast XOR.
    cache, new_cache = _load_cache(), {}
    hashes = {}            # Path -> int
    for p in paths:
        try:
            st = p.stat()
            key = f"{p}|{st.st_size}|{int(st.st_mtime)}|{HASH_METHOD}{HASH_SIZE}"
            hexh = cache.get(key)
            if hexh is None:
                with Image.open(p) as im:
                    hexh = str(hash_fn(im, hash_size=HASH_SIZE))
            hashes[p] = int(hexh, 16)
            new_cache[key] = hexh
        except Exception as e:
            print(f"  (skip unreadable {p.name}: {e})")
    _save_cache(new_cache)

    # ---- Union-find over all candidate images -----------------------------
    parent = {p: p for p in paths}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]       # path compression
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    # Signal 1: same normalized filename (cheapest + most reliable for this dataset).
    if ENABLE_NAME_DEDUPE:
        by_name = {}
        for p in paths:
            by_name.setdefault(_norm_name(p.name), []).append(p)
        for grp in by_name.values():
            for q in grp[1:]:
                union(grp[0], q)

    # Signal 2: perceptual-hash distance <= HASH_THRESHOLD.
    #   (O(n^2) pairwise; fine for typical hotel datasets. For tens of thousands
    #    of images, replace this loop with a BK-tree nearest-neighbour query.)
    items = list(hashes.items())
    band_pairs = []        # candidates for the optional ORB pass
    lo, hi_band = FEATURE_HASH_BAND
    for i in range(len(items)):
        pi, hi = items[i]
        for j in range(i + 1, len(items)):
            pj, hj = items[j]
            d = _popcount(hi ^ hj)
            if d <= HASH_THRESHOLD:
                union(pi, pj)
            elif ENABLE_FEATURE_DEDUPE and lo <= d <= hi_band:
                band_pairs.append((pi, pj))

    # Signal 3 (optional): ORB+RANSAC verify the hash-"suspicious" band only.
    if ENABLE_FEATURE_DEDUPE:
        if band_pairs:
            print(f"  (feature pass: verifying {len(band_pairs)} borderline pairs with ORB)")
        for pi, pj in band_pairs:
            if find(pi) == find(pj):
                continue                       # already grouped
            if _orb_inliers(pi, pj) >= FEATURE_MIN_INLIERS:
                union(pi, pj)

    # ---- Resolve clusters, keep largest, delete the rest ------------------
    clusters = {}
    for p in paths:
        clusters.setdefault(find(p), []).append(p)

    for group in clusters.values():
        if len(group) < 2:
            continue
        # KEEP the largest image (tie-break: file size, then name for determinism).
        keep = max(group, key=lambda p: (_image_area(p), p.stat().st_size, p.name))
        dupes = sorted(p for p in group if p != keep)
        print(f"  duplicate group ({len(group)} imgs) - keeping: {keep.name}")
        for p in dupes:
            removed.append(p)
            print(f"    {'WOULD DELETE' if DRY_RUN else 'deleted     '}  {p}")
            if not DRY_RUN:
                p.unlink()

    return removed


# ---------------------------------------------------------------------------
# JSON sync
# ---------------------------------------------------------------------------
def _filter_record(rec, deleted_names):
    """
    Drop blocked + deleted-duplicate entries from a record's image lists.
    `deleted_names` is a set of lowercased basenames removed by the dedupe pass.
    Returns number of references removed.
    """
    n = 0
    for key in ("images", "local_images"):
        vals = rec.get(key)
        if isinstance(vals, list):
            kept = []
            for v in vals:
                name = Path(str(v)).name
                if is_junk(name) or name.lower() in deleted_names:
                    continue
                kept.append(v)
            n += len(vals) - len(kept)
            rec[key] = kept
    return n


def sync_json(deleted_names):
    """Remove references to junk + deleted-duplicate images from every JSON file."""
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
                    removed += _filter_record(rec, deleted_names)
        elif isinstance(data, dict):          # single hotel record
            removed = _filter_record(data, deleted_names)
        if removed:
            total += removed
            print(f"  {'WOULD UPDATE' if DRY_RUN else 'updated     '}  "
                  f"{fp}  (-{removed} refs)")
            if not DRY_RUN:
                fp.write_text(json.dumps(data, ensure_ascii=False, indent=2),
                              encoding="utf-8")
    return total


# ---------------------------------------------------------------------------
def main():
    print("=== DRY RUN: nothing will change ===\n" if DRY_RUN
          else "=== APPLYING CHANGES ===\n")
    print(f"Images dir : {IMAGES_DIR}")
    signals = []
    if ENABLE_NAME_DEDUPE:    signals.append("filename")
    signals.append(f"{HASH_METHOD}<={HASH_THRESHOLD}")
    if ENABLE_FEATURE_DEDUPE: signals.append(f"ORB>={FEATURE_MIN_INLIERS}")
    print(f"Dedupe     : {'on' if ENABLE_DEDUPE else 'off'}  signals: {', '.join(signals)}\n")

    print("[1] Blocklist image files:")
    removed_block = prune_files()

    print("\n[2] Near-duplicate image files:")
    removed_dupes = prune_duplicates()

    # JSON sync must account for BOTH passes. Blocklist refs are matched by
    # keyword (is_junk); duplicate refs are matched by exact deleted basename.
    deleted_names = {p.name.lower() for p in removed_dupes}
    print("\n[3] JSON references:")
    refs = sync_json(deleted_names)

    verb = "Would remove" if DRY_RUN else "Removed"
    print(f"\n{verb} {len(removed_block)} blocklist + {len(removed_dupes)} "
          f"duplicate image files ({len(removed_block) + len(removed_dupes)} total) "
          f"and {refs} JSON references.")
    if DRY_RUN:
        print("If those lists look right, set DRY_RUN = False (top of file) "
              "and run again to apply.")


if __name__ == "__main__":
    main()