import Link from "next/link";
import { getCatalog } from "@/lib/content";

export default function HomePage() {
  const catalog = getCatalog();
  const first = catalog.books[0];

  return (
    <div className="landing">
      <section className="landing__frame">
        <p className="eyebrow">Private study surface</p>
        <h1 className="landing__brand">Living Word</h1>
        <p className="landing__lede">
          A stripped scripture desk: click a verse, open the intel panel, read
          commentary already tagged to that exact reference.
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
