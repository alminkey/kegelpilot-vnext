<script lang="ts">
  export let screen:'home'|'training'|'edu'|'progress'|'profile' = 'home';
  const tabs = [
    { id:'home', label:'Početna', icon:'M3 12h18' },
    { id:'training', label:'Trening', icon:'M12 2v20' },
    { id:'edu', label:'Edu', icon:'M4 6h16M4 12h16M4 18h16' },
    { id:'progress', label:'Napredak', icon:'M3 17l6-6 4 4 7-7' },
    { id:'profile', label:'Profil', icon:'M12 12a5 5 0 1 0 0-10a5 5 0 0 0 0 10zm-7 9a7 7 0 0 1 14 0' }
  ];
  function go(id:string){ screen=id as any; location.hash = id; }
</script>

<nav class="tabbar">
  <div class="container center" style="padding:8px 6px">
    {#each tabs as t}
      <button
        on:click={()=>go(t.id)}
        class="center"
        style="gap:8px;padding:10px 12px;border:none;background:transparent;color:{screen===t.id?'#fff':'var(--muted)'};font-weight:{screen===t.id?800:600};transform:{screen===t.id?'scale(1.02)':'none'}">
        <span style="display:inline-block;width:18px;height:18px;border:2px solid {screen===t.id?'#fff':'var(--muted)'};border-radius:4px"></span>
        <span>{t.label}</span>
      </button>
    {/each}
  </div>
</nav>
