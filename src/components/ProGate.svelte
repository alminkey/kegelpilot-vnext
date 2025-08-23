<script lang="ts">
  import { isAllowed, type FeatureKey } from "@/lib/gate";
  import PaywallModal from "@/components/PaywallModal.svelte";
  import { recordUpsell } from "@/lib/upsell";
  import { go } from "@/store/router";
  import { isPro } from "@/store/user";   // ← NOVO

  export let feature: FeatureKey;
  export let teaser = "PRO sadržaj";
  export let mode: "lock" | "blur" | "hide" = "lock";   // kako prikazati FREE korisniku
  export let origin = "gate";
  export let paywallMode: "modal" | "route" = "modal";  // NOVO: otvori modal ili idi na stranicu /pro

  let open = false;
  let allowed = false;

  // ✅ reaktivno i na promjenu PRO, bez comma-operator warn-a
  $: {
    const _touch = $isPro;   // samo da stvorimo zavisnost
    allowed = isAllowed(feature);
  }
  function showPaywall() {
    recordUpsell("attempt_open_pro", { feature, origin });
    if (paywallMode === "route") {
      // TIP PATCH: dok router tip ne sadrži "pro", privremeni cast uklanja TS warning
      (go as unknown as (r: string) => void)("pro");
    } else {
      open = true;
    }
  }
  function onUpgrade() {
    open = false; // stub; pravi checkout kasnije
  }
</script>

{#if allowed}
  <slot />
{:else}
  {#if mode === "hide"}
    <!-- pristupačno: klik + Enter/Space, bez mijenjanja layouta -->
    <div
      class="gate-click"
      role="button"
      tabindex="0"
      aria-label="Otvori PRO"
      on:click|stopPropagation|preventDefault={showPaywall}
      on:keydown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showPaywall(); }
      }}
    >
      <slot />
    </div>
  {:else if mode === "blur"}
    <div class="relative">
      <div class="pointer-events-none blur-sm select-none">
        <slot />
      </div>
      <div class="absolute inset-0 grid place-items-center">
        <button class="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold" on:click={showPaywall}>
          Otključaj PRO
        </button>
      </div>
    </div>
  {:else} <!-- lock -->
    <div class="rounded-xl border border-neutral-200 p-4">
      <div class="flex items-center gap-2">
        <span class="font-semibold">{teaser}</span>
      </div>
      <p class="mt-1 text-sm text-neutral-600">Dostupno u PRO verziji.</p>
      <button class="mt-3 px-3 py-2 rounded-xl bg-orange-500 text-white font-semibold" on:click={showPaywall}>
        Otključaj PRO
      </button>
    </div>
  {/if}

  {#if paywallMode === "modal"}
    <PaywallModal bind:open on:upgrade={onUpgrade} on:close={() => (open = false)} />
  {/if}
{/if}

<style>
  /* wrapper koji ne mijenja layout slota */
  .gate-click{ display: contents; }
</style>
