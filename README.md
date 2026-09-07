# Living Word

Private scripture intel surface with verse-tagged public-domain commentary.

**Not for public redistribution of third-party copyrighted material.** This project only ingests public-domain / CC0 sources. Do not point the fetch scripts at copyrighted commentary sites, and do not bundle NIV, ESV, NKJV, or other restricted translations.

## Translations

Free / public-domain packs included for Genesis, Psalms, and John:

- **KJV** King James Version
- **ASV** American Standard Version
- **WEB** World English Bible (modern)
- **BSB** Berean Standard Bible (modern, public domain)
- **BBE** Bible in Basic English (simple modern English)
- **NHEB** New Heart English Bible (modern, public domain)

NIV, ESV, and NKJV require paid licenses, so this app ships free modern
alternatives instead of those restricted texts.

Fetch the modern free packs with:

```bash
npm run fetch:free-bibles
npm run ingest
```

## Stack

- Next.js (App Router)
- Public-domain Bible text + Matthew Henry commentary (CC0)

## Commands

```bash
npm install
npm run ingest          # tag commentary → data/processed
npm run dev             # http://localhost:3000
node scripts/fetch-sources.mjs romans matthew   # pull more PD books
```

After fetching new books, add them to `BOOK_SLUGS` in `scripts/ingest.mjs`, then re-run ingest.

## Audio

Listen streams public-domain chapter MP3s from the Internet Archive:

- **KJV** (and ASV fallback): AudioTreasure Ultra Light pack (`kingjamesversionaudio`)
- **WEB**: David Williams narration mirror (`legacy-web-audio`)

Verse highlight is approximate, based on relative word counts within the chapter (these packs do not ship verse timings).



Commentary entries ship with ranges like `1-3` or `intro`. `scripts/ingest.mjs` expands ranges into concrete keys (`John.3.16`) and builds an inverted index used by `/api/intel`.
