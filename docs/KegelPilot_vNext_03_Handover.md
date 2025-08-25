
# KegelPilot vNext 04 — Handover & Quick Start
**Datum:** 2025-08-24 20:34 • **Fokus:** PRO simulacija + paywall gating + podsjetnici + a11y osnove

Ovaj dokument je praktični “checklist + upute” za nastavak rada na *KegelPilot vNext* grani.
Uparuje trenutno stanje sa planom iz **KP-BLUEPRINT** (Android-first).

---

## 1) Trenutno stanje (HIGH-LEVEL)

### PRO simulacija & persistencija
- `src/store/user.ts` — `isPro` Svelte store, `upgradeToPro()`, `downgradeToFree()`, `togglePro()`.
- Persistencija preko `localStorage` (`kp_is_pro`).
- Inicijalni read na load → PRO status dostupan kroz cijelu aplikaciju.

### Gating (paywall & feature guard)
- `src/lib/gate.ts` — izvor istine: `PRO_ONLY_KEYS` (`reminders.multi`, `edu.advanced`, `training.all_ranks`, `analytics.reports`).
- Helperi:
  - `isAllowed(feature)`
  - `whyNotAllowed(feature) -> "pro_only" | null`
  - `ensureAllowed(feature)` → automatski otvara paywall ako nije dozvoljeno
  - `gateAction(feature, fn)` → “pokušaj pa paywall”
  - `openPaywall(feature?, context?)` → emituje globalni event `"paywall:open"`

- UI:
  - **Paywall modal:** `src/components/PaywallModal.svelte` (a11y fokus trap, CTA planovi).
  - **Paywall host:** `src/components/PaywallHost.svelte` (sluša `paywall:open`, zatvara na `checkout:success`).
  - **ProBadge:** `src/components/ProBadge.svelte` → anchor na `#/pro` (bez bubblinga).

### Podsjetnici (FREE=1, PRO=10)
- `src/store/reminders.ts` — tip `Reminder` (+ `daysOfWeek?: number[]`), CRUD, servis “in-app” notifikacija.
- `canAddAnother()`, `validateReminder()`, `addValidated()`.
- **Editor modal:** `src/components/ReminderEditorModal.svelte` (Pon–Ned, live validacije, a11y, inline greške).
- FREE limit poruka sa zelenim CTA “Postani PRO” → `openPaywall("reminders.multi")`.

### Scroll lock — globalni ref-count
- `src/lib/scrollLock.ts` — `lockScroll()`, `unlockScroll()`, `resetScrollLock()`.
- Koristi se **samo** u `PaywallModal` i `ReminderEditorModal`. (Host više ne dira `overflow`.)

### PRO ekran
- `src/features/pro/Pro.svelte` — jednostavni planovi (mock/Stripe/Paddle preklop), “Vrati na FREE”.

### Plaćanja (client-only scaffolding)
- `src/lib/payments.ts` — provider: `mock` (default), `stripe` (redirectToCheckout), `paddle` (classic v3).
- `.env.local` (lokalno, ne u git):
  ```ini
  VITE_PAYMENTS_PROVIDER=mock
  # Stripe (kasnije):
  # VITE_PAYMENTS_PROVIDER=stripe
  # VITE_STRIPE_PK=pk_test_...
  # VITE_STRIPE_PRICE_MONTHLY=price_xxx
  # VITE_STRIPE_PRICE_ANNUAL=price_yyy
  ```

### Rute
- Hash router (`go('...')`); `App.svelte` ruta `pro` mapira na `Pro.svelte`.

### Testovi
- **Vitest (unit):** `src/store/__tests__/user.test.ts`, `src/store/__tests__/reminders.test.ts`.
- **Playwright (e2e):** `tests/paywall.spec.ts` (FREE → paywall → mock checkout → PRO persist).
- **CI workflow:** `.github/workflows/tests.yml` (pokreće unit + e2e).

---

## 2) Brzi “kako” (ključni isječci)

### 2.1 Otvaranje paywalla iz bilo koje komponente
```ts
import { openPaywall } from "@/lib/gate";

// npr. u on:click handleru
openPaywall("reminders.multi", { source: "some_component" });
```

Ili inline događaj bez importa:
```svelte
<button
  on:click={() =>
    window.dispatchEvent(new CustomEvent("paywall:open", { detail: { feature: "reminders.multi" } }))}
>Postani PRO</button>
```

### 2.2 PaywallHost mount (u `App.svelte`)
U `App.svelte` se jednom montira paywall host **ispod layouta**:
```svelte
<script lang="ts">
  import PaywallHost from "@/components/PaywallHost.svelte";
</script>

<!-- ...ostatak layouta / router outleta... -->

<PaywallHost />
```

### 2.3 Scroll lock pravilno korištenje
- Poziva **samo** modal prilikom `onMount`/otvaranja: `lockScroll()`
- Na zatvaranje: `unlockScroll()`
- U testovima/edge-case: `resetScrollLock()`

---

## 3) Run, build i test

### 3.1 Pokretanje (dev)
```bash
npm install
npm run dev
# ili preko LAN-a za test na telefonu
npm run dev:lan
```

### 3.2 Build i lokalni preview
```bash
npm run build
npm run preview
```

### 3.3 Testovi
```bash
npm run test   # Vitest (unit)
npm run e2e    # Playwright (e2e, koristi mock checkout)
```

---

## 4) Repo housekeeping

### .env.local (ne u git)
```ini
VITE_PAYMENTS_PROVIDER=mock
# Stripe kasnije:
# VITE_PAYMENTS_PROVIDER=stripe
# VITE_STRIPE_PK=pk_test_...
# VITE_STRIPE_PRICE_MONTHLY=price_xxx
# VITE_STRIPE_PRICE_ANNUAL=price_yyy
```

### .gitignore (dopuna)
```
.env.local
test-results/
playwright-report/
blob-report/
coverage/
```

### (Opcionalno) .gitattributes za EOL
```
* text=auto
*.svelte text eol=lf
*.ts     text eol=lf
*.js     text eol=lf
*.css    text eol=lf
*.html   text eol=lf
*.json   text eol=lf
*.yml    text eol=lf
*.yaml   text eol=lf
```

---

## 5) A11y i UX (što je urađeno vs. TODO)
- ✅ Paywall: fokus trap u modalu; `Esc` zatvara (mock), vraća fokus.
- ⚠️ **TODO:** fokus/outline na danima u sedmici (keyboard nav, `aria-pressed` sync, vizuelni focus ring).
- ✅ Reminder editor: live validacije, poruke grešaka, logična tab-navigacija.
- ⚠️ **TODO:** PRO plan kartice – hover/active stanja, mali “PRO aktiviran” toast nakon checkouta.

---

## 6) Troubleshooting (poznate zamke)
- **“Zalijepljen scroll” nakon zatvaranja paywalla/editora** → provjeri da *samo modali* pozivaju `lockScroll/unlockScroll`; PaywallHost ne dira `overflow`.
- **Badge vodi na pogrešnu rutu** → koristi `<a href="#/pro">` i `e.stopPropagation()` u `ProBadge`.
- **Stripe u dev-u** → drži `VITE_PAYMENTS_PROVIDER=mock` dok ne dobiješ stvarne `pk` i `price_*` vrijednosti.

---

## 7) Preporučeni sljedeći koraci (pretvori u GitHub Issues)

1) **A11y: Fokus/outline na danima u sedmici**
   - *Acceptance:* kompletna keyboard navigacija (Lijevo/Desno/Space/Enter), `aria-pressed` i vizuelni focus ring u skladu s temom.
   - *Test:* Vitest za logiku; mini Playwright skripta za navigaciju tasterima.

2) **E2E: Scroll se otključava nakon checkouta i zatvaranja oba modala**
   - *Acceptance:* nakon `checkout:success` i zatvaranja paywalla **i** editor modala, `document.body.style.overflow` resetovan (scroll radi).

3) **UI polish: plan kartice i toast “PRO aktiviran”**
   - *Acceptance:* hover/active stanja, kratki toast nakon mock checkouta; zatim redirect na prethodni `feature` kontekst.

4) **README (kratak how-to + ENV)**
   - *Acceptance:* sažeti koraci za dev, build, test + `.env.local` primjer.

5) **(Kasnije) Stripe server-side webhook (stvarna aktivacija/sub verifikacija)**
   - *Acceptance:* nakon webhooks potvrde, `isPro` se postavlja iz backenda; implementiran “restore purchases” tok.

---

## 8) Mapiranje na KP-BLUEPRINT
- Navigacija/tab-bar, Home/Training/Edu/Progress skelet i generalni stil prate **KP-BLUEPRINT**.
- Free vs PRO granica: osnovni program u FREE; napredne funkcije i svi rangovi u PRO.
- Podsjetnici Android-first (u vNext: “in-app” servis, kasnije nativne notifikacije).

---

## 9) Dodatne napomene
- **Ne zaključavati body scroll iz više mjesta** — isključivo `lockScroll()/unlockScroll()` util.
- **Design tokens**: primarni CTA mint (#0be2a0) na tamnoj; akcenat/hint #FFA657.
- **i18n skeleton** spreman za BS/EN (postaviti kasnije kad krene Play Store priprema).

---

**Sve gore je usklađeno sa postojećim kodom i trenutnim ciljevima sprinta. Sretno dalje!**
