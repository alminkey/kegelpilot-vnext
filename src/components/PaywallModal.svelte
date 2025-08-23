<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { upgradeToPro } from "@/store/user";

  export let open = false;

  const dispatch = createEventDispatcher<{ close: void; upgrade: void }>();

  function close()   { dispatch("close"); }
  function upgrade() { upgradeToPro(); dispatch("upgrade"); }

  // body scroll lock
  let prevOverflow = "";
  $: {
    if (open) { prevOverflow = document.body.style.overflow || ""; document.body.style.overflow = "hidden"; }
    else      { document.body.style.overflow = prevOverflow; }
  }

  /* ---------- Fokus trap (FIX) ---------- */
  let modalEl: HTMLDivElement | null = null;
  let focusables: HTMLElement[] = [];
  let firstFocusable: HTMLElement | null = null;
  let lastFocusable: HTMLElement | null = null;

  function setFocusables() {
    if (!modalEl) {
      focusables = [];
      firstFocusable = lastFocusable = null;
      return;
    }
    const nodes = modalEl.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    // zadrži samo vidljive i u layoutu
    focusables = Array.from(nodes).filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0;
    });
    firstFocusable = focusables[0] ?? null;
    lastFocusable  = focusables[focusables.length - 1] ?? null;
  }

  function onKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }

    if (e.key === "Tab" && focusables.length) {
      const active = document.activeElement as HTMLElement | null;
      const backwards = e.shiftKey;
      const outside = active ? !modalEl?.contains(active) : true;

      if (backwards && (outside || active === firstFocusable)) {
        e.preventDefault();
        lastFocusable?.focus();
      } else if (!backwards && (outside || active === lastFocusable)) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  // Dinamičko kačenje keydowna na window dok je modal otvoren
  let _keysBound = false;
  function bindWindowKeys(yes: boolean) {
    if (yes && !_keysBound) { window.addEventListener("keydown", onKeydown); _keysBound = true; }
    if (!yes && _keysBound) { window.removeEventListener("keydown", onKeydown); _keysBound = false; }
  }
  $: bindWindowKeys(open);
  onDestroy(() => bindWindowKeys(false));

// Fokus samo na “open -> true” (jednokratno na otvaranju)
let wasOpen = false;
$: {
  if (open && !wasOpen) {
    wasOpen = true;
    setTimeout(() => { setFocusables(); firstFocusable?.focus(); }, 0);
  } else if (!open && wasOpen) {
    wasOpen = false;
  }
}

</script>

{#if open}
  <div class="overlay">
    <button class="backdrop" type="button" aria-label="Zatvori" on:click={close}></button>

    <div class="modal enter" bind:this={modalEl} role="dialog" aria-modal="true" aria-label="KegelPilot PRO">
      <div class="head">
        <h3>Otkrij KegelPilot <span class="accent">PRO</span></h3>
        <button class="x" type="button" on:click={close} aria-label="Zatvori">✕</button>
      </div>

      <div class="body">
        <p>Sve što ti treba za napredak bez zastoja:</p>
        <ul>
          <li>Svi rangovi i programi (bez limita)</li>
          <li>Adaptivni plan (auto-prilagodba po feedbacku)</li>
          <li>Napredna analitika (sedmični/mjesečni izvještaji, heatmap)</li>
          <li>Više i pametni podsjetnici</li>
          <li>Specifični planovi (post-partum, nakon prostatektomije…)</li>
          <li>Audio/voice/haptics u pozadini</li>
          <li>Integracije (Health/Fit) + export + prioritetni support</li>
        </ul>
      </div>

      <div class="foot">
        <button class="btn-ghost"   type="button" on:click={close}>Kasnije</button>
        <button class="btn-primary" type="button" on:click={upgrade}>Postani PRO</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay{
    position: fixed; inset: 0; z-index: 9999;
    display: grid; place-items: center; padding: 16px;
  }
  .backdrop{
    position: absolute; inset: 0; background: rgba(0,0,0,.55);
    border: 0; padding: 0; margin: 0; cursor: pointer;
  }
  .modal{
    position: relative;
    width: min(620px, 96vw);
    border-radius: 16px; padding: 16px 14px 12px;
    background:
      radial-gradient(1200px 500px at -20% -20%, rgba(11,226,160,.06), transparent 40%),
      radial-gradient(800px 600px at 120% 120%, rgba(255,255,255,.04), transparent 45%),
      #0f1115;
    border: 1px solid rgba(255,255,255,.10);
    box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 24px 48px rgba(0,0,0,.55);
    color:#e6ebef;
    transform: translateY(8px); opacity: 0;
  }
  .modal.enter{ animation: pop .18s ease-out forwards; }
  @keyframes pop{ from{transform: translateY(8px); opacity:0;} to{transform: translateY(0); opacity:1;} }

  .head{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:4px 2px 8px; }
  .head h3{ font-size:1.2rem; font-weight:900; letter-spacing:.02em; margin:0; }
  .accent{ color:#0be2a0; }
  .x{ background:none; border:none; color:#e6ebef; font-size:18px; opacity:.85; cursor:pointer; }

  .body{ display:grid; gap:10px; padding:6px 2px 2px; }
  .body p{ margin:0; opacity:.95; }
  ul{ margin:0 0 4px 18px; padding:0; display:grid; gap:6px; }
  li{ opacity:.98; }

  .foot{ display:flex; justify-content:flex-end; gap:10px; padding-top:12px; }
  .btn-ghost{
    background:none; border:1px solid rgba(255,255,255,.18); color:#e6ebef;
    border-radius:12px; padding:10px 14px; font-weight:700; cursor:pointer;
  }
  .btn-primary{
    background:#0be2a0; color:#0f1115; border:none; border-radius:12px; padding:10px 14px;
    font-weight:800; cursor:pointer; box-shadow:0 10px 24px rgba(11,226,160,.18);
  }
</style>
