import { writable } from "svelte/store";
import ToastHost from "@/components/ToastHost.svelte";

export type ToastKind = "success" | "error" | "info";
export type Toast = {
  id: string;
  message: string;
  kind: ToastKind;
  ttlMs: number;
};

export const toasts = writable<Toast[]>([]);

let hostMounted = false;
function ensureHost() {
  if (hostMounted) return;
  // Dinamički montiramo ToastHost bez potrebe da diramo App.svelte
  const el = document.createElement("div");
  document.body.appendChild(el);
  new ToastHost({ target: el });
  hostMounted = true;
}

export function showToast(
  message: string,
  kind: ToastKind = "success",
  ttlMs = 2500
) {
  ensureHost();
  const id = crypto.randomUUID?.() ?? String(Date.now() + Math.random());
  const t: Toast = { id, message, kind, ttlMs };
  toasts.update((arr) => [...arr, t]);
  window.setTimeout(() => removeToast(id), ttlMs);
}

export function removeToast(id: string) {
  toasts.update((arr) => arr.filter((t) => t.id !== id));
}
