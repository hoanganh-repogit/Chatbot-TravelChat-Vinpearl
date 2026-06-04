#!/usr/bin/env python3
"""
Vinpearl hotel dataset scraper
==============================

Crawls public hotel pages on vinpearl.com and builds a LOCAL dataset of
text (descriptions, room/dining info) + images, organized per hotel.

Output it produces (a folder you can hand to your chatbot pipeline):

    dataset/
        hotels.json            <- master list of every hotel (full records)
        hotels.csv             <- flat summary, easy to eyeball in Excel
        hotels/
            <slug>.json        <- one full structured record per hotel
        images/
            <slug>/
                001_<name>.jpg
                002_<name>.jpg
                ...

WHY THIS IS SIMPLE: vinpearl.com is server-rendered (Drupal 9), so the text
and image URLs are already in the HTML. No browser automation needed.

Be polite: this targets ~20 hotels (~100 pages). Run it ONCE. The script
caches downloaded images and skips finished hotels, so re-runs are cheap and
don't hammer the site.

Usage:
    pip install requests beautifulsoup4 lxml
    python scrape_vinpearl.py
"""

import csv
import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Configuration  -- tweak these
# ---------------------------------------------------------------------------
BASE = "https://vinpearl.com"
LIST_URL = f"{BASE}/en/hotels"
OUT = Path("dataset")
DELAY = 2.0            # seconds to wait between requests. Be polite. Don't lower much.
TIMEOUT = 30
HEADERS = {
    # Identify yourself honestly. Put your real email so the site owner can reach you.
    "User-Agent": "VinpearlBookingBot/0.1 (educational project; contact: you@example.com)"
}

# Sub-pages on each hotel that carry useful content for a booking bot.
# Add/remove as you like (e.g. "/wedding", "/meeting-and-events").
SUBPAGES = ["", "/rooms", "/foods", "/offers", "/gallery"]

# Skip UI chrome (icons, arrows). We only want real content photos.
SKIP_IMAGE_PATTERNS = ("/icons/", "/img/icons/", "angle-small", "search-icon", "location-back")
KEEP_IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp")

# If automatic discovery misses hotels (e.g. some are loaded oddly), fill this
# in manually by browsing the site and copying the slug from each hotel's URL.
# Example: https://vinpearl.com/en/hotels/vinpearl-resort-nha-trang  ->  slug below
MANUAL_SLUGS = [
    # "vinpearl-resort-spa-phu-quoc",
    # "vinpearl-resort-nha-trang",
    # "vinpearl-luxury-nha-trang",
    # "vinpearl-resort-golf-nam-hoi-an",
]

session = requests.Session()
session.headers.update(HEADERS)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def get(url):
    """Fetch a URL politely, with one retry. Returns the Response or None."""
    for attempt in range(2):
        try:
            r = session.get(url, timeout=TIMEOUT)
            r.raise_for_status()
            time.sleep(DELAY)                 # pause AFTER every successful hit
            return r
        except requests.RequestException as e:
            print(f"    ! error fetching {url}: {e}")
            time.sleep(DELAY * 2)
    return None


def soup_of(url):
    r = get(url)
    return BeautifulSoup(r.text, "lxml") if r else None


def slugify(text):
    text = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[\s_-]+", "-", text)[:40]


def meta(soup, key):
    """Read a <meta property=...> or <meta name=...> content value."""
    tag = (soup.find("meta", attrs={"property": key})
           or soup.find("meta", attrs={"name": key}))
    return tag["content"].strip() if tag and tag.get("content") else None


# ---------------------------------------------------------------------------
# STAGE 1: discover the list of hotel URLs
# ---------------------------------------------------------------------------
def discover_hotels():
    """Pull hotel detail links off the /en/hotels listing page."""
    soup = soup_of(LIST_URL)
    urls = set()
    if soup:
        for a in soup.select("a[href]"):
            full = urljoin(BASE, a["href"])
            # A hotel detail page looks exactly like /en/hotels/<slug>
            m = re.match(r"^https://vinpearl\.com/en/hotels/([a-z0-9-]+)/?$", full)
            if m:
                urls.add(f"{BASE}/en/hotels/{m.group(1)}")
    # merge in any manual slugs
    urls |= {f"{BASE}/en/hotels/{s}" for s in MANUAL_SLUGS}
    return sorted(urls)


# ---------------------------------------------------------------------------
# STAGE 2: parse a single hotel (main page + sub-pages)
# ---------------------------------------------------------------------------
def collect_images(soup):
    """Return content image URLs found on a page (CDN-hosted photos only)."""
    found = set()
    og = meta(soup, "og:image")
    if og:
        found.add(og)
    for img in soup.select("img[src], img[data-src]"):
        src = img.get("src") or img.get("data-src")
        if not src:
            continue
        if "statics.vinpearl.com" in src and not any(p in src for p in SKIP_IMAGE_PATTERNS):
            found.add(src)
    return found


def visible_text(soup):
    """Strip nav/scripts and return the readable body text of a page."""
    main = soup.find("main") or soup.body
    if not main:
        return ""
    for bad in main.select("script, style, nav, header, footer, noscript"):
        bad.decompose()
    return re.sub(r"\n{3,}", "\n\n", main.get_text("\n", strip=True))


def parse_hotel(url):
    slug = url.rstrip("/").split("/")[-1]
    print(f"-> {slug}")
    record = {"slug": slug, "url": url, "images": [], "pages": {}}
    image_urls = set()

    for sub in SUBPAGES:
        soup = soup_of(url + sub)
        if not soup:
            continue
        key = sub.strip("/") or "main"

        if key == "main":
            # og: meta tags are the most reliable source on this site
            record["name"] = meta(soup, "og:title") or (
                soup.title.string.strip() if soup.title else slug)
            record["description"] = meta(soup, "og:description") or meta(soup, "description")
            # TODO (optional): add a real CSS selector for address/phone once you
            # inspect the page in your browser's DevTools. See README.
            record["address"] = None
            record["phone"] = None

        record["pages"][key] = visible_text(soup)
        image_urls |= collect_images(soup)

    record["images"] = sorted(image_urls)
    return record


# ---------------------------------------------------------------------------
# STAGE 3: download images into dataset/images/<slug>/
# ---------------------------------------------------------------------------
def download_images(record):
    folder = OUT / "images" / record["slug"]
    folder.mkdir(parents=True, exist_ok=True)
    saved = []
    for i, img_url in enumerate(record["images"], 1):
        path = urlparse(img_url).path
        ext = os.path.splitext(path)[1].lower()
        if ext not in KEEP_IMAGE_EXTS:
            continue
        fname = f"{i:03d}_{slugify(os.path.basename(path))}{ext}"
        dest = folder / fname
        if dest.exists():                      # resume-friendly: skip downloaded
            saved.append(str(dest))
            continue
        r = get(img_url)
        if r:
            dest.write_bytes(r.content)
            saved.append(str(dest))
    record["local_images"] = saved
    return record


# ---------------------------------------------------------------------------
# STAGE 4: orchestrate + store
# ---------------------------------------------------------------------------
def main():
    (OUT / "hotels").mkdir(parents=True, exist_ok=True)
    (OUT / "images").mkdir(parents=True, exist_ok=True)

    urls = discover_hotels()
    print(f"Discovered {len(urls)} hotels\n")
    if not urls:
        print("No hotels found automatically. Fill MANUAL_SLUGS at the top of "
              "this file by browsing vinpearl.com/en/hotels and copying slugs.")
        return

    all_records = []
    for url in urls:
        slug = url.rstrip("/").split("/")[-1]
        out_json = OUT / "hotels" / f"{slug}.json"
        if out_json.exists():                  # resume: skip finished hotels
            print(f"-> {slug} (already done, skipping)")
            all_records.append(json.loads(out_json.read_text(encoding="utf-8")))
            continue
        try:
            rec = download_images(parse_hotel(url))
            out_json.write_text(json.dumps(rec, ensure_ascii=False, indent=2),
                                encoding="utf-8")
            all_records.append(rec)
        except Exception as e:                 # one bad hotel won't kill the run
            print(f"    !! failed {url}: {e}")

    # master JSON
    (OUT / "hotels.json").write_text(
        json.dumps(all_records, ensure_ascii=False, indent=2), encoding="utf-8")

    # flat CSV summary for quick inspection
    with open(OUT / "hotels.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["slug", "name", "url", "n_images", "description"])
        for r in all_records:
            w.writerow([r["slug"], r.get("name"), r["url"],
                        len(r.get("local_images", [])), r.get("description")])

    total_imgs = sum(len(r.get("local_images", [])) for r in all_records)
    print(f"\nDone. {len(all_records)} hotels, {total_imgs} images -> ./{OUT}/")


if __name__ == "__main__":
    main()
