<script lang="ts">
  let open = 0;
  const items = [
    {t:'Šta su Kegeli?', c:'Hammock mišića dna karlice koji podržavaju mokraćni mjehur, prostatu i rektum.'},
    {t:'Zašto rade?', c:'Jači mišići = bolja kontrola mokrenja, podrška erekciji/orgazmu, dio core-a.'},
    {t:'Ko ima koristi?', c:'Muškarci sa curenjem urina, ED/PE, poslije prostatektomije (uz fizioterapeuta idealno).'},
    {t:'Ko treba pauzirati?', c:'Bol/pelvična disfunkcija, UTI, recentna operacija — prvo konsultuj ljekara.'},
    {t:'Kako naći pravi mišić?', c:'Kao da želiš zaustaviti mlaz mokraće — ali nemoj to raditi često tokom mokrenja.'}
  ];
</script>

<h2 class="title">O Kegel vježbama</h2>
{#each items as it, i}
  <section class="card" on:click={()=> open = open===i ? -1 : i} style="cursor:pointer">
    <div class="center">
      <div style="font-weight:800">{it.t}</div>
      <div class="muted">{open===i ? '−' : '+'}</div>
    </div>
    {#if open===i}
      <hr><div class="muted">{it.c}</div>
    {/if}
  </section>
{/each}
