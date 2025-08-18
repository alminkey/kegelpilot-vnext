<script lang="ts">
  import CurrentGoalCard from './CurrentGoalCard.svelte';
  import TodayTrainingCard from './TodayTrainingCard.svelte';

  // Store objekt + router (PAZI putanje!)
  import { kpStore } from '../../store/kpStore';
  import { go } from '../../store/router';
  import { onDestroy } from 'svelte';

  // inicijalno stanje
  let prog = kpStore.getTodayProgress(); // { done, target }
  let goal = kpStore.getRankGoal();      // { rank, day, length, percent }

  // subscribaj se na "ping" da bi se vrijednosti osvježavale kad completeSession() završi
  const unsubscribe = kpStore.change.subscribe(() => {
    prog = kpStore.getTodayProgress();
    goal = kpStore.getRankGoal();
  });
  onDestroy(unsubscribe);

  function startTraining() {
    go('training');
  }
</script>

<section class="home-grid">
  <CurrentGoalCard
    rank={goal.rank}
    day={goal.day}
    length={goal.length}
    done={prog.done}
    target={prog.target}
  />

  <!-- Today Training; očekuje se da komponenta emituje 'start', pa mi zovemo go('training') -->
  <TodayTrainingCard
    done={prog.done}
    target={prog.target}
    on:start={startTraining}
  />

  <!-- Ostale kartice (stub) -->
  <div class="card">
    <div class="title">Brzi start</div>
    <div class="muted">Treniraj pametno. Jedan tap.</div>
  </div>
  <div class="card">
    <div class="title">Savjet dana</div>
    <div class="muted">Diši ravnomjerno; lagani start.</div>
  </div>
</section>

<style>
  .home-grid { display:grid; gap:12px; padding:16px; grid-template-columns: 1fr; }
  .card { padding:12px; border:1px solid #e6e6e6; border-radius:12px; background:rgba(255,255,255,.03); }
  .title { font-weight:700; margin-bottom:4px; }
  .muted { opacity:.8; font-size:.95rem; }
</style>
