export type PlanReading = {
  slug: string;
  book: string;
  chapter: number;
  /** Optional verse to focus when opening the day. */
  verse?: number;
};

export type PlanDay = {
  day: number;
  title: string;
  readings: PlanReading[];
};

export type ReadingPlan = {
  id: string;
  title: string;
  description: string;
  lengthLabel: string;
  topic: string;
  image: string;
  days: PlanDay[];
};

export type DailyVerse = {
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  teaser: string;
};

function johnChapterDays(start: number, end: number, titleFor: (n: number) => string) {
  return Array.from({ length: end - start + 1 }, (_, i) => {
    const chapter = start + i;
    return {
      day: i + 1,
      title: titleFor(chapter),
      readings: [{ slug: "john", book: "John", chapter }],
    };
  });
}

/** Topical plans limited to the current library (Genesis, Psalms, John). */
export const READING_PLANS: ReadingPlan[] = [
  {
    id: "gospel-of-john",
    title: "Gospel of John",
    description: "One chapter a day through John’s account of Christ.",
    lengthLabel: "21 days",
    topic: "Gospel",
    image: "/plans/john.jpg",
    days: johnChapterDays(1, 21, (n) => `John ${n}`),
  },
  {
    id: "creation-week",
    title: "Creation Week",
    description: "Walk Genesis 1–7 and rest in the story of beginnings.",
    lengthLabel: "7 days",
    topic: "Beginnings",
    image: "/plans/creation.jpg",
    days: [
      { day: 1, title: "In the beginning", readings: [{ slug: "genesis", book: "Genesis", chapter: 1 }] },
      { day: 2, title: "Garden and breath", readings: [{ slug: "genesis", book: "Genesis", chapter: 2 }] },
      { day: 3, title: "Fall and promise", readings: [{ slug: "genesis", book: "Genesis", chapter: 3 }] },
      { day: 4, title: "Cain and Abel", readings: [{ slug: "genesis", book: "Genesis", chapter: 4 }] },
      { day: 5, title: "Generations", readings: [{ slug: "genesis", book: "Genesis", chapter: 5 }] },
      { day: 6, title: "The flood begins", readings: [{ slug: "genesis", book: "Genesis", chapter: 6 }] },
      { day: 7, title: "Through the waters", readings: [{ slug: "genesis", book: "Genesis", chapter: 7 }] },
    ],
  },
  {
    id: "shepherd-psalms",
    title: "Shepherd Psalms",
    description: "A short path of trust, repentance, and praise.",
    lengthLabel: "10 days",
    topic: "Trust",
    image: "/plans/shepherd.jpg",
    days: [
      { day: 1, title: "Two ways", readings: [{ slug: "psalms", book: "Psalms", chapter: 1 }] },
      { day: 2, title: "The Lord is my shepherd", readings: [{ slug: "psalms", book: "Psalms", chapter: 23, verse: 1 }] },
      { day: 3, title: "The Lord is my light", readings: [{ slug: "psalms", book: "Psalms", chapter: 27 }] },
      { day: 4, title: "God is our refuge", readings: [{ slug: "psalms", book: "Psalms", chapter: 46 }] },
      { day: 5, title: "Create in me a clean heart", readings: [{ slug: "psalms", book: "Psalms", chapter: 51 }] },
      { day: 6, title: "Dwelling place", readings: [{ slug: "psalms", book: "Psalms", chapter: 90 }] },
      { day: 7, title: "Make a joyful noise", readings: [{ slug: "psalms", book: "Psalms", chapter: 100 }] },
      { day: 8, title: "Bless the Lord", readings: [{ slug: "psalms", book: "Psalms", chapter: 103 }] },
      { day: 9, title: "Your word is a lamp", readings: [{ slug: "psalms", book: "Psalms", chapter: 119, verse: 105 }] },
      { day: 10, title: "I lift up my eyes", readings: [{ slug: "psalms", book: "Psalms", chapter: 121 }] },
    ],
  },
  {
    id: "light-of-the-world",
    title: "Light of the World",
    description: "Follow John’s theme of light breaking into darkness.",
    lengthLabel: "7 days",
    topic: "Light",
    image: "/plans/light.jpg",
    days: [
      { day: 1, title: "The true Light", readings: [{ slug: "john", book: "John", chapter: 1, verse: 4 }] },
      { day: 2, title: "Men loved darkness", readings: [{ slug: "john", book: "John", chapter: 3, verse: 19 }] },
      { day: 3, title: "I am the light", readings: [{ slug: "john", book: "John", chapter: 8, verse: 12 }] },
      { day: 4, title: "While ye have light", readings: [{ slug: "john", book: "John", chapter: 9 }] },
      { day: 5, title: "Walk in the day", readings: [{ slug: "john", book: "John", chapter: 11, verse: 9 }] },
      { day: 6, title: "Believe in the light", readings: [{ slug: "john", book: "John", chapter: 12, verse: 35 }] },
      { day: 7, title: "Lord, my light", readings: [{ slug: "psalms", book: "Psalms", chapter: 27, verse: 1 }] },
    ],
  },
  {
    id: "living-water",
    title: "Living Water",
    description: "Wells, rivers, and the water Christ gives.",
    lengthLabel: "8 days",
    topic: "Water",
    image: "/plans/water.jpg",
    days: [
      { day: 1, title: "Waters of creation", readings: [{ slug: "genesis", book: "Genesis", chapter: 1, verse: 2 }] },
      { day: 2, title: "Through the flood", readings: [{ slug: "genesis", book: "Genesis", chapter: 7 }] },
      { day: 3, title: "Hagar’s well", readings: [{ slug: "genesis", book: "Genesis", chapter: 21 }] },
      { day: 4, title: "Jacob’s well", readings: [{ slug: "john", book: "John", chapter: 4 }] },
      { day: 5, title: "Pool of Bethesda", readings: [{ slug: "john", book: "John", chapter: 5 }] },
      { day: 6, title: "Rivers of living water", readings: [{ slug: "john", book: "John", chapter: 7, verse: 37 }] },
      { day: 7, title: "Beside still waters", readings: [{ slug: "psalms", book: "Psalms", chapter: 23 }] },
      { day: 8, title: "Blood and water", readings: [{ slug: "john", book: "John", chapter: 19, verse: 34 }] },
    ],
  },
  {
    id: "faith-of-abraham",
    title: "Faith of Abraham",
    description: "Promise, journey, and trust in Genesis.",
    lengthLabel: "10 days",
    topic: "Faith",
    image: "/plans/abraham.jpg",
    days: [
      { day: 1, title: "Go to a land", readings: [{ slug: "genesis", book: "Genesis", chapter: 12 }] },
      { day: 2, title: "Promise renewed", readings: [{ slug: "genesis", book: "Genesis", chapter: 13 }] },
      { day: 3, title: "Covenant cut", readings: [{ slug: "genesis", book: "Genesis", chapter: 15 }] },
      { day: 4, title: "Hagar and Ishmael", readings: [{ slug: "genesis", book: "Genesis", chapter: 16 }] },
      { day: 5, title: "Names changed", readings: [{ slug: "genesis", book: "Genesis", chapter: 17 }] },
      { day: 6, title: "Visitors at Mamre", readings: [{ slug: "genesis", book: "Genesis", chapter: 18 }] },
      { day: 7, title: "Birth of Isaac", readings: [{ slug: "genesis", book: "Genesis", chapter: 21 }] },
      { day: 8, title: "The offering", readings: [{ slug: "genesis", book: "Genesis", chapter: 22 }] },
      { day: 9, title: "A burial place", readings: [{ slug: "genesis", book: "Genesis", chapter: 23 }] },
      { day: 10, title: "A bride for Isaac", readings: [{ slug: "genesis", book: "Genesis", chapter: 24 }] },
    ],
  },
  {
    id: "songs-of-ascent",
    title: "Songs of Ascent",
    description: "Climb with the pilgrim psalms of going up.",
    lengthLabel: "8 days",
    topic: "Pilgrimage",
    image: "/plans/ascent.jpg",
    days: [
      { day: 1, title: "I lift up my eyes", readings: [{ slug: "psalms", book: "Psalms", chapter: 121 }] },
      { day: 2, title: "Unto the hills", readings: [{ slug: "psalms", book: "Psalms", chapter: 123 }] },
      { day: 3, title: "If it had not been", readings: [{ slug: "psalms", book: "Psalms", chapter: 124 }] },
      { day: 4, title: "They that trust", readings: [{ slug: "psalms", book: "Psalms", chapter: 125 }] },
      { day: 5, title: "When the Lord turned", readings: [{ slug: "psalms", book: "Psalms", chapter: 126 }] },
      { day: 6, title: "Except the Lord build", readings: [{ slug: "psalms", book: "Psalms", chapter: 127 }] },
      { day: 7, title: "Blessed is every one", readings: [{ slug: "psalms", book: "Psalms", chapter: 128 }] },
      { day: 8, title: "Behold, how good", readings: [{ slug: "psalms", book: "Psalms", chapter: 133 }] },
    ],
  },
  {
    id: "bread-of-life",
    title: "Bread of Life",
    description: "Hunger, manna themes, and John’s feeding discourse.",
    lengthLabel: "6 days",
    topic: "Provision",
    image: "/plans/bread.jpg",
    days: [
      { day: 1, title: "Five thousand fed", readings: [{ slug: "john", book: "John", chapter: 6, verse: 1 }] },
      { day: 2, title: "I am the bread", readings: [{ slug: "john", book: "John", chapter: 6, verse: 35 }] },
      { day: 3, title: "Words of life", readings: [{ slug: "john", book: "John", chapter: 6, verse: 60 }] },
      { day: 4, title: "Taste and see", readings: [{ slug: "psalms", book: "Psalms", chapter: 34 }] },
      { day: 5, title: "Open thy mouth wide", readings: [{ slug: "psalms", book: "Psalms", chapter: 81 }] },
      { day: 6, title: "Breakfast by the sea", readings: [{ slug: "john", book: "John", chapter: 21 }] },
    ],
  },
  {
    id: "love-one-another",
    title: "Love One Another",
    description: "Upper-room love from John’s farewell chapters.",
    lengthLabel: "7 days",
    topic: "Love",
    image: "/plans/love.jpg",
    days: [
      { day: 1, title: "God so loved", readings: [{ slug: "john", book: "John", chapter: 3, verse: 16 }] },
      { day: 2, title: "A new commandment", readings: [{ slug: "john", book: "John", chapter: 13 }] },
      { day: 3, title: "Abide in me", readings: [{ slug: "john", book: "John", chapter: 15 }] },
      { day: 4, title: "Another Comforter", readings: [{ slug: "john", book: "John", chapter: 14 }] },
      { day: 5, title: "That they may be one", readings: [{ slug: "john", book: "John", chapter: 17 }] },
      { day: 6, title: "Feed my sheep", readings: [{ slug: "john", book: "John", chapter: 21, verse: 15 }] },
      { day: 7, title: "Steadfast love", readings: [{ slug: "psalms", book: "Psalms", chapter: 136 }] },
    ],
  },
  {
    id: "be-not-afraid",
    title: "Be Not Afraid",
    description: "Courage when fear rises in Genesis, Psalms, and John.",
    lengthLabel: "8 days",
    topic: "Courage",
    image: "/plans/courage.jpg",
    days: [
      { day: 1, title: "Fear not, Abram", readings: [{ slug: "genesis", book: "Genesis", chapter: 15, verse: 1 }] },
      { day: 2, title: "I am with thee", readings: [{ slug: "genesis", book: "Genesis", chapter: 26 }] },
      { day: 3, title: "Whom shall I fear", readings: [{ slug: "psalms", book: "Psalms", chapter: 27 }] },
      { day: 4, title: "God is our refuge", readings: [{ slug: "psalms", book: "Psalms", chapter: 46 }] },
      { day: 5, title: "It is I; be not afraid", readings: [{ slug: "john", book: "John", chapter: 6, verse: 16 }] },
      { day: 6, title: "Let not your heart", readings: [{ slug: "john", book: "John", chapter: 14, verse: 1 }] },
      { day: 7, title: "Peace I leave", readings: [{ slug: "john", book: "John", chapter: 14, verse: 27 }] },
      { day: 8, title: "Be of good cheer", readings: [{ slug: "john", book: "John", chapter: 16, verse: 33 }] },
    ],
  },
  {
    id: "i-am-sayings",
    title: "I Am Sayings",
    description: "Seven days with John’s great I Am revelations.",
    lengthLabel: "7 days",
    topic: "Christ",
    image: "/plans/iam.jpg",
    days: [
      { day: 1, title: "Bread of life", readings: [{ slug: "john", book: "John", chapter: 6, verse: 35 }] },
      { day: 2, title: "Light of the world", readings: [{ slug: "john", book: "John", chapter: 8, verse: 12 }] },
      { day: 3, title: "Door of the sheep", readings: [{ slug: "john", book: "John", chapter: 10, verse: 7 }] },
      { day: 4, title: "Good shepherd", readings: [{ slug: "john", book: "John", chapter: 10, verse: 11 }] },
      { day: 5, title: "Resurrection and life", readings: [{ slug: "john", book: "John", chapter: 11, verse: 25 }] },
      { day: 6, title: "Way, truth, life", readings: [{ slug: "john", book: "John", chapter: 14, verse: 6 }] },
      { day: 7, title: "True vine", readings: [{ slug: "john", book: "John", chapter: 15, verse: 1 }] },
    ],
  },
  {
    id: "beginnings",
    title: "Beginnings",
    description: "From creation to Babel—the early chapters of Genesis.",
    lengthLabel: "11 days",
    topic: "Beginnings",
    image: "/plans/beginnings.jpg",
    days: Array.from({ length: 11 }, (_, i) => ({
      day: i + 1,
      title: `Genesis ${i + 1}`,
      readings: [{ slug: "genesis", book: "Genesis", chapter: i + 1 }],
    })),
  },
  {
    id: "praise-and-wonder",
    title: "Praise & Wonder",
    description: "Psalms that lift the eyes and open the mouth in praise.",
    lengthLabel: "9 days",
    topic: "Praise",
    image: "/plans/praise.jpg",
    days: [
      { day: 1, title: "The heavens declare", readings: [{ slug: "psalms", book: "Psalms", chapter: 19 }] },
      { day: 2, title: "The earth is the Lord’s", readings: [{ slug: "psalms", book: "Psalms", chapter: 24 }] },
      { day: 3, title: "Great is the Lord", readings: [{ slug: "psalms", book: "Psalms", chapter: 48 }] },
      { day: 4, title: "Make a joyful noise", readings: [{ slug: "psalms", book: "Psalms", chapter: 100 }] },
      { day: 5, title: "Bless the Lord", readings: [{ slug: "psalms", book: "Psalms", chapter: 103 }] },
      { day: 6, title: "O give thanks", readings: [{ slug: "psalms", book: "Psalms", chapter: 107 }] },
      { day: 7, title: "I will lift up", readings: [{ slug: "psalms", book: "Psalms", chapter: 121 }] },
      { day: 8, title: "His mercy endureth", readings: [{ slug: "psalms", book: "Psalms", chapter: 136 }] },
      { day: 9, title: "Praise ye the Lord", readings: [{ slug: "psalms", book: "Psalms", chapter: 150 }] },
    ],
  },
  {
    id: "the-word",
    title: "The Word",
    description: "Christ the Word, and the word that lights the path.",
    lengthLabel: "7 days",
    topic: "Scripture",
    image: "/plans/word.jpg",
    days: [
      { day: 1, title: "In the beginning was the Word", readings: [{ slug: "john", book: "John", chapter: 1 }] },
      { day: 2, title: "Thy word is a lamp", readings: [{ slug: "psalms", book: "Psalms", chapter: 119, verse: 105 }] },
      { day: 3, title: "The words of eternal life", readings: [{ slug: "john", book: "John", chapter: 6, verse: 63 }] },
      { day: 4, title: "Sanctify them", readings: [{ slug: "john", book: "John", chapter: 17, verse: 17 }] },
      { day: 5, title: "These are written", readings: [{ slug: "john", book: "John", chapter: 20, verse: 30 }] },
      { day: 6, title: "More to be desired", readings: [{ slug: "psalms", book: "Psalms", chapter: 19 }] },
      { day: 7, title: "Continue ye", readings: [{ slug: "john", book: "John", chapter: 8, verse: 31 }] },
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
