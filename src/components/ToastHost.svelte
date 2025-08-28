<script lang="ts">
  import { onMount } from "svelte";
  import { toasts, removeToast } from "@/lib/toast";

  let list = [];
  const unsub = toasts.subscribe(v => (list = v));

  onMount(() => () => unsub());
</script>

<div class="toast-wrap" aria-live="polite" aria-atomic="true">
  {#each list as t (t.id)}
    <div class="toast-item" data-kind={t.kind} role="status">
      <span class="msg">{t.message}</span>
      <button class="x" aria-label="Zatvori" on:click={() => removeToast(t.id)}>×</button>
    </div>
  {/each}
</div>

<style>
  .toast-wrap {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 18px;
    display: grid;
    gap: 10px;
    z-index: 9999;
    pointer-events: none;
  }
  .toast-item {
    pointer-events: auto;
    min-width: 260px;
    max-width: 92vw;
    padding: 10px 14px;
    border-radius: 12px;
    background: #0f141a;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    display: grid;
    grid-auto-flow: column;
    align-items: center;
    gap: 12px;
    animation: slideUp 160ms ease-out;
  }
  .toast-item[data-kind="success"] { border-color: rgba(11,226,160,0.35); }
  .toast-item[data-kind="error"]   { border-color: rgba(255,102,102,0.35); }
  .msg { font-size: 14px; }
  .x {
    all: unset;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
  }
  .x:focus-visible { outline: 2px solid #81D4FA; outline-offset: 2px; }
  @keyframes slideUp {
    from { opacity: 0; transform: translate(-50%, 10px); }
    to   { opacity: 1; transform: translate(-50%, 0); }
  }
</style>
