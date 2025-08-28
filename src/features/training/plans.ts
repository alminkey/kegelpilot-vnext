// src/features/training/plans.ts
import type { Step } from "@/store/tuning";

/**
 * Bazni plan:
 * - 2s prepare (uvijek isto)
 * - 10 ciklusa po: 2s squeeze → 2s hold → 2s release  = 60s aktivnog dijela
 * Napomena: tuning faktor (scaleStepsByFactor) kasnije skalira trajanja.
 */
export function baseStepsForRank(_rank: number): Step[] {
  const steps: Step[] = [{ name: "prepare", ms: 2000 }];

  const CYCLES = 10;
  for (let i = 0; i < CYCLES; i++) {
    steps.push(
      { name: "squeeze", ms: 2000 },
      { name: "hold", ms: 2000 },
      { name: "release", ms: 2000 }
    );
  }
  return steps;
}

/** Dev skraćivanje vremena (brže testiranje) */
export function applyDevShort(steps: Step[], devShort: boolean): Step[] {
  if (!devShort) return steps;
  return steps.map((st) => ({
    ...st,
    ms: Math.max(400, Math.round(st.ms * 0.4)),
  }));
}
