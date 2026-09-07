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
  days: PlanDay[];
};

export type DailyVerse = {
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  teaser: string;
};

/** Static plans limited to the current library (Genesis, Psalms, John). */
export const READING_PLANS: ReadingPlan[] = [
  {
    id: "gospel-of-john",
    title: "Gospel of John",
    description: "One chapter a day through John’s account of Christ.",
    lengthLabel: "21 days",
    days: Array.from({ length: 21 }, (_, i) => ({
      day: i + 1,
      title: `John ${i + 1}`,
      readings: [{ slug: "john", book: "John", chapter: i + 1 }],
    })),
  },
  {
    id: "creation-week",
    title: "Creation Week",
    description: "Walk Genesis 1–7 and rest in the story of beginnings.",
    lengthLabel: "7 days",
    days: [
      {
        day: 1,
        title: "In the beginning",
        readings: [{ slug: "genesis", book: "Genesis", chapter: 1 }],
      },
      {
        day: 2,
        title: "Garden and breath",
        readings: [{ slug: "genesis", book: "Genesis", chapter: 2 }],
      },
      {
        day: 3,
        title: "Fall and promise",
        readings: [{ slug: "genesis", book: "Genesis", chapter: 3 }],
      },
      {
        day: 4,
        title: "Cain and Abel",
        readings: [{ slug: "genesis", book: "Genesis", chapter: 4 }],
      },
      {
        day: 5,
        title: "Generations",
        readings: [{ slug: "genesis", book: "Genesis", chapter: 5 }],
      },
      {
        day: 6,
        title: "The flood begins",
        readings: [{ slug: "genesis", book: "Genesis", chapter: 6 }],
      },
      {
        day: 7,
        title: "Through the waters",
        readings: [{ slug: "genesis", book: "Genesis", chapter: 7 }],
      },
    ],
  },
  {
    id: "shepherd-psalms",
    title: "Shepherd Psalms",
    description: "A short path of trust, repentance, and praise.",
    lengthLabel: "10 days",
    days: [
      {
        day: 1,
        title: "Two ways",
        readings: [{ slug: "psalms", book: "Psalms", chapter: 1 }],
      },
      {
        day: 2,
        title: "The Lord is my shepherd",
        readings: [
          { slug: "psalms", book: "Psalms", chapter: 23, verse: 1 },
        ],
      },
      {
        day: 3,
        title: "The Lord is my light",
        readings: [{ slug: "psalms", book: "Psalms", chapter: 27 }],
      },
      {
        day: 4,
        title: "God is our refuge",
        readings: [{ slug: "psalms", book: "Psalms", chapter: 46 }],
      },
      {
        day: 5,
        title: "Create in me a clean heart",
        readings: [{ slug: "psalms", book: "Psalms", chapter: 51 }],
      },
      {
        day: 6,
        title: "Dwelling place",
        readings: [{ slug: "psalms", book: "Psalms", chapter: 90 }],
      },
      {
        day: 7,
        title: "Make a joyful noise",
        readings: [{ slug: "psalms", book: "Psalms", chapter: 100 }],
      },
      {
        day: 8,
        title: "Bless the Lord",
        readings: [{ slug: "psalms", book: "Psalms", chapter: 103 }],
      },
      {
        day: 9,
        title: "Your word is a lamp",
        readings: [
          { slug: "psalms", book: "Psalms", chapter: 119, verse: 105 },
        ],
      },
      {
        day: 10,
        title: "I lift up my eyes",
        readings: [{ slug: "psalms", book: "Psalms", chapter: 121 }],
      },
    ],
  },
];

export const DAILY_VERSES: DailyVerse[] = [
  {
    book: "John",
    slug: "john",
    chapter: 3,
    verse: 16,
    teaser: "For God so loved the world…",
  },
  {
    book: "John",
    slug: "john",
    chapter: 1,
    verse: 1,
    teaser: "In the beginning was the Word…",
  },
  {
    book: "John",
    slug: "john",
    chapter: 8,
    verse: 12,
    teaser: "I am the light of the world…",
  },
  {
    book: "John",
    slug: "john",
    chapter: 14,
    verse: 6,
    teaser: "I am the way, the truth, and the life…",
  },
  {
    book: "John",
    slug: "john",
    chapter: 11,
    verse: 25,
    teaser: "I am the resurrection, and the life…",
  },
  {
    book: "Psalms",
    slug: "psalms",
    chapter: 23,
    verse: 1,
    teaser: "The Lord is my shepherd…",
  },
  {
    book: "Psalms",
    slug: "psalms",
    chapter: 46,
    verse: 1,
    teaser: "God is our refuge and strength…",
  },
  {
    book: "Psalms",
    slug: "psalms",
    chapter: 119,
    verse: 105,
    teaser: "Thy word is a lamp unto my feet…",
  },
  {
    book: "Psalms",
    slug: "psalms",
    chapter: 27,
    verse: 1,
    teaser: "The Lord is my light and my salvation…",
  },
  {
    book: "Genesis",
    slug: "genesis",
    chapter: 1,
    verse: 1,
    teaser: "In the beginning God created…",
  },
  {
    book: "Genesis",
    slug: "genesis",
    chapter: 1,
    verse: 27,
    teaser: "God created man in his own image…",
  },
  {
    book: "Genesis",
    slug: "genesis",
    chapter: 12,
    verse: 2,
    teaser: "I will make of thee a great nation…",
  },
];

export function getPlan(id: string): ReadingPlan | null {
  return READING_PLANS.find((plan) => plan.id === id) ?? null;
}

export function getDailyVerseForDate(date = new Date()): DailyVerse {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const now = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfYear = Math.floor((now - start) / 86_400_000);
  return DAILY_VERSES[(dayOfYear - 1) % DAILY_VERSES.length] ?? DAILY_VERSES[0];
}
