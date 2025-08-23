import { writable } from "svelte/store";

// Stranice
import Home from "@/features/home/Home.svelte";
import Training from "@/features/training/Training.svelte";
import Progress from "@/features/progress/Progress.svelte";
import Edu from "@/features/edu/Edu.svelte";
import Profile from "@/features/profile/Profile.svelte";
import Pro from "@/features/pro/Pro.svelte"; // ← pro stranica

// Dodaj "pro" u tip
export type Tab = "home" | "training" | "progress" | "edu" | "profile" | "pro";

// Mapiraj sve rute
export const routes: Record<Tab, any> = {
  home: Home,
  training: Training,
  progress: Progress,
  edu: Edu,
  profile: Profile,
  pro: Pro,
};

// Normalizacija hash-a
function tabFromHash(hash: string): Tab {
  const key = hash.replace(/^#\/?/, "") as Tab;
  switch (key) {
    case "home":
    case "training":
    case "progress":
    case "edu":
    case "profile":
    case "pro":
      return key;
    default:
      return "home";
  }
}

// Store + navigacija
const initial: Tab = tabFromHash(location.hash || "#/home");
export const route = writable<Tab>(initial);

export function go(tab: Tab) {
  if (location.hash !== `#/${tab}`) location.hash = `#/${tab}`;
  route.set(tab);
}

// Sync kad korisnik ručno mijenja hash
window.addEventListener("hashchange", () => {
  route.set(tabFromHash(location.hash));
});
