<script lang="ts">
  import { hardReset } from '@/store/kpStore';
  import { onMount } from 'svelte';
  import { today } from '@/store/kpStore'; // samo za sažetak

  // Isti ključ koji koristi Home za Weekly streak
  const LS_HISTORY = 'kp_history_v1';

  type DayStatus = 0 | 1 | 2; // 0 = bez sesije, 1 = pola, 2 = ispunjen cilj
  let history: Record<string, DayStatus> = {};

  const iso = (d: Date) => d.toISOString().slice(0, 10);

  function loadHistory() {
    try { history = JSON.parse(localStorage.getItem(LS_HISTORY) || '{}'); }
    catch { history = {}; }
  }

  // --- KALENDAR ---
  let view = new Date(); // prikazani mjesec

  function startOfMonth(d = view) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function endOfMonth(d = view)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

  let grid: { date?: Date; key: string; status: DayStatus }[] = [];
  const dow = ['Pon','Uto','Sri','Čet','Pet','Sub','Ned']; // prikaz

  function buildGrid() {
    const first = startOfMonth();
    const last  = endOfMonth();

    // JS getDay(): 0=ned → pretvori da nam 0=pon
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
  function thisMonth(){ view = new Date(); buildGrid(); }

  // --- BEST STREAK ---
  function bestStreak() {
    const keys = Object.keys(history).sort(); // ISO sort = kronološki
    let best = 0, cur = 0, prev: string | null = null;

    const isNext = (a:string,b:string) => {
      const da=new Date(a), db=new Date(b);
      return Math.round((db.getTime()-da.getTime())/(1000*60*60*24)) === 1;
    };

    for (const k of keys){
      const active = (history[k] ?? 0) > 0;
      if (!active){ cur = 0; prev = k; best = Math.max(best, cur); continue; }
      cur = prev && isNext(prev,k) ? cur+1 : 1;
      best = Math.max(best, cur); prev = k;
    }
    return best;
  }

  // --- RESET ---
  function resetStats(){
  if (!confirm('Reset statistike? Ovo briše SVE lokalne podatke (kao nova instalacija).')) return;
  hardReset();
  alert('App je resetirana.');
}


  onMount(()=>{ loadHistory(); buildGrid(); });
</script>

<section class="progress">
  <div class="head">
    <div class="title">Napredak</div>
    <div class="sub">Najbolji niz: <b>{bestStreak()}</b> dana</div>
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
  </div>

  <div class="summary card">
    <div class="line"><span class="k">Današnji cilj</span><span class="v">{$today.done}/{ $today.target }</span></div>
    <div class="legend">
      <span class="lg"><i class="p full"></i> Ispunjeno</span>
      <span class="lg"><i class="p half"></i> Polovično</span>
      <span class="lg"><i class="p none"></i> Bez sesije</span>
    </div>
    <div class="actions">
      <button class="reset" on:click={resetStats}>Reset statistike</button>
      <button class="ghost" on:click={thisMonth}>Skoči na ovaj mjesec</button>
    </div>
  </div>
</section>

<style>
  .progress{ padding:16px; max-width:680px; margin:0 auto; display:grid; gap:16px; }
  .title{ font-weight:900; font-size:1.2rem; }
  .sub{ opacity:.85; }
  .card{
    border-radius:16px; border:1px solid rgba(255,255,255,.08);
    background: radial-gradient(1200px 500px at -20% -20%, rgba(11,226,160,.06), transparent 40%),
                radial-gradient(800px 600px at 120% 120%, rgba(255,255,255,.04), transparent 45%),
                #0f1115;
    box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 20px 40px rgba(0,0,0,.35);
    padding:14px;
  }
  .hero .row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .month{ font-weight:800; text-transform:capitalize; }
  .nav{
    width:36px; height:36px; border-radius:10px; border:1px solid rgba(255,255,255,.14);
    background:transparent; color:#e6ebef; font-size:1.2rem; font-weight:800; cursor:pointer;
  }

  .dow{ display:grid; grid-template-columns:repeat(7,1fr); gap:6px; margin:8px 0 6px; opacity:.8; }
  .d{ text-align:center; font-size:.85rem; }

  .grid{ display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
  .cell{ aspect-ratio:1; display:grid; place-items:center; }
  .cell.empty{ opacity:.25; }
  .dot{
    width:100%; height:100%; border-radius:12px;
    display:grid; place-items:center;
    background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.12);
    position:relative;
  }
  .dot .n{ position:absolute; bottom:6px; right:8px; font-size:.9rem; opacity:.9; }
  /* DOT – polovično (H A L F) -> narandžasta */
.dot.half{
  background: linear-gradient(180deg, rgba(255,166,87,.28), rgba(255,166,87,.16));
  border-color: rgba(255,166,87,.55);
  box-shadow: inset 0 0 0 3px rgba(255,166,87,.20);
}
  .dot.full{
    background:#0be2a0; border-color:rgba(11,226,160,.6); color:#0f1115; font-weight:900;
    box-shadow:0 0 0 3px rgba(11,226,160,.16);
  }

  .summary .line{ display:flex; justify-content:space-between; margin-bottom:8px; }
  .legend{ display:flex; gap:14px; flex-wrap:wrap; margin:8px 0 12px; }
  .lg{ display:flex; align-items:center; gap:8px; }
  .p{ width:18px; height:10px; border-radius:999px; display:inline-block; border:1px solid rgba(255,255,255,.12); }
  .p.full{ background:#0be2a0; border-color:rgba(11,226,160,.5);}
  /* LEGENDA */
.p.half{
  background: rgba(255,166,87,.9);
  border-color: rgba(255,166,87,.7);
}
  .p.none{
  background: rgba(255,255,255,.08);
  border-color: rgba(255,255,255,.12);
}
  .actions{ display:flex; gap:10px; flex-wrap:wrap; }
  .reset{
    background:#ef3b2d; border:none; color:#fff; font-weight:800;
    padding:10px 14px; border-radius:12px; cursor:pointer;
  }
  .ghost{
    background:transparent; border:1px solid rgba(255,255,255,.18);
    color:#e6ebef; padding:10px 14px; border-radius:12px; font-weight:800; cursor:pointer;
  }
</style>
