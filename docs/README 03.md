
# KegelPilot vNext

Kegel vježbe – moderni Android‑first pristup (Svelte + Vite + TypeScript, Capacitor). Fokus: jasan trening, podsjetnici i jednostavan PRO model.

## Kako pokrenuti

```bash
npm install
npm run dev         # lokalni dev
npm run dev:lan     # test na telefonu (LAN)
npm run build       # produkcijski build
npm run preview     # lokalni preview
```

## Okruženje (.env.local)

```ini
VITE_PAYMENTS_PROVIDER=mock
# — Stripe kasnije —
# VITE_PAYMENTS_PROVIDER=stripe
# VITE_STRIPE_PK=pk_test_...
# VITE_STRIPE_PRICE_MONTHLY=price_xxx
# VITE_STRIPE_PRICE_ANNUAL=price_yyy
```

## Testovi

```bash
npm run test   # Vitest (unit)
npm run e2e    # Playwright (e2e, mock checkout)
```

## Struktura (ključni fajlovi)

- `src/store/user.ts` — PRO state + persist (localStorage).
- `src/store/reminders.ts` — podsjetnici + validacije + servis.
- `src/store/date.ts` — localDateKey, rollover/tz (poziv iz `App.svelte`).

- `src/lib/gate.ts` — dopuštenja + helperi + `openPaywall` event.
- `src/lib/scrollLock.ts` — jedini globalni scroll lock.

- `src/components/PaywallHost.svelte` — sluša `paywall:open`, zatvara na `checkout:success`.
- `src/components/PaywallModal.svelte` — UI + fokus trap + checkout success handler.
- `src/components/ProBadge.svelte` — `#/pro` link (bez bubblinga).

- `src/components/ReminderEditorModal.svelte` — editor podsjetnika (Pon–Ned, validacije).
- `src/features/pro/Pro.svelte` — planovi + “Vrati na FREE”.
- `src/lib/payments.ts` — mock/stripe/paddle adapteri.

## Paywall primjer

```ts
import { openPaywall } from "@/lib/gate";
openPaywall("reminders.multi", { source: "home_reminders" });
```

U `App.svelte` montirati `<PaywallHost />` jednom ispod layouta/outleta.
