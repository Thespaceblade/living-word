"use client";

import Image from "next/image";
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
import { formatDayReadings } from "@/lib/plans-data";

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
  const pct = Math.round((done.size / plan.days.length) * 100);
  const resumeDay =
    done.size >= plan.days.length
      ? plan.days.length
      : Math.min(progress.currentDay, plan.days.length);
  const resume = plan.days.find((d) => d.day === resumeDay) ?? plan.days[0];

  return (
    <div className="plan-detail">
      <div className="plan-detail__hero">
        <Image
          src={plan.image}
          alt=""
          fill
          priority
          sizes="(max-width: 900px) 100vw, 920px"
          className="plan-detail__hero-img"
        />
        <div className="plan-detail__hero-shade" />
        <div className="plan-detail__hero-copy">
          <p className="plan-detail__eyebrow">
            <Link href="/">Living Word</Link>
            <span aria-hidden> · </span>
            {plan.topic}
          </p>
          <h1>{plan.title}</h1>
          <p className="plan-detail__lede">{plan.description}</p>
          <div className="plan-detail__stats">
            <span>
              {plan.lengthLabel} · {done.size}/{plan.days.length} complete
            </span>
            <div className="plan-progress plan-progress--light" aria-hidden>
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="plan-detail__cta">
            <Link
              className="cta"
              href={readingHref(version, resume.readings[0], plan.id, resume.day)}
            >
              {done.size === 0
                ? "Start day 1"
                : done.size >= plan.days.length
                  ? "Read again"
                  : `Continue day ${resume.day}`}
            </Link>
          </div>
        </div>
      </div>

      <ol className="plan-days">
        {plan.days.map((day, index) => {
          const isDone = done.has(day.day);
          const href = readingHref(
            version,
            day.readings[0],
            plan.id,
            day.day,
          );
          return (
            <li
              key={day.day}
              className={`plan-day ${isDone ? "is-done" : ""} ${progress.currentDay === day.day ? "is-current" : ""}`}
              style={{ ["--i" as string]: index }}
            >
              <div className="plan-day__copy">
                <p className="plan-day__label">
                  Day {day.day}
                  {isDone ? " · Done" : null}
                </p>
                <h2>{day.title}</h2>
                <p className="plan-day__reading">
                  {formatDayReadings(day.readings)}
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
