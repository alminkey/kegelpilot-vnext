<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import ProGate from "@/components/ProGate.svelte";
  import ProBadge from "@/components/ProBadge.svelte";
  import type { EduLesson } from "./eduData";

  export let open = false;
  export let lesson: EduLesson | null = null;

  const dispatch = createEventDispatcher<{ close: void }>();
</script>

{#if open && lesson}
  <div class="overlay" role="dialog" aria-modal="true">
    <div class="modal">
      <div class="head">
        <div class="title-row">
          <div class="emoji">{lesson.emoji}</div>
          <h3>{lesson.title}</h3>
          {#if lesson.pro}<ProBadge small />{/if}
        </div>
        <button class="x" on:click={() => dispatch("close")} aria-label="Zatvori">✕</button>
      </div>

      <div class="meta">{lesson.duration}</div>

      <div class="body">
        {#if lesson.pro}
          <ProGate feature="edu.proLesson" teaser="Napredne tehnike i specifični planovi" mode="blur" origin="edu-detail">
            {#each lesson.content as p}<p class="p">{p}</p>{/each}
          </ProGate>
        {:else}
          {#each lesson.content as p}<p class="p">{p}</p>{/each}
        {/if}
      </div>

      <div class="foot">
        <button class="btn-ghost" on:click={() => dispatch("close")}>Zatvori</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay{ position:fixed; inset:0; z-index:50; background:rgba(0,0,0,.6); display:grid; place-items:center; padding:16px; }
  .modal{
    width:min(740px, 96vw);
    border-radius:16px; padding:16px;
    background: radial-gradient(1200px 500px at -20% -20%, rgba(11,226,160,.06), transparent 40%),
                radial-gradient(800px 600px at 120% 120%, rgba(255,255,255,.04), transparent 45%),
                #0f1115;
    border:1px solid rgba(255,255,255,.10);
    box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 24px 48px rgba(0,0,0,.5);
    color:#e6ebef;
  }
  .head{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .title-row{ display:flex; align-items:center; gap:10px; }
  .emoji{ font-size:1.6rem; }
  h3{ font-size:1.1rem; font-weight:800; letter-spacing:.02em; }
  .x{ background:none; border:none; color:#e6ebef; font-size:18px; opacity:.8; cursor:pointer; }
  .meta{ margin-top:2px; font-size:.9rem; opacity:.85; }

  .body{ margin-top:12px; display:grid; gap:10px; }
  .p{ line-height:1.5; opacity:.98; }

  .foot{ display:flex; justify-content:flex-end; gap:10px; margin-top:12px; }
  .btn-ghost{
    background:none; border:1px solid rgba(255,255,255,.18); color:#e6ebef;
    border-radius:12px; padding:10px 14px; font-weight:700; cursor:pointer;
  }
</style>
