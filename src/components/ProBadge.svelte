<script lang="ts">
  import { go, type Tab } from "@/store/router";
  import { isPro } from "@/store/user";
  export let small = false;

  const openPro = () => go("pro" as Tab); // i FREE bedž vodi na PRO stranicu
</script>

<button
  type="button"
  class="badge"
  class:small={small}
  class:pro={$isPro}
  class:free={!$isPro}
  title={$isPro ? "PRO aktivno — tap za detalje" : "FREE — tap za PRO opcije"}
  on:click={openPro}
>
  {$isPro ? "PRO aktivno" : "FREE"}
</button>

<style>
  .badge{
    all: unset;
    display:inline-flex; align-items:center;
    border-radius:999px; padding:4px 10px;
    font-weight:800; cursor:pointer;
    border:1px solid transparent;
  }
  .badge.small{ font-size:.8rem; padding:3px 8px; }

  /* PRO (zeleno) */
  .badge.pro{
    color:#0be2a0;
    background:rgba(11,226,160,.12);
    border-color:rgba(11,226,160,.25);
  }

  /* FREE (crveno) */
  .badge.free{
    color:#ff6b6b;
    background:rgba(255,107,107,.12);
    border-color:rgba(255,107,107,.28);
  }

  .badge:focus-visible{ outline:2px solid currentColor; outline-offset:2px; }
</style>
