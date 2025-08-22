type UpsellEvent =
  | "attempt_open_pro"
  | "difficulty_spike"
  | "rank_cleared_day3"
  | "custom_setting_locked";

type Ctx = Record<string, unknown>;

const KEY = "kp_upsell_v1";

type UpsellState = {
  counts: Record<string, number>;
  lastShownAt?: string | null;
};

function load(): UpsellState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as UpsellState;
  } catch {}
  return { counts: {}, lastShownAt: null };
}

function save(v: UpsellState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
}

export function recordUpsell(ev: UpsellEvent, ctx?: Ctx) {
  const st = load();
  st.counts[ev] = (st.counts[ev] ?? 0) + 1;
  save(st);
  // konzumira se u UI (npr. otvoriti paywall modal)
}

export function getUpsellCount(ev: UpsellEvent) {
  return load().counts[ev] ?? 0;
}
