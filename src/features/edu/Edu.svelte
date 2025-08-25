<script lang="ts">
  import { openPaywall } from "@/lib/gate";
  import { isPro } from "@/store/user";
  import EduDetailModal from "./EduDetailModal.svelte";
  import { lessons as rawLessons, type EduLesson } from "./eduData";

  type Lesson = EduLesson;

  const lessons: Lesson[] = rawLessons;

  let open = false;
  let lesson:
    | Partial<{
        title: string;
        desc: string;
        emoji: string;
        durationMin: number | string;
        content: string[];
      }>
    | null = null;

  // Helpers
  const titleOf = (l: Lesson) => l.title;
  const emojiOf = (l: Lesson) => l.emoji;

  // Ako nema desc, uzmi prvi paragraf iz content
  const descOf = (l: Lesson) =>
    (l.desc && l.desc.trim()) || (Array.isArray(l.content) && l.content[0]) || "";

  // "2 min" -> "2"
  function minsStr(l: Lesson): string {
    const n = parseInt(l.duration, 10);
    return Number.isFinite(n) ? String(n) : String(l.duration).replace(/\D+$/, "");
  }
  function minsNum(l: Lesson): number {
    const n = parseInt(minsStr(l), 10);
    return Number.isFinite(n) ? n : 2;
  }

  const isProItem = (l: Lesson) => l.pro === true;

  // Klik na karticu:
  //  - ako je PRO + FREE korisnik → paywall
  //  - inače → modal sa punim sadržajem (desc + content[])
  function onCardClick(l: Lesson) {
    if (isProItem(l) && !$isPro) {
      openPaywall("edu.advanced", { source: "edu_card" });
      return;
    }
    lesson = {
      title: titleOf(l),
      desc: descOf(l),
      emoji: emojiOf(l),
      durationMin: minsNum(l),
      content: Array.isArray(l.content) ? l.content : []
    };
    open = true;
  }
</script>

<section class="edu">
  <h2 class="h">Edukacija</h2>

  <div class="list">
    {#each lessons as it}
      <button
        type="button"
        class="card"
        on:click={() => onCardClick(it)}
        aria-label={titleOf(it)}
        title={titleOf(it)}
      >
        <!-- FREE/PRO bedž -->
        {#if isProItem(it)}
          <span class="badge pro">PRO</span>
        {:else}
          <span class="badge free">FREE</span>
        {/if}

        <div class="row">
          <span class="edu-emoji" aria-hidden="true">{emojiOf(it)}</span>
          <div class="txt">
            <div class="edu-title">{titleOf(it)}</div>

            {#if descOf(it)}
              <div class="edu-desc">{descOf(it)}</div>
            {/if}

            <div class="edu-meta">{minsStr(it)} min</div>
          </div>
        </div>
      </button>
    {/each}
  </div>

  <EduDetailModal bind:open {lesson} />
</section>

<style>
  .edu{ padding: 12px 16px 24px; color:#e6ebef; }
  .h{ margin: 0 0 12px 0; font-size:1.3rem; font-weight: 800; }

  .list{
    display: grid;
    grid-template-columns: 1fr; /* jedna kolona */
    gap: 12px;
  }

  .card{
    position: relative;
    width: 100%;
    border-radius: 16px;
    border:1px solid rgba(255,255,255,.12);
    background: #0e1319;
    display: block;
    text-align: left;
    color:#e6ebef;
    padding: 12px;
    cursor: pointer;
  }
  .row{ display: grid; grid-template-columns: 48px 1fr; gap: 12px; align-items: center; }
  .edu-emoji{ font-size: 1.6rem; text-align:center; }

  .txt{ display: grid; gap: 6px; }
  .edu-title{ font-weight:800; line-height:1.2; }

  /* više linija opisa; bez ellipsisa */
  .edu-desc{
    font-size:.95rem;
    opacity:.9;
    white-space: normal;
    overflow: visible;
    line-height: 1.35;
  }
  .edu-meta{ font-size:.85rem; opacity:.85; }

  .badge{
    position:absolute; top:8px; right:8px; font-size:.72rem; padding:2px 6px;
    border-radius:999px; border:1px solid rgba(255,255,255,.25); background:rgba(255,255,255,.08);
  }
  .badge.pro{ border-color:rgba(255,166,87,.5); background:rgba(255,166,87,.15); color:#FFA657; }
  .badge.free{ border-color:rgba(11,226,160,.35); background:rgba(11,226,160,.15); color:#0be2a0; }
</style>
