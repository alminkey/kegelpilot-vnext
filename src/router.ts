import { writable } from "svelte/store";

// Stranice (putanje po tvojoj strukturi)
import Home from "@/features/home/Home.svelte";
import Training from "@/features/training/Training.svelte";
import Progress from "@/features/progress/Progress.svelte";
import Edu from "@/features/edu/Edu.svelte";
import Profile from "@/features/profile/Profile.svelte";
import Pro from "@/features/pro/Pro.svelte"; // ← ovako je kod tebe u stablu

// Tip rute (dodali "pro")
export type Tab = "home" | "training" | "progress" | "edu" | "profile" | "pro";

// Mapa ruta → komponenti
export const routes: Record<Tab, any> = {
  home: Home,
  training: Training,
  progress: Progress,
  edu: Edu,
  profile: Profile,
  pro: Pro,
};

// Parse iz hash-a (otporan i jednostavan)
function tabFromHash(hash: string): Tab {
  const keyRaw = hash.replace(/^#\/?/, "");
  const allowed = new Set<Tab>([
    "home",
    "training",
    "progress",
    "edu",
    "profile",
    "pro",
  ]);
  return allowed.has(keyRaw as Tab) ? (keyRaw as Tab) : "home";
}

// Store + navigacija
const initial: Tab = tabFromHash(location.hash || "#/home");
export const route = writable<Tab>(initial);

export function go(tab: Tab) {
  if (location.hash !== `#/${tab}`) location.hash = `#/${tab}`;
  route.set(tab);
}

// Sync kada korisnik promijeni hash ručno
window.addEventListener("hashchange", () => {
  route.set(tabFromHash(location.hash));
});
