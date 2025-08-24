import { writable, get } from "svelte/store";
import { isPro } from "@/store/user";
import { localDateKey } from "@/store/date";
import { openPaywall } from "@/lib/gate";

/* ----------------- Tipovi ----------------- */
export type Reminder = {
  id: string;
  label: string;
  hour: number; // 0–23
  minute: number; // 0–59
  enabled: boolean;
  daysOfWeek?: number[]; // 0=Sun … 6=Sat (opciono; default = svi dani)
};

export type ValidationError = {
  kind: "time" | "days" | "limit";
  message: string;
};

/* ----------------- Persist ključevi ----------------- */
const KEY = "kp_reminders_v1";
const LAST_KEY = "kp_reminders_last_v1";

/* ----------------- Persist helperi ----------------- */
function load(): Reminder[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Reminder[];
  } catch {}
  return [];
}
function persist(v: Reminder[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
}

type LastMap = Record<string, string>; // reminderId -> lastFireKey (date+hh:mm)
function loadLast(): LastMap {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (raw) return JSON.parse(raw) as LastMap;
  } catch {}
  return {};
}
function saveLast(m: LastMap) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(m));
  } catch {}
}

/* ----------------- Store ----------------- */
const inner = writable<Reminder[]>(load());
inner.subscribe(persist);

/* ----------------- Limit i validacija ----------------- */
export function canAddAnother(currentCount: number): boolean {
  const pro = get(isPro);
  const limit = pro ? 10 : 1; // FREE:1, PRO:10
  return currentCount < limit;
}

export function validateReminder(input: {
  label: string;
  hour: number;
  minute: number;
  daysOfWeek?: number[];
}): ValidationError[] {
  const errs: ValidationError[] = [];
  const { hour, minute, daysOfWeek } = input;

  if (
    !(Number.isInteger(hour) && hour >= 0 && hour <= 23) ||
    !(Number.isInteger(minute) && minute >= 0 && minute <= 59)
  ) {
    errs.push({ kind: "time", message: "Neispravno vrijeme (sat/minuta)." });
  }

  if (daysOfWeek && daysOfWeek.length === 0) {
    errs.push({ kind: "days", message: "Odaberi bar jedan dan u sedmici." });
  }

  // limit samo pri dodavanju (vanjskim pozivom): ako već dosegnut
  const count = get(inner).length;
  if (!canAddAnother(count)) {
    errs.push({
      kind: "limit",
      message: "FREE plan dozvoljava 1 podsjetnik. Postani PRO za više.",
    });
  }
  return errs;
}

export function addValidated(
  r: Omit<Reminder, "id" | "enabled"> & { enabled?: boolean }
) {
  const errs = validateReminder({
    label: r.label,
    hour: r.hour,
    minute: r.minute,
    daysOfWeek: r.daysOfWeek,
  });
  if (errs.length) return { ok: false as const, errs };

  inner.update((arr) => {
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const rec: Reminder = {
      id,
      enabled: r.enabled ?? true,
      ...r,
      daysOfWeek: normalizeDays(r.daysOfWeek),
    };
    return [...arr, rec];
  });
  return { ok: true as const };
}

function normalizeDays(days?: number[]): number[] | undefined {
  if (!days || !days.length) return undefined; // tumači se kao “svi dani”
  // očisti duplikate i sortiraj
  const set = Array.from(new Set(days)).filter((d) => d >= 0 && d <= 6);
  return set.sort((a, b) => a - b);
}

/* ----------------- Public API ----------------- */
export const reminders = {
  subscribe: inner.subscribe,
  add(r: Omit<Reminder, "id" | "enabled"> & { enabled?: boolean }) {
    // preferiraj addValidated izvana; ovo ne validira limit
    inner.update((arr) => {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const rec: Reminder = {
        id,
        enabled: true,
        ...r,
        daysOfWeek: normalizeDays(r.daysOfWeek),
      };
      return [...arr, rec];
    });
  },
  updateOne(id: string, patch: Partial<Reminder>) {
    inner.update((arr) =>
      arr.map((r) =>
        r.id === id
          ? {
              ...r,
              ...patch,
              daysOfWeek: normalizeDays(patch.daysOfWeek ?? r.daysOfWeek),
            }
          : r
      )
    );
  },
  remove(id: string) {
    inner.update((arr) => arr.filter((r) => r.id !== id));
  },
  toggle(id: string) {
    const pro = get(isPro);
    inner.update((arr) => {
      const idx = arr.findIndex((r) => r.id === id);
      if (idx === -1) return arr;
      const r = arr[idx];
      const wantEnable = !r.enabled;

      // Na FREE: blokiraj uključivanje drugog aktivnog podsjetnika
      if (!pro && wantEnable) {
        const otherActive = arr.some((x) => x.enabled && x.id !== id);
        if (otherActive) {
          openPaywall("reminders.multi", { from: "toggle" });
          return arr; // bez promjene stanja
        }
      }
      // Inače normalno toggle
      return arr.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x));
    });
  },
  setAll(v: Reminder[]) {
    inner.set(
      v.map((r) => ({ ...r, daysOfWeek: normalizeDays(r.daysOfWeek) }))
    );
  },
};

/* ----------------- Enforce na downgrade (FREE) ----------------- */
/** Onemogući sve osim jednog aktivnog podsjetnika kada nije PRO. */
function enforceFreeReminderLimit() {
  inner.update((arr) => {
    // Ako je PRO, ne diramo
    if (get(isPro)) return arr;

    // Dozvoljen je max 1 aktivan; preferiraj postojeći aktivan s najranijim vremenom
    const enabled = arr.filter((r) => r.enabled);
    if (enabled.length <= 1) return arr;

    // Odaberi jednog koji ostaje aktivan (najraniji sat:min, pa po id)
    const keep = [...enabled].sort((a, b) => {
      const da = a.hour * 60 + a.minute;
      const db = b.hour * 60 + b.minute;
      if (da !== db) return da - db;
      return a.id.localeCompare(b.id);
    })[0];

    return arr.map((r) => (r.id === keep.id ? r : { ...r, enabled: false }));
  });
}

// Enforce odmah na startu i na svaku promjenu isPro→false
isPro.subscribe((pro) => {
  if (!pro) enforceFreeReminderLimit();
});

/* ----------------- Reminder servis (in-app) ----------------- */
let started = false;
let timer: number | undefined;
let lastMap: LastMap = loadLast();

export function startReminderService() {
  if (started) return;
  started = true;
  tick(); // odmah
}
export function stopReminderService() {
  if (!started) return;
  started = false;
  if (timer !== undefined) {
    clearTimeout(timer);
    timer = undefined;
  }
}

function tick() {
  try {
    fireDue();
  } catch {}
  timer = window.setTimeout(tick, 30_000); // provjera svakih 30s
}

function fireDue() {
  const now = new Date();
  const hh = now.getHours();
  const mm = now.getMinutes();
  const dow = now.getDay(); // 0=Sun … 6=Sat
  const key = `${localDateKey()}-${pad2(hh)}:${pad2(mm)}`;

  const list = get(inner);
  for (const r of list) {
    if (!r.enabled) continue;
    // poštuj odabrane dane (ako undefined ⇒ svi dani)
    const days =
      r.daysOfWeek && r.daysOfWeek.length
        ? r.daysOfWeek
        : [0, 1, 2, 3, 4, 5, 6];
    if (!days.includes(dow)) continue;

    if (r.hour === hh && r.minute === mm) {
      if (lastMap[r.id] !== key) {
        notify(r.label);
        lastMap[r.id] = key;
      }
    }
  }
  saveLast(lastMap);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

async function notify(body: string) {
  const title = "KegelPilot podsjetnik";
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
      return;
    }
    if (Notification.permission !== "denied") {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification(title, { body });
        return;
      }
    }
  }
  // Fallback kad notifikacije nisu dozvoljene
  try {
    alert(`${title}\n\n${body}`);
  } catch {}
}
