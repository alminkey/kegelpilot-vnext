<script lang="ts">
  import { isPro } from "@/store/user";

  // Tekstualni logo (mint). Ako želiš sliku pored teksta, lako dodamo kasnije.
  const SHOW_TEXT = true;
</script>

<header class="kp-header">
  <div class="brand">
    <!-- Home link (samo naslov) -->
    <a class="home" href="#/home" aria-label="KegelPilot Home">
      {#if SHOW_TEXT}
        <span class="title">KegelPilot</span>
      {/if}
    </a>

    <!-- Bedž odmah pored “loga” — klik vodi na PRO screen
         PRO: zelen, klik = upravljaj sub-om (tamo je “Vrati na FREE”)
         FREE: crven, klik = idi na PRO (upgrade)
    -->
    {#if $isPro}
      <a
        class="badge pro"
        href="#/pro"
        aria-label="Upravljaj pretplatom · Vrati na FREE"
      >PRO</a>
    {:else}
      <a
        class="badge free"
        href="#/pro"
        aria-label="Postani PRO"
      >FREE</a>
    {/if}
  </div>
</header>

<style>
  .kp-header{
    position: sticky; top: 0;
    display: flex; align-items: center;
    padding: 12px 16px;
    background: #0b0f14; color: #fff;
    z-index: 60;
    border-bottom: 1px solid #0f1720;
  }

  .brand{
    display: inline-flex; align-items: center; gap: 12px;
    width: 100%;
  }

  .home{
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none; color: inherit;
  }

  /* Tekstualni “logo” – mint, podebljan */
  .title{
    color: #0be2a0;
    font-size: clamp(20px, 5vw, 26px);
    font-weight: 900;
    letter-spacing: .2px;
    text-shadow: 0 1px 0 rgba(0,0,0,.25);
    line-height: 1;
  }

  .badge{
    display: inline-flex; align-items: center; justify-content: center;
    height: 28px; padding: 0 12px;
    border-radius: 999px;
    font-weight: 900; font-size: 12px;
    text-decoration: none; user-select: none;
    border: 1px solid transparent;
    line-height: 1;
  }

  /* PRO = mint (klik vodi na #/pro gdje je “Vrati na FREE”) */
  .badge.pro{
    background: #0be2a0; color: #0b0f14;
    border-color: rgba(11,226,160,.5);
  }

  /* FREE = crven (klik vodi na #/pro da korisnik upgrade-a) */
  .badge.free{
    background: #ff6b6b; color: #ffffff;
    border-color: rgba(255,107,107,.6);
  }

  /* Fokus ring za tastaturu */
  .badge:focus, .home:focus{
    outline: none;
    box-shadow: 0 0 0 3px rgba(11,226,160,.25);
    border-radius: 12px;
  }
</style>
