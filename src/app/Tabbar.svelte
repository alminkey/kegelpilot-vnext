<script lang="ts">
  import { route, go, type Tab } from "@/store/router";

  type Item = { key: Tab; label: string; emoji: string };
  const items: Item[] = [
    { key: "home",     label: "Početna",  emoji: "🏠" },
    { key: "training", label: "Trening",  emoji: "🏁" },
    { key: "edu",      label: "Edu",      emoji: "🎓" },
    { key: "progress", label: "Napredak", emoji: "📈" },
    { key: "profile",  label: "Profil",   emoji: "👤" },
  ];

  const nav = (t: Tab) => () => go(t);
</script>

<nav class="tabbar" aria-label="Glavna navigacija">
  {#each items as it}
    <button
      type="button"
      class="tab"
      class:active={$route === it.key}
      aria-current={$route === it.key ? "page" : undefined}
      on:click={nav(it.key)}
    >
      <span class="e">{it.emoji}</span>
      <span class="t">{it.label}</span>
    </button>
  {/each}
</nav>

<style>
  .tabbar{
    position: sticky; bottom: 0; z-index: 20;
    display:grid; grid-template-columns: repeat(5,1fr);
    gap:8px; padding:10px 12px;
    background: #0b0f14;
    border-top: 1px solid rgba(255,255,255,.06);
  }
  .tab{
    display:flex; flex-direction:column; align-items:center; gap:4px;
    border:1px solid rgba(255,255,255,.10);
    background: rgba(255,255,255,.04);
    color:#e6ebef; border-radius:12px; padding:8px 6px; font-weight:800;
    cursor:pointer;
  }
  .tab .e{ font-size:1.1rem; line-height:1; }
  .tab.active{
    border-color: rgba(11,226,160,.35);
    box-shadow: 0 0 0 3px rgba(11,226,160,.10) inset;
  }
</style>
