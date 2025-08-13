<script lang="ts">
  // Komponente su u istom folderu, pa koristi kratke putanje:
  import CurrentGoalCard from './CurrentGoalCard.svelte';
  import TodayTrainingCard from './TodayTrainingCard.svelte';

  // Store
  import { kpStore } from '../../store/kpStore';

  // Reaktivno čitanje – osvježiće se poslije svake završene sesije
  $: prog = kpStore.getTodayProgress();  // { done, target }
  $: goal = kpStore.getRankGoal();       // { rank, day, length, ... }
</script>

<!-- 🔁 NOVE kartice (komponente) -->
<CurrentGoalCard
  rank={goal.rank}
  day={goal.day}
  length={goal.length}
  done={prog.done}
  target={prog.target}
/>

<TodayTrainingCard
  done={prog.done}
  target={prog.target}
/>

<!-- Ostale pločice na naslovnoj ostaju kako jesu -->
<section class="grid twocol">
  <div class="card">
    <div class="title">Brzi start</div>
    <div class="muted">Treniraj pametno. Jedan tap.</div>
  </div>
  <div class="card">
    <div class="title">Savjet dana</div>
    <div class="muted">Diši ravnomjerno; manjim intenzitetom na početku.</div>
  </div>
</section>
