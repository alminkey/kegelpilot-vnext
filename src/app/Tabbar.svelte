<script lang="ts">
  import { route, go, type Tab } from '@/store/router';

  const items = [
    { key: 'home',     label: 'Početna'  },
    { key: 'training', label: 'Trening'  },
    { key: 'edu',      label: 'Edu'      },
    { key: 'progress', label: 'Napredak' },
    { key: 'profile',  label: 'Profil'   }
  ] as const;

  type TabKey = typeof items[number]['key'];
  const nav = (tab: TabKey) => go(tab as Tab); // bez ograničenja nakon 2/2
</script>

<nav class="tabbar" aria-label="Glavna navigacija">
  {#each items as it}
    <button
      type="button"
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
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 8px; padding: 10px 12px; background: #0f1115;
    border-top: 1px solid rgba(255,255,255,.08); z-index: 50;
  }
  button { appearance: none; border: 0; background: transparent; color: #c9d1d9;
           padding: 8px 6px; border-radius: 10px; font-size: .95rem; cursor: pointer; }
  button.active { background: rgba(102,230,168,.15); color: #66E6A8; font-weight: 700; }
</style>
