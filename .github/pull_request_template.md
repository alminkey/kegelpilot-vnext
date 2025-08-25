## 🔥 Sažetak (jedna–dvije rečenice)

<!-- Ukratko: šta ovaj PR radi i zašto. Npr: "Konsolidovan paywall na PaywallHost, dodan PRO toast, A11y roving tabindex za dane, e2e test scroll-unlock." -->

---

## ✨ Šta je promijenjeno

- [ ] Paywall: host-only (uklonjen lokalni `<PaywallModal />` iz `App.svelte`)
- [ ] `PaywallHost`: na `checkout:success` → close + `upgradeToPro()` + toast **“PRO aktiviran 🎉”**
- [ ] `Pro.svelte`: toast i na `checkout:success` i na `#/pro?success=1` (hash clean)
- [ ] `ReminderEditorModal`: A11y roving tabindex (←/→, Space/Enter), fokus ring, `role="toolbar"`
- [ ] Scroll lock stabilizovan (nema “zalijepljenog” body scrolla)
- [ ] Globalni `Toast` (store + komponenta), mount u `App.svelte`
- [ ] Testovi: `scroll_unlock.spec.ts` + ispravljen `paywall.spec.ts` (nema duplog modala)

> Ako je ovaj PR za nešto drugo, dopuni/izmijeni tačke iznad.

---

## 🧪 Kako testirati (korak po korak)

### 1) Setup

- [ ] `.env.local` ima `VITE_PAYMENTS_PROVIDER=mock`
- [ ] `App.svelte` montira **samo** `<PaywallHost />` + `<Toast />` (nema lokalnog `<PaywallModal />`)

### 2) Manualno

- [ ] **FREE → Paywall → PRO**  
      Pokušaj dodati **2. podsjetnik** (FREE limit=1) → otvori paywall → u DevTools:
  ```js
  window.dispatchEvent(new Event("checkout:success"));
  ```
