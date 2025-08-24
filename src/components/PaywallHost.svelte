<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import PaywallModal from "@/components/PaywallModal.svelte";

  let open = false;

  function openIt()  { open = true; }
  function closeIt() { open = false; }

  onMount(() => {
    const onOpen = () => openIt();
    const onCloseAll = () => closeIt();
    const onCheckoutSuccess = () => closeIt(); // zatvori nakon kupovine

    window.addEventListener("paywall:open", onOpen as any);
    window.addEventListener("kp:open-paywall", onOpen as any);
    window.addEventListener("kp:close-modals", onCloseAll as any);
    window.addEventListener("checkout:success", onCheckoutSuccess as any);

    return () => {
      window.removeEventListener("paywall:open", onOpen as any);
      window.removeEventListener("kp:open-paywall", onOpen as any);
      window.removeEventListener("kp:close-modals", onCloseAll as any);
      window.removeEventListener("checkout:success", onCheckoutSuccess as any);
    };
  });

  onDestroy(() => { /* ništa – Modal resetuje scroll */ });
</script>

<PaywallModal {open} on:close={closeIt} on:upgrade={closeIt} />
