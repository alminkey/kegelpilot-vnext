<script lang="ts">
  import { today, goal } from '@/store/kpStore';
  import { go } from '@/store/router';
  import { onMount } from 'svelte';
  import ReminderCard from '@/components/ReminderCard.svelte';
  import { localDateKey } from "@/store/date";

  $: dailyDone   = $today.done;
  $: dailyTarget = $today.target;
  $: dailyPct    = Math.min(1, (dailyTarget ? dailyDone / dailyTarget : 0)) * 100;

  $: rank   = $goal.rank;
  $: day    = $goal.day;
  $: length = $goal.length;
  $: rankPct = Math.round(($goal.percent ?? 0) * 100);

  const startTraining = () => go('training');
  const openPro       = () => go('profile');

  // Savjet dana
  const tips = [
    'Diši ravnomjerno — udah kroz nos, izdah duži.',
    'Ako osjetiš bol ili trnce, prekini i odmori.',
    'Fokus na dno karlice — ne steži zadnjicu/bedra.',
    'Postura: duga kičma, opuštena ramena.',
    'Kvalitet > snaga — kontrola pokreta.'
  ];
  $: tip = tips[new Date().getDay() % tips.length];

  // Weekly streak
  type DayStatus = 0|1|2;
  const LS_HISTORY = 'kp_history_v1';
  const iso = (d:Date)=>d.toISOString().slice(0,10);
  let history: Record<string,DayStatus> = {};
  function loadHistory(){ try{ history = JSON.parse(localStorage.getItem(LS_HISTORY) || '{}') }catch{ history = {} } }
  function saveHistory(){ try{ localStorage.setItem(LS_HISTORY, JSON.stringify(history)) }catch{} }
  function updateTodayFromStore(){
    const key = iso(new Date());
    const s:DayStatus = dailyDone >= dailyTarget ? 2 : (dailyDone>0?1:0);
    history[key]=s; saveHistory();
  }
  function last7(){
  const out: {date:string;status:DayStatus}[]=[];
  const now=new Date();
  for(let i=6;i>=0;i--){
    const d=new Date(now); d.setDate(now.getDate()-i);
    const k=localDateKey(d);
    out.push({date:k,status:history[k]??0});
  }
  return out;
}

  $: week = last7();

  onMount(()=>{
    loadHistory(); updateTodayFromStore();
    const h = ()=>{ loadHistory(); updateTodayFromStore(); week = last7(); };
    document.addEventListener('progress-updated', h);
    document.addEventListener('day-rollover', h); // ← NOVO: prelazak dana
    document.addEventListener('tz-changed', h);   // ← NOVO: promjena vremenske zone/DST
    return ()=>document.removeEventListener('progress-updated', h);
    document.removeEventListener('day-rollover', h);
    document.removeEventListener('tz-changed', h);
  });

  const labelFor = (d:string)=>['Ned','Pon','Uto','Sri','Čet','Pet','Sub'][new Date(d).getDay()];

  // EDU
  type EduItem = { id:string; title:string; desc:string; duration:string; emoji:string; pro?:boolean };
  const eduItems:EduItem[] = [
    { id:'breath',   title:'Disanje 101',     desc:'Ritam i dijafragma',   duration:'2 min', emoji:'🌬️' },
    { id:'posture',  title:'Postura',         desc:'Neutralna kičma',      duration:'2 min', emoji:'🧍'  },
    { id:'mobility', title:'Pelvic mobility', desc:'Lagano opuštanje',     duration:'3 min', emoji:'🧘', pro:true },
    { id:'awareness',title:'Svjesnost',       desc:'Mind–muscle konekcija',duration:'2 min', emoji:'🧠'  },
    { id:'recovery', title:'Recovery',        desc:'Opusti i resetuj',     duration:'3 min', emoji:'🛌', pro:true },
    { id:'mistakes', title:'Česte greške',    desc:'Šta izbjegavati',      duration:'1 min', emoji:'⚠️'  },
  ];
  const openEdu = (_:EduItem)=> go('edu');
</script>

<section class="home">
  <!-- HERO -->
  <div class="card hero">
    <div class="hero-top">
      <div class="title">Rang {rank} • Dan {day}/{length}</div>
      <div class="pill">vNext</div>
    </div>

    <div class="bar"><div class="fill" style={`--p:${rankPct}%`}></div></div>
    <div class="bar-meta"><span>Napredak ranga</span><span class="strong">{rankPct}%</span></div>

    <div class="hero-mini">
      <div>Preostalo danas: <b>{Math.max(dailyTarget - dailyDone, 0)}</b></div>
      <div>Procjena: <b>~3 min</b></div>
    </div>
  </div>

  <!-- DANAS + SAVJET -->
  <div class="grid-2">
    <div class="card today">
      <div class="left">
        <div class="bubble">
          <span class="num">{dailyDone}</span><span class="slash">/</span><span class="den">{dailyTarget}</span>
        </div>
        <div class="copy">
          <div class="h">Trening za danas</div>
          <div class="s">Današnji cilj: {dailyTarget} sesije</div>
        </div>
      </div>
      <button class="cta" on:click={startTraining}>Start</button>
      <div class="mini">
        <div class="mini-bar"><div class="mini-fill" style={`--p:${Math.min(100, dailyPct)}%`}></div></div>
        <div class="mini-meta"><span>Danas</span><span class="strong">{Math.round(Math.min(100, dailyPct))}%</span></div>
      </div>
    </div>

    <div class="card hint">
      <div class="hint-title">Savjet dana</div>
      <div class="hint-text">{tip}</div>
    </div>
  </div>

  <!-- QUICK -->
  <div class="quick">
    <button class="q" on:click={() => go('training')}>
      <span class="q-emoji">🏁</span>
      <span class="q-t">Brzi start</span>
    </button>
    <button class="q" on:click={() => go('progress')}><span class="q-emoji">📈</span><span class="q-t">Napredak</span></button>
    <button class="q" on:click={() => go('edu')}><span class="q-emoji">🎓</span><span class="q-t">Edukacija</span></button>
  </div>

  <!-- EDU -->
  <div class="edu card">
    <div class="row-top">
      <div class="title">Edukacija</div>
      <button class="see" on:click={() => go('edu')}>Vidi sve</button>
    </div>
    <div class="lane" aria-label="Edu lekcije">
      {#each eduItems as it}
        <button class="edu-card" on:click={() => openEdu(it)} aria-label={it.title} title={it.title}>
          <div class="badge" class:pro={it.pro}>{it.pro ? 'PRO' : 'FREE'}</div>
          <div class="edu-emoji">{it.emoji}</div>
          <div class="edu-title">{it.title}</div>
          <div class="edu-desc">{it.desc}</div>
          <div class="edu-meta">{it.duration}</div>
        </button>
      {/each}
    </div>
  </div>

  <!-- WEEKLY -->
  <div class="card streak">
    <div class="row-top">
      <div class="title">Weekly streak</div>
      <div class="muted">Zatamljeno = bez sesije • Pola = 1/2</div>
    </div>
    <div class="dots">
      {#each week as w}
        <div class="dot" class:full={w.status===2} class:half={w.status===1} title={w.date}>
          <span class="lbl">{labelFor(w.date)}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- PODSJETNIK (novi) -->
  <ReminderCard />

  <!-- PRO (button – rješava a11y) -->
  <button type="button" class="card pro" on:click={openPro} aria-label="Otvori KegelPilot PRO">
    <div class="pro-main">
      <div class="pro-title">KegelPilot PRO</div>
      <ul>
        <li>Otključani svi Rankovi treninga</li>
        <li>Adaptivni plan (lakše/teže bez ručnog podešavanja)</li>
        <li>Sedmični i mjesečni izvještaji</li>
        <li>Više podsjetnika + pametni nudge</li>
      </ul>
    </div>
    <span class="pro-cta">Probaj 7 dana</span>
  </button>
</section>

<style>
  .home{
    padding:16px; display:grid; gap:16px;
    width:100%; max-width:680px; margin:0 auto;
    overflow-x:hidden;
  }

  .card{
    position:relative; width:100%;
    border-radius:16px; border:1px solid rgba(255,255,255,.08);
    background: radial-gradient(1200px 500px at -20% -20%, rgba(11,226,160,.06), transparent 40%),
                radial-gradient(800px 600px at 120% 120%, rgba(255,255,255,.04), transparent 45%),
                #0f1115;
    box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 20px 40px rgba(0,0,0,.35);
    padding:14px; overflow:hidden;
  }

  .hero { padding:16px; }
  .hero::before{
    content:""; position:absolute; inset:-1px; border-radius:16px;
    background: linear-gradient(120deg, rgba(11,226,160,.35), rgba(255,255,255,0), rgba(11,226,160,.15));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    padding:1px; pointer-events:none;
  }
  .hero-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; }
  .title{ font-size:1.05rem; font-weight:800; letter-spacing:.02em; }
  .pill{ font-size:.8rem; color:#0be2a0; background: rgba(11,226,160,.12); border:1px solid rgba(11,226,160,.25); padding:4px 8px; border-radius:999px; }

  .bar{ height:10px; border-radius:999px; background:rgba(255,255,255,.07); overflow:hidden; }
  .fill{ height:100%; width:var(--p); background:linear-gradient(90deg,#0be2a0,#30ffcc); border-radius:999px; transition:width .3s ease; }
  .bar-meta{ display:flex; justify-content:space-between; margin-top:8px; font-size:.92rem; }
  .strong{ font-weight:800; }
  .hero-mini{ display:flex; gap:16px; margin-top:10px; opacity:.95; font-size:.92rem; }

  .grid-2{ display:grid; gap:16px; width:100%; }
  @media (min-width:720px){ .grid-2{ grid-template-columns: 1.3fr .7fr; } }

  .bubble{
    width:60px; height:60px; border-radius:50%;
    background: radial-gradient(100% 120% at 30% 20%, rgba(255,255,255,.15), rgba(255,255,255,.05));
    display:flex; align-items:center; justify-content:center; gap:2px; line-height:1;
  }
  .num{ font-weight:900; font-size:1.05rem; }
  .slash{ opacity:.8; font-weight:800; }
  .den{ opacity:.85; font-size:.95rem; }

  .today{ display:grid; gap:12px; width:100%; }
  .left{ display:flex; align-items:center; gap:12px; min-width:0; }
  .copy .h{ font-weight:800; font-size:1.02rem; }
  .copy .s{ opacity:.85; font-size:.92rem; }
  .cta{ justify-self:end; background:#0be2a0; color:#0f1115; font-weight:800; border:none; border-radius:12px; padding:10px 14px; cursor:pointer; box-shadow:0 10px 24px rgba(11,226,160,.18); }

  .mini{ margin-top:2px; }
  .mini-bar{ height:8px; border-radius:999px; background:rgba(255,255,255,.07); overflow:hidden; }
  .mini-fill{ height:100%; width:var(--p); background:linear-gradient(90deg,#0be2a0,#30ffcc); border-radius:999px; transition:width .3s ease; }
  .mini-meta{ display:flex; justify-content:space-between; margin-top:6px; font-size:.9rem; }

  .hint{ border:1px solid rgba(255,166,87,.25); background:linear-gradient(180deg, rgba(255,166,87,.16), rgba(255,166,87,.06)); }
  .hint-title{ font-weight:800; margin-bottom:6px; color:#FFA657; }
  .hint-text{ opacity:.98; }

  .quick{
    display:grid; grid-template-columns: repeat(3, 1fr);
    gap:12px; width:100%;
  }
  .q{
    min-width:0;
    background: rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.12);
    border-radius:14px; padding:12px 10px;
    display:flex; align-items:center; gap:10px;
    color:#e6ebef; cursor:pointer;
    transition: transform .12s ease, background .12s ease, border-color .12s ease;
  }
  .q:hover{ transform:translateY(-2px); background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.18); }
  .q-emoji{ font-size:1.6rem; line-height:1; }
  .q-t{ font-weight:800; }

  /* EDU lane – ne širi stranicu, horizontalni scroll */
  .edu{ padding:16px; }
  .edu .row-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .edu .see{ background:none; border:1px solid rgba(255,255,255,.18); color:#e6ebef; border-radius:10px; padding:6px 10px; font-weight:700; cursor:pointer; }

  .lane{
    width:100%; max-width:100%;
    display:grid; grid-auto-flow:column; grid-auto-columns:160px;
    gap:12px; padding:2px 2px 8px;
    overflow-x:auto; overflow-y:hidden;
    scroll-snap-type:x mandatory;
    -webkit-overflow-scrolling:touch;
  }
  .lane::-webkit-scrollbar{ height:6px; }
  .lane::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.15); border-radius:8px; }

  .edu-card{
    position:relative; width:160px; min-width:160px;
    scroll-snap-align:start;
    border-radius:14px; padding:12px;
    background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
    border:1px solid rgba(255,255,255,.12);
    display:grid; gap:6px; text-align:left; color:#e6ebef; cursor:pointer;
  }
  .badge{ position:absolute; top:8px; right:8px; font-size:.72rem; padding:2px 6px; border-radius:999px; border:1px solid rgba(255,255,255,.25); background:rgba(255,255,255,.08); }
  .badge.pro{ border-color:rgba(255,166,87,.5); background:rgba(255,166,87,.15); color:#FFA657; }
  .edu-emoji{ font-size:1.6rem; }
  .edu-title{ font-weight:800; line-height:1.1; }
  .edu-desc{ font-size:.9rem; opacity:.9; min-height:30px; }
  .edu-meta{ font-size:.85rem; opacity:.85; }

  .streak{ padding:16px; }
  .streak .row-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .muted{ opacity:.75; font-size:.88rem; }
  .dots{ display:flex; gap:10px; padding:6px 2px 16px; }
  .dot{ width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); position:relative; display:grid; place-items:center; }
  .dot.half{ background: radial-gradient(closest-side, rgba(255,255,255,.18), rgba(255,255,255,.06)); }
  .dot.full{ background:#0be2a0; border-color:rgba(11,226,160,.6); box-shadow:0 0 0 3px rgba(11,226,160,.16); color:#0f1115; font-weight:800; }
  .dot .lbl{ position:absolute; bottom:-18px; font-size:.78rem; opacity:.85; }

  .pro{
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    background:linear-gradient(180deg, rgba(11,226,160,.06), rgba(255,255,255,.02));
    border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:14px;
    text-align:left; color:#e6ebef; cursor:pointer;
  }
  .pro-title{ font-weight:900; letter-spacing:.02em; }
  .pro ul{ margin:6px 0 0 18px; padding:0; }
  .pro-cta{
    background:#0be2a0; color:#0f1115; border-radius:12px;
    padding:10px 14px; font-weight:800; box-shadow:0 10px 24px rgba(11,226,160,.18);
  }
</style>
