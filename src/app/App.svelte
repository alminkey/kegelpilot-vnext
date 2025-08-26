<script lang="ts">
  import { onMount } from "svelte";
  import Header from "@/app/Header.svelte";
  import Tabbar from "@/app/Tabbar.svelte";
  import PaywallHost from "@/components/PaywallHost.svelte";

  /* Rute (minimalni hash-router) */
  import Home from "@/features/home/Home.svelte";
  import Edu from "@/features/edu/Edu.svelte";
  import Pro from "@/features/pro/Pro.svelte";

  let route = "home";
  function syncRoute() {
    const h = location.hash.replace(/^#\/?/, "");
    route = h || "home";
  }

  onMount(() => {
    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  });
</script>

<Header />

<main class="page">
  {#if route === "home"}
    <Home />
  {:else if route === "edu"}
    <Edu />
  {:else if route === "pro"}
    <Pro />
  {:else}
    <Home />
  {/if}
</main>

<Tabbar />

<!-- MORA biti mountan jednom u aplikaciji da bi paywall radio -->
<PaywallHost />

<style>
  .page {
    /* dno ostavimo prostor za Tabbar da ne preklapa sadržaj */
    padding: 12px 12px 96px;
    min-height: calc(100vh - 56px); /* ~visina hedera */
    box-sizing: border-box;
  }
</style>
