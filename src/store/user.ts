import { writable } from "svelte/store";

const KEY = "kp_is_pro";

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export const isPro = writable<boolean>(read());

export function upgradeToPro() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {}
  isPro.set(true);
}
export function downgradeToFree() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  isPro.set(false);
}
export function togglePro() {
  read() ? downgradeToFree() : upgradeToPro();
}
