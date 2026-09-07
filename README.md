# Living Word

Private scripture intel surface with verse-tagged public-domain commentary.

**Not for public redistribution of third-party copyrighted material.** Local ingest
only uses public-domain / CC0 sources. Do not point the fetch scripts at
copyrighted commentary sites, and do not commit NIV, ESV, NKJV, or other
restricted translation text into this repository.

## Translations

Free / public-domain packs included for Genesis, Psalms, and John:

- **KJV** King James Version
- **ASV** American Standard Version
- **WEB** World English Bible (modern)
- **BSB** Berean Standard Bible (modern, public domain)
- **BBE** Bible in Basic English (simple modern English)
- **NHEB** New Heart English Bible (modern, public domain)

### Optional licensed feature

NIV, ESV, and NKJV require publisher licenses. Living Word can load them at
runtime through official APIs when you add keys locally. Copyrighted text is
never bundled or committed.

- **ESV** via [api.esv.org](https://api.esv.org/) (`ESV_API_KEY`)
- **NIV** and **NKJV** via [API.Bible](https://scripture.api.bible/) (`API_BIBLE_KEY`, plus plan access to those Bibles)

Copy `.env.example` to `.env.local`, add keys, restart the app. Chapters are
cached under `data/cache/bible` for up to 30 days. Without keys, those versions
show a setup screen and free packs keep working.

Fetch the modern free packs with:

```bash
npm run fetch:free-bibles
npm run ingest
```

## Stack

- Next.js (App Router)
- Public-domain Bible text + Matthew Henry commentary (CC0)
- Optional licensed text through publisher APIs

## Commands

```bash
npm install
npm run ingest          # tag commentary → data/processed
npm run dev             # http://localhost:3000
node scripts/fetch-sources.mjs romans matthew   # pull more PD books
```

After fetching new books, add them to `BOOK_SLUGS` in `scripts/ingest.mjs`, then re-run ingest.

## How tagging works

Commentary entries ship with ranges like `1-3` or `intro`. `scripts/ingest.mjs` expands ranges into concrete keys (`John.3.16`) and builds an inverted index used by `/api/intel`.
