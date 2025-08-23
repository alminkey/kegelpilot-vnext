<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { EditorData } from "@/components/reminder-types";

  export let open = false;
  export let data: EditorData = { label: "Vrijeme za vježbu", hour: 19, minute: 0, enabled: true };
  export let mode: "create" | "edit" = "create";

  const dispatch = createEventDispatcher<{ save: EditorData; close: void }>();

  // Lokalni editable state
  let label = data.label;
  let hourStr = String(data.hour).padStart(2, "0");
  let minuteStr = String(data.minute).padStart(2, "0");
  let enabled = data.enabled;

  // --- RE-SYNC SAMO KAD SE MODAL OTVORI ILI SE PROMIJENI 'data' REFERENCE ---
  let wasOpen = false;
  let lastDataRef: EditorData | null = null;

  function syncFromData() {
    label = data.label;
    hourStr = String(data.hour).padStart(2, "0");
    minuteStr = String(data.minute).padStart(2, "0");
    enabled = data.enabled;
  }

  // kad se promijeni 'open' -> prvi put pređemo na true, povuci vrijednosti
  $: if (open && !wasOpen) { wasOpen = true; lastDataRef = data; syncFromData(); }
  $: if (!open && wasOpen) { wasOpen = false; } // reset “edge” detekcije

  // ako parent pošalje NOVU referencu data dok je modal otvoren → povuci opet
  $: if (open && data && data !== lastDataRef) { lastDataRef = data; syncFromData(); }

  function save() {
    const h = parseInt(hourStr, 10);
    const m = parseInt(minuteStr, 10);
    dispatch("save", {
      id: data.id,
      label: label.trim() || "Podsjetnik",
      hour: isNaN(h) ? 19 : h,
      minute: isNaN(m) ? 0 : m,
      enabled
    });
  }

  // Notifikacije: status (HTTPS/localhost je potreban za pravi prompt)
  let notif: "default" | "denied" | "granted" | "unsupported" | "insecure" = "default";
  $: {
    try {
      if (!("Notification" in window)) notif = "unsupported";
      else if (!isSecureContext) notif = "insecure";
      else /* @ts-ignore */ notif = Notification.permission;
    } catch { notif = "unsupported"; }
  }
  async function askPermission() {
    try {
      if (notif === "unsupported" || notif === "insecure") return;
      /* @ts-ignore */ notif = await Notification.requestPermission();
    } catch {}
  }

  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
  const fmt = (h: string, m: string) => `${h}:${m}`;
</script>


{#if open}
  <div class="overlay" role="dialog" aria-modal="true">
    <div class="modal">
      <div class="head">
        <h3>{mode === "create" ? "Dodaj podsjetnik" : "Uredi podsjetnik"}</h3>
        <button class="x" on:click={() => dispatch("close")} aria-label="Zatvori">✕</button>
      </div>

      <div class="body">
        <label class="field">
          <div class="lab">Opis</div>
          <input class="input" maxlength="60" bind:value={label} placeholder="npr. Vrijeme za vježbu" />
        </label>

        <div class="field">
          <div class="lab">Vrijeme</div>
          <div class="time-row">
            <select class="select" bind:value={hourStr} aria-label="Sat">
              {#each HOURS as h}
                <option value={String(h).padStart(2, "0")}>{String(h).padStart(2, "0")}</option>
              {/each}
            </select>
            <span class="colon">:</span>
            <select class="select" bind:value={minuteStr} aria-label="Minuta">
              {#each MINUTES as m}
                <option value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</option>
              {/each}
            </select>
            <div class="time-preview">{fmt(hourStr, minuteStr)}</div>
          </div>
        </div>

        <label class="toggle">
          <input type="checkbox" bind:checked={enabled} />
          <span></span>
          <div class="t-copy">
            <div class="t-h">Podsjetnik uključen</div>
            <div class="t-s">Ako je isključeno, zadržava postavke bez zvona</div>
          </div>
        </label>

        {#if notif !== "granted"}
          <div class="note">
            <div class="n-h">Omogući notifikacije</div>

            {#if notif === "insecure"}
              <div class="n-s">
                Za sistemske notifikacije treba <b>HTTPS</b> ili <b>localhost</b>.
                Na lokalnoj mreži (http) dobit ćeš fallback <b>alert</b> u vrijeme podsjetnika.
              </div>
              <button class="btn-ghost" aria-disabled="true" style="opacity:.6; pointer-events:none;">Dozvoli</button>
            {:else if notif === "unsupported"}
              <div class="n-s">Ovaj browser ne podržava Notification API.</div>
            {:else}
              <div class="n-s">Da bi podsjetnik zvonio dok je app otvorena, dozvoli obavijesti.</div>
              <button class="btn-ghost" on:click={askPermission}>Dozvoli</button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="foot">
        <button class="btn-ghost" on:click={() => dispatch("close")}>Odustani</button>
        <button class="btn-primary" on:click={save}>{mode === "create" ? "Spremi" : "Sačuvaj"}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay{ position:fixed; inset:0; z-index:50; background:rgba(0,0,0,.6); display:grid; place-items:center; padding:16px; }
  .modal{
    width:min(560px, 96vw);
    border-radius:16px; padding:14px 14px 12px;
    background: radial-gradient(1200px 500px at -20% -20%, rgba(11,226,160,.06), transparent 40%),
                radial-gradient(800px 600px at 120% 120%, rgba(255,255,255,.04), transparent 45%),
                #0f1115;
    border:1px solid rgba(255,255,255,.10);
    box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 24px 48px rgba(0,0,0,.5);
    color:#e6ebef;
  }
  .head{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:4px 2px 8px; }
  .head h3{ font-size:1.05rem; font-weight:800; letter-spacing:.02em; }
  .x{ background:none; border:none; color:#e6ebef; font-size:18px; opacity:.8; cursor:pointer; }
  .body{ display:grid; gap:12px; padding:6px 2px 2px; }
  .field .lab{ font-size:.9rem; opacity:.85; margin-bottom:6px; }
  .input{
    width:100%; padding:10px 12px; border-radius:12px;
    background:#0b0f14; border:1px solid rgba(255,255,255,.14); color:#e6ebef; font-weight:600;
  }

  /* Time row */
  .time-row{ display:flex; align-items:center; gap:8px; }
  .select{
    background:#0b0f14; color:#e6ebef; border:1px solid rgba(255,255,255,.14);
    border-radius:10px; padding:8px 10px; font-weight:700;
  }
  .colon{ opacity:.7; font-weight:800; }
  .time-preview{
    margin-left:auto; font-weight:800; letter-spacing:.02em; opacity:.9;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
    border-radius:10px; padding:8px 10px;
  }

  .toggle{ display:flex; align-items:center; gap:12px; border-radius:12px; padding:10px 10px;
           background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.10); }
  .toggle input{ display:none; }
  .toggle span{ position:relative; width:52px; height:30px; border-radius:999px; background:rgba(255,255,255,.12); flex:0 0 auto; }
  .toggle span::after{ content:""; position:absolute; width:24px; height:24px; top:3px; left:3px; border-radius:50%; background:#fff; transition:transform .2s ease; }
  .toggle input:checked + span{ background:rgba(11,226,160,.4); }
  .toggle input:checked + span::after{ transform:translateX(22px); }
  .t-copy .t-h{ font-weight:800; }
  .t-copy .t-s{ font-size:.9rem; opacity:.85; }

  .note{ margin-top:4px; padding:10px; border-radius:12px; background:rgba(255,166,87,.10); border:1px solid rgba(255,166,87,.25); }
  .n-h{ font-weight:800; color:#FFA657; margin-bottom:4px; }
  .n-s{ font-size:.9rem; opacity:.95; margin-bottom:8px; }

  .foot{ display:flex; justify-content:flex-end; gap:10px; padding-top:10px; }
  .btn-ghost{
    background:none; border:1px solid rgba(255,255,255,.18); color:#e6ebef;
    border-radius:12px; padding:10px 14px; font-weight:700; cursor:pointer;
  }
  .btn-primary{
    background:#0be2a0; color:#0f1115; border:none; border-radius:12px; padding:10px 14px;
    font-weight:800; cursor:pointer; box-shadow:0 10px 24px rgba(11,226,160,.18);
  }
</style>
