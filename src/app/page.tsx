import Link from "next/link";
import { getCatalog } from "@/lib/content";

export default function HomePage() {
  const catalog = getCatalog();
  const first = catalog.books[0];
  const version = catalog.versions[0]?.id ?? "kjv";

  return (
    <div className="landing">
      <section className="landing__frame">
        <p className="eyebrow">Holy Bible</p>
        <h1 className="landing__brand">Living Word</h1>
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
