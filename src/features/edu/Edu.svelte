<script lang="ts">
  import ProGate from "@/components/ProGate.svelte";
  import EduDetailModal from "./EduDetailModal.svelte";
  import { lessons, type EduLesson } from "./eduData";

  // modal state
  let open = false;
  let lesson: EduLesson | null = null;

  function openLesson(l: EduLesson) {
    lesson = l;
    open = true;
  }
</script>

<section class="edu">
  <div class="row-top">
    <div class="title">Edukacija</div>
  </div>

  <div class="lane" aria-label="Edu lekcije">
    {#each lessons as it (it.id)}
      {#if it.pro}
        <ProGate feature="edu.advanced" teaser="Napredna lekcija" mode="blur" origin="edu">
          <button
            type="button"
            class="edu-card"
            on:click={() => openLesson(it)}
            aria-label={it.title}
            title={it.title}
          >
            <div class="badge pro">PRO</div>
            <div class="edu-emoji">{it.emoji}</div>
            <div class="edu-title">{it.title}</div>
            <div class="edu-desc">{it.desc}</div>
            <div class="edu-meta">{it.duration}</div>
          </button>
        </ProGate>
      {:else}
        <button
          type="button"
          class="edu-card"
          on:click={() => openLesson(it)}
          aria-label={it.title}
          title={it.title}
        >
          <div class="badge free">FREE</div>
          <div class="edu-emoji">{it.emoji}</div>
          <div class="edu-title">{it.title}</div>
          <div class="edu-desc">{it.desc}</div>
          <div class="edu-meta">{it.duration}</div>
        </button>
      {/if}
    {/each}
  </div>

  <!-- Modal detalja lekcije -->
  <EduDetailModal bind:open {lesson} on:close={() => (lesson = null)} />
</section>

<style>
  .edu{ padding:16px; display:grid; gap:10px; }
  .row-top{ display:flex; align-items:center; justify-content:space-between; }
  .row-top .title{ font-weight:800; letter-spacing:.02em; }

  .lane{
    width:100%; max-width:100%;
    display:grid; grid-auto-flow:column; grid-auto-columns:180px;
    gap:12px; padding:2px 2px 8px;
    overflow-x:auto; overflow-y:hidden;
    scroll-snap-type:x mandatory;
    -webkit-overflow-scrolling:touch;
  }
  .lane::-webkit-scrollbar{ height:6px; }
  .lane::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.15); border-radius:8px; }

  /* Card */
  .edu-card{
    position:relative; width:180px; min-width:180px;
    scroll-snap-align:start;
    border-radius:14px; padding:12px;
    background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
    border:1px solid rgba(255,255,255,.12);
    display:grid; gap:6px; text-align:left; color:#e6ebef; cursor:pointer;
  }
  .badge{
    position:absolute; top:8px; right:8px; font-size:.72rem; padding:2px 6px;
    border-radius:999px; border:1px solid rgba(255,255,255,.25); background:rgba(255,255,255,.08);
  }
  .badge.pro{ border-color:rgba(255,166,87,.5); background:rgba(255,166,87,.15); color:#FFA657; }
  .badge.free{ border-color:rgba(11,226,160,.35); background:rgba(11,226,160,.15); color:#0be2a0; }
  .edu-emoji{ font-size:1.6rem; }
  .edu-title{ font-weight:800; line-height:1.2; }
  .edu-desc{ font-size:.95rem; opacity:.9; min-height:34px; }
  .edu-meta{ font-size:.85rem; opacity:.85; }
</style>
