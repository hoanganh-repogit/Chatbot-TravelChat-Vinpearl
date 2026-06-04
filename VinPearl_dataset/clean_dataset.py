#!/usr/bin/env python3
"""
Vinpearl dataset cleaner
========================

Turns the RAW scraped hotel JSON files (where `pages.main/rooms/foods/offers`
are big text strings full of website navigation) into CLEAN, hierarchical
records ready for a chatbot.

INPUT  : dataset/hotels/<slug>.json        (output of scrape_vinpearl.py)
OUTPUT : dataset_clean/hotels/<slug>.json  (one clean record per hotel)
         dataset_clean/hotels_clean.json   (master array of all hotels)
         dataset_clean/hotels_clean.csv    (flat summary to eyeball)

How it works (the two ideas that make this robust):
  1. CHROME REMOVAL: the nav menu + footer are identical on every page, so any
     line that shows up on (almost) all of a hotel's pages is site chrome and
     gets dropped. Real content lines are page-specific and survive.
  2. SECTION PARSING: the cleaned `main` page has labelled sections
     ("Room types", "F&B Services", "Spa", "Discovery", "Promotions"). We split
     on those labels to build the hierarchy. The `rooms` page is mined for
     per-room size / capacity / price.

Everything is defensive: a missing section just yields an empty list / null,
never a crash. Run it, then check hotels_clean.csv for any hotel with 0 rooms
or no description -- those are the ones whose template differs and may need a
tweak.

    python clean_dataset.py
"""

import csv
import json
import re
from collections import Counter
from pathlib import Path

IN_DIR = Path("dataset/hotels")
OUT_DIR = Path("dataset_clean")

# Residual UI button labels to drop after chrome removal.
UI_NOISE = {
    "View all", "View details", "View more", "Book now", "Search",
    "Get directions", "Price only from", "Standard rate", "/night",
    "Download My Vinpearl app", "OK", "Read more",
}

# Section headers on the main page, in the order they appear.
SECTIONS = ["Room types", "F&B Services", "Spa", "Discovery", "Promotions",
            "Photo gallery"]


# ---------------------------------------------------------------------------
# Chrome removal
# ---------------------------------------------------------------------------
def detect_chrome(pages):
    """Lines appearing on (almost) every page of THIS hotel = nav/footer chrome."""
    counter = Counter()
    for txt in pages.values():
        for ln in {l.strip() for l in txt.split("\n") if l.strip()}:
            counter[ln] += 1
    n = len(pages)
    threshold = max(2, n - 1)          # on >= n-1 pages -> chrome
    return {ln for ln, c in counter.items() if c >= threshold}


def clean_lines(txt, chrome, keep_utilities=False):
    out = []
    for raw in txt.split("\n"):
        s = raw.strip()
        if not s or s in chrome or s in UI_NOISE:
            continue
        if s == "Utilities" and not keep_utilities:
            continue
        out.append(s)
    return out


# ---------------------------------------------------------------------------
# Small parsing helpers
# ---------------------------------------------------------------------------
def index_of(label, lines, start=0):
    for i in range(start, len(lines)):
        if lines[i].lower() == label.lower():
            return i
    return -1


def section_lines(lines, start_label, all_labels):
    """Return the lines between `start_label` and the next section header."""
    s = index_of(start_label, lines)
    if s < 0:
        return []
    end = len(lines)
    for lbl in all_labels:
        if lbl == start_label:
            continue
        e = index_of(lbl, lines, s + 1)
        if e > 0:
            end = min(end, e)
    return lines[s + 1:end]


def pairs_to_items(block, min_desc_len=60):
    """Turn [name, description, name, description, ...] into dicts.

    A line longer than min_desc_len is treated as a description belonging to the
    preceding (shorter) name line.
    """
    items, i = [], 0
    while i < len(block):
        name = block[i]
        desc = block[i + 1] if i + 1 < len(block) else ""
        if len(desc) >= min_desc_len:
            items.append({"name": name, "description": desc})
            i += 2
        else:
            # name with no long description following (e.g. a dining outlet)
            if len(name) < 80:
                items.append({"name": name, "description": None})
            i += 1
    return items


# ---------------------------------------------------------------------------
# Rooms-page enrichment
# ---------------------------------------------------------------------------
def enrich_rooms(rooms, rooms_txt, chrome):
    """Attach size / capacity / price / amenities to each room from /rooms text."""
    if not rooms_txt:
        return rooms
    lines = clean_lines(rooms_txt, chrome, keep_utilities=True)
    names = [r["name"] for r in rooms]
    name_pos = {}
    for i, ln in enumerate(lines):
        if ln in names and ln not in name_pos:
            name_pos[ln] = i

    for r in rooms:
        pos = name_pos.get(r["name"])
        if pos is None:
            continue
        # block = from this room name to the next known room name
        later = [p for n, p in name_pos.items() if p > pos]
        end = min(later) if later else len(lines)
        block = lines[pos:end]
        text = "\n".join(block)

        m_size = re.search(r"(\d{2,4})\s*m[²2]", text)
        m_cap = re.search(r"(\d+)\s*Guests?", text)
        prices = [float(x) for x in re.findall(r"~\s*([\d.]+)\s*USD", text)]

        # amenities: lines after "Utilities" until a price/number/widget token
        amen = []
        stop = re.compile(r"USD|Guests?|\bm[²2]\b|^\d+$|rate|Load More|Reserve|"
                          r"Going to|Leaving from|^Room\b|\t")
        if "Utilities" in block:
            for ln in block[block.index("Utilities") + 1:]:
                if stop.search(ln):
                    break
                if 1 < len(ln) < 45 and "\t" not in ln:
                    amen.append(ln)

        r["size_m2"] = int(m_size.group(1)) if m_size else None
        r["capacity"] = int(m_cap.group(1)) if m_cap else None
        r["price_from_usd"] = min(prices) if prices else None
        r["amenities"] = amen or None
    return rooms


# ---------------------------------------------------------------------------
# Contact (read from RAW text -- it lives in the footer, which chrome removal drops)
# ---------------------------------------------------------------------------
def extract_contact(raw_main):
    lines = raw_main.split("\n")
    phone = re.search(r"Tel:\s*([+\d().\s-]{7,})", raw_main)
    email = re.search(r"Email:\s*\n?\s*([^\s@]+@[^\s]+)", raw_main)
    address = None
    for i, l in enumerate(lines):
        if l.strip() == "Email:" and i > 0 and "Vietnam" in lines[i - 1]:
            address = lines[i - 1].strip()
            break
    return {
        "address": address,
        "phone": phone.group(1).strip() if phone else None,
        "email": email.group(1).strip() if email else None,  # often masked on site
    }


# ---------------------------------------------------------------------------
# Clean one hotel
# ---------------------------------------------------------------------------
def clean_hotel(raw):
    pages = raw.get("pages", {})
    chrome = detect_chrome(pages) if pages else set()

    rec = {
        "slug": raw.get("slug"),
        "name": raw.get("name"),
        "url": raw.get("url"),
        "location": None,
        "tagline": None,
        "description": raw.get("description"),
        "contact": {"address": raw.get("address"), "phone": raw.get("phone"),
                    "email": None},
        "room_types": [],
        "dining": [],
        "spa": None,
        "experiences": [],
        "promotions": [],
        "images": raw.get("images", []),
        "local_images": raw.get("local_images", []),
        "clean_text": {},
    }

    main_raw = pages.get("main", "")
    if main_raw:
        main = clean_lines(main_raw, chrome)
        rec["clean_text"]["main"] = "\n".join(main)
        rec["contact"] = extract_contact(main_raw)

        # location = first content line (e.g. "Khanh Hoa, Viet Nam")
        if main:
            rec["location"] = main[0]

        # tagline + description = the long paragraph before "Room types"
        rt = index_of("Room types", main)
        scan_to = rt if rt > 0 else len(main)
        for i in range(scan_to):
            if len(main[i]) > 120:
                rec["description"] = main[i]
                if i > 0:
                    rec["tagline"] = main[i - 1]
                break

        # sections
        rec["room_types"] = pairs_to_items(
            section_lines(main, "Room types", SECTIONS))
        dining_block = section_lines(main, "F&B Services", SECTIONS)
        rec["dining"] = [d for d in dining_block
                         if d != "F&B Services" and len(d) < 80]
        spa_block = section_lines(main, "Spa", SECTIONS)
        rec["spa"] = " ".join(spa_block) if spa_block else None
        rec["experiences"] = pairs_to_items(
            section_lines(main, "Discovery", SECTIONS))
        promo_block = section_lines(main, "Promotions", SECTIONS)
        rec["promotions"] = [p for p in promo_block if len(p) > 10]

    # keep cleaned versions of the other pages too (good fallback for search/RAG)
    for key in ("rooms", "foods", "offers"):
        if pages.get(key):
            rec["clean_text"][key] = "\n".join(clean_lines(pages[key], chrome))

    rec["room_types"] = enrich_rooms(rec["room_types"], pages.get("rooms", ""), chrome)
    return rec


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    (OUT_DIR / "hotels").mkdir(parents=True, exist_ok=True)
    files = sorted(IN_DIR.glob("*.json"))
    if not files:
        print(f"No JSON files in {IN_DIR}/. Point IN_DIR at your scraped hotels.")
        return

    cleaned = []
    for fp in files:
        raw = json.loads(fp.read_text(encoding="utf-8"))
        rec = clean_hotel(raw)
        (OUT_DIR / "hotels" / fp.name).write_text(
            json.dumps(rec, ensure_ascii=False, indent=2), encoding="utf-8")
        cleaned.append(rec)
        print(f"  {rec['slug']:35} rooms={len(rec['room_types']):2} "
              f"dining={len(rec['dining'])} "
              f"desc={'Y' if rec['description'] else 'N'}")

    (OUT_DIR / "hotels_clean.json").write_text(
        json.dumps(cleaned, ensure_ascii=False, indent=2), encoding="utf-8")

    with open(OUT_DIR / "hotels_clean.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["slug", "name", "location", "phone", "n_rooms",
                    "n_dining", "n_images", "has_description"])
        for r in cleaned:
            w.writerow([r["slug"], r["name"], r["location"],
                        r["contact"]["phone"], len(r["room_types"]),
                        len(r["dining"]), len(r["local_images"]),
                        bool(r["description"])])

    print(f"\nDone. {len(cleaned)} hotels -> {OUT_DIR}/")


if __name__ == "__main__":
    main()
