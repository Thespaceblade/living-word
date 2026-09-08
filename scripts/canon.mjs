/**
 * Protestant canon metadata shared by fetch/ingest scripts.
 * English `name` is the local raw filename stem and catalog book title.
 */
export const VERSIONS = [
  { id: "kjv", label: "KJV", name: "King James Version" },
  { id: "asv", label: "ASV", name: "American Standard Version" },
  { id: "web", label: "WEB", name: "World English Bible" },
  { id: "bsb", label: "BSB", name: "Berean Standard Bible" },
  { id: "bbe", label: "BBE", name: "Bible in Basic English" },
  { id: "nheb", label: "NHEB", name: "New Heart English Bible" },
];

/**
 * @typedef {{
 *   slug: string,
 *   name: string,
 *   testament: "OT" | "NT",
 *   chapters: number,
 *   audioNum: string,
 *   aruljohn: string,
 *   midvash: string,
 *   scrollmapper: string,
 *   commentary: string | null,
 *   stepCode: string,
 *   abbrs: string[],
 * }} CanonBook
 */

/** @type {CanonBook[]} */
export const CANON = [
  { slug: "genesis", name: "Genesis", testament: "OT", chapters: 50, audioNum: "01", aruljohn: "Genesis", midvash: "Gen", scrollmapper: "Genesis", commentary: "genesis", stepCode: "Gen", abbrs: ["gen", "ge", "gn", "genesis"] },
  { slug: "exodus", name: "Exodus", testament: "OT", chapters: 40, audioNum: "02", aruljohn: "Exodus", midvash: "Exod", scrollmapper: "Exodus", commentary: "exodus", stepCode: "Exo", abbrs: ["exo", "ex", "exod", "exodus"] },
  { slug: "leviticus", name: "Leviticus", testament: "OT", chapters: 27, audioNum: "03", aruljohn: "Leviticus", midvash: "Lev", scrollmapper: "Leviticus", commentary: "leviticus", stepCode: "Lev", abbrs: ["lev", "le", "lv", "leviticus"] },
  { slug: "numbers", name: "Numbers", testament: "OT", chapters: 36, audioNum: "04", aruljohn: "Numbers", midvash: "Num", scrollmapper: "Numbers", commentary: "numbers", stepCode: "Num", abbrs: ["num", "nu", "nm", "numbers"] },
  { slug: "deuteronomy", name: "Deuteronomy", testament: "OT", chapters: 34, audioNum: "05", aruljohn: "Deuteronomy", midvash: "Deut", scrollmapper: "Deuteronomy", commentary: "deuteronomy", stepCode: "Deu", abbrs: ["deu", "dt", "deut", "deuteronomy"] },
  { slug: "joshua", name: "Joshua", testament: "OT", chapters: 24, audioNum: "06", aruljohn: "Joshua", midvash: "Josh", scrollmapper: "Joshua", commentary: "joshua", stepCode: "Jos", abbrs: ["jos", "josh", "joshua"] },
  { slug: "judges", name: "Judges", testament: "OT", chapters: 21, audioNum: "07", aruljohn: "Judges", midvash: "Judg", scrollmapper: "Judges", commentary: "judges", stepCode: "Jdg", abbrs: ["jdg", "judg", "judges"] },
  { slug: "ruth", name: "Ruth", testament: "OT", chapters: 4, audioNum: "08", aruljohn: "Ruth", midvash: "Ruth", scrollmapper: "Ruth", commentary: "ruth", stepCode: "Rut", abbrs: ["rut", "ru", "ruth"] },
  { slug: "1-samuel", name: "1 Samuel", testament: "OT", chapters: 31, audioNum: "09", aruljohn: "1Samuel", midvash: "1Sam", scrollmapper: "I Samuel", commentary: "1-samuel", stepCode: "1Sa", abbrs: ["1sa", "1sam", "1samuel"] },
  { slug: "2-samuel", name: "2 Samuel", testament: "OT", chapters: 24, audioNum: "10", aruljohn: "2Samuel", midvash: "2Sam", scrollmapper: "II Samuel", commentary: "2-samuel", stepCode: "2Sa", abbrs: ["2sa", "2sam", "2samuel"] },
  { slug: "1-kings", name: "1 Kings", testament: "OT", chapters: 22, audioNum: "11", aruljohn: "1Kings", midvash: "1Kgs", scrollmapper: "I Kings", commentary: "1-kings", stepCode: "1Ki", abbrs: ["1ki", "1kgs", "1kings"] },
  { slug: "2-kings", name: "2 Kings", testament: "OT", chapters: 25, audioNum: "12", aruljohn: "2Kings", midvash: "2Kgs", scrollmapper: "II Kings", commentary: "2-kings", stepCode: "2Ki", abbrs: ["2ki", "2kgs", "2kings"] },
  { slug: "1-chronicles", name: "1 Chronicles", testament: "OT", chapters: 29, audioNum: "13", aruljohn: "1Chronicles", midvash: "1Chr", scrollmapper: "I Chronicles", commentary: "1-chronicles", stepCode: "1Ch", abbrs: ["1ch", "1chr", "1chronicles"] },
  { slug: "2-chronicles", name: "2 Chronicles", testament: "OT", chapters: 36, audioNum: "14", aruljohn: "2Chronicles", midvash: "2Chr", scrollmapper: "II Chronicles", commentary: "2-chronicles", stepCode: "2Ch", abbrs: ["2ch", "2chr", "2chronicles"] },
  { slug: "ezra", name: "Ezra", testament: "OT", chapters: 10, audioNum: "15", aruljohn: "Ezra", midvash: "Ezra", scrollmapper: "Ezra", commentary: "ezra", stepCode: "Ezr", abbrs: ["ezr", "ezra"] },
  { slug: "nehemiah", name: "Nehemiah", testament: "OT", chapters: 13, audioNum: "16", aruljohn: "Nehemiah", midvash: "Neh", scrollmapper: "Nehemiah", commentary: "nehemiah", stepCode: "Neh", abbrs: ["neh", "ne", "nehemiah"] },
  { slug: "esther", name: "Esther", testament: "OT", chapters: 10, audioNum: "17", aruljohn: "Esther", midvash: "Esth", scrollmapper: "Esther", commentary: "esther", stepCode: "Est", abbrs: ["est", "esth", "esther"] },
  { slug: "job", name: "Job", testament: "OT", chapters: 42, audioNum: "18", aruljohn: "Job", midvash: "Job", scrollmapper: "Job", commentary: "job", stepCode: "Job", abbrs: ["job"] },
  { slug: "psalms", name: "Psalms", testament: "OT", chapters: 150, audioNum: "19", aruljohn: "Psalms", midvash: "Ps", scrollmapper: "Psalms", commentary: "psalms", stepCode: "Psa", abbrs: ["ps", "psa", "pss", "psalm", "psalms"] },
  { slug: "proverbs", name: "Proverbs", testament: "OT", chapters: 31, audioNum: "20", aruljohn: "Proverbs", midvash: "Prov", scrollmapper: "Proverbs", commentary: "proverbs", stepCode: "Pro", abbrs: ["pro", "prov", "proverbs"] },
  { slug: "ecclesiastes", name: "Ecclesiastes", testament: "OT", chapters: 12, audioNum: "21", aruljohn: "Ecclesiastes", midvash: "Eccl", scrollmapper: "Ecclesiastes", commentary: "ecclesiastes", stepCode: "Ecc", abbrs: ["ecc", "eccl", "ecclesiastes", "qoh"] },
  { slug: "song-of-solomon", name: "Song of Solomon", testament: "OT", chapters: 8, audioNum: "22", aruljohn: "SongofSolomon", midvash: "Song", scrollmapper: "Song of Solomon", commentary: null, stepCode: "Sng", abbrs: ["sng", "song", "sos", "cant", "songofsolomon"] },
  { slug: "isaiah", name: "Isaiah", testament: "OT", chapters: 66, audioNum: "23", aruljohn: "Isaiah", midvash: "Isa", scrollmapper: "Isaiah", commentary: "isaiah", stepCode: "Isa", abbrs: ["isa", "is", "isaiah"] },
  { slug: "jeremiah", name: "Jeremiah", testament: "OT", chapters: 52, audioNum: "24", aruljohn: "Jeremiah", midvash: "Jer", scrollmapper: "Jeremiah", commentary: "jeremiah", stepCode: "Jer", abbrs: ["jer", "je", "jeremiah"] },
  { slug: "lamentations", name: "Lamentations", testament: "OT", chapters: 5, audioNum: "25", aruljohn: "Lamentations", midvash: "Lam", scrollmapper: "Lamentations", commentary: "lamentations", stepCode: "Lam", abbrs: ["lam", "la", "lamentations"] },
  { slug: "ezekiel", name: "Ezekiel", testament: "OT", chapters: 48, audioNum: "26", aruljohn: "Ezekiel", midvash: "Ezek", scrollmapper: "Ezekiel", commentary: "ezekiel", stepCode: "Ezk", abbrs: ["eze", "ezek", "ezekiel"] },
  { slug: "daniel", name: "Daniel", testament: "OT", chapters: 12, audioNum: "27", aruljohn: "Daniel", midvash: "Dan", scrollmapper: "Daniel", commentary: "daniel", stepCode: "Dan", abbrs: ["dan", "da", "daniel"] },
  { slug: "hosea", name: "Hosea", testament: "OT", chapters: 14, audioNum: "28", aruljohn: "Hosea", midvash: "Hos", scrollmapper: "Hosea", commentary: "hosea", stepCode: "Hos", abbrs: ["hos", "ho", "hosea"] },
  { slug: "joel", name: "Joel", testament: "OT", chapters: 3, audioNum: "29", aruljohn: "Joel", midvash: "Joel", scrollmapper: "Joel", commentary: "joel", stepCode: "Jol", abbrs: ["joe", "joel"] },
  { slug: "amos", name: "Amos", testament: "OT", chapters: 9, audioNum: "30", aruljohn: "Amos", midvash: "Amos", scrollmapper: "Amos", commentary: "amos", stepCode: "Amo", abbrs: ["amo", "am", "amos"] },
  { slug: "obadiah", name: "Obadiah", testament: "OT", chapters: 1, audioNum: "31", aruljohn: "Obadiah", midvash: "Obad", scrollmapper: "Obadiah", commentary: "obadiah", stepCode: "Oba", abbrs: ["oba", "ob", "obad", "obadiah"] },
  { slug: "jonah", name: "Jonah", testament: "OT", chapters: 4, audioNum: "32", aruljohn: "Jonah", midvash: "Jonah", scrollmapper: "Jonah", commentary: "jonah", stepCode: "Jon", abbrs: ["jon", "jnh", "jonah"] },
  { slug: "micah", name: "Micah", testament: "OT", chapters: 7, audioNum: "33", aruljohn: "Micah", midvash: "Mic", scrollmapper: "Micah", commentary: "micah", stepCode: "Mic", abbrs: ["mic", "mi", "micah"] },
  { slug: "nahum", name: "Nahum", testament: "OT", chapters: 3, audioNum: "34", aruljohn: "Nahum", midvash: "Nah", scrollmapper: "Nahum", commentary: "nahum", stepCode: "Nam", abbrs: ["nah", "na", "nahum"] },
  { slug: "habakkuk", name: "Habakkuk", testament: "OT", chapters: 3, audioNum: "35", aruljohn: "Habakkuk", midvash: "Hab", scrollmapper: "Habakkuk", commentary: "habakkuk", stepCode: "Hab", abbrs: ["hab", "habakkuk"] },
  { slug: "zephaniah", name: "Zephaniah", testament: "OT", chapters: 3, audioNum: "36", aruljohn: "Zephaniah", midvash: "Zeph", scrollmapper: "Zephaniah", commentary: "zephaniah", stepCode: "Zep", abbrs: ["zep", "zeph", "zephaniah"] },
  { slug: "haggai", name: "Haggai", testament: "OT", chapters: 2, audioNum: "37", aruljohn: "Haggai", midvash: "Hag", scrollmapper: "Haggai", commentary: "haggai", stepCode: "Hag", abbrs: ["hag", "hg", "haggai"] },
  { slug: "zechariah", name: "Zechariah", testament: "OT", chapters: 14, audioNum: "38", aruljohn: "Zechariah", midvash: "Zech", scrollmapper: "Zechariah", commentary: "zechariah", stepCode: "Zec", abbrs: ["zec", "zech", "zechariah"] },
  { slug: "malachi", name: "Malachi", testament: "OT", chapters: 4, audioNum: "39", aruljohn: "Malachi", midvash: "Mal", scrollmapper: "Malachi", commentary: "malachi", stepCode: "Mal", abbrs: ["mal", "malachi"] },
  { slug: "matthew", name: "Matthew", testament: "NT", chapters: 28, audioNum: "40", aruljohn: "Matthew", midvash: "Matt", scrollmapper: "Matthew", commentary: "matthew", stepCode: "Mat", abbrs: ["mat", "mt", "matt", "matthew"] },
  { slug: "mark", name: "Mark", testament: "NT", chapters: 16, audioNum: "41", aruljohn: "Mark", midvash: "Mark", scrollmapper: "Mark", commentary: "mark", stepCode: "Mrk", abbrs: ["mar", "mk", "mrk", "mark"] },
  { slug: "luke", name: "Luke", testament: "NT", chapters: 24, audioNum: "42", aruljohn: "Luke", midvash: "Luke", scrollmapper: "Luke", commentary: "luke", stepCode: "Luk", abbrs: ["luk", "lk", "luke"] },
  { slug: "john", name: "John", testament: "NT", chapters: 21, audioNum: "43", aruljohn: "John", midvash: "John", scrollmapper: "John", commentary: "john", stepCode: "Jhn", abbrs: ["joh", "jn", "jhn", "john"] },
  { slug: "acts", name: "Acts", testament: "NT", chapters: 28, audioNum: "44", aruljohn: "Acts", midvash: "Acts", scrollmapper: "Acts", commentary: "acts", stepCode: "Act", abbrs: ["act", "ac", "acts"] },
  { slug: "romans", name: "Romans", testament: "NT", chapters: 16, audioNum: "45", aruljohn: "Romans", midvash: "Rom", scrollmapper: "Romans", commentary: "romans", stepCode: "Rom", abbrs: ["rom", "ro", "romans"] },
  { slug: "1-corinthians", name: "1 Corinthians", testament: "NT", chapters: 16, audioNum: "46", aruljohn: "1Corinthians", midvash: "1Cor", scrollmapper: "I Corinthians", commentary: "1-corinthians", stepCode: "1Co", abbrs: ["1co", "1cor", "1corinthians"] },
  { slug: "2-corinthians", name: "2 Corinthians", testament: "NT", chapters: 13, audioNum: "47", aruljohn: "2Corinthians", midvash: "2Cor", scrollmapper: "II Corinthians", commentary: "2-corinthians", stepCode: "2Co", abbrs: ["2co", "2cor", "2corinthians"] },
  { slug: "galatians", name: "Galatians", testament: "NT", chapters: 6, audioNum: "48", aruljohn: "Galatians", midvash: "Gal", scrollmapper: "Galatians", commentary: "galatians", stepCode: "Gal", abbrs: ["gal", "ga", "galatians"] },
  { slug: "ephesians", name: "Ephesians", testament: "NT", chapters: 6, audioNum: "49", aruljohn: "Ephesians", midvash: "Eph", scrollmapper: "Ephesians", commentary: "ephesians", stepCode: "Eph", abbrs: ["eph", "ephesians"] },
  { slug: "philippians", name: "Philippians", testament: "NT", chapters: 4, audioNum: "50", aruljohn: "Philippians", midvash: "Phil", scrollmapper: "Philippians", commentary: "philippians", stepCode: "Php", abbrs: ["php", "phil", "philippians"] },
  { slug: "colossians", name: "Colossians", testament: "NT", chapters: 4, audioNum: "51", aruljohn: "Colossians", midvash: "Col", scrollmapper: "Colossians", commentary: "colossians", stepCode: "Col", abbrs: ["col", "colossians"] },
  { slug: "1-thessalonians", name: "1 Thessalonians", testament: "NT", chapters: 5, audioNum: "52", aruljohn: "1Thessalonians", midvash: "1Thess", scrollmapper: "I Thessalonians", commentary: "1-thessalonians", stepCode: "1Th", abbrs: ["1th", "1thess", "1thessalonians"] },
  { slug: "2-thessalonians", name: "2 Thessalonians", testament: "NT", chapters: 3, audioNum: "53", aruljohn: "2Thessalonians", midvash: "2Thess", scrollmapper: "II Thessalonians", commentary: "2-thessalonians", stepCode: "2Th", abbrs: ["2th", "2thess", "2thessalonians"] },
  { slug: "1-timothy", name: "1 Timothy", testament: "NT", chapters: 6, audioNum: "54", aruljohn: "1Timothy", midvash: "1Tim", scrollmapper: "I Timothy", commentary: "1-timothy", stepCode: "1Ti", abbrs: ["1ti", "1tim", "1timothy"] },
  { slug: "2-timothy", name: "2 Timothy", testament: "NT", chapters: 4, audioNum: "55", aruljohn: "2Timothy", midvash: "2Tim", scrollmapper: "II Timothy", commentary: "2-timothy", stepCode: "2Ti", abbrs: ["2ti", "2tim", "2timothy"] },
  { slug: "titus", name: "Titus", testament: "NT", chapters: 3, audioNum: "56", aruljohn: "Titus", midvash: "Titus", scrollmapper: "Titus", commentary: "titus", stepCode: "Tit", abbrs: ["tit", "titus"] },
  { slug: "philemon", name: "Philemon", testament: "NT", chapters: 1, audioNum: "57", aruljohn: "Philemon", midvash: "Phlm", scrollmapper: "Philemon", commentary: "philemon", stepCode: "Phm", abbrs: ["phm", "phlm", "philemon"] },
  { slug: "hebrews", name: "Hebrews", testament: "NT", chapters: 13, audioNum: "58", aruljohn: "Hebrews", midvash: "Heb", scrollmapper: "Hebrews", commentary: "hebrews", stepCode: "Heb", abbrs: ["heb", "hebrews"] },
  { slug: "james", name: "James", testament: "NT", chapters: 5, audioNum: "59", aruljohn: "James", midvash: "Jas", scrollmapper: "James", commentary: "james", stepCode: "Jas", abbrs: ["jas", "jam", "james"] },
  { slug: "1-peter", name: "1 Peter", testament: "NT", chapters: 5, audioNum: "60", aruljohn: "1Peter", midvash: "1Pet", scrollmapper: "I Peter", commentary: "1-peter", stepCode: "1Pe", abbrs: ["1pe", "1pet", "1peter"] },
  { slug: "2-peter", name: "2 Peter", testament: "NT", chapters: 3, audioNum: "61", aruljohn: "2Peter", midvash: "2Pet", scrollmapper: "II Peter", commentary: "2-peter", stepCode: "2Pe", abbrs: ["2pe", "2pet", "2peter"] },
  { slug: "1-john", name: "1 John", testament: "NT", chapters: 5, audioNum: "62", aruljohn: "1John", midvash: "1John", scrollmapper: "I John", commentary: "1-john", stepCode: "1Jn", abbrs: ["1jn", "1jo", "1john"] },
  { slug: "2-john", name: "2 John", testament: "NT", chapters: 1, audioNum: "63", aruljohn: "2John", midvash: "2John", scrollmapper: "II John", commentary: "2-john", stepCode: "2Jn", abbrs: ["2jn", "2jo", "2john"] },
  { slug: "3-john", name: "3 John", testament: "NT", chapters: 1, audioNum: "64", aruljohn: "3John", midvash: "3John", scrollmapper: "III John", commentary: "3-john", stepCode: "3Jn", abbrs: ["3jn", "3jo", "3john"] },
  { slug: "jude", name: "Jude", testament: "NT", chapters: 1, audioNum: "65", aruljohn: "Jude", midvash: "Jude", scrollmapper: "Jude", commentary: "jude", stepCode: "Jud", abbrs: ["jud", "jude"] },
  { slug: "revelation", name: "Revelation", testament: "NT", chapters: 22, audioNum: "66", aruljohn: "Revelation", midvash: "Rev", scrollmapper: "Revelation of John", commentary: "revelation", stepCode: "Rev", abbrs: ["rev", "re", "revelation", "apoc"] },
];

export const BOOK_SLUGS = Object.fromEntries(CANON.map((b) => [b.name, b.slug]));

export function bookBySlug(slug) {
  return CANON.find((b) => b.slug === slug) ?? null;
}

export function bookByName(name) {
  return CANON.find((b) => b.name === name) ?? null;
}
