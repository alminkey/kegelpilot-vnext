import { get } from "svelte/store";
import { isPro } from "@/store/user";

/** Ključevi koje ćemo koristiti na komponentama */
export type FeatureKey =
  | "rank>2"
  | "edu.proLesson"
  | "analytics.advanced"
  | "reminders.multi"
  | "training.customPlan"
  | "integrations.health";

export function isAllowed(feature: FeatureKey, overrideIsPro?: boolean) {
  const pro = overrideIsPro ?? get(isPro);

  if (pro) return true;

  // FREE pravila iz KP-PRO-PLAN (sažetak):
  // - FREE: jezgro treninga, prva 2 ranga, osnovna edu, dnevni brojač, mini statistika, 1 podsjetnik...
  // - PRO: sve ostalo (svi rangovi/programi, adaptivno, napredna analitika, više podsjetnika, specifični planovi, integracije...)
  switch (feature) {
    case "rank>2":
    case "edu.proLesson":
    case "analytics.advanced":
    case "reminders.multi":
    case "training.customPlan":
    case "integrations.health":
      return false; // zaključno za FREE
    default:
      return true;
  }
}
