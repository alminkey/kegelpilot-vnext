<script lang="ts">
  import { onMount } from "svelte";
  import { isPro, isProPaid, upgradeToPro, downgradeToFree, markProPaid } from "@/store/user";
  import { startCheckout } from "@/lib/payments";
  import { showToast } from "@/store/toast";
  import { clearTrial } from "@/store/trial";

  type PlanId = "monthly" | "annual";
  let loadingPlan: PlanId | null = null;

  function hashQuery(): URLSearchParams {
    const h = location.hash || "";
    const i = h.indexOf("?");
    return new URLSearchParams(i >= 0 ? h.slice(i + 1) : "");
  }
  function clearHashQuery() {
    const base = location.origin + location.pathname + location.search + "#/pro";
    history.replaceState(null, "", base);
  }

  function handlePaidSuccess() {
    markProPaid();
    upgradeToPro();
    try { clearTrial(); } catch {}
    try { showToast("PRO aktiviran 🎉"); } catch {}
  }

  onMount(() => {
    const onSuccess = () => handlePaidSuccess();
    window.addEventListener("checkout:success", onSuccess as any);

    const q = hashQuery();
    if (q.get("success") === "1") {
      handlePaidSuccess();
      clearHashQuery();
    }
    return () => window.removeEventListener("checkout:success", onSuccess as any);
  });

  async function buy(plan: PlanId) {
    if (loadingPlan) return;
    loadingPlan = plan;
    try {
      await startCheckout({ plan }); // kupovina bez trial-a
    } catch (e) {
      console.warn("[pro] checkout error", e);
      try { showToast("Kupovina nije uspjela. Pokušaj ponovo."); } catch {}
    } finally {
      loadingPlan = null;
    }
  }

  async function startTrialCheckout() {
    // “7 dana besplatno” -> uvijek ide kao trial na mjesečni plan
    await startCheckout({ plan: "monthly", trial: true });
  }

  $: paid = $isProPaid;
  $: onTrial = $isPro && !$isProPaid;
</script>

<section class="pro-wrap">
  <div class="card head" role="region" aria-label="Status pretplate">
    <h2>KegelPilot <span class="accent">PRO</span></h2>
    {#if paid}
      <div class="status on" aria-live="polite">PRO aktivno (pretplata)</div>
    {:else if onTrial}
      <div class="status trial" aria-live="polite">Trial aktivan</div>
    {:else}
      <div class="status off" aria-live="polite">FREE</div>
    {/if}
  </div>

  {#if paid}
    <div class="card active">
      <h3>Hvala! PRO je aktivan 🎉</h3>
      <p>Uživaj u svim PRO funkcijama.</p>
    </div>
  {:else}
    {#if onTrial}
      <div class="card notice">
        <b>Trial je aktivan.</b> Možeš odmah uzeti mjesečni ili godišnji plan — podaci ostaju sačuvani.
      </div>
    {:else}
      <div class="card notice">
        Probaj PRO besplatno 7 dana — traži karticu i automatski prelazi na mjesečni plan ako ne otkažeš.
      </div>
    {/if}

    <div class="card plans" role="group" aria-label="Planovi pretplate">
      <div class="plan">
        <div class="p-title">Mjesečno</div>
        <div class="p-price">9,99 €</div>
        <div class="p-badge" aria-hidden="true">7 dana besplatno</div>

        {#if !onTrial}
          <!-- Poseban CTA za TRIAL (uz karticu u REAL modu). U MOCK modu samo lokalni trial. -->
          <div class="p-actions">
            <button class="btn-ghost" on:click={startTrialCheckout} aria-label="Probaj 7 dana">
              Probaj 7 dana
            </button>
          </div>
        {/if}

        <div class="p-actions">
          <button
            class="btn-primary"
            on:click={() => buy("monthly")}
            aria-label="Kupi mjesečni plan"
            aria-busy={loadingPlan === "monthly"}
            disabled={loadingPlan === "monthly"}
          >
            {#if loadingPlan === "monthly"}
              <span class="spinner" aria-hidden="true"></span> Obrada…
            {:else}
              Kupi mjesečni plan
            {/if}
          </button>
        </div>
      </div>

      <div class="plan">
        <div class="p-title">Godišnje</div>
        <div class="p-price">79,99 €</div>
        <div class="p-badge accent">Uštedi ~33%</div>
        <div class="p-actions">
          <button
            class="btn-primary"
            on:click={() => buy("annual")}
            aria-label="Kupi godišnji plan"
            aria-busy={loadingPlan === "annual"}
            disabled={loadingPlan === "annual"}
          >
            {#if loadingPlan === "annual"}
              <span class="spinner" aria-hidden="true"></span> Obrada…
            {:else}
              Kupi godišnji plan
            {/if}
          </button>
        </div>
      </div>
    </div>

    {#if onTrial}
      <div class="card dev">
        <button class="btn-ghost" on:click={downgradeToFree}>Vrati na FREE (test)</button>
      </div>
    {/if}
  {/if}
</section>

<style>
  .pro-wrap { padding:16px; display:grid; gap:16px; max-width:780px; margin:0 auto; }
  .card{
    border-radius:16px; padding:14px;
    background:
      radial-gradient(1200px 500px at -20% -20%, rgba(11,226,160,.06), transparent 40%),
      radial-gradient(800px 600px at 120% 120%, rgba(255,255,255,.04), transparent 45%),
      #0f1115;
    border:1px solid rgba(255,255,255,.10); color:#e6ebef;
  }

  .head{ display:flex; align-items:center; justify-content:space-between; }
  h2{ margin:0; font-size:1.25rem; font-weight:900; letter-spacing:.02em; }
  .accent{ color:#0be2a0; }

  .status{ font-weight:800; padding:6px 10px; border-radius:999px; }
  .status.on{ background:rgba(11,226,160,.18); border:1px solid rgba(11,226,160,.45); color:#0be2a0; }
  .status.off{ background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); }
  .status.trial{ background:rgba(129,212,250,.16); border:1px solid rgba(129,212,250,.45); color:#81D4FA; }

  .notice{ font-size:.95rem; }

  .plans{ display:grid; gap:12px; grid-template-columns: 1fr 1fr; }
  @media (max-width:560px){ .plans{ grid-template-columns: 1fr; } }

  .plan{
    display:grid; gap:10px; align-content:start;
    padding:14px; border-radius:16px;
    background:#0f1115; border:1.5px solid rgba(255,255,255,.10);
    transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;
  }
  .plan:hover{
    transform: translateY(-1px) scale(1.01);
    border-color: rgba(11,226,160,.35);
    box-shadow: 0 10px 26px rgba(11,226,160,.10);
    background: linear-gradient(0deg, rgba(11,226,160,.05), rgba(11,226,160,0)) #0f1115;
  }

  .p-title{ font-weight:900; }
  .p-price{ font-size:1.15rem; font-weight:900; }
  .p-badge{
    width:max-content; font-size:.8rem; font-weight:700;
    padding:4px 8px; border-radius:999px;
    background: rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18);
    pointer-events:none; /* neklikabilno */
  }
  .p-badge.accent{ background: rgba(11,226,160,.14); border-color: rgba(11,226,160,.45); color:#0be2a0; }

  .p-actions{ margin-top:2px; display:flex; gap:8px; flex-wrap:wrap; }
  .btn-primary{
    display:inline-grid; grid-auto-flow:column; align-items:center; gap:8px;
    background:#0be2a0; color:#0f1115; border:none; border-radius:12px; padding:10px 14px;
    font-weight:900; box-shadow:0 10px 24px rgba(11,226,160,.18); cursor:pointer;
  }
  .btn-ghost{
    background:none; border:1px solid rgba(255,255,255,.18); color:#e6ebef;
    border-radius:12px; padding:10px 14px; font-weight:800; cursor:pointer;
  }
  .btn-ghost:focus-visible{ outline:2px solid #81D4FA; outline-offset:3px; }

  .spinner{ width:16px; height:16px; border-radius:999px; border:2px solid rgba(0,0,0,.25); border-top-color: rgba(0,0,0,.75); animation: spin 800ms linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .active h3{ margin:0 0 6px 0; font-weight:900; }
</style>
