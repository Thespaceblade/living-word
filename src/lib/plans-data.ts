export type PlanReading = {
  slug: string;
  book: string;
  chapter: number;
};

export type PlanDay = {
  day: number;
  title: string;
  /** One or more full chapters for the day (never a single-verse tease). */
  readings: PlanReading[];
};

export type ReadingPlan = {
  id: string;
  title: string;
  description: string;
  lengthLabel: string;
  topic: string;
  image: string;
  /** Short credit for the shape of the plan (PD / common ministry patterns). */
  sourceNote: string;
  days: PlanDay[];
};

export type DailyVerse = {
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  teaser: string;
};

function ch(book: string, slug: string, chapter: number): PlanReading {
  return { book, slug, chapter };
}

function john(chapter: number) {
  return ch("John", "john", chapter);
}

function gen(chapter: number) {
  return ch("Genesis", "genesis", chapter);
}

function psa(chapter: number) {
  return ch("Psalms", "psalms", chapter);
}

function johnChapterDays(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => {
    const chapter = start + i;
    return {
      day: i + 1,
      title: `John ${chapter}`,
      readings: [john(chapter)],
    };
  });
}

/**
 * Topical plans limited to Genesis / Psalms / John.
 * Day units follow common online plan practice: full chapters
 * (and sometimes two related chapters), not single-verse snippets.
 */
export const READING_PLANS: ReadingPlan[] = [
  {
    id: "gospel-of-john",
    title: "Gospel of John",
    description:
      "A classic 21-day walk—one full chapter a day through John’s Gospel.",
    lengthLabel: "21 days",
    topic: "Gospel",
    image: "/plans/john.jpg",
    sourceNote: "Pattern: Bible.com / Learn of Christ “Journey through John”",
    days: johnChapterDays(1, 21),
  },
  {
    id: "creation-week",
    title: "Creation Week",
    description:
      "Seven full chapters from Genesis beginnings through the flood narrative.",
    lengthLabel: "7 days",
    topic: "Beginnings",
    image: "/plans/creation.jpg",
    sourceNote: "Pattern: beginner Genesis chapter-a-day surveys",
    days: [
      { day: 1, title: "Creation", readings: [gen(1)] },
      { day: 2, title: "Garden", readings: [gen(2)] },
      { day: 3, title: "Fall", readings: [gen(3)] },
      { day: 4, title: "Cain and Abel", readings: [gen(4)] },
      { day: 5, title: "Generations", readings: [gen(5)] },
      { day: 6, title: "Corruption and ark", readings: [gen(6)] },
      { day: 7, title: "The flood", readings: [gen(7)] },
    ],
  },
  {
    id: "shepherd-psalms",
    title: "Shepherd Psalms",
    description:
      "Ten full psalms of trust, repentance, and praise—one psalm each day.",
    lengthLabel: "10 days",
    topic: "Trust",
    image: "/plans/shepherd.jpg",
    sourceNote: "Pattern: “Psalms of Comfort” / shepherd devotionals",
    days: [
      { day: 1, title: "Two ways", readings: [psa(1)] },
      { day: 2, title: "The Lord is my shepherd", readings: [psa(23)] },
      { day: 3, title: "The Lord is my light", readings: [psa(27)] },
      { day: 4, title: "God is our refuge", readings: [psa(46)] },
      { day: 5, title: "Create in me a clean heart", readings: [psa(51)] },
      { day: 6, title: "Dwelling place", readings: [psa(90)] },
      { day: 7, title: "Make a joyful noise", readings: [psa(100)] },
      { day: 8, title: "Bless the Lord", readings: [psa(103)] },
      { day: 9, title: "Your word is a lamp", readings: [psa(119)] },
      { day: 10, title: "I lift up my eyes", readings: [psa(121)] },
    ],
  },
  {
    id: "light-of-the-world",
    title: "Light of the World",
    description:
      "Follow John’s light theme through full chapters (sometimes two related chapters), ending in a psalm of courage.",
    lengthLabel: "6 days",
    topic: "Light",
    image: "/plans/light.jpg",
    sourceNote: "Pattern: topical John light plans (chs. 1, 3, 8–9, 11–12)",
    days: [
      { day: 1, title: "Light in the beginning", readings: [john(1)] },
      { day: 2, title: "Light and judgment", readings: [john(3)] },
      { day: 3, title: "I am the light · sight to the blind", readings: [john(8), john(9)] },
      { day: 4, title: "Light and Lazarus", readings: [john(11)] },
      { day: 5, title: "Walk while ye have light", readings: [john(12)] },
      { day: 6, title: "The Lord is my light", readings: [psa(27)] },
    ],
  },
  {
    id: "living-water",
    title: "Living Water",
    description:
      "Wells, floods, and living water—full Genesis, John, and Psalm chapters.",
    lengthLabel: "8 days",
    topic: "Water",
    image: "/plans/water.jpg",
    sourceNote: "Pattern: topical “living water” chapter surveys",
    days: [
      { day: 1, title: "Waters of creation", readings: [gen(1)] },
      { day: 2, title: "Through the flood", readings: [gen(7), gen(8)] },
      { day: 3, title: "Hagar and the well", readings: [gen(21)] },
      { day: 4, title: "Jacob’s well", readings: [john(4)] },
      { day: 5, title: "Pool of Bethesda", readings: [john(5)] },
      { day: 6, title: "Rivers of living water", readings: [john(7)] },
      { day: 7, title: "Beside still waters", readings: [psa(23)] },
      { day: 8, title: "Blood and water", readings: [john(19)] },
    ],
  },
  {
    id: "faith-of-abraham",
    title: "Faith of Abraham",
    description:
      "Abraham’s call to the offering—shaped like YouVersion “Climbing with Abraham,” chapter by chapter.",
    lengthLabel: "10 days",
    topic: "Faith",
    image: "/plans/abraham.jpg",
    sourceNote: "Pattern: Climbing with Abraham / Genesis faith arcs",
    days: [
      { day: 1, title: "Before the call", readings: [gen(11)] },
      { day: 2, title: "Go to a land", readings: [gen(12)] },
      { day: 3, title: "Promise and altar", readings: [gen(13)] },
      { day: 4, title: "Covenant cut", readings: [gen(15)] },
      { day: 5, title: "Hagar and the promise", readings: [gen(16), gen(17)] },
      { day: 6, title: "Visitors at Mamre", readings: [gen(18)] },
      { day: 7, title: "Birth of Isaac", readings: [gen(21)] },
      { day: 8, title: "The offering", readings: [gen(22)] },
      { day: 9, title: "A burial place", readings: [gen(23)] },
      { day: 10, title: "A bride for Isaac", readings: [gen(24)] },
    ],
  },
  {
    id: "songs-of-ascent",
    title: "Songs of Ascent",
    description:
      "Pilgrim psalms of going up—each day a full song of ascent.",
    lengthLabel: "8 days",
    topic: "Pilgrimage",
    image: "/plans/ascent.jpg",
    sourceNote: "Pattern: Songs of Ascent / pilgrimage psalm plans",
    days: [
      { day: 1, title: "I lift up my eyes", readings: [psa(121)] },
      { day: 2, title: "Unto thee I lift", readings: [psa(123)] },
      { day: 3, title: "If it had not been", readings: [psa(124)] },
      { day: 4, title: "They that trust", readings: [psa(125)] },
      { day: 5, title: "When the Lord turned", readings: [psa(126)] },
      { day: 6, title: "Except the Lord build", readings: [psa(127)] },
      { day: 7, title: "Blessed is every one", readings: [psa(128)] },
      { day: 8, title: "Behold, how good", readings: [psa(133)] },
    ],
  },
  {
    id: "bread-of-life",
    title: "Bread of Life",
    description:
      "Feeding, hunger, and the bread discourse—full chapters around John’s table.",
    lengthLabel: "5 days",
    topic: "Provision",
    image: "/plans/bread.jpg",
    sourceNote: "Pattern: John 6 “Bread of Life” chapter studies",
    days: [
      { day: 1, title: "Five thousand and the bread", readings: [john(6)] },
      { day: 2, title: "Taste and see", readings: [psa(34)] },
      { day: 3, title: "Open thy mouth wide", readings: [psa(81)] },
      { day: 4, title: "The lamp of the word", readings: [psa(119)] },
      { day: 5, title: "Breakfast by the sea", readings: [john(21)] },
    ],
  },
  {
    id: "love-one-another",
    title: "Love One Another",
    description:
      "Upper-room love through full farewell chapters in John, plus a psalm of mercy.",
    lengthLabel: "7 days",
    topic: "Love",
    image: "/plans/love.jpg",
    sourceNote: "Pattern: John farewell / love commandment plans",
    days: [
      { day: 1, title: "God so loved", readings: [john(3)] },
      { day: 2, title: "A new commandment", readings: [john(13)] },
      { day: 3, title: "Let not your heart", readings: [john(14)] },
      { day: 4, title: "Abide in me", readings: [john(15)] },
      { day: 5, title: "The Spirit of truth", readings: [john(16)] },
      { day: 6, title: "That they may be one", readings: [john(17)] },
      { day: 7, title: "His mercy endureth", readings: [psa(136)] },
    ],
  },
  {
    id: "be-not-afraid",
    title: "Be Not Afraid",
    description:
      "Courage when fear rises—full chapters of promise in Genesis, Psalms, and John.",
    lengthLabel: "8 days",
    topic: "Courage",
    image: "/plans/courage.jpg",
    sourceNote: "Pattern: topical fear-not / courage chapter plans",
    days: [
      { day: 1, title: "Fear not, Abram", readings: [gen(15)] },
      { day: 2, title: "I am with thee", readings: [gen(26)] },
      { day: 3, title: "Whom shall I fear", readings: [psa(27)] },
      { day: 4, title: "God is our refuge", readings: [psa(46)] },
      { day: 5, title: "It is I; be not afraid", readings: [john(6)] },
      { day: 6, title: "Peace I leave with you", readings: [john(14)] },
      { day: 7, title: "Be of good cheer", readings: [john(16)] },
      { day: 8, title: "What time I am afraid", readings: [psa(56)] },
    ],
  },
  {
    id: "i-am-sayings",
    title: "I Am Sayings",
    description:
      "Seven I Am revelations—each day the full John chapter that holds the saying.",
    lengthLabel: "7 days",
    topic: "Christ",
    image: "/plans/iam.jpg",
    sourceNote: "Pattern: Bible.com / church “7 I Am” chapter plans",
    days: [
      { day: 1, title: "Bread of life", readings: [john(6)] },
      { day: 2, title: "Light of the world", readings: [john(8), john(9)] },
      { day: 3, title: "Door of the sheep", readings: [john(10)] },
      { day: 4, title: "Good shepherd", readings: [john(10), psa(23)] },
      { day: 5, title: "Resurrection and the life", readings: [john(11)] },
      { day: 6, title: "Way, truth, and life", readings: [john(14)] },
      { day: 7, title: "True vine", readings: [john(15)] },
    ],
  },
  {
    id: "beginnings",
    title: "Beginnings",
    description:
      "Genesis foundations—creation to Abraham’s call, one chapter a day.",
    lengthLabel: "12 days",
    topic: "Beginnings",
    image: "/plans/beginnings.jpg",
    sourceNote: "Pattern: Learn of Christ “Genesis: Foundations of Faith”",
    days: Array.from({ length: 12 }, (_, i) => ({
      day: i + 1,
      title: `Genesis ${i + 1}`,
      readings: [gen(i + 1)],
    })),
  },
  {
    id: "praise-and-wonder",
    title: "Praise & Wonder",
    description:
      "Full psalms that lift the eyes—praise for every season.",
    lengthLabel: "9 days",
    topic: "Praise",
    image: "/plans/praise.jpg",
    sourceNote: "Pattern: praise-psalm devotionals",
    days: [
      { day: 1, title: "The heavens declare", readings: [psa(19)] },
      { day: 2, title: "The earth is the Lord’s", readings: [psa(24)] },
      { day: 3, title: "Great is the Lord", readings: [psa(48)] },
      { day: 4, title: "Make a joyful noise", readings: [psa(100)] },
      { day: 5, title: "Bless the Lord", readings: [psa(103)] },
      { day: 6, title: "O give thanks", readings: [psa(107)] },
      { day: 7, title: "I will lift up", readings: [psa(121)] },
      { day: 8, title: "His mercy endureth", readings: [psa(136)] },
      { day: 9, title: "Praise ye the Lord", readings: [psa(150)] },
    ],
  },
  {
    id: "the-word",
    title: "The Word",
    description:
      "Christ the Word and the word that lights the path—full chapters only.",
    lengthLabel: "7 days",
    topic: "Scripture",
    image: "/plans/word.jpg",
    sourceNote: "Pattern: Word / Logos chapter plans in John & Psalms",
    days: [
      { day: 1, title: "In the beginning was the Word", readings: [john(1)] },
      { day: 2, title: "Thy word is a lamp", readings: [psa(119)] },
      { day: 3, title: "The words of eternal life", readings: [john(6)] },
      { day: 4, title: "Continue in my word", readings: [john(8)] },
      { day: 5, title: "Sanctify them through thy truth", readings: [john(17)] },
      { day: 6, title: "These are written", readings: [john(20)] },
      { day: 7, title: "More to be desired", readings: [psa(19)] },
    ],
  },
  {
    id: "who-is-jesus",
    title: "Who Is Jesus?",
    description:
      "Seven full John chapters that answer who He is—from Word to risen Lord.",
    lengthLabel: "7 days",
    topic: "Christ",
    image: "/plans/john.jpg",
    sourceNote: "Pattern: Learn of Christ “Who Is Jesus?”",
    days: [
      { day: 1, title: "The Word made flesh", readings: [john(1)] },
      { day: 2, title: "God so loved the world", readings: [john(3)] },
      { day: 3, title: "The good shepherd", readings: [john(10)] },
      { day: 4, title: "The way, truth, and life", readings: [john(14)] },
      { day: 5, title: "The true vine", readings: [john(15)] },
      { day: 6, title: "It is finished", readings: [john(19)] },
      { day: 7, title: "My Lord and my God", readings: [john(20)] },
    ],
  },
];

export const DAILY_VERSES: DailyVerse[] = [
  { book: "John", slug: "john", chapter: 3, verse: 16, teaser: "For God so loved the world…" },
  { book: "John", slug: "john", chapter: 1, verse: 1, teaser: "In the beginning was the Word…" },
  { book: "John", slug: "john", chapter: 8, verse: 12, teaser: "I am the light of the world…" },
  { book: "John", slug: "john", chapter: 14, verse: 6, teaser: "I am the way, the truth, and the life…" },
  { book: "John", slug: "john", chapter: 11, verse: 25, teaser: "I am the resurrection, and the life…" },
  { book: "Psalms", slug: "psalms", chapter: 23, verse: 1, teaser: "The Lord is my shepherd…" },
  { book: "Psalms", slug: "psalms", chapter: 46, verse: 1, teaser: "God is our refuge and strength…" },
  { book: "Psalms", slug: "psalms", chapter: 119, verse: 105, teaser: "Thy word is a lamp unto my feet…" },
  { book: "Psalms", slug: "psalms", chapter: 27, verse: 1, teaser: "The Lord is my light and my salvation…" },
  { book: "Genesis", slug: "genesis", chapter: 1, verse: 1, teaser: "In the beginning God created…" },
  { book: "Genesis", slug: "genesis", chapter: 1, verse: 27, teaser: "God created man in his own image…" },
  { book: "Genesis", slug: "genesis", chapter: 12, verse: 2, teaser: "I will make of thee a great nation…" },
];

export function getPlan(id: string): ReadingPlan | null {
  return READING_PLANS.find((plan) => plan.id === id) ?? null;
}

export function formatDayReadings(readings: PlanReading[]): string {
  return readings
    .map((r) => `${r.book} ${r.chapter}`)
    .join(" · ");
}

export function getDailyVerseForDate(date = new Date()): DailyVerse {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const now = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const dayOfYear = Math.floor((now - start) / 86_400_000);
  return DAILY_VERSES[(dayOfYear - 1) % DAILY_VERSES.length] ?? DAILY_VERSES[0];
}

export const PLAN_TOPICS = Array.from(
  new Set(READING_PLANS.map((p) => p.topic)),
).sort();
