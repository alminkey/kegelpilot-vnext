import { get } from "svelte/store";
import { isPro } from "@/store/user";

export type FeatureKey = string;

// Jedan izvor istine: lista PRO-only feature ključeva
export const PRO_ONLY_KEYS: ReadonlyArray<FeatureKey> = [
  "reminders.multi",
  "edu.advanced",
  "training.all_ranks",
  "analytics.reports",
] as const;

// Interno za brzu provjeru
const PRO_ONLY_SET = new Set<FeatureKey>(PRO_ONLY_KEYS);

export function isAllowed(feature: FeatureKey): boolean {
  // PRO otključava sve
  if (get(isPro)) return true;
  // FREE: zabranjeno sve što je u PRO listi
  return !PRO_ONLY_SET.has(feature);
}
