"use client";

import { getPlan } from "./plans-data";

export type PlanProgress = {
  planId: string;
  completedDays: number[];
  /** Next day to read (1-based). */
  currentDay: number;
  updatedAt: string;
};

export type PlansStore = Record<string, PlanProgress>;

const STORAGE_KEY = "lw-plans-v1";
const listeners = new Set<() => void>();
const EMPTY_STORE: PlansStore = Object.freeze({}) as PlansStore;

let cachedRaw: string | null = null;
let cachedStore: PlansStore = EMPTY_STORE;

export function getPlansSnapshot(): PlansStore {
  if (typeof window === "undefined") return EMPTY_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedStore;
    cachedRaw = raw;
    cachedStore = raw ? (JSON.parse(raw) as PlansStore) : EMPTY_STORE;
    return cachedStore;
  } catch {
    cachedRaw = null;
    cachedStore = EMPTY_STORE;
    return EMPTY_STORE;
  }
}

export function getServerPlansSnapshot(): PlansStore {
  return EMPTY_STORE;
}

export function subscribePlans(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cachedRaw = null;
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function writeStore(next: PlansStore) {
  const raw = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedStore = Object.keys(next).length === 0 ? EMPTY_STORE : next;
  listeners.forEach((listener) => listener());
}

export function getPlanProgress(
  store: PlansStore,
  planId: string,
): PlanProgress {
  const plan = getPlan(planId);
  const existing = store[planId];
  if (existing) return existing;
  return {
    planId,
    completedDays: [],
    currentDay: 1,
    updatedAt: new Date(0).toISOString(),
  };
}

export function markPlanDayComplete(planId: string, day: number) {
  const plan = getPlan(planId);
  if (!plan) return;
  const store = { ...getPlansSnapshot() };
  const current = getPlanProgress(store, planId);
  const completed = new Set(current.completedDays);
  completed.add(day);

  let nextDay = current.currentDay;
  if (day >= current.currentDay) {
    nextDay = Math.min(day + 1, plan.days.length);
    while (
      nextDay <= plan.days.length &&
      completed.has(nextDay) &&
      nextDay < plan.days.length
    ) {
      nextDay += 1;
    }
    if (completed.size >= plan.days.length) {
      nextDay = plan.days.length;
    }
  }

  store[planId] = {
    planId,
    completedDays: Array.from(completed).sort((a, b) => a - b),
    currentDay: nextDay,
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
}

export function markPlanDayIncomplete(planId: string, day: number) {
  const store = { ...getPlansSnapshot() };
  const current = getPlanProgress(store, planId);
  const completed = current.completedDays.filter((d) => d !== day);
  store[planId] = {
    planId,
    completedDays: completed,
    currentDay: Math.min(day, current.currentDay),
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
}

export function readingHref(
  version: string,
  reading: { slug: string; chapter: number },
  planId: string,
  day: number,
  readingIndex = 0,
) {
  const qs = new URLSearchParams();
  qs.set("plan", planId);
  qs.set("day", String(day));
  if (readingIndex > 0) qs.set("r", String(readingIndex));
  return `/read/${version}/${reading.slug}/${reading.chapter}?${qs.toString()}`;
}
