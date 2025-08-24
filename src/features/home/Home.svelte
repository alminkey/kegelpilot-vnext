<script lang="ts">
  import { today, goal } from '@/store/kpStore';
  import { go } from '@/store/router';
  import { onMount } from 'svelte';
  import { localDateKey } from "@/store/date";
  
  /* REMINDERS */
  import ReminderEditorModal from "@/components/ReminderEditorModal.svelte";
  import { reminders, addValidated } from "@/store/reminders";
  import type { Reminder } from "@/store/reminders";
  import type { EditorData } from "@/components/reminder-types";

  /* PRO gate za Edu */
  import { isPro } from "@/store/user";
  import { isAllowed, openPaywall } from "@/lib/gate";

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
    document.addEventListener('day-rollover', h);
    document.addEventListener('tz-changed', h);
    return ()=>{
      document.removeEventListener('progress-updated', h);
      document.removeEventListener('day-rollover', h);
      document.removeEventListener('tz-changed', h);
    };
  });

  const labelFor = (d:string)=>['Ned','Pon','Uto','Sri','Čet','Pet','Sub'][new Date(d).getDay()];

  /* ---------- Reminders UI helpers ---------- */
  const FULL_WEEK = [0,1,2,3,4,5,6];

  function daysLabel(days?: number[]) {
    const d = (days && days.length ? [...days].sort() : FULL_WEEK);
    const all = FULL_WEEK, work = [1,2,3,4,5], weekend = [0,6];
    const eq = (a:number[], b:number[]) => a.length===b.length && a.every(x=>b.includes(x));
    if (eq(d, all)) return "Svaki dan";
    if (eq(d, work)) return "Radni dani";
    if (eq(d, weekend)) return "Vikend";
    const names = ["Ned","Pon","Uto","Sri","Čet","Pet","Sub"];
    return d.map(i => names[i]).join(", ");
  }
  const timeStr = (h:number,m:number)=>`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;

  /* ---------- Editor modal state + handlers ---------- */
  let editorOpen = false;
  let editorMode: "create" | "edit" = "create";
  let editorData: EditorData = {
    label: "Vrijeme za vježbu",
    hour: 19,
    minute: 0,
    enabled: true,
    daysOfWeek: [1,3,5]
  };

  function handleAdd() {
    editorMode = "create";
    editorData = {
      label: "Vrijeme za vježbu",
      hour: new Date().getHours(),
      minute: Math.min(59, new Date().getMinutes()+1),
      enabled: true,
      daysOfWeek: [1,3,5]
    };
    editorOpen = true;
  }

  function handleEdit(r: Reminder) {
    editorMode = "edit";
    editorData = {
      id: r.id,
      label: r.label,
      hour: r.hour,
      minute: r.minute,
      enabled: r.enabled,
      daysOfWeek: r.daysOfWeek?.length ? r.daysOfWeek : FULL_WEEK,
    };
    editorOpen = true;
  }

  function handleSave(e: CustomEvent<EditorData & { daysOfWeek: number[] }>) {
    const d = e.detail;
    if (editorMode === "create") {
      const res = addValidated({
        label: d.label,
        hour: d.hour,
        minute: d.minute,
        daysOfWeek: d.daysOfWeek?.length ? d.daysOfWeek : FULL_WEEK,
        enabled: d.enabled,
      });
      if (!res.ok) {
        openPaywall("reminders.multi", { source: "home_add" });
    return;
      }
    } else {
      reminders.updateOne(d.id!, {
        label: d.label,
        hour: d.hour,
        minute: d.minute,
        enabled: d.enabled,
        daysOfWeek: d.daysOfWeek?.length ? d.daysOfWeek : FULL_WEEK,
      });
    }
    editorOpen = false;
  }

  /* ---------- Edu PRO gate ---------- */
  type EduItem = { id:string; title:string; desc:string; duration:string; emoji:string; pro?:boolean };
  const eduItems:EduItem[] = [
    { id:'breath',   title:'Disanje 101',     desc:'Ritam i dijafragma',   duration:'2 min', emoji:'🌬️' },
    { id:'posture',  title:'Postura',         desc:'Neutralna kičma',      duration:'2 min', emoji:'🧍'  },
    { id:'mobility', title:'Pelvic mobility', desc:'Lagano opuštanje',     duration:'3 min', emoji:'🧘', pro:true },
    { id:'awareness',title:'Svjesnost',       desc:'Mind–muscle konekcija',duration:'2 min', emoji:'🧠'  },
    { id:'recovery', title:'Recovery',        desc:'Opusti i resetuj',     duration:'3 min', emoji:'🛌', pro:true },
    { id:'mistakes', title:'Česte greške',    desc:'Šta izbjegavati',      duration:'1 min', emoji:'⚠️'  },
  ];

  function openEdu(it: EduItem){
    // PRO-only lekcije su “edu.advanced”
    if (it.pro && !isAllowed("edu.advanced")) {
      openPaywall("edu.advanced", { from: "home_edu_card", id: it.id });
      return;
    }
    go('edu');
  }
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
        <button
          class="edu-card"
          class:pro={it.pro}
          class:need-pro={it.pro && !$isPro}
          on:click={() => openEdu(it)}
          aria-label={it.title}
          title={it.title}
        >
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

  <!-- PODSJETNIK -->
  <div class="card remind">
    <div class="row-top">
      <div class="title">Podsjetnik</div>
      <button class="btn-primary" on:click={handleAdd}>Dodaj još</button>
    </div>

    {#if $reminders.length === 0}
      <div class="empty">Nema podsjetnika. Dodaj prvi.</div>
    {:else}
      <div class="rem-list">
        {#each $reminders as r (r.id)}
          <div class="rem-row">
            <div class="time">{timeStr(r.hour, r.minute)}</div>
            <div class="meta">
              <div class="r-title">{r.label}</div>
              <div class="r-sub">{daysLabel(r.daysOfWeek)}</div>
            </div>

            <!-- a11y switch -->
            <label class="switch" title={r.enabled ? "Isključi" : "Uključi"}>
              <input
                type="checkbox"
                role="switch"
                aria-checked={r.enabled}
                checked={r.enabled}
                on:change={() => reminders.toggle(r.id)}
                aria-label="Uključi/isključi podsjetnik"
              />
              <span aria-hidden="true"></span>
            </label>

            <div class="actions">
              <button class="r-btn" on:click={() => handleEdit(r)}>Uredi</button>
              <button class="r-btn danger" on:click={() => reminders.remove(r.id)}>Ukloni</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

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

  <!-- EDITOR MODAL -->
  <ReminderEditorModal
    bind:open={editorOpen}
    mode={editorMode}
    data={editorData}
    on:save={handleSave}
    on:close={() => (editorOpen = false)}
  />
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

  .hint{ border:1px solid rgba(255,166,87,.25); background:linear-gradient(180deg, rgba(255,166,87,.16), rgba(255,255,255,.06)); }
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

  /* EDU lane */
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
  .edu-card.need-pro { outline: 1px dashed rgba(255,166,87,.45); }
  .edu-card.need-pro:hover { outline-color: rgba(255,166,87,.8); }

  .streak{ padding:16px; }
  .streak .row-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .muted{ opacity:.75; font-size:.88rem; }
  .dots{ display:flex; gap:10px; padding:6px 2px 16px; }
  .dot{ width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); position:relative; display:grid; place-items:center; }
  .dot.half{ background: radial-gradient(closest-side, rgba(255,255,255,.18), rgba(255,255,255,.06)); }
  .dot.full{ background:#0be2a0; border-color:rgba(11,226,160,.6); box-shadow:0 0 0 3px rgba(11,226,160,.16); color:#0f1115; font-weight:800; }
  .dot .lbl{ position:absolute; bottom:-18px; font-size:.78rem; opacity:.85; }

  /* Reminders */
  .remind { padding:16px; }
  .remind .row-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .btn-primary{
    background:#0be2a0; color:#0f1115; border:none; border-radius:12px; padding:10px 14px;
    font-weight:800; cursor:pointer; box-shadow:0 10px 24px rgba(11,226,160,.18);
  }

  .empty{ opacity:.85; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.10); border-radius:12px; padding:10px; }

  .rem-list{ display:grid; gap:10px; }
  .rem-row{
    display:grid; grid-template-columns: auto 1fr auto auto; align-items:center; gap:12px;
    padding:10px; border-radius:12px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.10);
  }
  @media (max-width:420px){
    .rem-row{
      grid-template-columns: auto 1fr; 
      grid-template-areas:
        "time time"
        "meta meta"
        "switch actions";
      row-gap:8px;
    }
    .time{ grid-area: time; }
    .meta{ grid-area: meta; }
    .switch{ grid-area: switch; justify-self: start; }
    .actions{ grid-area: actions; justify-self: end; }
  }

  .time{
    font-weight:800; letter-spacing:.02em;
    color:#FFA657;
    background:rgba(255,166,87,.12); border:1px solid rgba(255,166,87,.45);
    border-radius:10px; padding:8px 10px;
  }
  .meta{ display:flex; flex-direction:column; gap:2px; min-width:0; }
  .r-title{ font-weight:800; font-size:.95rem; line-height:1.1; }
  .r-sub{ font-size:.85rem; opacity:.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  .switch{ display:flex; align-items:center; }
  .switch input{ appearance:none; width:46px; height:26px; border-radius:999px; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.22); position:relative; cursor:pointer; }
  .switch input::after{ content:""; position:absolute; width:20px; height:20px; top:2.5px; left:3px; border-radius:50%; background:#fff; transition: transform .18s ease; }
  .switch input:checked{ background:rgba(11,226,160,.4); border-color:rgba(11,226,160,.6); }
  .switch input:checked::after{ transform: translateX(20px); }

  .actions{ display:flex; gap:8px; }
  .r-btn{
    background:none; border:1px solid rgba(255,255,255,.18); color:#e6ebef;
    border-radius:10px; padding:6px 10px; font-weight:700; cursor:pointer;
  }
  .r-btn.danger{ border-color: rgba(255,107,107,.45); color:#ff6b6b; }

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
