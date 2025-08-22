<script lang="ts">
  import { go } from "@/store/router";
  import { isPro, upgradeToPro, downgradeToFree, togglePro } from "@/store/user";

  const makePro  = () => { upgradeToPro();  go("home"); };
  const makeFree = () => { downgradeToFree(); go("home"); };
  const quickToggle = () => { togglePro(); go("home"); };
</script>

<section class="pro-page">
  <div class="card hero">
    <h1>KegelPilot PRO</h1>
    <p>Napredak bez zastoja — sve što ti treba u jednoj verziji.</p>
    <div class="status">
      Status:
      <span class="pill" class:ok={$isPro}>{$isPro ? "PRO aktivno" : "FREE"}</span>
    </div>
  </div>

  <div class="card">
    <h2>Šta dobijaš</h2>
    <ul>
      <li>Svi rangovi i programi (bez limita)</li>
      <li>Adaptivni plan (auto-prilagodba po feedbacku)</li>
      <li>Napredna analitika (sedmični/mjesečni izvještaji, heatmap)</li>
      <li>Više i pametni podsjetnici</li>
      <li>Specifični planovi (post-partum, nakon prostatektomije…)</li>
      <li>Audio/voice/haptics u pozadini</li>
      <li>Integracije (Health/Fit) + export + prioritetni support</li>
    </ul>

    <div class="actions">
      <button class="btn-ghost" on:click={() => go("home")}>Kasnije</button>
      {#if $isPro}
        <button class="btn-warning" on:click={makeFree}>Vrati na FREE</button>
      {:else}
        <button class="btn-primary" on:click={makePro}>Postani PRO</button>
      {/if}
    </div>
  </div>

  <!-- Dev pomoć: brzo testiranje Free/Pro -->
  <div class="card dev">
    <div class="dev-row">
      <div class="dev-title">Dev test</div>
      <button class="btn-ghost" on:click={quickToggle}>Toggle PRO</button>
    </div>
  </div>
</section>

<style>
  .pro-page{
    padding:16px; display:grid; gap:16px; max-width:680px; margin:0 auto;
  }
  .card{
    position:relative; width:100%;
    border-radius:16px; border:1px solid rgba(255,255,255,.08);
    background:
      radial-gradient(1200px 500px at -20% -20%, rgba(11,226,160,.06), transparent 40%),
      radial-gradient(800px 600px at 120% 120%, rgba(255,255,255,.04), transparent 45%),
      #0f1115;
    box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 20px 40px rgba(0,0,0,.35);
    padding:16px; color:#e6ebef;
  }
  .hero h1{ font-size:1.6rem; font-weight:900; letter-spacing:.02em; margin:0 0 6px; }
  .status{ margin-top:6px; font-size:.95rem; opacity:.95; display:flex; gap:8px; align-items:center; }
  .pill{
    font-weight:800; padding:4px 8px; border-radius:999px;
    border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.08);
  }
  .pill.ok{ color:#0be2a0; border-color:rgba(11,226,160,.35); background:rgba(11,226,160,.12); }

  h2{ font-weight:800; margin:0 0 8px; }
  ul{ margin:0 0 12px 18px; padding:0; display:grid; gap:6px; }

  .actions{ display:flex; gap:10px; justify-content:flex-end; }
  .btn-ghost{
    background:none; border:1px solid rgba(255,255,255,.18); color:#e6ebef;
    border-radius:12px; padding:10px 14px; font-weight:700; cursor:pointer;
  }
  .btn-primary{
    background:#0be2a0; color:#0f1115; border:none; border-radius:12px; padding:10px 14px;
    font-weight:800; cursor:pointer; box-shadow:0 10px 24px rgba(11,226,160,.18);
  }
  .btn-warning{
    background:#FFA657; color:#0f1115; border:none; border-radius:12px; padding:10px 14px;
    font-weight:800; cursor:pointer; box-shadow:0 10px 24px rgba(255,166,87,.18);
  }

  .dev{ padding:12px; }
  .dev-row{ display:flex; align-items:center; justify-content:space-between; }
  .dev-title{ font-weight:800; letter-spacing:.02em; opacity:.9; }
</style>
