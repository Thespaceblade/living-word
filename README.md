# Living Word

Private scripture intel surface: KJV text with verse-tagged public-domain commentary.

**Not for public redistribution of third-party copyrighted material.** This project only ingests public-domain / CC0 sources (KJV + Matthew Henry via Open Christian Data). Do not point the fetch scripts at copyrighted commentary sites.

## Stack

- Next.js (App Router)
- Public-domain KJV
- Matthew Henry commentary (CC0), tagged to verses by range expansion

## Commands

```bash
npm install
npm run ingest          # tag commentary → data/processed
npm run dev             # http://localhost:3000
node scripts/fetch-sources.mjs romans matthew   # pull more PD books
```

After fetching new books, add them to `BOOK_SLUGS` in `scripts/ingest.mjs`, then re-run ingest.

## Audio

Listen uses the browser’s speech synthesis on the public-domain chapter text already on screen (KJV, ASV, WEB), with verse-by-verse highlight sync. Human narration can be added later when timed PD audio is hosted.


Commentary entries ship with ranges like `1-3` or `intro`. `scripts/ingest.mjs` expands ranges into concrete keys (`John.3.16`) and builds an inverted index used by `/api/intel`.
