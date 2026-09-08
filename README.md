# Living Word

Private scripture intel surface with verse-tagged public-domain commentary.

**Not for public redistribution of third-party copyrighted material.** This project only ingests public-domain / CC0 sources. Do not point the fetch scripts at copyrighted commentary sites, and do not bundle NIV, ESV, NKJV, or other restricted translations.

## Translations

Free / public-domain packs for the full Protestant canon (66 books):

- **KJV** King James Version
- **ASV** American Standard Version
- **WEB** World English Bible (modern)
- **BSB** Berean Standard Bible (modern, public domain)
- **BBE** Bible in Basic English (simple modern English)
- **NHEB** New Heart English Bible (modern, public domain)

NIV, ESV, and NKJV require paid licenses, so this app ships free modern
alternatives instead of those restricted texts.

Fetch and process the library with:

```bash
npm run fetch:bible-library
npm run ingest
npm run ingest:words
```

Matthew Henry commentary is included for every book OpenChristianData publishes
(Song of Solomon has no MH pack yet). Original-language words come from STEPBible.

## Stack

- Next.js (App Router)
- Public-domain Bible text + Matthew Henry commentary (CC0)
- STEPBible morphology (CC BY 4.0)

## Commands

```bash
npm install
npm run ingest          # tag commentary → data/processed
npm run ingest:words    # STEPBible morphology → data/processed/words
npm run dev             # http://localhost:3000
npm run fetch:bible-library
```

## How tagging works

Commentary entries ship with ranges like `1-3` or `intro`. `scripts/ingest.mjs` expands ranges into concrete keys (`John.3.16`) and builds an inverted index used by `/api/intel`.
