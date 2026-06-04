# Vinpearl Hotel Dataset Pipeline

Builds a clean, structured, size-optimized dataset (text + images) from the
public hotel pages on vinpearl.com, for use in a room-booking assistant chatbot.

The pipeline has **four steps**, run in order:

| Step | Script | What it does | Reads | Writes |
|------|--------|--------------|-------|--------|
| 1 | `scrape_vinpearl.py` | Crawl the site, download raw page text + images | vinpearl.com | `dataset/` |
| 2 | `clean_dataset.py`   | Turn raw page text into structured hierarchy | `dataset/hotels/` | `dataset_clean/` |
| 3 | `prune_images.py`    | Delete junk images (logos, thumbnails, etc.) | `dataset/` & `dataset_clean/` | edits in place |
| 4 | `optimize_images.py` | Shrink remaining images to WebP, no quality loss | `dataset/` & `dataset_clean/` | edits in place |

Steps 1–2 write to a **new** folder and never destroy the previous one. Steps
3–4 edit images in place but are **dry-run by default** — they only report what
they would do until you flip a switch.

---

## Setup (once)

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## Step 1 — Scrape

```bash
python scrape_vinpearl.py
```

vinpearl.com is server-rendered (Drupal), so plain `requests` + `BeautifulSoup`
is enough — no browser automation. Polite (2-second delay, honest User-Agent)
and **resume-friendly**: finished hotels and downloaded images are skipped.

Produces:

```
dataset/
  hotels.json          # all hotels, raw records
  hotels.csv           # summary
  hotels/<slug>.json   # one raw record per hotel (pages are big text blobs)
  images/<slug>/*       # downloaded photos
```

---

## Step 2 — Clean

```bash
python clean_dataset.py
```

Two ideas make it robust: **chrome removal** (lines appearing on nearly every
page of a hotel are nav/footer and get dropped) and **section parsing** (the
cleaned `main` page is split on labels like "Room types", "F&B Services", "Spa",
"Promotions"; the `rooms` page is mined for size, capacity, and price).

Produces:

```
dataset_clean/
  hotels_clean.json     # all hotels, cleaned
  hotels_clean.csv      # QA summary (rooms / dining / description per hotel)
  hotels/<slug>.json    # one clean record per hotel
```

### Cleaned record shape

```jsonc
{
  "slug", "name", "url", "location", "tagline", "description",
  "contact": { "address", "phone", "email" },
  "room_types": [
    { "name", "description", "size_m2", "capacity", "price_from_usd", "amenities": [] }
  ],
  "dining": [ "Sea Breeze Restaurant", "Pool Bar" ],
  "spa": "...",
  "experiences": [ { "name", "description" } ],
  "promotions": [ "..." ],
  "images": [ "https://statics.vinpearl.com/..." ],
  "local_images": [ "dataset/images/<slug>/..." ],
  "clean_text": { "main", "rooms", "foods", "offers" }   // boilerplate-stripped fallback for search/RAG
}
```

### QA after cleaning — important

Open `dataset_clean/hotels_clean.csv` and look for hotels with **0 rooms** or
**no description**. Those are properties whose page template differs from the
beach resorts (typically city hotels and the "Affiliated by Melia" ones) and
need a small parser tweak — usually a different section label. Known gaps:
several city hotels return 0 rooms, and `dining` currently only fills for
resorts that use the exact label "F&B Services".

---

## Step 3 — Prune junk images

```bash
python prune_images.py            # 1. PREVIEW (DRY_RUN = True) — changes nothing
# edit the file: set DRY_RUN = False
python prune_images.py            # 2. APPLY
```

Deletes image files whose name contains any blocked keyword and removes the
matching entries from every JSON file so nothing points at a deleted image.

- Blocked keywords are in `BLOCKLIST` at the top:
  `logo, thumb, anh-man-hinh, smallpng, untitle, sharelink, web-tap-sap`
- Matching is case-insensitive on the filename only.
- **Safe by default:** preview first; deletion is permanent.

---

## Step 4 — Optimize image size (no quality loss)

```bash
python optimize_images.py         # 1. PREVIEW — reports the savings
# edit the file: set DRY_RUN = False
python optimize_images.py         # 2. APPLY
```

Re-encodes images to **WebP** to make them smaller **without downscaling**:

- **PNG / GIF / BMP** (graphics, screenshots) -> **lossless WebP**: the result
  is pixel-for-pixel identical, just a smaller file.
- **JPEG / WebP** (photos) -> **WebP quality 90**: visually indistinguishable
  from the original; typically 25-60% smaller.

Resolution is never changed, a file is only replaced when the new one is
actually smaller, and `.jpg -> .webp` renames are reflected in the JSON
`local_images` paths automatically. Run this **after** Step 3 so you don't waste
time optimizing images you're about to delete. Tune `PHOTO_QUALITY` (default 90)
if you want; lower = smaller but eventually visible.

---

## Be a responsible crawler

1. Skim `https://vinpearl.com/robots.txt` and the Terms of Use before scraping.
2. Keep the 2-second delay in `scrape_vinpearl.py`. Run the crawl once.
3. Put your real email in the `User-Agent` at the top of `scrape_vinpearl.py`.
4. Images are Vinpearl's copyright — fine for an internal/educational project,
   but don't redistribute them as your own.

## Known data quirks (not bugs)

- `contact.email` is usually empty because vinpearl.com masks email addresses
  on the live page, so they were never in the scrape.
- A few rooms have `null` size or price when that detail only appears inside the
  room's description text; the value is still in the `description` string.

## Next step: dataset → chatbot

- **Text / RAG:** chunk each hotel's `description` + room/dining text, embed the
  chunks, store in a vector DB so the bot can retrieve relevant context.
- **Images:** reference them by the `local_images` paths in each record.
- **Booking:** reservations happen on booking.vinpearl.com — have the bot answer
  questions and recommend rooms, then hand off there rather than transact itself.
