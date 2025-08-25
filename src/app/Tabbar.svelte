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

<nav class="kp-tabbar" aria-label="Glavna navigacija">
  <div class="inner">
    {#each items as it}
      <button
        type="button"
        class="tab { $route === it.key ? 'active' : '' }"
        aria-current={$route === it.key ? "page" : undefined}
        on:click={nav(it.key)}
      >
        <span class="e">{it.emoji}</span>
        <span class="l">{it.label}</span>
      </button>
    {/each}
  </div>
</nav>

<style>
  .kp-tabbar{
    position: fixed;
    left: 0; right: 0;
    bottom: 0;                              /* skroz do dna */
    z-index: 120;                           /* ispod modala */
    width: 100%;
    background: var(--bg, #0b0f14);         /* puni background */
    padding: 10px 12px max(10px, env(safe-area-inset-bottom, 0));
  }
  /* Pokrij safe-area “usnu” ako postoji */
  .kp-tabbar::after{
    content: "";
    position: absolute; left: 0; right: 0; bottom: 0;
    height: env(safe-area-inset-bottom, 0);
    background: var(--bg, #0b0f14);
  }

  .inner{
    max-width: 680px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
  }
  .tab{
    display:flex; flex-direction:column; align-items:center; gap:4px;
    border:1px solid rgba(255,255,255,.10);
    background: rgba(255,255,255,.04);
    color:#e6ebef; border-radius:12px; padding:8px 6px; font-weight:800;
    cursor:pointer;
    min-height: 60px;
  }
  .tab .e{ font-size:1.1rem; line-height:1; }
  .tab .l{ font-size:.82rem; }
  .tab.active{
    border-color: rgba(11,226,160,.35);
    box-shadow: 0 0 0 3px rgba(11,226,160,.10) inset;
  }
  .tab:focus{ outline:none; box-shadow: 0 0 0 3px rgba(11,226,160,.25); }
</style>
