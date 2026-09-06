import Link from "next/link";
import { getCatalog } from "@/lib/content";

export default function HomePage() {
  const catalog = getCatalog();
  const first = catalog.books[0];

  return (
    <div className="landing">
      <section className="landing__frame">
        <p className="eyebrow">Holy Bible</p>
        <h1 className="landing__brand">Living Word</h1>
        <p className="landing__lede">
          A clean place to read Scripture. Open a chapter, click a verse, and
          see commentary already tagged to that exact reference.
        </p>
        <div className="cta-row">
          <Link className="cta" href={`/read/${first?.slug ?? "john"}/1`}>
            Open reader
          </Link>
          <Link className="cta cta--ghost" href="/read/john/3">
            Jump to John 3
          </Link>
        </div>
      </section>
    </div>
  );
}
