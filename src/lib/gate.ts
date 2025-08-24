import { get } from "svelte/store";
import { isPro } from "@/store/user";

export type FeatureKey = string;

export const PRO_ONLY_KEYS = [
  "reminders.multi",
  "edu.advanced",
  "training.all_ranks",
  "analytics.reports",
] as const;

const PRO_ONLY_SET = new Set<FeatureKey>(Array.from(PRO_ONLY_KEYS));

export function isAllowed(feature: FeatureKey): boolean {
  return get(isPro) || !PRO_ONLY_SET.has(feature);
}

export function ensureAllowed(feature: FeatureKey): boolean {
  if (isAllowed(feature)) return true;
  openPaywall(feature);
  return false;
}

export function openPaywall(
  feature?: FeatureKey,
  context?: Record<string, unknown>
) {
  if (get(isPro)) return; // PRO korisnik – nema paywalla
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("paywall:open", { detail: { feature, context } })
  );
}
