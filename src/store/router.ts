import { writable } from "svelte/store";

export type Tab = "home" | "training" | "edu" | "progress" | "profile";

function tabFromHash(hash: string): Tab {
  const name = hash.replace(/^#\/?/, "") || "home";
  const allowed: readonly Tab[] = [
    "home",
    "training",
    "edu",
    "progress",
    "profile",
  ] as const;
  return (allowed as readonly string[]).includes(name) ? (name as Tab) : "home";
}

export const route = writable<Tab>(tabFromHash(location.hash));

export function go(tab: Tab) {
  const next = `#/${tab}`;
  if (location.hash !== next) location.hash = next;
  route.set(tab);
}

window.addEventListener("hashchange", () => {
  route.set(tabFromHash(location.hash));
});
