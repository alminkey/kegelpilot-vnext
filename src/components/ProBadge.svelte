<script lang="ts">
  export let active = false; // true = PRO aktivno, false = FREE

  // Samo zaustavimo bubbling; navigaciju radi anchor sam (href="#/pro").
  function stop(e: MouseEvent) {
    e.stopPropagation();
    // ne radimo preventDefault – pustimo anchor da promijeni hash
  }
</script>

<a
  href="#/pro"
  class="pro-badge"
  class:active={active}
  on:click={stop}
  aria-label="Otvori KegelPilot PRO"
  title="KegelPilot PRO"
>
  {#if active} PRO aktivno {:else} FREE {/if}
</a>

<style>
  .pro-badge{
    display:inline-block;
    font-weight:800; font-size:.85rem; letter-spacing:.02em;
    background:rgba(11,226,160,.14);
    border:1px solid rgba(11,226,160,.35);
    color:#0be2a0;
    padding:6px 10px; border-radius:999px; cursor:pointer;
    text-decoration:none; /* anchor bez podcrtavanja */
  }
  .pro-badge.active{
    background:rgba(11,226,160,.20);
    border-color:rgba(11,226,160,.55);
  }
</style>
