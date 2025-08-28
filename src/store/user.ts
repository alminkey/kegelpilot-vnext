import { writable, get } from "svelte/store";

const KEY = "kp_is_pro";
const LEGACY_KEYS = ["kp_pro_v1"]; // eventualni raniji ključevi
const KEY_PAID = "kp_pro_paid_v1"; // ⬅ plaćeni PRO (kupovina), nezavisno od trial-a

const hasLS = () =>
  typeof window !== "undefined" && typeof localStorage !== "undefined";

function readFromStorage(): boolean {
  if (!hasLS()) return false;
  try {
    // prioritet: aktuelni ključ
    const cur = localStorage.getItem(KEY);
    if (cur != null) return cur === "1";

    // migracija sa legacy ključeva (ako postoje i postavljeni su na "1")
    for (const lk of LEGACY_KEYS) {
      const v = localStorage.getItem(lk);
      if (v === "1") {
        localStorage.setItem(KEY, "1");
        try {
          localStorage.removeItem(lk);
        } catch {}
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function readPaidFromStorage(): boolean {
  if (!hasLS()) return false;
  try {
    return localStorage.getItem(KEY_PAID) === "1";
  } catch {
    return false;
  }
}

export const isPro = writable<boolean>(readFromStorage());
export const isProPaid = writable<boolean>(readPaidFromStorage()); // ⬅ NEW

// Persist SVAKU promjenu (poklapa i slučaj kada testovi direktno rade isPro.set(true))
isPro.subscribe((val) => {
  if (!hasLS()) return;
  try {
    if (val) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY); // zadržavamo dosadašnju semantiku
  } catch {}
});

// Persist paid PRO flag
isProPaid.subscribe((val) => {
  if (!hasLS()) return;
  try {
    if (val) localStorage.setItem(KEY_PAID, "1");
    else localStorage.removeItem(KEY_PAID);
  } catch {}
});

export function upgradeToPro() {
  if (!get(isPro)) isPro.set(true);
}

export function downgradeToFree() {
  if (get(isPro)) isPro.set(false);
}

export function togglePro() {
  get(isPro) ? downgradeToFree() : upgradeToPro();
}

/** Oznaci da je korisnik kupio PRO (ne trial). Pozovi nakon uspješnog checkouta. */
export function markProPaid() {
  if (!get(isProPaid)) isProPaid.set(true);
  // sigurnosti radi, uključi i PRO status
  if (!get(isPro)) isPro.set(true);
}

/** (dev/test) Ukini plaćeni PRO flag */
export function clearProPaid() {
  if (get(isProPaid)) isProPaid.set(false);
}

/** Ručno osvježi store iz localStorage-a (npr. nakon clear-a) */
export function reloadProFromStorage() {
  isPro.set(readFromStorage());
}

/**
 * Inicijalizuj sync među tabovima (storage event) i uradi “warmup”.
 * Pozovi jednom u App.svelte (onMount).
 */
let _inited = false;
export function initUserPersistence() {
  if (_inited || !hasLS()) return;
  _inited = true;

  // warm-up
  reloadProFromStorage();
  isProPaid.set(readPaidFromStorage());

  // sync među tabovima/prozorima
  window.addEventListener("storage", (e) => {
    if (!e) return;
    if (e.key === KEY || (e.key && LEGACY_KEYS.includes(e.key))) {
      const next = readFromStorage();
      if (next !== get(isPro)) isPro.set(next);
    }
    if (e.key === KEY_PAID) {
      const paid = readPaidFromStorage();
      if (paid !== get(isProPaid)) isProPaid.set(paid);
    }
  });
}
