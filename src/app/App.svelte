<script lang="ts">
  import Header from './Header.svelte';
  import Tabbar from './Tabbar.svelte';
  import { route } from '@/store/router';

  import Home     from '@/features/home/Home.svelte';
  import Training from '@/features/training/Training.svelte';
  import Progress from '@/features/progress/Progress.svelte';
  import Profile  from '@/features/profile/Profile.svelte';
  import Edu      from '@/features/edu/Edu.svelte'; // prilagodi ime ako je drugo
</script>

<Header />

<main class="page">
  {#if $route === 'home'}
    <Home />
  {:else if $route === 'training'}
    <Training />
  {:else if $route === 'progress'}
    <Progress />
  {:else if $route === 'profile'}
    <Profile />
  {:else if $route === 'edu'}
    <Edu />
  {:else}
    <Home />
  {/if}
</main>

<Tabbar />

<style>
  :global(html, body){ margin:0; height:100%; background:#0b0f14; }
  :global(*), :global(*::before), :global(*::after){ box-sizing:border-box; }

  .page{
    /* fiksni tabbar prostor */
    padding-bottom: calc(84px + env(safe-area-inset-bottom, 0));
    /* spriječi širenje, centriraj, ali dozvoli 100% na mobu */
    max-width: 680px;
    width: 100%;
    margin: 0 auto;
    overflow-x: clip;
  }
</style>
