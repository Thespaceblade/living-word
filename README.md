# Living Word

Private scripture intel surface with verse-tagged public-domain commentary.

**Not for public redistribution of third-party copyrighted material.** Local ingest
only uses public-domain / CC0 sources. Do not point the fetch scripts at
copyrighted commentary sites, and do not commit NIV, ESV, NKJV, or other
restricted translation text into this repository.

## Translations

Free / public-domain packs for the full Protestant canon (66 books):

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

Fetch and process the library with:

```bash
npm run fetch:bible-library
npm run ingest
npm run ingest:words
npm run ingest:lexicon
```

Jamieson-Fausset-Brown raw data may still exist under `data/raw`, but the
reader Explainer uses **Tyndale Open Study Notes** (CC BY-SA 4.0) for modern
verse notes across the Protestant canon (Judges is not in that pack).

```bash
npm run fetch:tyndale
npm run ingest:tyndale
```

Original-language words come from STEPBible. Strong's lexicon entries come from
Open Scriptures (CC BY-SA).

## Stack

- Next.js (App Router)
- Public-domain Bible text + Tyndale Open Study Notes (CC BY-SA 4.0)
- STEPBible morphology (CC BY 4.0)
- Open Scriptures Strong's lexicon (CC BY-SA)
- Optional licensed text through publisher APIs

## Commands

```bash
npm install
npm run fetch:tyndale   # Tyndale Open Study Notes → data/raw
npm run ingest          # Bible packs → data/processed
npm run ingest:tyndale  # tag Tyndale notes → data/processed/commentary
npm run ingest:words    # STEPBible morphology → data/processed/words
npm run ingest:lexicon  # Strong's lexicon → data/processed/lexicon
npm run dev             # http://localhost:3000
npm run fetch:bible-library
```

## Attribution

Tyndale Open Study Notes © Tyndale House Publishers. Licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
See [tyndaleopenresources.com](https://tyndaleopenresources.com/).

## How tagging works

Commentary entries ship with ranges like `1-3` or `intro`. `scripts/ingest.mjs` expands ranges into concrete keys (`John.3.16`) and builds an inverted index used by `/api/intel`.
