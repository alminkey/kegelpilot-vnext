<script lang="ts">
  import { route, go } from '@/store/router';
  import type { Tab } from '@/store/router';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'home',     label: 'Početna'  },
    { id: 'training', label: 'Trening'  },
    { id: 'edu',      label: 'Edu'      },
    { id: 'progress', label: 'Napredak' },
    { id: 'profile',  label: 'Profil'   },
  ];
</script>

<nav class="tabbar" aria-label="Glavna navigacija">
  {#each tabs as t}
    <button
      class:active={$route===t.id}
      on:click={() => go(t.id)}
      aria-current={$route===t.id ? 'page' : undefined}
    >
      {t.label}
    </button>
  {/each}
</nav>

<style>
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
    font-weight:800; cursor:pointer;
  }
  button.active{
    background: rgba(11,226,160,.2);
    color:#0be2a0;
  }
</style>
