#!/usr/bin/env node
/**
 * Copy processed library data into public/ for static / GitHub Pages builds,
 * and emit compact search + concordance indexes for the browser.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "data/processed");
const DEST = path.join(ROOT, "public/data/processed");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(from, to) {
  ensureDir(to);
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data));
}

function normalizeStrongs(raw) {
  const cleaned = String(raw)
    .trim()
    .toUpperCase()
    .replace(/^STRONG'?S?\s*/i, "");
  const match = cleaned.match(/^([HG])?0*(\d{1,5})$/);
  if (!match) return null;
  const num = match[2];
  if (!num) return null;
  const prefix = match[1] ?? (Number(num) >= 4000 ? "G" : "H");
  return `${prefix}${Number(num)}`;
}

function buildSearchIndexes(catalog) {
  const outDir = path.join(DEST, "search");
  ensureDir(outDir);
  for (const version of catalog.versions) {
    const verses = [];
    for (const book of catalog.books) {
      const biblePath = path.join(SRC, "bible", version.id, `${book.slug}.json`);
      if (!fs.existsSync(biblePath)) continue;
      const bible = readJson(biblePath);
      for (const chapter of bible.chapters) {
        for (const verse of chapter.verses) {
          verses.push({
            b: bible.book,
            s: bible.slug,
            c: chapter.chapter,
            v: verse.verse,
            t: verse.text,
          });
        }
      }
    }
    writeJson(path.join(outDir, `${version.id}.json`), verses);
    console.log(`  search/${version.id}.json (${verses.length} verses)`);
  }
}

function buildConcordance(catalog) {
  const index = {};
  const bookName = new Map(catalog.books.map((b) => [b.slug, b.book]));
  for (const book of catalog.books) {
    const file = path.join(SRC, "words", `${book.slug}.json`);
    if (!fs.existsSync(file)) continue;
    const bundle = readJson(file);
    for (const [chapterKey, verseMap] of Object.entries(bundle.chapters ?? {})) {
      const chapter = Number(chapterKey);
      for (const [verseKey, tokens] of Object.entries(verseMap)) {
        const verse = Number(verseKey);
        for (const token of tokens) {
          const key = normalizeStrongs(token.strongs);
          if (!key) continue;
          const list = index[key] ?? [];
          const already = list.some(
            (hit) =>
              hit.s === book.slug && hit.c === chapter && hit.v === verse,
          );
          if (!already) {
            list.push({
              b: bookName.get(book.slug) ?? book.book,
              s: book.slug,
              c: chapter,
              v: verse,
              g: token.gloss,
              t: token.tlit,
            });
            index[key] = list;
          }
        }
      }
    }
  }
  writeJson(path.join(DEST, "lexicon", "concordance.json"), index);
  console.log(`  lexicon/concordance.json (${Object.keys(index).length} keys)`);
}

function main() {
  if (!fs.existsSync(SRC)) {
    throw new Error("Missing data/processed. Run npm run ingest first.");
  }
  fs.rmSync(DEST, { recursive: true, force: true });
  console.log("Copying processed data → public/data/processed …");
  copyDir(SRC, DEST);
  const catalog = readJson(path.join(SRC, "catalog.json"));
  console.log("Building browser search indexes …");
  buildSearchIndexes(catalog);
  console.log("Building browser concordance …");
  buildConcordance(catalog);
  console.log("Static data ready.");
}

main();
