<script lang="ts">
  import { kpStore } from '../../store/kpStore';
  import { onMount } from 'svelte';

  let state:'idle'|'prepare'|'run' = 'idle';
  let t:any = null;
  let countdown = 0;

  function start(){
    if(state!=='idle') return;
    state='prepare'; countdown = 2;
    const step = ()=>{
      if(countdown<=0){ run(); return; }
      countdown -= 1;
      t = setTimeout(step, 1000);
    };
    step();
  }
  function run(){
    state='run';
    kpStore.startSession(); // devShort: ~3s
  }
  function stop(){
    if(state==='run'){ kpStore.abortSession(); }
    state='idle'; clearTimeout(t); t=null;
  }
</script>

<div class="card" style="text-align:center;padding:24px">
  <div style="margin-bottom:12px;font-weight:800;color:var(--acc)">
    {#if state==='prepare'} PRIPREMI SE ({countdown}s)
    {:else if state==='run'} TRENING U TOKU
    {:else} SPREMAN
    {/if}
  </div>
  <div style="display:flex;align-items:center;justify-content:center;height:240px">
    <div style="width:200px;height:200px;border-radius:50%;position:relative;border:2px solid rgba(255,255,255,.12)">
      <!-- ring placeholder -->
      <div style="position:absolute;inset:0;border-radius:50%;box-shadow:0 0 48px rgba(156,240,208,.15) inset"></div>
    </div>
  </div>
  {#if state==='idle'}
    <button class="btn" on:click={start}>START</button>
  {:else}
    <button class="btn" on:click={stop} style="background:#fff;color:#111">STOP</button>
  {/if}
</div>
