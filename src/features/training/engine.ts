// src/features/training/engine.ts
import type { PhaseName, Step } from "@/store/tuning";
import { scaleStepsByFactor } from "@/store/tuning";
import { baseStepsForRank, applyDevShort } from "@/features/training/plans";

export type { PhaseName, Step };

type UpdatePayload = {
  totalProgress: number; // 0..1 kroz cijelu sesiju (uklj. prepare)
  stepProgress: number; // 0..1 unutar trenutne faze
  stepName: PhaseName;
  stepMs: number;
  stepElapsed: number; // ms unutar trenutne faze
  totalElapsed: number; // ms od početka sesije
  totalMs: number; // ukupan ms sesije
  prepareMs: number; // trajanje prepare faze
};

type RunOpts = {
  devShort: boolean;
  rank: number;
  factor: number;
  onPhase?: (name: PhaseName) => void;
  onUpdate?: (p: UpdatePayload) => void;
  onDone?: () => void;
};

function buildSteps(devShort: boolean, rank: number, factor: number): Step[] {
  const base = baseStepsForRank(rank);
  const scaled = scaleStepsByFactor(base, factor);
  return applyDevShort(scaled, devShort);
}

/** Pokreni jednu sesiju – vraća kontroler sa stop() */
export function runSession(opts: RunOpts) {
  const steps = buildSteps(opts.devShort, opts.rank, opts.factor);
  const totalMs = steps.reduce((a, s) => a + s.ms, 0);
  const prepareMs = steps.find((s) => s.name === "prepare")?.ms ?? 0;

  let i = 0;
  let rafId: number | null = null;
  let cancelled = false;

  let stepStart = performance.now();
  let totalStart = stepStart;

  function nextPhase(now: number) {
    if (i >= steps.length) {
      opts.onDone?.();
      return;
    }
    stepStart = now;
    opts.onPhase?.(steps[i].name);
  }

  function frame(now: number) {
    if (cancelled) return;
    const step = steps[i];
    const stepElapsed = now - stepStart;
    const stepProgress = Math.min(1, stepElapsed / step.ms);

    const totalElapsed = now - totalStart;
    const totalProgress = Math.min(1, totalElapsed / totalMs);

    opts.onUpdate?.({
      totalProgress,
      stepProgress,
      stepName: step.name,
      stepMs: step.ms,
      stepElapsed,
      totalElapsed,
      totalMs,
      prepareMs,
    });

    if (stepElapsed >= step.ms) {
      i += 1;
      if (i >= steps.length) {
        opts.onUpdate?.({
          totalProgress: 1,
          stepProgress: 1,
          stepName: step.name,
          stepMs: step.ms,
          stepElapsed: step.ms,
          totalElapsed: totalMs,
          totalMs,
          prepareMs,
        });
        opts.onDone?.();
        return;
      }
      nextPhase(now);
    }
    rafId = requestAnimationFrame(frame);
  }

  // start
  nextPhase(performance.now());
  rafId = requestAnimationFrame(frame);

  return {
    stop() {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
    },
  };
}
