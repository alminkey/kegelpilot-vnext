<script lang="ts">
  
  import Header from './Header.svelte';
  import Tabbar from './Tabbar.svelte';
  import { kp } from "@/store/kp";
  import { route } from "@/store/router";
  import Home     from '@/features/home/Home.svelte';
  import Training from '@/features/training/Training.svelte';
  import Progress from '@/features/progress/Progress.svelte';
  import Profile  from '@/features/profile/Profile.svelte';
  import Edu      from '@/features/edu/Edu.svelte';
  import Pro      from '@/features/pro/Pro.svelte';

  import { onMount } from "svelte";
  import { startDayRolloverWatcher, stopDayRolloverWatcher } from "@/store/date";
  import { initUserPersistence } from "@/store/user";

  import PaywallHost from "@/components/PaywallHost.svelte";
  import Toast from "@/components/Toast.svelte";

  onMount(() => {
    initUserPersistence();
    startDayRolloverWatcher();
    return () => stopDayRolloverWatcher();
  });
  onMount(() => {
    kp.init();
    // Ako želiš i lagani ticker za rollover (npr. svake 3 min):
    const t = setInterval(() => kp.maybeRollover(), 180_000);
    return () => clearInterval(t);
  });
</script>

<Header />

<main class="page">
  {#if $route === 'home'}
    <Home />
  {:else if $route === 'training'}
    <Training />
  {:else if $route === 'edu'}
    <Edu />
  {:else if $route === 'progress'}
    <Progress />
  {:else if $route === 'profile'}
    <Profile />
  {:else if $route === 'pro'}
    <Pro />
  {:else}
    <Home />
  {/if}
</main>

<Tabbar />

<PaywallHost />
<Toast />

<style>
  :root{
    /* Visina tabbara (koristi i Tabbar.svelte) */
    --tabbar-h: 80px;
    --bg: #0b0f14;
  }
  :global(html, body){ margin:0; height:100%; background: var(--bg); }
  :global(*), :global(*::before), :global(*::after){ box-sizing:border-box; }

  /* Rezerviši prostor da sadržaj ne ulazi ispod fiksiranog tabbara */
  .page{
    padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0));
    max-width: 680px; width: 100%; margin: 0 auto; overflow-x: clip;
    min-height: 100svh;
  }
</style>
