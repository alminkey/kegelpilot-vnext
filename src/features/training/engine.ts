export type PhaseName = "prepare" | "squeeze" | "hold" | "release";
export type Step = { name: PhaseName; ms: number };

type UpdatePayload = {
  totalProgress: number; // 0..1 kroz cijelu sesiju (uklj. prepare)
  stepProgress: number; // 0..1 unutar trenutne faze
  stepName: PhaseName;
  stepMs: number;
  stepElapsed: number; // ms unutar trenutne faze
  totalElapsed: number; // ms od početka sesije
  totalMs: number; // ukupan ms sesije
  prepareMs: number; // trajanje prepare faze (za UI kalkulacije)
};

type RunOpts = {
  devShort: boolean;
  onPhase?: (name: PhaseName) => void;
  onUpdate?: (p: UpdatePayload) => void;
  onDone?: () => void;
};

// Minimalni program: 2s prepare → 3s squeeze → 3s hold → 3s release
function buildSteps(devShort: boolean): Step[] {
  const ms = (normal: number, short: number) => (devShort ? short : normal);
  return [
    { name: "prepare", ms: ms(2000, 1000) },
    { name: "squeeze", ms: ms(3000, 1200) },
    { name: "hold", ms: ms(3000, 1200) },
    { name: "release", ms: ms(3000, 1200) },
  ];
}

/** Pokreni jednu sesiju – vraća kontroler sa stop() */
export function runSession(opts: RunOpts) {
  const steps = buildSteps(opts.devShort);
  const totalMs = steps.reduce((a, s) => a + s.ms, 0);
  const prepareMs = steps[0].ms;

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
