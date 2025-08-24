// src/lib/scrollLock.ts
let count = 0;
let prev: string | null = null;

export function lockScroll() {
  if (typeof document === "undefined") return;
  if (count === 0) {
    try {
      prev = document.body.style.overflow || "";
    } catch {
      prev = "";
    }
    try {
      document.body.style.overflow = "hidden";
    } catch {}
  }
  count++;
}

export function unlockScroll() {
  if (typeof document === "undefined") return;
  if (count > 0) count--;
  if (count === 0 && prev !== null) {
    try {
      document.body.style.overflow = prev;
    } catch {}
    prev = null;
  }
}

/** Za svaki slučaj, ako želiš reset na promjenu rute */
export function resetScrollLock() {
  count = 0;
  try {
    document.body.style.overflow = "";
  } catch {}
  prev = null;
}
