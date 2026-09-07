#!/usr/bin/env node
/**
 * Fetch additional public-domain commentary books from OpenChristianData.
 * Usage: node scripts/fetch-sources.mjs [book-slug ...]
 * Example: node scripts/fetch-sources.mjs romans matthew
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const COMMENTARY_BASE =
  "https://raw.githubusercontent.com/OpenChristianData/open-christian-data/main/data/commentaries/matthew-henry";
const BIBLE_BASE =
  "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master";

/** slug (OpenChristianData / filename) -> Bible JSON book name */
const BOOK_MAP = {
  genesis: "Genesis",
  exodus: "Exodus",
  leviticus: "Leviticus",
  numbers: "Numbers",
  deuteronomy: "Deuteronomy",
  joshua: "Joshua",
  judges: "Judges",
  ruth: "Ruth",
  "1-samuel": "1Samuel",
  "2-samuel": "2Samuel",
  "1-kings": "1Kings",
  "2-kings": "2Kings",
  "1-chronicles": "1Chronicles",
  "2-chronicles": "2Chronicles",
  ezra: "Ezra",
  nehemiah: "Nehemiah",
  esther: "Esther",
  job: "Job",
  psalms: "Psalms",
  proverbs: "Proverbs",
  ecclesiastes: "Ecclesiastes",
  "song-of-solomon": "SongofSolomon",
  isaiah: "Isaiah",
  jeremiah: "Jeremiah",
  lamentations: "Lamentations",
  ezekiel: "Ezekiel",
  daniel: "Daniel",
  hosea: "Hosea",
  joel: "Joel",
  amos: "Amos",
  obadiah: "Obadiah",
  jonah: "Jonah",
  micah: "Micah",
  nahum: "Nahum",
  habakkuk: "Habakkuk",
  zephaniah: "Zephaniah",
  haggai: "Haggai",
  zechariah: "Zechariah",
  malachi: "Malachi",
  matthew: "Matthew",
  mark: "Mark",
  luke: "Luke",
  john: "John",
  acts: "Acts",
  romans: "Romans",
  "1-corinthians": "1Corinthians",
  "2-corinthians": "2Corinthians",
  galatians: "Galatians",
  ephesians: "Ephesians",
  philippians: "Philippians",
  colossians: "Colossians",
  "1-thessalonians": "1Thessalonians",
  "2-thessalonians": "2Thessalonians",
  "1-timothy": "1Timothy",
  "2-timothy": "2Timothy",
  titus: "Titus",
  philemon: "Philemon",
  hebrews: "Hebrews",
  james: "James",
  "1-peter": "1Peter",
  "2-peter": "2Peter",
  "1-john": "1John",
  "2-john": "2John",
  "3-john": "3John",
  jude: "Jude",
  revelation: "Revelation",
};

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  console.log(`Wrote ${dest} (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.log("Pass one or more book slugs, e.g. romans matthew");
    process.exit(1);
  }

  for (const slug of slugs) {
    const bibleName = BOOK_MAP[slug];
    if (!bibleName) {
      console.warn(`Unknown slug: ${slug}`);
      continue;
    }
    await download(
      `${COMMENTARY_BASE}/${slug}.json`,
      path.join(ROOT, "data/raw/commentary/matthew-henry", `${slug}.json`),
    );
    await download(
      `${BIBLE_BASE}/${bibleName}.json`,
      path.join(ROOT, "data/raw/bible", `${bibleName}.json`),
    );
  }

  console.log("Update BOOK_SLUGS in scripts/ingest.mjs, then run: npm run ingest");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
