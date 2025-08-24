import { writable } from "svelte/store";

type ToastData = { id: number; message: string; timeout?: number };
const _toasts = writable<ToastData[]>([]);
let _id = 1;

export const toasts = _toasts;

export function showToast(message: string, ms = 2200) {
  const id = _id++;
  _toasts.update((list) => [...list, { id, message, timeout: ms }]);
  if (ms > 0) {
    setTimeout(() => {
      _toasts.update((list) => list.filter((t) => t.id !== id));
    }, ms);
  }
}
