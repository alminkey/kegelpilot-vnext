<script lang="ts">
  export let rank = 1;
  export let day = 1;       // 1..length
  export let length = 5;    // npr. 5 dana u rangu
  export let done = 0;      // završene sesije danas
  export let target = 2;    // dnevni cilj

  // napredak unutar dana (0..1)
  $: dayPart = Math.min(1, done / Math.max(1, target));
  // procenat ranga (uključuje trenutni dan)
  $: rankPct = Math.round(((Math.max(0, day - 1) + dayPart) / Math.max(1, length)) * 100);
</script>

<a
  id="kp-goal-strip"
  class="card linkcard"
  href="#progress"
  aria-label={`Rang ${rank}, dan ${day} od ${length}, danas ${done} od ${target}`}
>
  <header class="title">Rang {rank} • Dan {day}/{length}</header>

  <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={rankPct}>
    <div class="fill" style={`width:${rankPct}%`}></div>
  </div>

  <small class="muted">Danas: {done}/{target}</small>
</a>

<style>
  .card { border-radius: 12px; }
  .linkcard {
    display: block;
    padding: 14px;
    background: var(--surface-2);
    color: inherit;
    text-decoration: none;
  }
  .title { font-weight: 800; margin-bottom: 6px; }
  .bar { height: 8px; background: rgba(255,255,255,.08); border-radius: 8px; overflow: hidden; }
  .fill { height: 100%; background: var(--mint); }
  .muted { opacity: .7; }
</style>
