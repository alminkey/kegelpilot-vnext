import { writable, get } from "svelte/store";

const KEY = "kp_is_pro";
const LEGACY_KEYS = ["kp_pro_v1"]; // eventualni raniji ključevi

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

export const isPro = writable<boolean>(readFromStorage());

// Persist SVAKU promjenu (poklapa i slučaj kada testovi direktno rade isPro.set(true))
isPro.subscribe((val) => {
  if (!hasLS()) return;
  try {
    if (val) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY); // zadržavamo tvoju dosadašnju semantiku
  } catch {}
});

export function upgradeToPro() {
  isPro.set(true);
}

export function downgradeToFree() {
  isPro.set(false);
}

export function togglePro() {
  // koristimo in‑memory vrijednost (brže i tačno ako storage promijeni neko drugi)
  const cur = get(isPro);
  isPro.set(!cur);
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

  // warm‑up u slučaju da je modul evaluiran prije nego što je storage bio spreman
  reloadProFromStorage();

  // sync među tabovima/prozorima
  window.addEventListener("storage", (e) => {
    if (!e) return;
    // reaguj ako se promijenio naš ključ ili neki legacy
    if (e.key === KEY || (e.key && LEGACY_KEYS.includes(e.key))) {
      // pročitaj svježu vrijednost i upiši u store (bez petlje: store -> storage imamo guard)
      const next = readFromStorage();
      if (next !== get(isPro)) isPro.set(next);
    }
  });
}
