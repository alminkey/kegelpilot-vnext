import { writable } from "svelte/store";

export type Tab = "home" | "training" | "progress" | "edu" | "profile";

function tabFromHash(hash: string): Tab {
  const key = hash.replace(/^#\/?/, "") as Tab;
  return (["home", "training", "progress", "edu", "profile"] as const).includes(
    key
  )
    ? key
    : "home";
}

const initial: Tab = tabFromHash(location.hash || "#/home");
export const route = writable<Tab>(initial);

export function go(tab: Tab) {
  // sync URL + store
  if (location.hash !== `#/${tab}`) location.hash = `#/${tab}`;
  route.set(tab);
}

// keep store in sync with user navigation
window.addEventListener("hashchange", () => {
  route.set(tabFromHash(location.hash));
});
