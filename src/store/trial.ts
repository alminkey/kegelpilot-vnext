// src/store/trial.ts
import { writable, get } from "svelte/store";
import { localDateKey } from "@/store/date";
import { upgradeToPro, downgradeToFree, isPro } from "@/store/user";

export type TrialState = {
  startedAt: string | null; // "YYYY-MM-DD" (lokalna TZ)
  daysTotal: number; // 7
  daysLeft: number; // 0..7
  active: boolean; // daysLeft > 0
  expired: boolean; // !active && startedAt != null
};

const TRIAL_DAYS = 7;
const KEY = "kp_trial_start_v1";

const hasLS = () =>
  typeof window !== "undefined" && typeof localStorage !== "undefined";

function readStart(): string | null {
  if (!hasLS()) return null;
  try {
    const v = localStorage.getItem(KEY);
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

function writeStart(d: string | null) {
  if (!hasLS()) return;
  try {
    if (d) localStorage.setItem(KEY, d);
    else localStorage.removeItem(KEY);
  } catch {}
}

function fromKey(k: string): Date {
  // k = "YYYY-MM-DD" u lokalnoj zoni
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function calcState(): TrialState {
  const start = readStart();
  if (!start) {
    return {
      startedAt: null,
      daysTotal: TRIAL_DAYS,
      daysLeft: 0,
      active: false,
      expired: false,
    };
  }
  const todayKey = localDateKey(new Date());
  const startDate = fromKey(start);
  const todayDate = fromKey(todayKey);
  const diffMs = todayDate.getTime() - startDate.getTime();
  const daysPassed = Math.max(0, Math.floor(diffMs / 86400000));
  const daysLeft = Math.max(0, TRIAL_DAYS - daysPassed);
  const active = daysLeft > 0;
  const expired = !active;
  return { startedAt: start, daysTotal: TRIAL_DAYS, daysLeft, active, expired };
}

export const trial = writable<TrialState>(calcState());

function refreshAndEnforce() {
  const state = calcState();
  trial.set(state);

  // Ako je istekao trial, spusti korisnika na FREE (samo ako je još PRO zbog triala)
  if (state.expired) {
    if (get(isPro)) {
      try {
        downgradeToFree();
      } catch {}
    }
    // očisti ključ da kartica opet pokaže "Probaj 7 dana"
    writeStart(null);
    trial.set(calcState());
  }
}

/** Pozovi da aktiviraš 7-dnevni trial. */
export function startTrial() {
  const cur = get(trial);
  if (cur.active) return; // već aktivan
  const todayKey = localDateKey(new Date());
  writeStart(todayKey);
  refreshAndEnforce();
  // Omogući PRO tokom triala
  try {
    upgradeToPro();
  } catch {}
  // Event za UI (opciono)
  try {
    window.dispatchEvent(
      new CustomEvent("trial:started", { detail: { startedAt: todayKey } })
    );
  } catch {}
}

/** Ručno očisti trial (dev/debug). */
export function clearTrial() {
  writeStart(null);
  refreshAndEnforce();
}

/** Inicijalizacija osluškivanja promjena dana / TZ / storage. Pozovi npr. u Home onMount. */
let inited = false;
export function initTrial() {
  if (inited) return;
  inited = true;

  // odmah provjeri stanje
  refreshAndEnforce();

  // dan se promijenio (naš app već šalje ove evente)
  const onDay = () => refreshAndEnforce();
  const onTz = () => refreshAndEnforce();
  const onStorage = (e: StorageEvent) => {
    if (e && e.key === KEY) refreshAndEnforce();
  };

  try {
    document.addEventListener("day-rollover", onDay as any);
    document.addEventListener("tz-changed", onTz as any);
    window.addEventListener("storage", onStorage);
  } catch {}
}
