<script lang="ts">
  export let rank = 1;
  export let day = 1;
  export let length = 5;
  export let done = 0;
  export let target = 2;

  $: pct = Math.min(100, Math.round((done / Math.max(1, target)) * 100));
</script>

<section id="kp-goal-strip" class="card">
  <header>Rang {rank} • Dan {day}/{length}</header>
  <div class="bar"><div class="fill" style={`width:${pct}%`}></div></div>
  <small>Danas: {done}/{target}</small>
</section>
