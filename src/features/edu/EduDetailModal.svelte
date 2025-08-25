<script lang="ts">
  import { onDestroy, tick } from "svelte";
  import { lockScroll, unlockScroll } from "@/lib/scrollLock";

  export let open: boolean = false;
  export let lesson:
    | Partial<{
        title: string;
        desc: string;
        emoji: string;
        durationMin: number | string;
        content: string[];
      }>
    | null = null;

  let modalEl: HTMLDivElement | null = null;

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  $: open ? lockScroll() : unlockScroll();
  onDestroy(() => unlockScroll());

  $: if (open) {
    tick().then(() => modalEl?.focus());
  }

  function close() { open = false; }

  const titleId = "edu-dialog-title";
</script>

<svelte:window on:keydown={onKeydown} />

{#if open && lesson}
  <div class="overlay" aria-hidden="true" on:click|self={close}>
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabindex="-1"
      bind:this={modalEl}
    >
      <div class="head">
        <h3 class="ttl" id={titleId}>
          {#if lesson.emoji}<span class="emoji" aria-hidden="true">{lesson.emoji}</span>{/if}
          {lesson.title}
        </h3>
        <button type="button" class="x" aria-label="Zatvori" on:click={close}>×</button>
      </div>

      <div class="body">
        {#if lesson.desc}<p class="desc">{lesson.desc}</p>{/if}

        {#if Array.isArray(lesson.content) && lesson.content.length}
          <div class="content">
            {#each lesson.content as p}
              <p class="para">{p}</p>
            {/each}
          </div>
        {/if}

        <div class="meta">{lesson.durationMin} min</div>
      </div>

      <div class="foot">
        <button type="button" class="btn-ghost" on:click={close}>Zatvori</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay{
    position: fixed; inset: 0;
    z-index: 300;
    background: rgba(0,0,0,.6);
    display: grid; place-items: center;
    padding: 16px;
  }
  .modal{
    width: min(560px, 96vw);
    max-height: calc(100svh - 24px);
    overflow: auto;
    display: grid; grid-template-rows: auto 1fr auto;

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
  .ttl{ font-size:1.05rem; font-weight:800; letter-spacing:.02em; display:flex; align-items:center; gap:.5rem; }
  .emoji{ font-size:1.25rem; line-height:1; }

  .x{
    background:none; border:none; color:#e6ebef;
    font-size:22px; opacity:.85; cursor:pointer; line-height:1;
  }
  .x:focus{ outline:none; box-shadow: 0 0 0 3px rgba(11,226,160,.25); border-radius:8px; }

  .body{
    display:grid; gap:12px; padding:6px 2px 2px;
    padding-bottom: 8px;
  }
  .desc{ opacity:.95; }
  .content{ display:grid; gap:10px; }
  .para{ opacity:.95; line-height:1.5; }
  .meta{ font-size:.9rem; opacity:.85; }

  .foot{
    position: sticky; bottom: 0;
    background:#0f1115;
    padding-top:10px;
    padding-bottom: max(10px, env(safe-area-inset-bottom, 0));
    display:flex; justify-content:flex-end; gap:10px;
  }

  .btn-ghost{
    background:none; border:1px solid rgba(255,255,255,.18); color:#e6ebef;
    border-radius:12px; padding:10px 14px; font-weight:700; cursor:pointer;
  }
</style>
