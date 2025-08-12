<script lang="ts">
  import { kpStore } from '../../store/kpStore';
  import { get } from 'svelte/store';
  function toTraining(){ location.hash = 'training'; }
  function toProgress(){ location.hash = 'progress'; }
  $: prog = kpStore.getTodayProgress();
  $: goal = kpStore.getRankGoal();
  $: pToday = Math.min(1, prog.done / Math.max(1, prog.target));
  $: ringDash = 2*Math.PI*21;
</script>

<section class="card" on:click={toProgress}>
  <div class="center">
    <div><b>Rang {goal.rank}</b> • Dan <b>{goal.day}</b>/{goal.length}</div>
    <div>Danas: <b>{prog.done}</b>/{prog.target}</div>
  </div>
  <div style="height:8px;background:rgba(255,255,255,.08);border-radius:8px;overflow:hidden;margin-top:8px">
    <div style="height:100%;width:{Math.round((goal.percent||0)*100)}%;background:var(--mint)"></div>
  </div>
</section>

<section class="card center" on:click={toTraining}>
  <div style="position:relative;width:56px;height:56px">
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="21" stroke="rgba(255,255,255,.1)" stroke-width="6" fill="none"/>
      <circle cx="28" cy="28" r="21" stroke="var(--acc)" stroke-width="6" fill="none" stroke-linecap="round"
              transform="rotate(-90 28 28)"
              stroke-dasharray={ringDash}
              stroke-dashoffset={Math.round(ringDash*(1-pToday))}/>
    </svg>
    <div style="position:absolute;left:0;top:50%;transform:translate(70%,-50%);font-weight:800">
      {prog.done}/{prog.target}
    </div>
  </div>
  <div style="flex:1">
    <div style="font-weight:800">Trening za danas</div>
    <div class="muted">Dan {goal.day} • Rang {goal.rank} • ~{ kpStore.getTodayProgress().target * 2 } min</div>
  </div>
  <button class="btn">Start</button>
</section>

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
