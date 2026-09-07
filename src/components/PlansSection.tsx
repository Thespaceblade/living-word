"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  getPlanProgress,
  getPlansSnapshot,
  getServerPlansSnapshot,
  readingHref,
  subscribePlans,
} from "@/lib/plans";
import { PLAN_TOPICS, READING_PLANS } from "@/lib/plans-data";

type Props = {
  version: string;
};

export function PlansSection({ version }: Props) {
  const store = useSyncExternalStore(
    subscribePlans,
    getPlansSnapshot,
    getServerPlansSnapshot,
  );
  const [topic, setTopic] = useState<string | null>(null);

  const plans = useMemo(
    () =>
      topic
        ? READING_PLANS.filter((plan) => plan.topic === topic)
        : READING_PLANS,
    [topic],
  );

  return (
    <section className="home-plans" aria-labelledby="home-plans-title">
      <div className="home-section__head">
        <h2 id="home-plans-title">Reading plans</h2>
        <p>Topical paths through Genesis, Psalms, and John.</p>
      </div>

      <div className="plan-topics" role="tablist" aria-label="Plan topics">
        <button
          type="button"
          role="tab"
          aria-selected={topic == null}
          className={`plan-topics__chip ${topic == null ? "is-active" : ""}`}
          onClick={() => setTopic(null)}
        >
          All
        </button>
        {PLAN_TOPICS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={topic === item}
            className={`plan-topics__chip ${topic === item ? "is-active" : ""}`}
            onClick={() => setTopic(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <ul className="plan-grid">
        {plans.map((plan, index) => {
          const progress = getPlanProgress(store, plan.id);
          const done = progress.completedDays.length;
          const total = plan.days.length;
          const complete = done >= total;
          const resumeDay = complete
            ? total
            : Math.min(progress.currentDay, total);
          const day =
            plan.days.find((d) => d.day === resumeDay) ?? plan.days[0];
          const reading = day.readings[0];
          const href = readingHref(version, reading, plan.id, day.day);
          const pct = Math.round((done / total) * 100);

          return (
            <li
              key={plan.id}
              className="plan-card"
              style={{ ["--i" as string]: index }}
            >
              <Link href={`/plans/${plan.id}`} className="plan-card__media">
                <Image
                  src={plan.image}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 100vw, 420px"
                  className="plan-card__img"
                />
                <span className="plan-card__topic">{plan.topic}</span>
              </Link>
              <div className="plan-card__body">
                <div className="plan-card__copy">
                  <h3>
                    <Link href={`/plans/${plan.id}`}>{plan.title}</Link>
                  </h3>
                  <p>{plan.description}</p>
                  <p className="plan-card__meta">
                    {plan.lengthLabel}
                    {done > 0 ? ` · ${done}/${total}` : null}
                  </p>
                  {done > 0 ? (
                    <div
                      className="plan-progress"
                      aria-label={`${pct}% complete`}
                    >
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  ) : null}
                </div>
                <div className="plan-card__actions">
                  <Link className="cta" href={href}>
                    {done === 0
                      ? "Start"
                      : complete
                        ? "Read again"
                        : `Continue day ${resumeDay}`}
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
