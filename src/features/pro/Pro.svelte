<script lang="ts">
  import { onMount } from "svelte";
  import { isPro, upgradeToPro, downgradeToFree } from "@/store/user";
  import { startCheckout } from "@/lib/payments";
  import { showToast } from "@/store/toast";

  // helper za hash-rutu: #/pro?success=1
  function hashQuery(): URLSearchParams {
    const h = location.hash || "";
    const i = h.indexOf("?");
    return new URLSearchParams(i >= 0 ? h.slice(i + 1) : "");
  }
  function clearHashQuery() {
    const base = location.origin + location.pathname + location.search + "#/pro";
    history.replaceState(null, "", base);
  }

  onMount(() => {
    // 1) Mock/Stripe success preko eventa
    const onSuccess = () => { upgradeToPro(); try { showToast("PRO aktiviran 🎉"); } catch {} };
    window.addEventListener("checkout:success", onSuccess as any);

    // 2) Ako smo došli sa #/pro?success=1 (Stripe redirect), promoviši i očisti URL
    const q = hashQuery();
    if (q.get("success") === "1") {
      upgradeToPro();
      try { showToast("PRO aktiviran 🎉"); } catch {}
      clearHashQuery();
    }

    return () => window.removeEventListener("checkout:success", onSuccess as any);
  });

  async function buy(plan: "monthly" | "annual") {
    try {
      await startCheckout({ plan });
    } catch (e) {
      console.warn("[pro] checkout error", e);
    }
  }
</script>

<section class="pro-wrap">
  <div class="card head">
    <h2>KegelPilot <span class="accent">PRO</span></h2>
    {#if $isPro}
      <div class="status on">PRO aktivno</div>
    {:else}
      <div class="status off">FREE</div>
    {/if}
  </div>

  {#if !$isPro}
    <div class="card plans">
      <div class="plan">
        <div class="p-title">Mjesečno</div>
        <div class="p-price">9,99 €</div>
        <button class="btn-primary" on:click={() => buy("monthly")}>Kupi mjesečni plan</button>
      </div>
      <div class="plan">
        <div class="p-title">Godišnje</div>
        <div class="p-price">79,99 €</div>
        <button class="btn-primary" on:click={() => buy("annual")}>Kupi godišnji plan</button>
      </div>
    </div>

    <div class="card perks">
      <h3>Šta dobijaš</h3>
      <ul>
        <li>Više podsjetnika + pametni nudge</li>
        <li>Svi rangovi i programi</li>
        <li>Adaptivni plan</li>
        <li>Izvještaji (sedmični/mjesečni)</li>
      </ul>
    </div>
  {:else}
    <div class="card active">
      <h3>Hvala! PRO je aktivan 🎉</h3>
      <p>Možeš koristiti sve PRO funkcije. Ako želiš, možeš se vratiti na FREE.</p>
      <button class="btn-ghost" on:click={downgradeToFree}>Vrati na FREE</button>
    </div>
  {/if}
</section>

<style>
  .pro-wrap{ padding:16px; display:grid; gap:16px; max-width:680px; margin:0 auto; }
  .card{
    border-radius:16px; padding:14px;
    background: radial-gradient(1200px 500px at -20% -20%, rgba(11,226,160,.06), transparent 40%),
                radial-gradient(800px 600px at 120% 120%, rgba(255,255,255,.04), transparent 45%),
                #0f1115;
    border:1px solid rgba(255,255,255,.10);
    color:#e6ebef;
  }
  .head{ display:flex; align-items:center; justify-content:space-between; }
  h2{ margin:0; font-size:1.2rem; font-weight:900; letter-spacing:.02em; }
  .accent{ color:#0be2a0; }
  .status{ font-weight:800; padding:6px 10px; border-radius:999px; }
  .status.on{ background:rgba(11,226,160,.18); border:1px solid rgba(11,226,160,.45); color:#0be2a0; }
  .status.off{ background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); opacity:.95; }

  .plans{ display:grid; gap:12px; grid-template-columns: 1fr 1fr; }
  @media (max-width:560px){ .plans{ grid-template-columns: 1fr; } }
  .plan{ display:grid; gap:8px; align-content:start; }
  .p-title{ font-weight:800; }
  .p-price{ font-size:1.1rem; font-weight:900; }

  .btn-primary{
    background:#0be2a0; color:#0f1115; border:none; border-radius:12px; padding:10px 14px;
    font-weight:800; cursor:pointer; box-shadow:0 10px 24px rgba(11,226,160,.18);
  }
  .btn-ghost{
    background:none; border:1px solid rgba(255,255,255,.18); color:#e6ebef;
    border-radius:12px; padding:10px 14px; font-weight:700; cursor:pointer;
  }

  .perks h3, .active h3{ margin:0 0 6px 0; font-weight:900; }
  .perks ul{ margin:0 0 0 18px; padding:0; display:grid; gap:6px; }
</style>
