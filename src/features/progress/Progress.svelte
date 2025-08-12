<script lang="ts">
  import { kpStore } from '../../store/kpStore';
  $: p = kpStore.getTodayProgress();
  $: g = kpStore.getRankGoal();
</script>

<div class="grid">
  <section class="card">
    <div class="title">Sažetak</div>
    <div class="muted">Dan ranga: {g.day}/{g.length} • Danas: {p.done}/{p.target}</div>
  </section>
  <section class="card">
    <div class="title">Cilj ranga</div>
    <div class="muted">2 sesije/dan × 5 dana</div>
    <div style="height:8px;background:rgba(255,255,255,.08);border-radius:8px;overflow:hidden;margin-top:8px">
      <div style="height:100%;width:{Math.round((g.percent||0)*100)}%;background:var(--mint)"></div>
    </div>
  </section>
</div>
