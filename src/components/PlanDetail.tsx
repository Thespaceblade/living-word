"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getPlanProgress,
  getPlansSnapshot,
  getServerPlansSnapshot,
  markPlanDayComplete,
  markPlanDayIncomplete,
  readingHref,
  subscribePlans,
} from "@/lib/plans";
import type { ReadingPlan } from "@/lib/plans-data";

type Props = {
  plan: ReadingPlan;
  version: string;
};

export function PlanDetail({ plan, version }: Props) {
  const store = useSyncExternalStore(
    subscribePlans,
    getPlansSnapshot,
    getServerPlansSnapshot,
  );
  const progress = getPlanProgress(store, plan.id);
  const done = new Set(progress.completedDays);

  return (
    <div className="plan-detail">
      <header className="plan-detail__head">
        <p className="plan-detail__eyebrow">
          <Link href="/">Living Word</Link>
          <span aria-hidden> · </span>
          Reading plan
        </p>
        <h1>{plan.title}</h1>
        <p className="plan-detail__lede">{plan.description}</p>
        <p className="plan-detail__meta">
          {plan.lengthLabel} · {progress.completedDays.length}/{plan.days.length}{" "}
          complete
        </p>
      </header>

      <ol className="plan-days">
        {plan.days.map((day) => {
          const reading = day.readings[0];
          const isDone = done.has(day.day);
          const href = readingHref(version, reading, plan.id, day.day);
          return (
            <li
              key={day.day}
              className={`plan-day ${isDone ? "is-done" : ""} ${progress.currentDay === day.day ? "is-current" : ""}`}
            >
              <div className="plan-day__copy">
                <p className="plan-day__label">
                  Day {day.day}
                  {isDone ? " · Done" : null}
                </p>
                <h2>{day.title}</h2>
                <p className="plan-day__reading">
                  {reading.book} {reading.chapter}
                  {reading.verse ? `:${reading.verse}` : ""}
                </p>
              </div>
              <div className="plan-day__actions">
                <Link className="cta" href={href}>
                  Read
                </Link>
                <button
                  type="button"
                  className="cta cta--ghost"
                  onClick={() =>
                    isDone
                      ? markPlanDayIncomplete(plan.id, day.day)
                      : markPlanDayComplete(plan.id, day.day)
                  }
                >
                  {isDone ? "Undo" : "Mark done"}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
