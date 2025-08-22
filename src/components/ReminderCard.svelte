<script lang="ts">
  import { onMount } from "svelte";
  import { reminders, canAddAnother, type Reminder, startReminderService } from "@/store/reminders";
  import ReminderEditorModal from "@/components/ReminderEditorModal.svelte";
  import PaywallModal from "@/components/PaywallModal.svelte";      // [1] dodano
  import type { EditorData } from "@/components/reminder-types";
 import { isPro } from "@/store/user";

let canAdd = false;
$: canAdd = ($isPro, canAddAnother(list.length));  // re-kalkuliši i kad se PRO promijeni

  let list: Reminder[] = [];
  const unsub = reminders.subscribe(v => list = v);

  onMount(() => {
    startReminderService();
    return () => unsub();
  });

  // modal state
  let showModal = false;
  let mode: "create" | "edit" = "create";
  let editorData: EditorData = { label: "Vrijeme za vježbu", hour: 19, minute: 0, enabled: true };

  // paywall popup
  let showPaywall = false;                                          // [2] dodano

  // header actions
  function openCreate() {
    mode = "create";
    editorData = { label: "Vrijeme za vježbu", hour: nextHour(), minute: 0, enabled: true };
    showModal = true;
  }
  function nextHour() {
    const d = new Date(); d.setMinutes(0); d.setSeconds(0); d.setMilliseconds(0);
    return (d.getHours() + 1) % 24;
  }

  // row actions
  function openEdit(r: Reminder) {
    mode = "edit";
    editorData = { id: r.id, label: r.label, hour: r.hour, minute: r.minute, enabled: r.enabled };
    showModal = true;
  }
  function remove(id: string) { reminders.remove(id); }
  function toggle(id: string) { reminders.toggle(id); }

  function onSave(e: CustomEvent<EditorData>) {
    const d = e.detail;
    if (mode === "edit" && d.id) {
      reminders.updateOne(d.id, { label: d.label, hour: d.hour, minute: d.minute, enabled: d.enabled });
    } else {
      reminders.add({ label: d.label, hour: d.hour, minute: d.minute, enabled: d.enabled });
    }
    showModal = false;
  }

  function fmt(h:number,m:number){ return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }
</script>

<div class="card remind">
  <div class="row-top">
    <div class="title">Podsjetnik</div>

    {#if canAdd}
      <button type="button" class="btn-primary" on:click={openCreate}>Dodaj</button>
    {:else}
      <!-- [3] umjesto ProGate: direktno otvori PaywallModal kao popup -->
      <button type="button" class="btn-primary" on:click={() => (showPaywall = true)}>Dodaj još</button>
    {/if}
  </div>

  {#if list.length === 0}
    <p class="empty">Postavi dnevni podsjetnik!</p>
  {:else}
    <ul class="list">
      {#each list as r (r.id)}
        <li class="row">
          <div class="left">
            <div class="time">{fmt(r.hour, r.minute)}</div>
            <div class="copy">
              <div class="h">{r.label}</div>
              <div class="s">{r.enabled ? "Uključeno" : "Isključeno"}</div>
            </div>
          </div>

          <div class="actions">
            <label class="switch">
              <input type="checkbox" checked={r.enabled} on:change={() => toggle(r.id)} />
              <span></span>
            </label>
            <button type="button" class="btn-ghost" on:click={() => openEdit(r)}>Uredi</button>
            <button type="button" class="btn-ghost" on:click={() => remove(r.id)}>Ukloni</button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<!-- Editor modal -->
<ReminderEditorModal bind:open={showModal} {mode} data={editorData}
  on:save={onSave} on:close={() => (showModal = false)} />

<!-- Paywall popup (full overlay, ne širi karticu) -->
<PaywallModal bind:open={showPaywall}
  on:upgrade={() => (showPaywall = false)}
  on:close={() => (showPaywall = false)} />

<style>
  /* ——— Card shell (isti vibe kao Home.card) ——— */
  .card{
    position:relative; width:100%;
    border-radius:16px; border:1px solid rgba(255,255,255,.08);
    background: radial-gradient(1200px 500px at -20% -20%, rgba(11,226,160,.06), transparent 40%),
                radial-gradient(800px 600px at 120% 120%, rgba(255,255,255,.04), transparent 45%),
                #0f1115;
    box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 20px 40px rgba(0,0,0,.35);
    padding:16px; color:#e6ebef;
  }
  .row-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .title{ font-weight:800; letter-spacing:.02em; }

  .btn-primary{
    background:#0be2a0; color:#0f1115; border:none; border-radius:12px; padding:8px 12px;
    font-weight:800; cursor:pointer; box-shadow:0 10px 24px rgba(11,226,160,.18);
  }
  .btn-ghost{
    background:none; border:1px solid rgba(255,255,255,.18); color:#e6ebef;
    border-radius:10px; padding:6px 10px; font-weight:700; cursor:pointer;
  }

  .empty{ margin-top:4px; font-size:.95rem; opacity:.9; }

  .list{ display:grid; gap:10px; margin-top:8px; }
  .row{
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    border-radius:12px; padding:10px 12px;
    background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
    border:1px solid rgba(255,255,255,.12);
  }
  .left{ display:flex; align-items:center; gap:12px; min-width:0; }
  .time{
    min-width:66px; text-align:center; font-weight:900; letter-spacing:.02em;
    background:#0b0f14; border:1px solid rgba(255,255,255,.14); border-radius:10px; padding:8px 10px;
  }
  .copy .h{ font-weight:800; line-height:1.1; }
  .copy .s{ font-size:.9rem; opacity:.85; }

  .actions{ display:flex; align-items:center; gap:8px; }
  .switch{ position:relative; width:52px; height:30px; flex:0 0 auto; }
  .switch input{ display:none; }
  .switch span{ position:absolute; inset:0; background:rgba(255,255,255,.12); border-radius:999px; }
  .switch span::after{ content:""; position:absolute; width:24px; height:24px; top:3px; left:3px; border-radius:50%; background:#fff; transition: transform .2s ease; }
  .switch input:checked + span{ background:rgba(11,226,160,.4); }
  .switch input:checked + span::after{ transform:translateX(22px); }

  /* no-overflow & shrink-friendly */
  .card, .row, .left, .copy { min-width: 0; }
  .list, .row { overflow: hidden; }
  .copy .h, .copy .s { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
