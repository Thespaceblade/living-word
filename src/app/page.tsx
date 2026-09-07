import Link from "next/link";
import { LivingWordLogo } from "@/components/LivingWordLogo";
import { PlansSection } from "@/components/PlansSection";
import { getCatalog, getVerseText } from "@/lib/content";
import { getDailyVerseForDate } from "@/lib/plans-data";

export default function HomePage() {
  const catalog = getCatalog();
  const first = catalog.books[0];
  const version = catalog.versions[0]?.id ?? "kjv";
  const daily = getDailyVerseForDate();
  const dailyText =
    getVerseText(version, daily.slug, daily.chapter, daily.verse) ??
    daily.teaser;

  return (
    <div className="home">
      <div className="landing">
        <section className="landing__frame">
          <LivingWordLogo size="lg" className="landing__logo" />
          <p className="landing__lede">
            A clean place to read Scripture. Choose a version, open a chapter,
            jump to any verse, and read commentary tagged to that reference.
          </p>
          <div className="cta-row">
            <Link
              className="cta"
              href={`/read/${version}/${first?.slug ?? "john"}/1`}
            >
              Open reader
            </Link>
            <Link className="cta cta--ghost" href={`/read/${version}/john/3`}>
              Jump to John 3
            </Link>
          </div>
        </section>
      </div>

      <section className="home-daily" aria-labelledby="daily-verse-title">
        <div className="home-section__head">
          <h2 id="daily-verse-title">Today’s verse</h2>
          <p>A short word for the day from this library.</p>
        </div>
        <blockquote className="home-daily__quote">
          <p>{dailyText}</p>
          <footer>
            <cite>
              {daily.book} {daily.chapter}:{daily.verse}
            </cite>
            <Link
              className="cta cta--ghost"
              href={`/read/${version}/${daily.slug}/${daily.chapter}?verse=${daily.verse}`}
            >
              Read in context
            </Link>
          </footer>
        </blockquote>
      </section>

      <PlansSection version={version} />
    </div>
  );
}
