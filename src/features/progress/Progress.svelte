<script lang="ts">
  import { hardReset as coreReset, today, goal, getDailyProgressMap, on } from '@/store/kp';
  import { resetAll as legacyReset } from '@/store/kpStore';
  import { onMount } from 'svelte';

  type DayStatus = 0 | 1 | 2;
  let history: Record<string, DayStatus> = {};

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const dow = ['Pon','Uto','Sri','Čet','Pet','Sub','Ned'];

  $: targetPerDay = $goal.targetPerDay ?? 2;

  let view = new Date();
  function startOfMonth(d = view) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function endOfMonth(d = view)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

  let grid: { date?: Date; key: string; status: DayStatus }[] = [];

  function buildHistoryFromStore() {
    const map = getDailyProgressMap();
    history = {};
    for (const [k, v] of Object.entries(map)) {
      const n = v || 0;
      history[k] = n >= targetPerDay ? 2 : n > 0 ? 1 : 0;
    }
  }

  function buildGrid() {
    const first = startOfMonth();
    const last  = endOfMonth();
    const lead = (first.getDay() + 6) % 7;
    const days = last.getDate();

    const cells: { date?: Date; key: string; status: DayStatus }[] = [];
    for (let i=0;i<lead;i++) cells.push({ key:`lead-${i}`, status:0 });
    for (let d=1; d<=days; d++){
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const k = iso(date);
      cells.push({ date, key:k, status: history[k] ?? 0 });
    }
    while (cells.length % 7 !== 0) cells.push({ key:`tail-${cells.length}`, status:0 });
    while (cells.length < 42) cells.push({ key:`pad-${cells.length}`, status:0 });
    grid = cells;
  }

  function prevMonth(){ view = new Date(view.getFullYear(), view.getMonth()-1, 1); buildGrid(); }
  function nextMonth(){ view = new Date(view.getFullYear(), view.getMonth()+1, 1); buildGrid(); }

  function bestStreak(){
    const daysBack = 365;
    let best = 0, cur = 0;
    const todayD = new Date();
    for (let i=daysBack; i>=0; i--){
      const d = new Date(todayD); d.setDate(todayD.getDate()-i);
      const k = iso(d);
      const s = history[k] ?? 0;
      if (s === 2) { cur += 1; best = Math.max(best, cur); }
      else cur = 0;
    }
    return best;
  }

  function totalSessions(){
    const map = getDailyProgressMap();
    return Object.values(map).reduce((a,b)=>a+(b||0),0);
  }

  function rebuild(){ buildHistoryFromStore(); buildGrid(); }

  // — Confirm modal state —
  let confirmOpen = false;
  function openConfirm(){ confirmOpen = true; }
  async function confirmReset(){
    await coreReset();   // vNext (IndexedDB)
    legacyReset();       // legacy (localStorage)
    confirmOpen = false;
    rebuild();
  }
  function cancelReset(){ confirmOpen = false; }

  function handleKey(e: KeyboardEvent){
    if (confirmOpen && e.key === 'Escape') cancelReset();
  }

  onMount(()=>{
    rebuild();
    const off1 = on('progress-updated', rebuild);
    const off2 = on('day-rollover', rebuild);
    window.addEventListener('keydown', handleKey);
    return () => { off1(); off2(); window.removeEventListener('keydown', handleKey); };
  });
</script>

<section class="progress">
  <div class="head">
    <div class="title">Napredak</div>
    <div class="sub">Najbolji niz: <b>{bestStreak()}</b> dana</div>
  </div>

  <div class="pills">
    <div class="p full">
      <div class="l">Dan ranga</div>
      <div class="v">{$goal.day}/{Math.max(1,$goal.length)}</div>
    </div>
    <div class="p half">
      <div class="l">Današnje sesije</div>
      <div class="v">{$today.done}/{$today.target}</div>
    </div>
    <div class="p none">
      <div class="l">Ukupno</div>
      <div class="v">{totalSessions()}</div>
    </div>
  </div>

  <div class="hero card">
    <div class="row">
      <button class="nav" on:click={prevMonth} aria-label="Prethodni mjesec">‹</button>
      <div class="month">{view.toLocaleDateString('bs-BA',{month:'long',year:'numeric'})}</div>
      <button class="nav" on:click={nextMonth} aria-label="Sljedeći mjesec">›</button>
    </div>

    <div class="dow">{#each dow as d}<div class="d">{d}</div>{/each}</div>

    <div class="grid">
      {#each grid as c (c.key)}
        <div class="cell" class:empty={!c.date}>
          {#if c.date}
            <div class="dot" class:half={c.status===1} class:full={c.status===2}>
              <span class="n">{c.date.getDate()}</span>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="legend">
      <div class="lg"><span class="b full"></span><span>Ispunjen cilj</span></div>
      <div class="lg"><span class="b half"></span><span>Djelimično</span></div>
      <div class="lg"><span class="b none"></span><span>Nema sesije</span></div>
    </div>

    <div class="actions">
      <button class="ghost" on:click={rebuild}>Osvježi</button>
      <button class="reset" on:click={openConfirm}>Resetuj sve</button>
    </div>
  </div>
</section>

{#if confirmOpen}
  <div class="overlay" role="dialog" aria-modal="true" aria-label="Potvrda resetovanja">
    <div class="dialog">
      <h3>Jeste li sigurni da želite resetovati kompletan napredak?</h3>
      <p>Ova radnja briše sve lokalne podatke o sesijama i ciljevima.</p>
      <div class="row">
        <button class="btn ghost" on:click={cancelReset}>Odustani</button>
        <button class="btn danger" on:click={confirmReset}>Da, resetuj sve</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .head{ display:flex; align-items:baseline; justify-content:space-between; margin-bottom:10px; }
  .title{ font-weight:900; font-size:1.25rem; }
  .sub{ opacity:.9; }

  .card{
    background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 16px;
    padding: 14px;
    margin: 8px 0 16px;
  }
  .row{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .nav{ background:transparent; color:#e6ebef; border:1px solid rgba(255,255,255,.18); border-radius:10px; padding:6px 10px; cursor:pointer; }
  .month{ font-weight:800; letter-spacing:.02em; }

  .dow{ display:grid; grid-template-columns:repeat(7,1fr); gap:6px; margin:10px 0 8px; opacity:.9; }
  .d{ text-align:center; font-weight:700; }

  .grid{ display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
  .cell{ aspect-ratio:1/1; }
  .cell.empty{ opacity:.4; }

  .dot{
    position:relative; width:100%; height:100%;
    border-radius:12px; display:grid; place-items:center;
    background:rgba(255,255,255,.08);
    border:1px solid rgba(255,255,255,.12);
  }
  .dot.full{ background:rgba(11,226,160,.15); border-color:rgba(11,226,160,.45); }
  .dot.half{ background:rgba(255,166,87,.12); border-color:rgba(255,166,87,.45); }
  .n{ font-weight:800; }

  .legend{ display:flex; gap:16px; margin:12px 0 10px; }
  .lg{ display:flex; align-items:center; gap:8px; }
  .b{ width:12px; height:12px; border-radius:4px; display:inline-block; }
  .b.full{ background:rgba(11,226,160,.9); }
  .b.half{ background:rgba(255,166,87,.9); }
  .b.none{ background:rgba(255,255,255,.28); }

  .pills{ display:flex; gap:10px; flex-wrap:wrap; margin: 6px 0 10px; }
  .p{ display:flex; flex-direction:column; gap:4px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.04); padding:10px 12px; border-radius:12px; min-width:120px; }
  .p .l{ font-size:.8rem; opacity:.85; }
  .p .v{ font-weight:900; font-size:1rem; letter-spacing:.02em; }
  .p.full{ background: rgba(11,226,160,.08); border-color: rgba(11,226,160,.38); }
  .p.half{ background: rgba(255,166,87,.08); border-color: rgba(255,166,87,.38); }
  .p.none{ background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.12); }

  .actions{ display:flex; gap:10px; flex-wrap:wrap; }
  .reset{
    background:#ef3b2d; border:none; color:#fff; font-weight:800;
    padding:10px 14px; border-radius:12px; cursor:pointer;
  }
  .ghost{
    background:transparent; border:1px solid rgba(255,255,255,.18);
    color:#e6ebef; padding:10px 14px; border-radius:12px; font-weight:800; cursor:pointer;
  }

  /* Modal */
  .overlay{ position:fixed; inset:0; background:rgba(0,0,0,.45);
            display:flex; align-items:center; justify-content:center; z-index:100; }
  .dialog{ width:min(520px, 92vw); background:#11151b; border:1px solid #2a2f36;
           border-radius:16px; padding:18px; text-align:center; }
  .dialog h3{ margin:0 0 8px; }
  .dialog p{ opacity:.9; margin:0 0 12px; }
  .btn{ padding:10px 16px; border-radius:12px; border:none; cursor:pointer; font-weight:700; }
  .btn.ghost{ background:transparent; color:#c9d1d9; border:1px solid rgba(255,255,255,.15); }
  .btn.danger{ background:#ef3b2d; color:#fff; }
</style>
