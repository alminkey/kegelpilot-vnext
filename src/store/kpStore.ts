import { writable, derived, get } from "svelte/store";

// ——— Tipovi ———
export type RankGoal = {
  rank: number;
  day: number;
  length: number;
  percent: number;
};
export type TodayProgress = { done: number; target: number };

type State = {
  today: TodayProgress;
  goal: RankGoal;
  sessionActive: boolean;
  devShort: boolean;
};

// ——— Inicijalno stanje ———
const initial: State = {
  today: { done: 0, target: 2 },
  goal: { rank: 1, day: 1, length: 5, percent: 0 },
  sessionActive: false,
  devShort: true,
};

// Glavni store stanja
export const s = writable<State>({ ...initial });

// Slice store-ovi
export const today = derived(s, ($s) => $s.today);
export const goal = derived(s, ($s) => $s.goal);

// Public API
export function getTodayProgress(): TodayProgress {
  return get(s).today;
}
export function getRankGoal(): RankGoal {
  return get(s).goal;
}

export const change = writable<number>(0);

// Helpers
function recalcGoalPercent(st: State, nextDone: number): number {
  const { day, length } = st.goal;
  const dailyTarget = Math.max(1, st.today.target);
  const frac = day - 1 + nextDone / dailyTarget;
  return Math.max(0, Math.min(1, frac / Math.max(1, length)));
}

function emitProgressUpdated() {
  if (typeof document !== "undefined") {
    document.dispatchEvent(new CustomEvent("progress-updated"));
  }
  change.set(Date.now());
}

// ——— Core API ———
export function completeSession(): void {
  s.update((st) => {
    const nextDone = Math.min(st.today.target, st.today.done + 1);
    const nextPercent = recalcGoalPercent(st, nextDone);
    return {
      ...st,
      sessionActive: false,
      today: { ...st.today, done: nextDone },
      goal: { ...st.goal, percent: nextPercent },
    };
  });
  emitProgressUpdated();
}

export function startSession(): void {
  s.update((st) => ({ ...st, sessionActive: true }));
}
export function abortSession(): void {
  s.update((st) => ({ ...st, sessionActive: false }));
  emitProgressUpdated();
}
export function finishSession(): void {
  completeSession();
}

export function resetToday(): void {
  s.update((st) => {
    const nextPercent = recalcGoalPercent(st, 0);
    return {
      ...st,
      today: { ...st.today, done: 0 },
      goal: { ...st.goal, percent: nextPercent },
    };
  });
  emitProgressUpdated();
}

export function setToday(next: Partial<TodayProgress>): void {
  s.update((st) => {
    const merged = { ...st.today, ...next };
    const nextPercent = recalcGoalPercent(
      { ...st, today: merged },
      merged.done
    );
    return { ...st, today: merged, goal: { ...st.goal, percent: nextPercent } };
  });
  emitProgressUpdated();
}

export function setGoal(next: Partial<RankGoal>): void {
  s.update((st) => {
    const merged = { ...st.goal, ...next };
    const nextPercent = recalcGoalPercent(
      { ...st, goal: merged },
      st.today.done
    );
    return { ...st, goal: { ...merged, percent: nextPercent } };
  });
  emitProgressUpdated();
}

export function setDevShort(v: boolean): void {
  s.update((st) => ({ ...st, devShort: v }));
}
export function resetAll(): void {
  s.set({ ...initial });
  emitProgressUpdated();
}

// ——— NEW: kompatibilni objekt export ———
export const kpStore = {
  s,
  today,
  goal,
  getTodayProgress,
  getRankGoal,
  completeSession,
  startSession,
  abortSession,
  finishSession,
  resetToday,
  setToday,
  setGoal,
  setDevShort,
  resetAll,
  change,
};
