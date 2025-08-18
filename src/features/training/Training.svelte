<script lang="ts">
  import TrainingRing from '@/features/training/TrainingRing.svelte';
  import { runSession, type PhaseName } from '@/features/training/engine';
  import {
    s, today, goal,
    completeSession, abortSession,
    shouldAskFeedback, feedbackOkRank, feedbackTooHardRank
  } from '@/store/kpStore';
  import { go } from '@/store/router';
  import { get } from 'svelte/store';

  let controller: { stop(): void } | null = null;

  let running = false;
  let phase: PhaseName = 'prepare';

  // iz engine-a
  let progress = 0;
  let stepMs = 0;
  let stepElapsed = 0;
  let stepProgress = 0;
  let totalElapsed = 0;
  let totalMs = 0;
  let prepareMs = 0;

  // feedback
  let showFeedback = false;
  let step: 'question' | 'too-hard' = 'question';

  const tips: string[] = [
    'Diši ravnomjerno — udah kroz nos, izdah duži.',
    'Ako osjetiš bol ili trnce, prekini i odmori.',
    'Ne steži zadnjicu/bedra — fokus na dno karlice.',
    'Kvalitet iznad snage — lagano ali kontrolisano.',
    'Ramena opuštena; ne zadržavaj dah.'
  ];

  function start() {
    running = true;
    const devShort = get(s).devShort;

    controller?.stop();
    controller = runSession({
      devShort,
      onPhase: (p) => { phase = p; stepProgress = 0; },
      onUpdate: (u) => {
        progress      = u.totalProgress;
        stepMs        = u.stepMs;
        stepElapsed   = Math.min(u.stepElapsed, u.stepMs);
        stepProgress  = u.stepProgress;
        totalElapsed  = u.totalElapsed;
        totalMs       = u.totalMs;
        prepareMs     = u.prepareMs;
      },
      onDone: () => {
        running = false;
        completeSession();
        if (shouldAskFeedback()) { showFeedback = true; step = 'question'; }
        else { go('home'); }
      }
    });
  }
  function stop() { controller?.stop(); running = false; abortSession(); go('home'); }

  $: phaseTitle =
    phase === 'prepare' ? 'Pripremi se' :
    phase === 'squeeze' ? 'Stegni' :
    phase === 'hold'    ? 'Zadrži' :
                          'Opusti';

  // % napretka bez “pripreme”
  $: trainProg = totalMs > 0
    ? Math.max(0, Math.min(1, (totalElapsed - prepareMs) / Math.max(1, totalMs - prepareMs)))
    : 0;

  $: metric = phase === 'prepare'
    ? `${Math.max(1, Math.ceil((stepMs - stepElapsed)/1000))}s`
    : `${Math.round(trainProg*100)}%`;

  // unutrašnji puls (samo tokom treninga)
  $: innerPulse =
    phase === 'squeeze' ? stepProgress :
    phase === 'hold'    ? 1 :
    phase === 'release' ? 1 - stepProgress :
                          0;

  // “prepare” puls na vanjskom ringu
  const PREP_PULSES = 2;
  $: prepWave = (1 - Math.cos(2 * Math.PI * PREP_PULSES * stepProgress)) / 2; // 0..1
  $: ringOpacity = phase === 'prepare' ? (1 - 0.5 * prepWave) : 1;
  $: ringProgress = phase === 'prepare' ? 1 : trainProg;

  function fbNo()  { feedbackOkRank(); closeFb(); }
  function fbYes() { step = 'too-hard'; }
  function fbDelta(d: number) { feedbackTooHardRank(d); closeFb(); }
  function closeFb() { showFeedback = false; go('home'); }
  function toggle() { running ? stop() : start(); }
</script>

<section class="training-page">
  <div class="card training">
    <div class="phase-title">{phaseTitle}</div>

    <div class="ring-box">
      <TrainingRing
        progress={ringProgress}
        pulse={phase==='prepare' ? 0 : innerPulse}
        ringColor="#0be2a0"
        pulseColor="#FFA657"
        ringOpacity={ringOpacity}
      />

      <div class="center-label" role="button" tabindex="0"
           on:click={toggle}
           on:keydown={(e)=> (e.key==='Enter'||e.key===' ') && toggle()}>
        {running ? 'STOP' : 'START'}
      </div>

      <div class="metric">{metric}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="card tips">
      <div class="title">Savjeti</div>
      <ul>
        {#each tips.slice(0,3) as t}
          <li>{t}</li>
        {/each}
      </ul>
    </div>

    <div class="card stats">
      <div class="title">Kratka statistika</div>
      <div class="grid">
        <div>
          <div class="k">Danas</div>
          <div class="v">{$today.done}/{$today.target}</div>
        </div>
        <div>
          <div class="k">Preostalo</div>
          <div class="v">{Math.max($today.target - $today.done, 0)}</div>
        </div>
        <div>
          <div class="k">Rang</div>
          <div class="v">{$goal.rank}</div>
        </div>
        <div>
          <div class="k">Dan</div>
          <div class="v">{$goal.day}/{$goal.length}</div>
        </div>

        <!-- ✅ bar s boljim kontrastom teksta -->
        <div class="bar" style={`--p:${Math.round($goal.percent*100)}%`}>
          Napredak ranga <span>{Math.round($goal.percent*100)}%</span>
        </div>
      </div>
    </div>
  </div>
</section>

{#if showFeedback}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Povratna informacija o sesiji">
    <div class="modal">
      {#if step === 'question'}
        <h3>Je li sesija bila preteška?</h3>
        <div class="row">
          <button class="btn ghost" on:click={fbNo}>NE</button>
          <button class="btn warn"  on:click={fbYes}>DA</button>
        </div>
        <button class="link" on:click={closeFb} aria-label="Zatvori">Zatvori</button>
      {:else}
        <h3>Koliko olakšati?</h3>
        <div class="row">
          <button class="btn ghost" on:click={() => fbDelta(0.2)}>20% lakše</button>
          <button class="btn ghost" on:click={() => fbDelta(0.3)}>30% lakše</button>
          <button class="btn ghost" on:click={() => fbDelta(0.5)}>50% lakše</button>
        </div>
        <button class="link" on:click={closeFb}>Odustani</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .training-page { padding: 16px; min-height: 60vh; display: grid; gap: 12px; }
  .card { padding:16px; border:1px solid #2a2f36; border-radius:12px; background:#0f1115; }
  .training { text-align:center; padding:24px; display:grid; gap:16px; place-items:center; }

  .phase-title { color:#0be2a0; font-size:1.1rem; font-weight:800; letter-spacing:.02em; }

  .ring-box { position: relative; width: 260px; height: 260px; margin-inline:auto; }
  .center-label {
    position:absolute; left:50%; top:50%; transform: translate(-50%, -50%);
    color:#e6ebef; font-weight:800; letter-spacing:.02em; user-select:none; cursor:pointer;
  }
  .center-label:focus { outline: 2px solid rgba(255,255,255,.2); outline-offset: 2px; }
  .metric {
    position:absolute; left:50%; top: calc(50% + 56px); transform: translateX(-50%);
    font-weight:700; color:#e6ebef; opacity:.95;
  }

  .info-grid { display:grid; gap:12px; }
  @media (min-width: 720px) { .info-grid { grid-template-columns: 1fr 1fr; } }

  .title { font-weight:800; margin-bottom:8px; }
  .tips ul { list-style: disc; margin: 0 0 0 18px; padding: 0; }
  .tips li { opacity:.9; margin:4px 0; }

  .stats .grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px; }
  .stats .k { opacity:.75; font-size:.9rem; }
  .stats .v { font-weight:800; letter-spacing:.02em; }
  .stats .bar {
    grid-column: 1 / -1;
    margin-top: 6px; padding:10px; border-radius:10px;
    background: linear-gradient(90deg, #0be2a0 var(--p), rgba(255,255,255,.08) var(--p));
    color:#e6ebef;                 /* ✅ svijetli tekst, vidljiv na zelenom */
    font-weight:800; text-align:center;
  }

  .btn { padding:10px 16px; border-radius:12px; border:none; cursor:pointer; font-weight:700; }
  .btn.warn  { background:#ffb166; color:#111; }
  .btn.ghost { background:transparent; color:#c9d1d9; border:1px solid rgba(255,255,255,.15); }
  .link { background:none; border:none; color:#81D4FA; margin-top:12px; cursor:pointer; }

  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45);
                   display:flex; align-items:center; justify-content:center; z-index:100; }
  .modal { width:min(480px, 92vw); background:#11151b; border:1px solid #2a2f36;
           border-radius:16px; padding:20px; text-align:center; }
  .row { display:flex; gap:10px; justify-content:center; margin:12px 0; flex-wrap:wrap; }
</style>
