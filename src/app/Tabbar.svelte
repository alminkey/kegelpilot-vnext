<script lang="ts">
<<<<<<< HEAD
  import { route, go } from '@/store/router';
  import type { Tab } from '@/store/router';

  const tabs: { id: Tab; label: string }[] = [
    { id:'home',     label:'Početna'  },
    { id:'training', label:'Trening'  },
    { id:'edu',      label:'Edu'      },
    { id:'progress', label:'Napredak' },
    { id:'profile',  label:'Profil'   },
  ];
</script>

<nav class="tabbar" aria-label="Glavna navigacija">
  {#each tabs as t}
    <button
      class:active={$route===t.id}
      on:click={() => go(t.id)}
      aria-current={$route===t.id ? 'page' : undefined}
    >{t.label}</button>
=======
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
>>>>>>> origin/main
  {/each}
</nav>

<style>
<<<<<<< HEAD
  .tabbar{
    position: fixed;
    left: 0; right: 0; bottom: 0;
    height: 64px;
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0));
    display:flex; gap:8px;
    background:#0f1115;
    border-top:1px solid rgba(255,255,255,.08);
    z-index: 50;
  }
  button{
    flex:1; min-width:0;
    border:none; border-radius:12px;
    background: transparent; color:#e6ebef;
    font-weight: 800; cursor:pointer;
  }
  button.active{
    background: rgba(11,226,160,.2);
    color:#0be2a0;
=======
  .tabbar {
    position: sticky; bottom: 0; left: 0; right: 0;
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 8px; padding: 10px 12px; background: #0f1115;
    border-top: 1px solid rgba(255,255,255,.08); z-index: 50;
>>>>>>> origin/main
  }
  button { appearance: none; border: 0; background: transparent; color: #c9d1d9;
           padding: 8px 6px; border-radius: 10px; font-size: .95rem; cursor: pointer; }
  button.active { background: rgba(102,230,168,.15); color: #66E6A8; font-weight: 700; }
</style>
