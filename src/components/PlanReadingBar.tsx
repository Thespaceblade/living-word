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
import { getPlan } from "@/lib/plans-data";

type Props = {
  planId: string;
  day: number;
  version: string;
};

export function PlanReadingBar({ planId, day, version }: Props) {
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
  const pct = Math.round(
    (progress.completedDays.length / plan.days.length) * 100,
  );

  function completeDay() {
    if (!plan || !next) {
      markPlanDayComplete(planId, day);
      return;
    }
    markPlanDayComplete(planId, day);
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
          {progress.completedDays.length}/{plan.days.length} days complete
        </p>
        <div className="plan-progress" aria-hidden>
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="plan-bar__actions">
        {isDone ? (
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
            {pending ? "Saving…" : "Complete & continue"}
          </button>
        )}
      </div>
    </div>
  );
}
