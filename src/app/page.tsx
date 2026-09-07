import Link from "next/link";
import { LivingWordLogo } from "@/components/LivingWordLogo";
import { getCatalog } from "@/lib/content";

export default function HomePage() {
  const catalog = getCatalog();
  const first = catalog.books[0];
  const version = catalog.versions[0]?.id ?? "kjv";

  return (
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
  );
}
