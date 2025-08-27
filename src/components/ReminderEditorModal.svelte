<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import type { EditorData } from "@/components/reminder-types";
  import { validateReminder } from "@/store/reminders";
  import type { ValidationError } from "@/store/reminders";
  import { openPaywall } from "@/lib/gate";
  import { lockScroll, unlockScroll } from "@/lib/scrollLock";
  
  export let open = false;
  export let data: EditorData = {
    label: "Vrijeme za vježbu",
    hour: 19,
    minute: 0,
    enabled: true,
    daysOfWeek: [1, 3, 5]
  };
  export let mode: "create" | "edit" = "create";

  // Globalni scroll lock (ref-count)
  $: open ? lockScroll() : unlockScroll();
  onDestroy(() => unlockScroll());

  const dispatch = createEventDispatcher<{
    save: EditorData & { daysOfWeek: number[] };
    close: void;
  }>();

  const DAYS = [
    { i: 1, label: "Pon" },
    { i: 2, label: "Uto" },
    { i: 3, label: "Sri" },
    { i: 4, label: "Čet" },
    { i: 5, label: "Pet" },
    { i: 6, label: "Sub" },
    { i: 0, label: "Ned" },
  ];

  let label = data.label;
  let hourStr = String(data.hour).padStart(2, "0");
  let minuteStr = String(data.minute).padStart(2, "0");
  let enabled = data.enabled;

  const fullWeek = () => [0, 1, 2, 3, 4, 5, 6];
  let daysOfWeek: number[] =
    Array.isArray((data as any).daysOfWeek) && (data as any).daysOfWeek.length
      ? (data as any).daysOfWeek.slice().sort()
      : fullWeek();

  let wasOpen = false;
  let lastDataRef: EditorData | null = null;
  function syncFromData() {
    label = data.label;
    hourStr = String(data.hour).padStart(2, "0");
    minuteStr = String(data.minute).padStart(2, "0");
    enabled = data.enabled;
    daysOfWeek =
      Array.isArray((data as any).daysOfWeek) && (data as any).daysOfWeek.length
        ? (data as any).daysOfWeek.slice().sort()
        : fullWeek();
    vErrs = [];
    limitErr = null;
    otherErrs = [];
  }
  $: if (open && !wasOpen) { wasOpen = true; lastDataRef = data; syncFromData(); }
  $: if (!open && wasOpen) { wasOpen = false; }
  $: if (open && data && data !== lastDataRef) { lastDataRef = data; syncFromData(); }

  
  // — A11y: roving tabindex za dane u sedmici —
  let focusIndex = 0;
  let dayBtns: HTMLButtonElement[] = [];

  // Action za hvatanje reference na dugme dana (radi sa Svelte templatom bez TS cast-a)
  function captureDayBtn(node: HTMLButtonElement, i: number) {
    dayBtns[i] = node;
    return {
      destroy() {
        // opcionalno čišćenje; nije obavezno
      }
    };
  }
  function handleDaysKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusIndex = (focusIndex + 1) % DAYS.length;
      dayBtns[focusIndex]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusIndex = (focusIndex - 1 + DAYS.length) % DAYS.length;
      dayBtns[focusIndex]?.focus();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      // koristimo postojeću toggleDay logiku na indeksu
      const idx = focusIndex;
      // ako već postoji mapiranje i->value, koristimo isti indeks kao u {#each DAYS as d, i}
      toggleDay(DAYS[idx].i ?? idx);
    }
  }
function toggleDay(i: number) {
    daysOfWeek = daysOfWeek.includes(i)
      ? daysOfWeek.filter((d) => d !== i)
      : [...daysOfWeek, i].sort();
  }

  // Validacija/greške
  let vErrs: ValidationError[] = [];
  let limitErr: string | null = null;
  let otherErrs: string[] = [];

  function save() {
    const h = parseInt(hourStr, 10);
    const m = parseInt(minuteStr, 10);

    vErrs = validateReminder({
      label: (label ?? "").trim() || "Podsjetnik",
      hour: isNaN(h) ? 19 : h,
      minute: isNaN(m) ? 0 : m,
      daysOfWeek,
    });

    limitErr = vErrs.find((e) => e.kind === "limit")?.message ?? null;
    otherErrs = vErrs.filter((e) => e.kind !== "limit").map((e) => e.message);

    if (vErrs.length) return;

    dispatch("save", {
      id: (data as any).id,
      label: (label ?? "").trim() || "Podsjetnik",
      hour: isNaN(h) ? 19 : h,
      minute: isNaN(m) ? 0 : m,
      enabled,
      daysOfWeek
    });
  }

  // Notifications hint
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
    <div class="modal" aria-describedby="rem-editor-errors">
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

        <!-- Dani u sedmici -->
        <div class="field" role="group" aria-label="Dani u sedmici">
          <div class="lab">Dani u sedmici</div>
          <div
  class="days"
  role="toolbar"
  aria-label="Odaberi dane u sedmici"
  tabindex="0"
  on:focus={() => dayBtns[focusIndex]?.focus()}
  on:keydown={handleDaysKeydown}
>

  {#each DAYS as d, i}
    <button
      type="button"
      class:active={daysOfWeek.includes(d.i)}
      aria-pressed={daysOfWeek.includes(d.i)}
      tabindex={i === focusIndex ? 0 : -1}
      use:captureDayBtn={i}
      on:focus={() => (focusIndex = i)}
      on:click={() => toggleDay(d.i)}
    >
      {d.label}
    </button>
  {/each}
</div>
        </div>

        <label class="toggle">
          <input type="checkbox" bind:checked={enabled} role="switch" aria-checked={enabled} aria-label="Podsjetnik uključen" />
          <span aria-hidden="true"></span>
          <div class="t-copy">
            <div class="t-h">Podsjetnik uključen</div>
            <div class="t-s">Ako je isključeno, zadržava postavke bez zvona</div>
          </div>
        </label>

        <!-- PREMIUM limit poruka s CTA -->
        {#if limitErr}
          <div class="alert-premium" role="alert">
            <span class="dot" aria-hidden="true"></span>
            <span class="msg">{limitErr}</span>
            <button
              type="button"
              class="btn-primary btn-compact"
              on:click={() => openPaywall("reminders.multi", { source: "reminder_editor" })}
            >
              Postani PRO
            </button>
          </div>
        {/if}

        <!-- Ostale greške (live region) -->
        <div id="rem-editor-errors" class="sr-live" aria-live="polite">
          {#if otherErrs.length}
            <ul class="errors">
              {#each otherErrs as e}<li>{e}</li>{/each}
            </ul>
          {/if}
        </div>

        {#if notif !== "granted"}
          <div class="note">
            <div class="n-h">Omogući notifikacije</div>

            {#if notif === "insecure"}
              <div class="n-s">
              .
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
        <button class="btn-ghost" on:click={() => dispatch("close")} data-autofocus>Odustani</button>
        <button class="btn-primary" on:click={save}>{mode === "create" ? "Spremi" : "Sačuvaj"}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* ⬆ povisili z-index da prebaci Tabbar (koji je ~120) */
  .overlay{
    position:fixed; inset:0; z-index:300;
    background:rgba(0,0,0,.6);
    display:grid; place-items:center; padding:16px;
  }

  /* ⬇ dodali: max-height, grid redove, overflow:auto da tijelo modala skrola */
  .modal{
    width:min(560px, 96vw);
    max-height: calc(100svh - 24px);           /* NOVO */
    display: grid;                              /* NOVO */
    grid-template-rows: auto 1fr auto;          /* NOVO */
    overflow: auto;                              /* NOVO */

    border-radius:16px; padding:14px 14px 12px;
    background:
      radial-gradient(1200px 500px at -20% -20%, rgba(11,226,160,.06), transparent 40%),
      radial-gradient(800px 600px at 120% 120%, rgba(255,255,255,.04), transparent 45%),
      #0f1115;
    border:1px solid rgba(255,255,255,.10);
    box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 24px 48px rgba(0,0,0,.5);
    color:#e6ebef;
  }

  .head{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:4px 2px 8px; }
  .head h3{ font-size:1.05rem; font-weight:800; letter-spacing:.02em; }
  .x{ background:none; border:none; color:#e6ebef; font-size:18px; opacity:.8; cursor:pointer; }

  .body{
    display:grid; gap:12px; padding:6px 2px 2px;
    padding-bottom: 8px; /* malo mjesta iznad sticky footera */
  }

  .field .lab{ font-size:.9rem; opacity:.85; margin-bottom:3px; }
  .input{
    width:100%; padding:10px 12px; border-radius:12px;
    background:#0b0f14; border:1px solid rgba(255,255,255,.14); color:#e6ebef; font-weight:600;
  }
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

  .days { display:flex; gap:.5rem; flex-wrap:wrap; }
  .days button{
    padding:.4rem .6rem; border-radius:.5rem; border:1px solid rgba(255,255,255,.30);
    background:transparent; color:#e6ebef; font-weight:700; opacity:.8; cursor:pointer;
  }
  .days button.active{ opacity:1; outline:2px solid currentColor; }

  .toggle{
    display:flex; align-items:center; gap:12px; border-radius:12px; padding:10px 10px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.10);
  }
  .toggle input{ appearance: none; width:1px; height:1px; position:absolute; opacity:0; }
  .toggle span{ position:relative; width:52px; height:30px; border-radius:999px; background:rgba(255,255,255,.12); flex:0 0 auto; }
  .toggle span::after{ content:""; position:absolute; width:24px; height:24px; top:3px; left:3px; border-radius:50%; background:#fff; transition:transform .2s ease; }
  .toggle input:checked + span{ background:rgba(11,226,160,.4); }
  .toggle input:checked + span::after{ transform:translateX(22px); }

  .t-copy .t-h{ font-weight:800; }
  .t-copy .t-s{ font-size:.9rem; opacity:.85; }

  .alert-premium{
    display:flex; align-items:center; gap:10px;
    color:#ff6b6b; padding:8px 10px; border-radius:12px;
    background:rgba(255,107,107,.10); border:1px solid rgba(255,107,107,.35);
  }
  .alert-premium .dot{ width:8px; height:8px; border-radius:50%; background:#ff6b6b; display:inline-block; }
  .alert-premium .msg{ flex:1 1 auto; }

  .errors { margin:.5rem 0; color:#ff6b6b; }
  .errors li{ margin-left:1rem; }

  .note{ margin-top:4px; padding:10px; border-radius:12px; background:rgba(255,166,87,.10); border:1px solid rgba(255,166,87,.25); }
  .n-h{ font-weight:800; color:#FFA657; margin-bottom:4px; }
  .n-s{ font-size:.9rem; opacity:.95; margin-bottom:8px; }

  /* ⬇ footer je “zalijepljen” u dnu modala i uvijek vidljiv */
  .foot{
    position: sticky; bottom: 0;                 /* NOVO */
    background:#0f1115;                          /* NOVO (pokriva sadržaj ispod) */
    padding-top:10px;                             /* postojeće + */
    padding-bottom: max(10px, env(safe-area-inset-bottom, 0)); /* NOVO */
    display:flex; justify-content:flex-end; gap:10px;
  }

  .btn-ghost{
    background:none; border:1px solid rgba(255,255,255,.18); color:#e6ebef;
    border-radius:12px; padding:10px 14px; font-weight:700; cursor:pointer;
  }
  .btn-primary{
    background:#0be2a0; color:#0f1115; border:none; border-radius:12px; padding:10px 14px;
    font-weight:800; cursor:pointer; box-shadow:0 10px 24px rgba(11,226,160,.18);
  }
  .btn-compact{ padding:8px 12px; font-size:.92rem; }
</style>

