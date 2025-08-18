<script lang="ts">
  export let progress = 0;          // 0..1 (cijela sesija)
  export let pulse = 0;             // 0..1 (unutrašnji puls)
  export let ringColor = '#0be2a0'; // zelena (vanjski ring)
  export let pulseColor = '#FFA657';// narandžasta (unutrašnji puls)
  export let ringOpacity = 1;       // 0..1 – “prepare” puls

  const size = 260;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  $: dash = `${c * progress} ${c}`;

  const innerMax = r - stroke * 1.35;
  const innerMin = innerMax * 0.35;
  $: k = Math.max(0, Math.min(1, pulse));
  $: innerR = innerMin + (innerMax - innerMin) * k;

  // centar uvijek 100% providan; ivica 50%→0% providnosti kako puls raste
  $: alphaCenter = 0;
  $: alphaEdge   = 0.5 + 0.5 * k;

  const gid = `pulseGrad-${Math.random().toString(36).slice(2)}`;
</script>

<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} class="ring">
  <defs>
    <radialGradient id={gid} cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color={pulseColor} stop-opacity={alphaCenter}/>
      <stop offset="100%" stop-color={pulseColor} stop-opacity={alphaEdge}/>
    </radialGradient>
  </defs>

  <!-- pozadinski trag -->
  <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,.10)" stroke-width={stroke} fill="none" />

  <!-- vanjski ring -->
  <circle
    cx={size/2} cy={size/2} r={r}
    stroke={ringColor} stroke-width={stroke} fill="none"
    stroke-linecap="round"
    stroke-dasharray={dash}
    stroke-opacity={ringOpacity}
    transform={`rotate(-90 ${size/2} ${size/2})`}
  />

  <!-- unutrašnji puls -->
  <circle cx={size/2} cy={size/2} r={innerR} fill={`url(#${gid})`} />
</svg>

<style>
  .ring { display:block; filter: drop-shadow(0 0 18px rgba(11,226,160,.18)); }
</style>
