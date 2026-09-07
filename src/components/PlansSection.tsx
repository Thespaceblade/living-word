"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getPlanProgress,
  getPlansSnapshot,
  getServerPlansSnapshot,
  readingHref,
  subscribePlans,
} from "@/lib/plans";
import { READING_PLANS } from "@/lib/plans-data";

type Props = {
  version: string;
};

export function PlansSection({ version }: Props) {
  const store = useSyncExternalStore(
    subscribePlans,
    getPlansSnapshot,
    getServerPlansSnapshot,
  );

  return (
    <section className="home-plans" aria-labelledby="home-plans-title">
      <div className="home-section__head">
        <h2 id="home-plans-title">Reading plans</h2>
        <p>Short paths through the books already in this library.</p>
      </div>
      <ul className="home-plans__list">
        {READING_PLANS.map((plan) => {
          const progress = getPlanProgress(store, plan.id);
          const done = progress.completedDays.length;
          const total = plan.days.length;
          const complete = done >= total;
          const resumeDay = complete
            ? total
            : Math.min(progress.currentDay, total);
          const day = plan.days.find((d) => d.day === resumeDay) ?? plan.days[0];
          const reading = day.readings[0];
          const href = readingHref(version, reading, plan.id, day.day);

          return (
            <li key={plan.id}>
              <article className="home-plan">
                <div className="home-plan__copy">
                  <h3>{plan.title}</h3>
                  <p>{plan.description}</p>
                  <p className="home-plan__meta">
                    {plan.lengthLabel}
                    {done > 0
                      ? ` · ${done}/${total} complete`
                      : null}
                  </p>
                </div>
                <div className="home-plan__actions">
                  <Link className="cta" href={href}>
                    {done === 0
                      ? "Start"
                      : complete
                        ? "Read again"
                        : `Continue day ${resumeDay}`}
                  </Link>
                  <Link className="cta cta--ghost" href={`/plans/${plan.id}`}>
                    View days
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
