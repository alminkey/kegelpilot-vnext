// src/store/kpStore.ts
import { writable, derived, get } from "svelte/store";

// ——— Tipovi ———
export type RankGoal = {
  rank: number;
  day: number;
  length: number;
  percent: number;
};
export type TodayProgress = { done: number; target: number };

export type SessionFeedback =
  | { date: string; kind: "ok" }
  | { date: string; kind: "too_hard"; delta: number };

type State = {
  today: TodayProgress;
  goal: RankGoal;
  sessionActive: boolean;
  devShort: boolean;
};

// ——— Persist: localStorage (dnevni rollover) ———
const LS_KEY = "kp_today_v1";
const FEEDBACK_LS = "kp_last_feedback_v1";
const RANK_FB_LS = "kp_fb_by_rank_v1";
const todayIso = () => new Date().toISOString().slice(0, 10);

function loadPersist(): TodayProgress | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      date: string;
      done: number;
      target: number;
    };
    if (data.date !== todayIso()) return null;
    return { done: data.done ?? 0, target: Math.max(1, data.target ?? 2) };
  } catch {
    return null;
  }
}
function savePersist(p: TodayProgress) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ date: todayIso(), done: p.done, target: p.target })
    );
  } catch {}
}

// ——— Helperi ———
function calcPercent(
  day: number,
  length: number,
  done: number,
  target: number
): number {
  const dailyTarget = Math.max(1, target);
  const dailyFrac = Math.min(1, done / dailyTarget);
  const frac = day - 1 + dailyFrac;
  return Math.max(0, Math.min(1, frac / Math.max(1, length)));
}
function recalcGoalPercent(st: State, nextDone: number): number {
  return calcPercent(st.goal.day, st.goal.length, nextDone, st.today.target);
}

// ——— Inicijalno stanje ———
const BASE_TODAY: TodayProgress = { done: 0, target: 2 };
const persistedToday: TodayProgress | null =
  typeof window !== "undefined" && typeof localStorage !== "undefined"
    ? loadPersist()
    : null;

const initial: State = {
  today: persistedToday ?? BASE_TODAY,
  goal: { rank: 1, day: 1, length: 5, percent: 0 },
  sessionActive: false,
  devShort: true,
};
initial.goal.percent = calcPercent(
  initial.goal.day,
  initial.goal.length,
  initial.today.done,
  initial.today.target
);

// ——— Store ———
export const s = writable<State>({ ...initial });
export const today = derived(s, ($s) => $s.today);
export const goal = derived(s, ($s) => $s.goal);

// Ping
export const change = writable<number>(0);
function emitProgressUpdated() {
  if (typeof document !== "undefined")
    document.dispatchEvent(new CustomEvent("progress-updated"));
  change.set(Date.now());
}

// ——— Feedback (zadnji izbor) ———
export const lastFeedback = writable<SessionFeedback | null>(null);
(() => {
  try {
    const raw =
      typeof localStorage !== "undefined" && localStorage.getItem(FEEDBACK_LS);
    if (raw) lastFeedback.set(JSON.parse(raw) as SessionFeedback);
  } catch {}
})();
function persistFeedback(fb: SessionFeedback) {
  try {
    localStorage.setItem(FEEDBACK_LS, JSON.stringify(fb));
  } catch {}
}

// ——— Per-rank feedback ———
type RankFeedbackState = {
  state: "ack_ok" | "too_hard";
  delta?: number;
  updated: string;
};
type RankFeedbackMap = Record<string, RankFeedbackState>;

const loadRankFb = (): RankFeedbackMap => {
  try {
    const raw =
      typeof localStorage !== "undefined" && localStorage.getItem(RANK_FB_LS);
    return raw ? (JSON.parse(raw) as RankFeedbackMap) : {};
  } catch {
    return {};
  }
};
const saveRankFb = (map: RankFeedbackMap) => {
  try {
    localStorage.setItem(RANK_FB_LS, JSON.stringify(map));
  } catch {}
};

export const rankFeedback = writable<RankFeedbackMap>(loadRankFb());
rankFeedback.subscribe((m) => saveRankFb(m));

// ——— Public API ———
export function getTodayProgress(): TodayProgress {
  return get(s).today;
}
export function getRankGoal(): RankGoal {
  return get(s).goal;
}

// ✔️ unbounded done (3/2, 5/2…)
export function completeSession(): void {
  s.update((st) => {
    const nextDone = st.today.done + 1;
    const nextPercent = recalcGoalPercent(st, nextDone);
    const nextState: State = {
      ...st,
      sessionActive: false,
      today: { ...st.today, done: nextDone },
      goal: { ...st.goal, percent: nextPercent },
    };
    if (typeof localStorage !== "undefined") savePersist(nextState.today);
    return nextState;
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
    const next: TodayProgress = { done: 0, target: st.today.target };
    const nextPercent = calcPercent(
      st.goal.day,
      st.goal.length,
      next.done,
      next.target
    );
    const nextState: State = {
      ...st,
      today: next,
      goal: { ...st.goal, percent: nextPercent },
    };
    if (typeof localStorage !== "undefined") savePersist(next);
    return nextState;
  });
  emitProgressUpdated();
}

export function setToday(next: Partial<TodayProgress>): void {
  s.update((st) => {
    const merged: TodayProgress = { ...st.today, ...next };
    const nextPercent = calcPercent(
      st.goal.day,
      st.goal.length,
      merged.done,
      merged.target
    );
    const nextState: State = {
      ...st,
      today: merged,
      goal: { ...st.goal, percent: nextPercent },
    };
    if (typeof localStorage !== "undefined") savePersist(merged);
    return nextState;
  });
  emitProgressUpdated();
}

export function setGoal(next: Partial<RankGoal>): void {
  s.update((st) => {
    const merged = { ...st.goal, ...next };
    const nextPercent = calcPercent(
      merged.day,
      merged.length,
      st.today.done,
      st.today.target
    );
    return { ...st, goal: { ...merged, percent: nextPercent } };
  });
  emitProgressUpdated();
}

export function setDevShort(v: boolean): void {
  s.update((st) => ({ ...st, devShort: v }));
}

// ✅ Reset svega + reset upita o težini (per-rank)
export function resetAll(): void {
  const next: State = { ...initial, today: { ...BASE_TODAY } };
  s.set(next);
  if (typeof localStorage !== "undefined") {
    savePersist(next.today);
    try {
      localStorage.removeItem(FEEDBACK_LS);
    } catch {}
    try {
      localStorage.removeItem(RANK_FB_LS);
    } catch {}
  }
  lastFeedback.set(null);
  rankFeedback.set({});
  emitProgressUpdated();
}

// ——— Per-rank feedback API ———
export function shouldAskFeedback(): boolean {
  const rank = String(get(s).goal.rank);
  const entry = get(rankFeedback)[rank];
  return !entry || entry.state === "too_hard";
}
export function feedbackOkRank() {
  const rank = String(get(s).goal.rank);
  const entry: RankFeedbackState = {
    state: "ack_ok",
    updated: new Date().toISOString(),
  };
  rankFeedback.set({ ...get(rankFeedback), [rank]: entry });
  const fb: SessionFeedback = { date: todayIso(), kind: "ok" };
  lastFeedback.set(fb);
  persistFeedback(fb);
  change.set(Date.now());
}
export function feedbackTooHardRank(delta: number) {
  const rank = String(get(s).goal.rank);
  const entry: RankFeedbackState = {
    state: "too_hard",
    delta,
    updated: new Date().toISOString(),
  };
  rankFeedback.set({ ...get(rankFeedback), [rank]: entry });
  const fb: SessionFeedback = { date: todayIso(), kind: "too_hard", delta };
  lastFeedback.set(fb);
  persistFeedback(fb);
  change.set(Date.now());
}

// (aliasi)
export function feedbackOk() {
  feedbackOkRank();
}
export function feedbackTooHard(d: number) {
  feedbackTooHardRank(d);
}

// ——— Kompatibilni objekt export ———
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
  lastFeedback,
  rankFeedback,
  shouldAskFeedback,
  feedbackOkRank,
  feedbackTooHardRank,
  feedbackOk,
  feedbackTooHard,
};

// ——— Auto-persist svake promjene ———
s.subscribe((st) => {
  if (typeof localStorage === "undefined") return;
  savePersist(st.today);
});
