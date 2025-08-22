// src/store/date.ts
let midnightTimer: number | undefined;
let tzTimer: number | undefined;
let lastTZKey = "";

// YYYY-MM-DD u lokalnom vremenu (bez UTC bug-a)
export const localDateKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${y}-${p(m)}-${p(day)}`;
};

function scheduleNextMidnightTick() {
  const now = new Date();
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    50
  );
  const ms = Math.max(1000, next.getTime() - now.getTime());
  midnightTimer = window.setTimeout(() => {
    document.dispatchEvent(new CustomEvent("day-rollover"));
    scheduleNextMidnightTick();
  }, ms);
}

function tzKey() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  const off = new Date().getTimezoneOffset(); // minute offset; mijenja se na DST
  return `${tz}|${off}`;
}

function startTZWatcher() {
  lastTZKey = tzKey();
  tzTimer = window.setInterval(() => {
    const k = tzKey();
    if (k !== lastTZKey) {
      lastTZKey = k;
      document.dispatchEvent(
        new CustomEvent("tz-changed", { detail: { key: k } })
      );
      // sigurnosno: forsiraj refresh dnevnih ključeva
      document.dispatchEvent(new CustomEvent("day-rollover"));
    }
  }, 60_000);
}

function stopTZWatcher() {
  if (tzTimer) {
    clearInterval(tzTimer);
    tzTimer = undefined;
  }
}

/** Public API */
export function startDayRolloverWatcher() {
  if (!midnightTimer) scheduleNextMidnightTick();
  if (!tzTimer) startTZWatcher();
}

export function stopDayRolloverWatcher() {
  if (midnightTimer) {
    clearTimeout(midnightTimer);
    midnightTimer = undefined;
  }
  stopTZWatcher();
}
