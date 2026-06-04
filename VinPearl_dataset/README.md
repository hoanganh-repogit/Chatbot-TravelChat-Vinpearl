
/
Claude finished the response
You are an richly experienced years Data Engineer, I am design a chatbot that assist to book room in advanced for VInPearl. My team and I observe that VInpearl has only about 20 hotels and resorts, so we want to crawl data from the VinPearl website including images and description. However, I never crawl data for an ai project so I want you instruct me steps by steps so that I can have a file or folder dataset finally

9:41 AM

Deliberated web scraping methodology and site-specific implementation strategy
Deliberated web scraping methodology and site-specific implementation strategy
I'll give you a complete step-by-step path. First, let me check Vinpearl's actual site so my advice is concrete rather than generic — the right scraping tools depend heavily on how the site is built.


Analyzing Drupal architecture for optimal scraping methodology
Analyzing Drupal architecture for optimal scraping methodology
Let me look at one hotel page to understand how the content and images are structured.


Architected ethical scraper project with robust code templates
Architected ethical scraper project with robust code templates
This is a great first scraping project to learn on, and Vinpearl's site is unusually friendly for it. I checked the live site: it runs on Drupal 9 and serves plain server-rendered HTML (not a JavaScript app), so you don't need heavy tools like Selenium — simple requests + BeautifulSoup is enough. The descriptions sit in reliable og: meta tags, and all real photos are hosted on statics.vinpearl.com. URLs follow a clean pattern: vinpearl.com/en/hotels/<slug> with sub-pages like /rooms, /foods, /gallery.

Let me give you the full picture, then hand you a ready-to-run project.

The mental model (what "crawling" actually is)
Four stages, every time: discover the list of pages → fetch each page's HTML → parse the fields you want out of the HTML → store them as structured files + downloaded images. Everything else is just being careful and polite.

Step 0 — Be a responsible crawler (do this first)
Before any code, open https://vinpearl.com/robots.txt in your browser and skim it, and glance at their Terms of Use. For your case the risk is low — there are only ~20 hotels, so it's ~100 page requests total, run once. The rules that keep you safe: add a delay between requests (1–2 seconds), send an honest User-Agent with your contact, cache results so you never re-hit the site while debugging, and remember the images are Vinpearl's copyright — fine for an internal/educational project, but don't redistribute them as your own.

Step 1 — Design your dataset schema before scraping
Decide what your chatbot needs to answer questions, then scrape to fill it. A good schema for a booking assistant:

json
{
  "slug": "vinpearl-resort-spa-phu-quoc",
  "name": "Vinpearl Resort & Spa Phu Quoc",
  "url": "...",
  "description": "Welcoming guests with its bright red tiles...",
  "address": "...",
  "phone": "...",
  "pages": { "main": "...", "rooms": "...", "foods": "..." },
  "images": ["https://statics.vinpearl.com/..."],
  "local_images": ["dataset/images/<slug>/001_....jpg"]
}
Step 2 — Set up your environment
bash
mkdir vinpearl-scraper && cd vinpearl-scraper
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install requests beautifulsoup4 lxml
Steps 3–6 — Discover, parse, download, store
Rather than have you write this from scratch, I've built you a complete, commented scraper that does all four stages. Let me create the project files.


Validated scraper syntax and tested parsing logic offline
Validated scraper syntax and tested parsing logic offline
Let me quickly verify the script is syntactically sound and the parsing logic works on a sample (I can't hit the live site from here, but I can test the parser offline).


Validated parser functionality and prepared implementation instructions
Validated parser functionality and prepared implementation instructions
The parser works correctly — notice it pulled the hero, room, and pool photos while skipping the UI icon, and caught the lazy-loaded data-src image too.


Presented 3 files
Presented 3 files
How to run it
Download the three files into one folder, then:

bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python scrape_vinpearl.py
In a few minutes you'll have a dataset/ folder: a master hotels.json, a hotels.csv you can open in Excel to sanity-check, one JSON per hotel, and an images/<slug>/ folder of photos for each property. That folder is your dataset.

What's solid vs. what you'll refine
The script reliably gets each hotel's name, description, full page text (main, rooms, dining, offers, gallery), and photos — I verified that logic above. Two things are deliberately left for you to tune after your first run, because they need you to look at the live HTML in your browser: structured address/phone, and breaking the rooms page into a clean list of room types. The README walks you through using Chrome DevTools ("Inspect") to find the right CSS selector and drop it in. This is the single most useful scraping skill to learn, so it's worth doing once by hand.

One thing to keep in mind for the chatbot stage
The dataset you build here is the knowledge layer. Actual reservations happen on booking.vinpearl.com, which is a separate dynamic system — so the realistic design is a bot that answers questions and recommends rooms from your scraped data, then hands the user off to the booking site to transact, rather than trying to complete payments itself.

If you'd like, I can show you the next stage — chunking and embedding this dataset/ into a vector store so the chatbot can actually retrieve from it. Want me to walk through whether discovery picks up all ~20 hotels, or move on to the RAG setup?


Scrape vinpearl
PY 

Readme
Document · MD 

Requirements
TXT 
THe terminal display like that after I run the python scrape_vinpearl.py: "notice] To update, run: pip install --upgrade pip
    ! error fetching https://vinpearl.com/en/hotels: 403 Client Error: Forbidden for url: https://vinpearl.com/en/hotels
Discovered 16 hotels
-> hon-tam-resort
    ! error fetching https://vinpearl.com/en/hotels/hon-tam-resort/gallery: 404 Client Error: Not Found for url: https://vinpearl.com/en/hotels/hon-tam-resort/gallery
    ! error fetching https://vinpearl.com/en/hotels/hon-tam-resort/gallery: 404 Client Error: Not Found for url: https://vinpearl.com/en/hotels/hon-tam-resort/gallery
-> vinholidays-fiesta-phu-quoc"  is it fail when crawling? What can I do to help you?

Show more
10:01 AM

Diagnosed transient errors and devised robustness improvements
Diagnosed transient errors and devised robustness improvements
Good news: it's not failing — it's working correctly and already crawling. The lines you're seeing are non-fatal. Let me explain both, because understanding them is useful:

The 403 on /en/hotels — that's the listing page briefly refusing the request (light bot protection or a transient hiccup). But notice what happened right after: Discovered 16 hotels. The script has a built-in retry, the second attempt got through, and discovery succeeded. So that error was self-healed.

The 404 on /gallery — this just means hon-tam-resort doesn't have a separate gallery page. Not every hotel uses every sub-page. The script catches it and moves on (you can see it continued to vinholidays-fiesta-phu-quoc). It prints twice only because the retry tries again — pointless for a 404, which is the one thing worth polishing.

So: let it finish running. When it's done you'll have a dataset/ folder. Nothing is broken.

That said, two small improvements remove the noise and make the 403 less likely. Let me apply them.


Synthesized error diagnosis and prepared concise closing guidance
Synthesized error diagnosis and prepared concise closing guidance
I made two changes: the get() function now treats a 404 as a quiet skip (no pointless retry, no alarming message), and I added the standard Accept / Accept-Language headers that browsers always send, which makes that occasional 403 less likely.

You don't need to stop your current run — it's working and is resume-friendly, so finished hotels and already-downloaded images are skipped. You can either let it complete, or stop it (Ctrl+C), replace the file with this updated version, and re-run; it'll pick up where it left off.

To answer "what can I do to help" — nothing's needed right now, but once it finishes, the most useful thing you can paste back is the final summary line (something like Done. N hotels, M images) plus a peek at dataset/hotels.csv. That lets me check two things: whether all ~20 hotels were captured (you got 16 discovered, so a few may be missing and need adding to MANUAL_SLUGS), and whether any hotel came back with 0 images, which would signal a page that's structured differently.

One honest note on the 403: it recovered on retry here, so you're fine. But if you ever hit a wall where it blocks every attempt, that's the site signaling it doesn't want automated access — the right move then is to back off rather than escalate evasion tactics.


Scrape vinpearl
PY 

hon-tam-resort.json
json

I completely crawled the hotel & resort dataset from VInPearl. Now I want you to  clean data because I see page/mains, page/rooms, page/foods, and page/offers fields are still not be organised hierarchically and these fields are just text strings.

11:01 AM

Examined sample file to devise comprehensive cleaning script for entire dataset
Examined sample file to devise comprehensive cleaning script for entire dataset
Let me look at the actual data you crawled so I can see how the text is structured before designing the cleanup.


Identified boilerplate patterns and devised content extraction strategy
Identified boilerplate patterns and devised content extraction strategy
The data isn't broken — but I can see exactly what's wrong. Every pages field has a huge slab of identical website navigation (language switcher, the full hotel dropdown menu, footer legal text) wrapped around the small bit of real content. The scraper's text cleanup didn't catch it because Vinpearl doesn't use proper <nav>/<footer> tags. Let me find where the real content actually begins and ends.


Identified actual content boundaries within crawled dataset structure
Identified actual content boundaries within crawled dataset structure
Found it — real content starts around line 313 ("Khanh Hoa, Viet Nam", "Best rate guarantee"...). Let me see the actual content body and where the footer junk begins.


Identifying rooms page as richest data source
Identifying rooms page as richest data source
I now fully understand the structure. The main page is actually a goldmine — it contains room types with descriptions, dining, spa, experiences, promotions, and contact info, all wrapped in repeated nav/footer chrome. Let me check how the /rooms, /foods, /offers pages differ, then design the cleaner.


Deciphering hierarchical structure of hotel dataset fields
Deciphering hierarchical structure of hotel dataset fields
This is very revealing. Three things are now clear:

The same navigation header and footer repeat on every page — that's the bulk of the junk.
The main page is the richest summary (description + room list + dining + spa + experiences + promotions + contact), organized in labeled sections like "Room types", "F&B Services", "Spa", "Promotions".
The rooms page has the detailed room data — amenities, capacity, size, and even prices (e.g. "Standard rate ~107USD /night").
Let me prototype a cleaner and test it on your file before writing the final script. First, the boilerplate stripper.


Assembling final schema while enriching room data hierarchically
Assembling final schema while enriching room data hierarchically
The boilerplate stripper works cleanly — all nav/footer junk is gone and the content structure is obvious. Now let me build and test the full section parser that turns this into hierarchy.


Architecting comprehensive data cleaning script for hierarchical organization
Architecting comprehensive data cleaning script for hierarchical organization
Excellent — 9 room types extracted cleanly. Now let me add dining, experiences, promotions, contact info (via regex on the raw text), and enrich rooms with price/size from the rooms page.


Validating hierarchical data structure organization successfully
Validating hierarchical data structure organization successfully
Everything extracts correctly. (The email comes back empty because Vinpearl masks emails on the live page with Cloudflare protection — that's the site, not your data.) The price and size data on the rooms page is recoverable too.

I now have a validated approach. Let me write the final cleaning script and test it end-to-end on your file.


The data cleaning script that turns raw scraped pages into hierarchical structured JSON
The data cleaning script that turns raw scraped pages into hierarchical structured JSON
Now let me test it end-to-end on your file.


Presenting cleaned dataset and organized JSON output
Presenting cleaned dataset and organized JSON output
This is working well — clean hierarchy with rooms broken out into name, description, size, capacity, price, and amenities. I spotted one small flaw: the last room's amenities list picked up booking-widget leftovers ("Load More", "Reserve", "Room\t1"). Let me tighten that.


Validated dataset and orchestrated hierarchical restructuring solution
Validated dataset and orchestrated hierarchical restructuring solution
Fixed — the amenities now end cleanly. Here are the results on your file.


Presented 2 files
Presented 2 files
clean_dataset.py is the tool; hon-tam-resort.clean.json is what it produced from your file, so you can see the target shape before running it on everything.

Your raw pages strings became this hierarchy:

name, location, tagline, description
contact: { address, phone, email }
room_types: [ { name, description, size_m2, capacity, price_from_usd, amenities[] } ]   # 9 rooms
dining: [ "Sea Breeze Restaurant", "Pool Bar" ]
spa, experiences[], promotions[]
images[], local_images[]
clean_text: { main, rooms, foods, offers }   # boilerplate-stripped, kept as a RAG fallback
The two ideas that make it robust, in case you want to understand it rather than just run it: the nav menu and footer are byte-identical on every page, so any line appearing on nearly all of a hotel's pages is flagged as chrome and dropped — that clears the junk without me hand-listing every menu item. Then the cleaned main page is split on its section labels ("Room types", "F&B Services", "Spa", "Promotions") to build the tree, and the rooms page is mined with regex for size, capacity, and price.

To run it on your whole dataset
Drop clean_dataset.py next to your dataset/ folder and run python clean_dataset.py. It reads every file in dataset/hotels/ and writes dataset_clean/, including a hotels_clean.csv summary.

That CSV is your QA tool. After running, sort it and look for any hotel with 0 rooms or has_description = False — those are properties whose page template differs slightly from Hon Tam's, and they'll need a small tweak (usually a different section label). If you paste me that summary, or upload one hotel that came out empty, I can adjust the parser for it.

Two honest caveats on what you're seeing: email is null because Vinpearl masks email addresses on the live site, so it was never in your scrape — not a bug. And two rooms have null price/size because that data sits only in their text description, not in a separate price field; the value is still inside the description string if you need it. Want me to add a fallback that pulls size out of the description text when the structured field is missing?


Clean dataset
PY 

Hon tam resort.clean
Code · JSON 

hon-tam-resort.json
json

The terminal log like that: "scraper$ python clean_dataset.py
  hon-tam-resort                      rooms= 9 dining=2 desc=Y
  vinholidays-fiesta-phu-quoc         rooms= 9 dining=0 desc=Y
  vinpearl-beachfront-nha-trang       rooms=13 dining=0 desc=Y
  vinpearl-condotel-beachfront-nha-trang rooms= 0 dining=0 desc=Y
  vinpearl-cua-hoi-resort-affiliated-by-melia rooms= 0 dining=0 desc=Y
  vinpearl-cua-sot-resort-affiliated-by-melia rooms= 0 dining=0 desc=Y
  vinpearl-empire-nha-trang-affiliated-by-melia rooms= 0 dining=0 desc=Y
  vinpearl-ha-tinh-affiliated-by-melia rooms= 0 dining=0 desc=Y
  vinpearl-hotel-bac-ninh             rooms= 0 dining=0 desc=Y
  vinpearl-luxury-nha-trang           rooms=13 dining=0 desc=Y
  vinpearl-resort-golf-nam-hoi-an     rooms=14 dining=0 desc=Y
  vinpearl-resort-nha-trang           rooms=15 dining=0 desc=Y
  vinpearl-resort-spa-ha-long         rooms=14 dining=0 desc=Y
  vinpearl-resort-spa-nha-trang-bay   rooms=16 dining=0 desc=Y
  vinpearl-resort-spa-phu-quoc        rooms=13 dining=0 desc=Y
  vinpearl-wonderworld-phu-quoc       rooms=14 dining=0 desc=Y
Done. 16 hotels -> dataset_clean/
" But as you seen in the .json, I dont see my data is cleaned

Show more
11:16 AM

Pinpointing the uploaded raw file versus cleaned output discrepancy
Pinpointing the uploaded raw file versus cleaned output discrepancy
Let me look at exactly what's in the file you uploaded — I need to see whether it's the raw input or the cleaned output, because that changes everything.


Pinpointing template discrepancies causing zero values
Pinpointing template discrepancies causing zero values
Found the problem — and it's good news. The file you uploaded is your raw input file (dataset/hotels/hon-tam-resort.json), not the cleaned output. I can tell because it only has the original pages text blobs and no room_types field.

The cleaner writes to a separate folder on purpose — it never touches your raw scrape, so it doesn't overwrite anything. Your cleaned data is in a different place:

dataset/hotels/hon-tam-resort.json          ← what you uploaded (RAW, untouched input)
dataset_clean/hotels/hon-tam-resort.json    ← the CLEANED output  ← look here
dataset_clean/hotels_clean.json             ← all 16 hotels in one file
dataset_clean/hotels_clean.csv              ← the summary
Let me prove the cleaning actually happened by running it on the exact file you just uploaded and showing you the before/after.


Diagnosed folder confusion and pinpointed template parsing issues
Diagnosed folder confusion and pinpointed template parsing issues
Your data is cleaned — you were just looking in the input folder. The file you uploaded (pages.main is a 13,589-character blob starting with "Vietnamese / English / Korean"...) is the original raw scrape. The cleaned version, which I've attached above as hon-tam-resort.CLEANED.json, has 9 structured room_types (with size and price), dining, contact, and so on. Open the attached file and compare it to yours — that's what's sitting in your dataset_clean/hotels/ folder right now.

One thing that might have thrown you: even the cleaned file still has a clean_text section near the bottom containing page text. That's intentional — it's the boilerplate-stripped text I keep as a search fallback. The structured fields above it (room_types, dining, etc.) are your cleaned data. If it's confusing, you can delete the clean_text block.

The two real issues your log revealed
Your run surfaced two genuine gaps worth fixing:

Seven hotels got rooms=0 — bac-ninh, the four "Affiliated by Melia" ones, the condotel, and empire. These are mostly city hotels rather than beach resorts, so their main page almost certainly uses a different section label than "Room types" (or lists rooms differently). This is exactly the template-difference case I mentioned would need a tweak.

dining=0 on 15 of 16 hotels — only Hon Tam worked, which tells me the "F&B Services" label I tuned on is specific to Hon Tam; the others likely call that section "Dining" or "Restaurants & Bars," or only list dining on the /foods page.

I can fix both, but I need to see how those pages are structured — and I can only see Hon Tam right now. Could you upload two raw files from your dataset/hotels/ folder (the input folder, not the clean one):

vinpearl-hotel-bac-ninh.json — to fix the zero-rooms case
vinpearl-resort-nha-trang.json — it got 15 rooms but 0 dining, so it'll show me the dining-label difference
With those two, I can generalize the parser so the section labels are detected automatically instead of hard-coded, and your whole dataset will fill in.


Hon tam resort.cleaned
Code · JSON 
Now I want you to delete image that contain ["logo", "thumb", "anh-man-hinh", "smallpng", "untitle", "sharelink", "web-tap-sap"] in image files' name

11:25 AM

Validating blocklist against local files, eliminating non-content images
Validating blocklist against local files, eliminating non-content images
Before writing the deletion script, let me check your actual image filenames so I can confirm these patterns match real files (and show you exactly what would be removed).


Constructing mock dataset structure with dummy image files
Constructing mock dataset structure with dummy image files
The blocklist matches real files — in Hon Tam alone it catches 12 downloaded images: logos, thumbnails, a screenshot (anh-man-hinh = "screenshot"), "Untitled design" exports, and share-link graphics. Exactly the non-content junk. Let me write a deletion script and test it.


Devised testing strategy to validate image pruning functionality
Devised testing strategy to validate image pruning functionality
Now let me test it on a realistic mock of your folder structure — create the actual image files from your data, then run the script in both preview and apply modes.


Presenting pruning script and elucidating deletion logic
Presenting pruning script and elucidating deletion logic
Preview looks correct — 12 junk files flagged, the real photos (hon-tam-resort-*.jpg) untouched. Now let me verify the actual deletion works by flipping to apply mode.


Engineered safe deletion script with bonus JSON synchronization
Engineered safe deletion script with bonus JSON synchronization
Works perfectly. On your Hon Tam data it deleted the 12 junk files (logos, thumbnails, the screenshot, "Untitled" exports, share-link graphic), kept all 34 real hotel photos, and left no matches behind.


Presented file
Presented file
Drop prune_images.py next to your dataset/ folder and run it. How to use it:

bash
python prune_images.py          # 1. PREVIEW — lists what it would delete, changes nothing
# open the file, change DRY_RUN = True  ->  DRY_RUN = False
python prune_images.py          # 2. APPLY — deletes for real
It's deliberately safe-by-default: the first run only prints the list so you can eyeball it before anything is removed (file deletion can't be undone). Once the list looks right, flip DRY_RUN to False and run again.

One thing I added beyond just deleting files, because you'd hit the problem immediately otherwise: it also strips those same images out of the images and local_images lists in your JSON files (dataset/hotels/, dataset_clean/, and the master hotels_clean.json). Without that, your records would point at files that no longer exist. On your test run that was 12 files plus 22 references removed, leaving local_images at 34.

If you ever want to add or remove a keyword, just edit the BLOCKLIST at the top — matching is case-insensitive and checks the filename only.


Prune images
PY 
Now because I just manage dataset step so I dont know Whether I rename file readme.md or not. I want you to rewrite it

11:34 AM

Deliberated comprehensive README rewrite for three-script pipeline
Deliberated comprehensive README rewrite for three-script pipeline
Your README only documents the scraper, but the project now has three steps. Let me rewrite it to cover the whole pipeline.


Ran a command, read a file
Ran a command, read a file
Done. The rewritten README now documents the full pipeline instead of just the scraper. Key changes:

It opens with a table showing all three steps (scrape_vinpearl.py → clean_dataset.py → prune_images.py), what each reads and writes, so the order is unambiguous. Then a section per step with the exact command, what folder it produces, and the gotchas — including the dry-run-first workflow for pruning and the QA reminder to check hotels_clean.csv for the zero-rooms hotels.

I also folded in the cleaned record schema, the responsible-crawling notes, and the two "not a bug" quirks we ran into (masked emails, and rooms where size/price live only in the description). It closes with the dataset-to-chatbot next steps.

Just save it as README.md in your vinpearl-scraper/ folder, replacing the old one. If your team uses the file, the filename is conventionally capitalized README.md (all caps) so it renders at the top of the folder on GitHub — but lowercase readme.md works fine too; it's only a display convention, not a functional requirement.


Readme
Document · MD 






Claude is AI and can make mistakes. Please double-check responses.


raw
Readme · MD
# Vinpearl Hotel Dataset Pipeline
 
Builds a clean, structured dataset (text + images) from the public hotel pages
on vinpearl.com, for use in a room-booking assistant chatbot.
 
The pipeline has **three steps**, run in order:
 
| Step | Script | What it does | Reads | Writes |
|------|--------|--------------|-------|--------|
| 1 | `scrape_vinpearl.py` | Crawl the site, download raw page text + images | vinpearl.com | `dataset/` |
| 2 | `clean_dataset.py`   | Turn raw page text into structured hierarchy | `dataset/hotels/` | `dataset_clean/` |
| 3 | `prune_images.py`    | Delete junk images (logos, thumbnails, etc.) | `dataset/` & `dataset_clean/` | (edits in place) |
 
Each step writes to a **new** location and never destroys the previous one, so
you can always re-run a step without losing earlier work.
 
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
is enough — no browser automation. The script is polite (2-second delay, honest
User-Agent) and **resume-friendly**: finished hotels and downloaded images are
skipped, so you can stop and re-run safely.
 
Produces:
 
```
dataset/
  hotels.json          # all hotels, raw records
  hotels.csv           # summary
  hotels/<slug>.json   # one raw record per hotel (pages are big text blobs)
  images/<slug>/*.jpg  # downloaded photos
```
 
A raw record's `pages` field (`main`, `rooms`, `foods`, `offers`) is just
website text with all the navigation and footer still in it. Step 2 fixes that.
 
---
 
## Step 2 — Clean
 
```bash
python clean_dataset.py
```
 
Two ideas make this robust:
 
1. **Chrome removal** — the nav menu and footer are identical on every page, so
   any line appearing on nearly all of a hotel's pages is treated as site chrome
   and dropped. Real content survives.
2. **Section parsing** — the cleaned `main` page is split on its labels
   ("Room types", "F&B Services", "Spa", "Promotions") to build the hierarchy,
   and the `rooms` page is mined for per-room size, capacity, and price.
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
need a small parser tweak — usually a different section label. Known gaps to
revisit: several city hotels return 0 rooms, and `dining` currently only fills
for resorts that use the exact label "F&B Services".
 
---
 
## Step 3 — Prune junk images
 
```bash
python prune_images.py            # 1. PREVIEW (DRY_RUN = True) — changes nothing
# edit the file: set DRY_RUN = False
python prune_images.py            # 2. APPLY — deletes for real
```
 
Deletes image files whose name contains any blocked keyword and removes the
matching entries from every JSON file so nothing points at a deleted image.
Matching is case-insensitive on the filename only.
 
- Blocked keywords live in `BLOCKLIST` at the top of the script:
  `logo, thumb, anh-man-hinh, smallpng, untitle, sharelink, web-tap-sap`
- **Safe by default:** `DRY_RUN = True` means the first run only prints what it
  *would* delete. Review the list, then flip `DRY_RUN = False` and run again.
  Deletion is permanent, so always preview first.
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
 



