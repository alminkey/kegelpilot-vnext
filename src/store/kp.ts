// src/store/kp.ts
// Centralni store za KegelPilot (IndexedDB + event bus + dnevna logika 00–04)

import { writable, derived, get } from "svelte/store";
import localforage from "localforage";
import { localDateKey } from "@/store/date";

// ——— Konstante ———
const DEFAULT_TARGET_PER_DAY = 2;
const DEFAULT_GOAL_DAYS = 5;
const DB_KEY = "kp_v1";

// ——— Tipovi ———
export type TodayProgress = { dateKey: string; done: number; target: number };

export type RankPlan = {
  rank: number;
  day: number; // 1..length
  length: number; // npr. 5
  percent: number; // completedDays / length
  completedDays: number; // broj dana sa done >= target
  rankStartDateKey: string;
  targetPerDay: number;
};

type Session = { id: string; at: string; durationSec?: number };

type PersistShape = {
  daily_progress: Record<string, number>;
  plan: {
    rank: number;
    rankStartDateKey: string;
    goalDays: number;
    targetPerDay: number;
  };
  sessions: Session[];
};

// ——— Event bus ———
type KPEventName = "progress-updated" | "session-complete" | "day-rollover";
const bus = new EventTarget();
function emit(name: KPEventName, detail?: any) {
  bus.dispatchEvent(new CustomEvent(name, { detail }));
  if (typeof document !== "undefined") {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }
}
export function on(name: KPEventName, handler: (e: CustomEvent) => void) {
  const fn = (e: Event) => handler(e as CustomEvent);
  bus.addEventListener(name, fn as EventListener);
  return () => bus.removeEventListener(name, fn as EventListener);
}

// ——— Internal memorija ———
const _loaded = writable(false);
const _mem: { data: PersistShape | null } = { data: null };

// ——— Public stores ———
export const today = writable<TodayProgress>({
  dateKey: localDateKey(new Date()),
  done: 0,
  target: DEFAULT_TARGET_PER_DAY,
});

export const goal = writable<RankPlan>({
  rank: 1,
  day: 1,
  length: DEFAULT_GOAL_DAYS,
  percent: 0,
  completedDays: 0,
  rankStartDateKey: localDateKey(new Date()),
  targetPerDay: DEFAULT_TARGET_PER_DAY,
});

// Sažetak za Home
export const homeSummary = derived([today, goal], ([t, g]) => ({
  title: `Rang ${g.rank} • Dan ${g.day}/${g.length}`,
  todayLine: `Danas: ${t.done}/${t.target}`,
  progressPercent: Math.round(g.percent * 100),
  t,
  g,
}));

// Minimalni “stats” za Progress
export const stats = writable<{ totalSessions: number; bestStreak: number }>({
  totalSessions: 0,
  bestStreak: 0,
});

// ——— Helpers ———
function isInBonusWindow(d: Date) {
  const h = d.getHours(); // 00–03h
  return h >= 0 && h < 4;
}
function addDays(date: Date, delta: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function uuid() {
  return (
    (globalThis.crypto?.randomUUID?.() as string) ??
    Math.random().toString(36).slice(2) + Date.now().toString(36)
  );
}

localforage.config({ name: "kegelpilot", storeName: "kp_store" });

// ——— Load/Save ———
async function load(): Promise<PersistShape> {
  const todayKey = localDateKey(new Date());
  const empty: PersistShape = {
    daily_progress: { [todayKey]: 0 },
    plan: {
      rank: 1,
      rankStartDateKey: todayKey,
      goalDays: DEFAULT_GOAL_DAYS,
      targetPerDay: DEFAULT_TARGET_PER_DAY,
    },
    sessions: [],
  };
  try {
    const data = (await localforage.getItem(DB_KEY)) as PersistShape | null;
    _mem.data = data ?? empty;
  } catch {
    _mem.data = empty;
  }
  _loaded.set(true);
  return _mem.data!;
}

async function save() {
  if (_mem.data) {
    try {
      await localforage.setItem(DB_KEY, _mem.data);
    } catch {
      /* no-op */
    }
  }
}

// Osiguraj bucket za današnji dan + emit rollover
function ensureDayBuckets(now = new Date()) {
  const data = _mem.data!;
  const tKey = localDateKey(now);
  if (data.daily_progress[tKey] == null) {
    data.daily_progress[tKey] = 0;
    emit("day-rollover", { dateKey: tKey });
  }
}

// Rebuild derivata
function recomputeDerived(now = new Date()) {
  const data = _mem.data!;
  const tKey = localDateKey(now);
  const target = data.plan.targetPerDay;
  const done = data.daily_progress[tKey] ?? 0;

  today.set({ dateKey: tKey, done, target });

  // Rang progres
  const start = data.plan.rankStartDateKey;
  const length = data.plan.goalDays;
  let completedDays = 0;

  for (let i = 0; i < length; i++) {
    const dk = localDateKey(addDays(new Date(start), i));
    const c = data.daily_progress[dk] ?? 0;
    if (c >= target) completedDays++;
    if (dk >= tKey) break;
  }

  const day = clamp(completedDays + 1, 1, length);
  const percent = clamp(completedDays / length, 0, 1);

  goal.set({
    rank: data.plan.rank,
    day,
    length,
    percent,
    completedDays,
    rankStartDateKey: start,
    targetPerDay: target,
  });

  // Stats
  const totals = Object.values(data.daily_progress).reduce(
    (a, b) => a + (b || 0),
    0
  );

  const keys = Object.keys(data.daily_progress).sort();
  let best = 0,
    cur = 0;
  let prev: string | null = null;
  for (const k of keys) {
    const v = data.daily_progress[k] || 0;
    if (v >= target) {
      if (prev && k === localDateKey(addDays(new Date(prev), 1))) cur += 1;
      else cur = 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
    prev = k;
  }

  stats.set({ totalSessions: totals, bestStreak: best });
}

// ——— Public API ———
export async function init() {
  await load();
  ensureDayBuckets(new Date());
  recomputeDerived(new Date());
}

export async function recordSession(opts?: {
  now?: Date;
  durationSec?: number;
}) {
  if (!_mem.data) await init();
  const now = opts?.now ?? new Date();
  const durationSec = opts?.durationSec ?? 0;

  const data = _mem.data!;
  const tKey = localDateKey(now);
  const yKey = localDateKey(addDays(now, -1));
  const target = data.plan.targetPerDay;

  if (data.daily_progress[tKey] == null) data.daily_progress[tKey] = 0;

  let applied = tKey;
  if (isInBonusWindow(now)) {
    const yDone = data.daily_progress[yKey] ?? 0;
    if (yDone < target) {
      data.daily_progress[yKey] = yDone + 1;
      applied = yKey;
    } else {
      data.daily_progress[tKey] = (data.daily_progress[tKey] ?? 0) + 1;
      applied = tKey;
    }
  } else {
    data.daily_progress[tKey] = (data.daily_progress[tKey] ?? 0) + 1;
    applied = tKey;
  }

  data.sessions.push({ id: uuid(), at: new Date().toISOString(), durationSec });

  await save();
  recomputeDerived(now);
  emit("session-complete", { key: applied, durationSec });
  emit("progress-updated", {
    key: applied,
    progress: data.daily_progress[applied],
  });
}

export async function completeSession(now = new Date()) {
  await recordSession({ now });
}

export async function setDailyTarget(n: number) {
  if (!_mem.data) await init();
  const data = _mem.data!;
  data.plan.targetPerDay = Math.max(1, Math.floor(n));
  await save();
  recomputeDerived(new Date());
  emit("progress-updated", { key: get(today).dateKey });
}

export async function resetDailyIfRollover(now = new Date()) {
  if (!_mem.data) await init();
  ensureDayBuckets(now);
  await save();
  recomputeDerived(now);
}

export async function hardReset() {
  await localforage.removeItem(DB_KEY);
  _mem.data = null;
  await init();
}

export function getSnapshot(): PersistShape | null {
  return _mem.data ? JSON.parse(JSON.stringify(_mem.data)) : null;
}
export function getDailyProgressMap(): Record<string, number> {
  return _mem.data ? { ..._mem.data.daily_progress } : {};
}

// ——— BACK-COMPAT objekat (imenovani export `kp`) ———
// Ovo omogućava import:  import { kp } from '@/store/kp';
export const kp = {
  init,
  today,
  goal,
  homeSummary,
  stats,
  recordSession,
  completeSession,
  setDailyTarget,
  resetDailyIfRollover,
  hardReset,
  getSnapshot,
  getDailyProgressMap,
  on,
};

// (opciono) default export, ako negdje koristiš `import kp from '@/store/kp'`
export default kp;
