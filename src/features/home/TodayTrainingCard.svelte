<script lang="ts">
  import { go } from '../../store/router';
  export let done = 0;
  export let target = 2;

  function start() {
    try { go?.('training'); } catch {}
    // fallback: location.hash = '#training';
  }
</script>

<section id="kp-today-card" class="card">
  <div class="circle">{done}/{target}</div>
  <div class="body">
    <div class="title">Trening za danas</div>
    <div class="muted">Danas cilj: {target} sesije</div>
  </div>
  <button id="tc-start" class="btn" on:click={start}>Start</button>
</section>

<style>
  .card {
    display:flex; align-items:center; gap:12px;
    background: var(--surface-2); padding:14px; border-radius:12px;
  }
  .circle {
    width:56px; height:56px; border-radius:50%;
    display:grid; place-items:center; font-weight:800;
    background: rgba(255,255,255,.06);
  }
  .body{ flex:1; min-width:0 }
  .title{ font-weight:800; margin-bottom:2px }
  .muted{ opacity:.7; font-size:.92rem }
  .btn{ margin-left:auto }
</style>
