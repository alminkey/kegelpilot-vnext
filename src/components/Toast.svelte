<script lang="ts">
  import { toasts } from "@/store/toast";
</script>

<div class="toast-wrap">
  {#each $toasts as t (t.id)}
    <div class="toast">{t.message}</div>
  {/each}
</div>

<style>
  .toast-wrap {
    position: fixed; right: 16px; bottom: 16px; z-index: 200;
    display: grid; gap: 8px;
  }
  .toast {
    background: #0be2a0; color: #0b0e12; padding: 10px 12px; border-radius: 10px; font-weight: 700;
    box-shadow: 0 10px 20px rgba(11,226,160,.2);
  }
</style>
