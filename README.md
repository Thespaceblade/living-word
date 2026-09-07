# Living Word

Private scripture intel surface with verse-tagged public-domain commentary.

**Not for public redistribution of third-party copyrighted material.** Local ingest only uses public-domain / CC0 sources (KJV, ASV, WEB + Matthew Henry via Open Christian Data). Do not point the fetch scripts at copyrighted commentary sites.

## Translations

Always available offline:

- KJV, ASV, WEB (public domain)

Optional licensed translations (fetched at runtime, never committed):

- **ESV** via [api.esv.org](https://api.esv.org/) (`ESV_API_KEY`)
- **NIV** and **NKJV** via [API.Bible](https://scripture.api.bible/) (`API_BIBLE_KEY`, plus plan access to those Bibles)

Copy `.env.example` to `.env.local`, add keys, restart the app. Chapters are cached under `data/cache/bible` for up to 30 days.

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
