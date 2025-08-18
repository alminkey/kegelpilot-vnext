<script lang="ts">
  import { route, go, type Tab } from '../store/router';

  type Item = { key: Tab; label: string };
  const items: Item[] = [
    { key: 'home',     label: 'Početna' },
    { key: 'training', label: 'Trening' },
    { key: 'edu',      label: 'Edu' },
    { key: 'progress', label: 'Napredak' },
    { key: 'profile',  label: 'Profil' }
  ];

  function nav(tab: Tab) {
    go(tab); // sync hash + store
  }
</script>

<nav class="tabbar" role="tablist" aria-label="Glavna navigacija">
  {#each items as it}
    <button
      type="button"
      role="tab"
      class:active={$route === it.key}
      aria-current={$route === it.key ? 'page' : undefined}
      on:click={() => nav(it.key)}
    >
      {it.label}
    </button>
  {/each}
</nav>

<style>
  .tabbar {
    position: sticky; bottom: 0; left: 0; right: 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    padding: 10px 12px;
    background: #0f1115;
    border-top: 1px solid rgba(255,255,255,.08);
    z-index: 50;          /* iznad sadržaja */
    pointer-events: auto; /* sigurno prima klikove */
  }
  button {
    appearance: none; border: 0; background: transparent;
    color: #c9d1d9; padding: 8px 6px; border-radius: 10px;
    font-size: 0.95rem; cursor: pointer;
  }
  button.active {
    background: rgba(102, 230, 168, .15);
    color: #66E6A8;
    font-weight: 700;
  }
</style>
