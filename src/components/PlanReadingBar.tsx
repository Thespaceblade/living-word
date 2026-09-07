"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getPlanProgress,
  getPlansSnapshot,
  getServerPlansSnapshot,
  markPlanDayComplete,
  markPlanDayIncomplete,
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

  return (
    <div className="plan-bar" role="region" aria-label="Reading plan">
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
      </div>
      <div className="plan-bar__actions">
        <button
          type="button"
          className={`plan-bar__btn ${isDone ? "is-done" : ""}`}
          onClick={() =>
            isDone
              ? markPlanDayIncomplete(planId, day)
              : markPlanDayComplete(planId, day)
          }
        >
          {isDone ? "Day complete" : "Mark day complete"}
        </button>
        {isDone && next ? (
          <Link
            className="plan-bar__btn plan-bar__btn--next"
            href={`/read/${version}/${next.readings[0].slug}/${next.readings[0].chapter}?plan=${plan.id}&day=${next.day}${next.readings[0].verse ? `&verse=${next.readings[0].verse}` : ""}`}
          >
            Next day
          </Link>
        ) : null}
      </div>
    </div>
  );
}
