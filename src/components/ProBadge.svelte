<script lang="ts">
  export let small = false;
</script>

<span class="inline-flex items-center rounded-full bg-orange-500/15 text-orange-500
             font-semibold {small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}">
  PRO
</span>

<style>
  :global(.text-[10px]) { font-size:10px; }
</style>
