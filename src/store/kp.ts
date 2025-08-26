// src/store/kp.ts
import { writable } from "svelte/store";
import localforage from "localforage";

/**
 * KegelPilot – centralni store (v1 skeleton)
 * - Trajni storage: IndexedDB (localforage)
 * - Event bus: session-complete, progress-updated, day-rollover
 * - API: init(), recordSession(), resetDailyIfRollover()
 */

localforage.config({
  name: "kegelpilot",
  storeName: "kp_store",
});

const STORAGE_KEY = "kp_state_v1";

export type DayKey = string; // npr. '2025-08-26'

export interface Session {
  id: string;
  at: number; // epoch ms
  durationSec: number; // trajanje u sekundama
}

export interface DailyProgress {
  sessions: number;
  seconds: number;
}

export interface PlanState {
  rank: number; // npr. 1
  day: number; // 1..5
  targetSessions: number; // cilj sesija za danas
}

export interface SettingsState {
  keepScreenOn: boolean;
}

export interface KPState {
  plan: PlanState;
  progressByDay: Record<DayKey, DailyProgress>;
  sessions: Session[];
  settings: SettingsState;
  lastDayKey: DayKey | null; // za rollover detekciju
}

/* ---------- default state ---------- */
function defaultState(): KPState {
  return {
    plan: { rank: 1, day: 1, targetSessions: 2 },
    progressByDay: {},
    sessions: [],
    settings: { keepScreenOn: true },
    lastDayKey: null,
  };
}

/* ---------- Event bus ---------- */
type KPEvent = "session-complete" | "progress-updated" | "day-rollover";

const bus = new EventTarget();
export function on(event: KPEvent, handler: (e: CustomEvent<any>) => void) {
  const fn = handler as unknown as EventListener;
  bus.addEventListener(event, fn);
  return () => bus.removeEventListener(event, fn);
}
function emit(event: KPEvent, detail?: any) {
  bus.dispatchEvent(new CustomEvent(event, { detail }));
}

/* ---------- day key helper (lokalni datum) ---------- */
function todayKey(d = new Date()): DayKey {
  // 'YYYY-MM-DD' u lokalnoj zoni
  // en-CA format daje ISO bez vremena
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/* ---------- Store ---------- */
const base = writable<KPState>(defaultState());
export const kp = {
  subscribe: base.subscribe,
  /** učitaj iz IndexedDB + postavi rollover marker */
  async init() {
    const saved =
      (await localforage.getItem<KPState>(STORAGE_KEY)) ?? defaultState();
    if (!saved.lastDayKey) saved.lastDayKey = todayKey();
    base.set(saved);
  },
  /** snimi na IndexedDB */
  async save(get: () => KPState) {
    const s = get();
    await localforage.setItem(STORAGE_KEY, s);
  },
  /** utility: snapshot trenutnog stanja */
  get snapshot(): KPState {
    let v!: KPState;
    const unsub = base.subscribe((s) => (v = s));
    unsub();
    return v;
  },
  /** reset dnevnog progres ako je došao novi dan (00–04 logiku dodamo kasnije) */
  maybeRollover() {
    base.update((s) => {
      const nowKey = todayKey();
      if (s.lastDayKey && s.lastDayKey !== nowKey) {
        // samo emit signal; čišćenje dnevnih counters je jednostavno,
        // ali neka za sada ostane u progressByDay per-key (bez brisanja).
        emit("day-rollover", { from: s.lastDayKey, to: nowKey });
        s.lastDayKey = nowKey;
      }
      return s;
    });
  },
  /** upiši završenu sesiju i osvježi dnevni progress */
  async recordSession(durationSec: number) {
    base.update((s) => {
      const now = Date.now();
      const id = `s_${now}`;
      s.sessions.push({ id, at: now, durationSec });

      const key = todayKey();
      const dp = (s.progressByDay[key] ??= { sessions: 0, seconds: 0 });
      dp.sessions += 1;
      dp.seconds += durationSec;

      emit("session-complete", { id, durationSec, key });
      emit("progress-updated", { key, progress: dp });
      return s;
    });
    await kp.save(() => kp.snapshot);
  },
};
