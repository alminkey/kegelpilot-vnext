import { writable, derived } from "svelte/store";

export type ProStatus = "free" | "pro";

export type UserState = {
  proStatus: ProStatus;
  proSince?: string | null; // ISO lokalni datum
  trial?: { startedAt: string; days: number } | null;
};

const KEY = "kp_user_v1";

function load(): UserState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as UserState;
  } catch {}
  return { proStatus: "free", proSince: null, trial: null };
}

function persist(v: UserState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
}

function createUserStore() {
  const { subscribe, update, set } = writable<UserState>(load());
  subscribe(persist);

  return {
    subscribe,
    set,
    update,
    upgradeToPro() {
      update((u) => ({
        ...u,
        proStatus: "pro",
        proSince: new Date().toISOString(),
        trial: null,
      }));
    },
    downgradeToFree() {
      update((u) => ({ ...u, proStatus: "free" }));
    },
    startTrial(days = 7) {
      update((u) => ({
        ...u,
        trial: { startedAt: new Date().toISOString(), days },
      }));
    },
  };
}

export const user = createUserStore();
export const isPro = derived(user, ($u) => $u.proStatus === "pro");
