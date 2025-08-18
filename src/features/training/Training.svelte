<script lang="ts">
  import { completeSession, abortSession } from '../../store/kpStore';
  import { go } from '../../store/router';

  // jednostavan state dok je dev
  let state: 'idle' | 'prepare' | 'run' = 'idle';
  let countdown = 3;
  let t: number | null = null;
  let cancelled = false;

  function clearT(){ if (t) { clearTimeout(t); t = null; } }

  // START → 3s priprema → 3s "run" → completeSession() → Home
  function start() {
    cancelled = false;
    state = 'prepare';
    countdown = 3;
    clearT();
    t = window.setTimeout(tickPrepare, 1000);
  }

  function tickPrepare() {
    if (cancelled) return;
    if (countdown > 1) {
      countdown -= 1;
      clearT();
      t = window.setTimeout(tickPrepare, 1000);
    } else {
      state = 'run';
      // DEV: trajanje "run" 3s – kasnije će ovo zamijeniti pravi engine/prsten
      clearT();
      t = window.setTimeout(() => {
        if (cancelled) return;
        completeSession();  // +1 today.done, goal.percent refresh
        go('home');
      }, 3000);
    }
  }

  function stop() {
    cancelled = true;
    clearT();
    abortSession(); // STOP ne broji
    state = 'idle';
    go('home');
  }
</script>

<div class="card" style="text-align:center;padding:24px">
  <div style="margin-bottom:12px;font-weight:800;">
    {#if state==='prepare'} PRIPREMI SE ({countdown}s)
    {:else if state==='run'} TRENING U TOKU
    {:else} SPREMAN
    {/if}
  </div>

  <div style="display:flex;align-items:center;justify-content:center;height:240px">
    <!-- placeholder za prsten -->
    <div style="width:200px;height:200px;border-radius:50%;position:relative;border:2px solid rgba(255,255,255,.12)">
      <div style="position:absolute;inset:0;border-radius:50%;box-shadow:0 0 48px rgba(156,240,208,.15) inset"></div>
    </div>
  </div>

  {#if state==='idle'}
    <button class="btn" on:click={start}>START</button>
  {:else}
    <button class="btn" on:click={stop} style="background:#fff;color:#111">STOP</button>
  {/if}
</div>

<style>
  .card { padding:12px; border:1px solid #e6e6e6; border-radius:12px; background:rgba(255,255,255,.03); }
  .btn { padding:10px 16px; border-radius:12px; border:none; background:#0be2a0; color:#111; font-weight:700; cursor:pointer; }
  .btn:disabled { opacity:.5; cursor:not-allowed; }
</style>
