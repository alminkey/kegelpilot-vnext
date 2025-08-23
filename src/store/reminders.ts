import { writable, get } from "svelte/store";
import { isPro } from "@/store/user";
import { localDateKey } from "@/store/date";

export type Reminder = {
  id: string;
  label: string;
  hour: number; // 0–23
  minute: number; // 0–59
  enabled: boolean;
  // (kasnije) days?: number[]; // 0=Sun ... 6=Sat
};

const KEY = "kp_reminders_v1";
const LAST_KEY = "kp_reminders_last_v1";

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

const inner = writable<Reminder[]>(load());
inner.subscribe(persist);

export const reminders = {
  subscribe: inner.subscribe,
  add(r: Omit<Reminder, "id" | "enabled"> & { enabled?: boolean }) {
    inner.update((arr) => {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const rec: Reminder = { id, enabled: true, ...r };
      return [...arr, rec];
    });
  },
  updateOne(id: string, patch: Partial<Reminder>) {
    inner.update((arr) =>
      arr.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  },
  remove(id: string) {
    inner.update((arr) => arr.filter((r) => r.id !== id));
  },
  toggle(id: string) {
    inner.update((arr) =>
      arr.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  },
  setAll(v: Reminder[]) {
    inner.set(v);
  },
};

export function canAddAnother(currentCount: number): boolean {
  const pro = get(isPro);
  const limit = pro ? 10 : 1; // FREE: 1, PRO: 10 (promijeni po želji)
  return currentCount < limit;
}

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
  const key = `${localDateKey()}-${pad2(hh)}:${pad2(mm)}`;

  const list = get(inner);
  for (const r of list) {
    if (!r.enabled) continue;
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
