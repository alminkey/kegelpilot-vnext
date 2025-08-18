<script lang="ts">
  import { kpStore, today, goal, resetAll, resetToday } from '@/store/kpStore';

  function onResetAll() {
    if (confirm('Resetovati SVU statistiku (dnevni progres i ciljni napredak)?')) {
      resetAll();
      alert('Statistika je resetovana.');
    }
  }
  function onResetToday() {
    if (confirm('Resetovati samo današnji brojač?')) {
      resetToday();
      alert('Današnji brojač je resetovan.');
    }
  }
</script>

<section class="page">
  <h2>Napredak</h2>

  <div class="card">
    <div><b>Danas:</b> {$today.done}/{$today.target}</div>
    <div><b>Cilj:</b> Rang {$goal.rank} • Dan {$goal.day}/{$goal.length}</div>
  </div>

  <div class="card danger">
    <div class="title">Reset statistike</div>
    <div class="row">
      <button class="btn danger" on:click={onResetAll}>Resetuj sve</button>
      <button class="btn ghost"  on:click={onResetToday}>Samo današnji</button>
    </div>
    <p class="hint">Reset sve = početno stanje (0/2, napredak cilja 0%).</p>
  </div>
</section>

<style>
  .page { padding:16px; display:grid; gap:12px; }
  .card { padding:12px; border:1px solid #2a2f36; border-radius:12px; background:#0f1115; }
  .card.danger { border-color: rgba(255,110,110,.35); }
  .title { font-weight:800; margin-bottom:8px; }
  .row { display:flex; gap:10px; flex-wrap:wrap; }
  .btn { padding:10px 16px; border-radius:12px; border:none; cursor:pointer; font-weight:700; }
  .btn.danger { background:#ff6e6e; color:#111; }
  .btn.ghost  { background:transparent; color:#c9d1d9; border:1px solid rgba(255,255,255,.15); }
  .hint { opacity:.75; margin-top:8px; font-size:.9rem; }
</style>
