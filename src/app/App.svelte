<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './Header.svelte';
  import Tabbar from './Tabbar.svelte';
  import Home from '../features/home/Home.svelte';
  import Training from '../features/training/Training.svelte';
  import Edu from '../features/edu/Edu.svelte';
  import Progress from '../features/progress/Progress.svelte';
  import Profile from '../features/profile/Profile.svelte';
  import { route } from '../store/router';

  let screen = 'home';
  const screens = { home: Home, training: Training, edu: Edu, progress: Progress, profile: Profile };
  $: Comp = screens[screen] || Home;

  function setFromHash(){
    const h = (location.hash||'').replace('#','');
    screen = (['home','training','edu','progress','profile'].includes(h) ? h : 'home');
  }
  onMount(()=>{
    setFromHash();
    window.addEventListener('hashchange', setFromHash);
  });
</script>

<Header />
<div class="container" style="padding-bottom:72px;padding-top:12px">
  <svelte:component this={Comp} />
</div>
<Tabbar bind:screen />
