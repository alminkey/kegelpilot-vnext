<script lang="ts">
  import Header from './Header.svelte';
  import Tabbar from './Tabbar.svelte';

  // ROUTER store (hash)
  import { route } from '../store/router';

  // Ekrani
  import Home from '../features/home/Home.svelte';
  import Training from '../features/training/Training.svelte';
  import Edu from '../features/edu/Edu.svelte';
  import Progress from '../features/progress/Progress.svelte';
  import Profile from '../features/profile/Profile.svelte';

  // Screen je samo "mirror" na $route
  $: screen = $route;
  const screens = {
    home: Home,
    training: Training,
    edu: Edu,
    progress: Progress,
    profile: Profile
  } as const;

  $: Comp = screens[screen] || Home;
</script>

<div class="app">
  <Header />
  <main class="page">
    <svelte:component this={Comp} />
  </main>
  <Tabbar />
</div>

<style>
  .app { min-height:100dvh; display:flex; flex-direction:column; }
  .page { flex:1; }
</style>