"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";
import {
  getPlanProgress,
  getPlansSnapshot,
  getServerPlansSnapshot,
  markPlanDayComplete,
  markPlanDayIncomplete,
  readingHref,
  subscribePlans,
} from "@/lib/plans";
import { formatDayReadings, getPlan } from "@/lib/plans-data";

type Props = {
  planId: string;
  day: number;
  version: string;
  slug: string;
  chapter: number;
};

export function PlanReadingBar({
  planId,
  day,
  version,
  slug,
  chapter,
}: Props) {
  const plan = getPlan(planId);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const store = useSyncExternalStore(
    subscribePlans,
    getPlansSnapshot,
    getServerPlansSnapshot,
  );
  if (!plan) return null;

  const progress = getPlanProgress(store, planId);
  const isDone = progress.completedDays.includes(day);
  const dayMeta = plan.days.find((d) => d.day === day);
  const next = plan.days.find((d) => d.day === day + 1);
  const readings = dayMeta?.readings ?? [];
  const currentIndex = Math.max(
    0,
    readings.findIndex((r) => r.slug === slug && r.chapter === chapter),
  );
  const withinDayNext = readings[currentIndex + 1] ?? null;
  const pct = Math.round(
    (progress.completedDays.length / plan.days.length) * 100,
  );

  function goNextChapter() {
    if (!plan || !withinDayNext) return;
    startTransition(() => {
      router.push(
        readingHref(version, withinDayNext, plan.id, day, currentIndex + 1),
      );
    });
  }

  function completeDay() {
    if (!plan) {
      markPlanDayComplete(planId, day);
      return;
    }
    markPlanDayComplete(planId, day);
    if (!next) return;
    startTransition(() => {
      router.push(readingHref(version, next.readings[0], plan.id, next.day));
    });
  }

  return (
    <div
      className={`plan-bar ${pending ? "is-pending" : ""}`}
      role="region"
      aria-label="Reading plan"
    >
      <div className="plan-bar__copy">
        <p className="plan-bar__label">
          <Link href={`/plans/${plan.id}`}>{plan.title}</Link>
          <span aria-hidden> · </span>
          Day {day}
          {dayMeta ? ` · ${dayMeta.title}` : ""}
        </p>
        <p className="plan-bar__meta">
          Today: {formatDayReadings(readings)}
          <span aria-hidden> · </span>
          {progress.completedDays.length}/{plan.days.length} days complete
        </p>
        {readings.length > 1 ? (
          <div className="plan-bar__readings" aria-label="Today’s chapters">
            {readings.map((reading, index) => {
              const active =
                reading.slug === slug && reading.chapter === chapter;
              return (
                <Link
                  key={`${reading.slug}-${reading.chapter}-${index}`}
                  className={`plan-bar__chip ${active ? "is-active" : ""}`}
                  href={readingHref(version, reading, plan.id, day, index)}
                >
                  {reading.book} {reading.chapter}
                </Link>
              );
            })}
          </div>
        ) : null}
        <div className="plan-progress" aria-hidden>
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="plan-bar__actions">
        {withinDayNext ? (
          <button
            type="button"
            className="plan-bar__btn"
            disabled={pending}
            onClick={goNextChapter}
          >
            {pending
              ? "Opening…"
              : `Next: ${withinDayNext.book} ${withinDayNext.chapter}`}
          </button>
        ) : isDone ? (
          <>
            <button
              type="button"
              className="plan-bar__btn is-done"
              onClick={() => markPlanDayIncomplete(planId, day)}
            >
              Day complete
            </button>
            {next ? (
              <Link
                className="plan-bar__btn plan-bar__btn--next"
                href={readingHref(version, next.readings[0], plan.id, next.day)}
              >
                Next day
              </Link>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            className="plan-bar__btn"
            disabled={pending}
            onClick={completeDay}
          >
            {pending
              ? "Saving…"
              : next
                ? "Complete & continue"
                : "Mark day complete"}
          </button>
        )}
      </div>
    </div>
  );
}
