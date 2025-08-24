<script lang="ts">
  import ProBadge from "@/components/ProBadge.svelte";
  import { isPro } from "@/store/user";
</script>

<header class="header">
  <div class="container center" style="padding:10px 16px; position:relative; z-index:5;">
    <div class="title">KegelPilot</div>
    <div class="center" style="gap:10px">
      <ProBadge active={$isPro} />
      <span class="pill">vNext</span>
    </div>
  </div>
</header>
