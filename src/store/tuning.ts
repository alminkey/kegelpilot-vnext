// src/store/tuning.ts
import { writable, get } from "svelte/store";

export type RankId = string;
type Answer = "NE" | "DA";

type RankTuning = {
  factor: number; // 1.0 default; clamp [0.6 .. 1.4]
  lastAnswer?: Answer; // ako je "NE" -> ne pitamo do sljedećeg ranga
  lastPromptKey?: string;
};

type TuningState = Record<RankId, RankTuning>;

const KEY = "kp_tuning_v1";
const hasLS = () => typeof window !== "undefined" && "localStorage" in window;

function load(): TuningState {
  if (!hasLS()) return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
function persist(s: TuningState) {
  if (!hasLS()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export const tuning = writable<TuningState>(load());
tuning.subscribe(persist);

function clamp(x: number) {
  return Math.min(1.4, Math.max(0.6, x));
}

export function getFactor(rankId: RankId): number {
  const s = get(tuning);
  return s[rankId]?.factor ?? 1.0;
}

export function setFactor(rankId: RankId, factor: number) {
  tuning.update((s) => {
    const cur = s[rankId] ?? { factor: 1.0 };
    s[rankId] = { ...cur, factor: clamp(factor) };
    return { ...s };
  });
}

export function adjust(rankId: RankId, delta: number) {
  tuning.update((s) => {
    const cur = s[rankId] ?? { factor: 1.0 };
    s[rankId] = { ...cur, factor: clamp((cur.factor ?? 1.0) + delta) };
    return { ...s };
  });
}

export function markAnswer(rankId: RankId, answer: Answer, dayKey?: string) {
  tuning.update((s) => {
    const cur = s[rankId] ?? { factor: 1.0 };
    s[rankId] = {
      ...cur,
      lastAnswer: answer,
      lastPromptKey: dayKey ?? cur.lastPromptKey,
    };
    return { ...s };
  });
}

export function shouldAsk(rankId: RankId): boolean {
  const s = get(tuning)[rankId];
  if (!s) return true;
  return s.lastAnswer !== "NE";
}

export function onRankEnter(rankId: RankId) {
  tuning.update((s) => {
    const cur = s[rankId] ?? { factor: 1.0 };
    s[rankId] = { ...cur, lastAnswer: undefined, lastPromptKey: undefined };
    return { ...s };
  });
}

/* ---------- Scale na vremenske korake ---------- */
export type PhaseName = "prepare" | "squeeze" | "hold" | "release";
export type Step = { name: PhaseName; ms: number };

function roundMs(x: number) {
  return Math.max(400, Math.round(x));
}

/**
 * Skalira trajanja prema faktoru. "prepare" ne diramo (uvijek isto),
 * "release" skaliramo blaže radi stabilnijeg ritma.
 */
export function scaleStepsByFactor(steps: Step[], factor: number): Step[] {
  const f = clamp(factor || 1);
  return steps.map((st) => {
    let scale = f;
    if (st.name === "prepare") scale = 1.0;
    if (st.name === "release") scale = Math.min(1.2, Math.max(0.8, f));
    return { ...st, ms: roundMs(st.ms * scale) };
  });
}
