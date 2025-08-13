// src/store/router.ts
import { writable } from "svelte/store";

export type Tab = "home" | "trainer" | "edu" | "progress" | "profile";

// interni store za aktivni tab
const _tab = writable<Tab>("home");

// javni read-only API
export const route = { subscribe: _tab.subscribe };

// programatska navigacija
export const go = (tab: Tab) => {
  if (typeof window !== "undefined") {
    _tab.set(tab);
    location.hash = "#" + tab;
  }
};

// inicijalizacija i sync sa hash-om
export function initRouter() {
  const normalize = (h: string): Tab => {
    const t = (h.replace("#", "") || "home") as Tab;
    return (
      ["home", "trainer", "edu", "progress", "profile"] as const
    ).includes(t)
      ? t
      : "home";
  };
  const apply = () => _tab.set(normalize(location.hash));
  window.addEventListener("hashchange", apply);
  apply();
}
