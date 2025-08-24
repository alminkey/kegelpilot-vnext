<script lang="ts">
  import Header from './Header.svelte';
  import Tabbar from './Tabbar.svelte';
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


  /* Paywall modal (global overlay) */
  import PaywallModal from "@/components/PaywallModal.svelte";
  let paywallOpen = false;

  onMount(() => {
    initUserPersistence();
  });

  onMount(() => {
    startDayRolloverWatcher();
    return () => stopDayRolloverWatcher();
  });

  // Slušaj globalni event pa otvori paywall iz bilo kojeg mjesta (openPaywall)
  onMount(() => {
    const open = () => (paywallOpen = true);
    window.addEventListener("paywall:open", open as EventListener);
    return () => window.removeEventListener("paywall:open", open as EventListener);
  });
</script>

<Header />

<main class="page">
  {#if $route === 'home'}         <Home />
  {:else if $route === 'training'}<Training />
  {:else if $route === 'progress'}<Progress />
  {:else if $route === 'profile'} <Profile />
  {:else if $route === 'edu'}     <Edu />
  {:else if $route === 'pro'}     <Pro />
  {:else}                         <Home />
  {/if}
</main>

<Tabbar />
<PaywallHost />
<!-- Globalno montiran paywall modal -->
<PaywallModal
  bind:open={paywallOpen}
  on:close={() => (paywallOpen = false)}
  on:upgrade={() => (paywallOpen = false)}
/>

<style>
  :global(html, body){ margin:0; height:100%; background:#0b0f14; }
  :global(*), :global(*::before), :global(*::after){ box-sizing:border-box; }
  .page{
    padding-bottom: calc(84px + env(safe-area-inset-bottom, 0));
    max-width: 680px; width: 100%; margin: 0 auto; overflow-x: clip;
  }
</style>
