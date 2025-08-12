# KegelPilot vNext (Android‑first starter)

WIP: Tab bar skeleton (feat/tabbar)

Android‑first skeleton sa Svelte + Vite + TypeScript + Capacitor. Sadrži početne ekrane: Početna, Trening, Edu, Napredak, Profil, i minimalni `kpStore`.

## Zahtjevi

- Node 18+
- Android Studio (za build i pokretanje na telefonu)
- JDK 17 (preporučeno kroz Android Studio)

## Pokretanje (web dev)

```bash
npm install
npm run dev
# otvori http://localhost:5173
```

## Android (Capacitor)

```bash
# Build web dijela i sinhronizacija u android/ projekat
npm run build
npx cap sync
npx cap add android   # (prvi put)
npx cap open android  # otvori u Android Studio
```

U Android Studio:

- Poveži telefon (USB debugging) ili emuliraj Pixel/AVD.
- Run ▶

> Skripta `npm run cap:android` radi build + sync + open u jednom potezu.

## Struktura

```
src/
  app/        (layout, Header, Tabbar, App.svelte)
  features/   (home, training, edu, progress, profile)
  store/      (kpStore.ts, router.ts)
  core/       (rezervisano za engine, plan, statistike)
  services/   (adapteri: Billing, Notifications, Storage)
  adapters/   (web/android implementacije - TODO)
```

## Šta dalje

- Dodati `services/NotificationsService` i adapter za Android (Capacitor Local Notifications).
- Dodati Play Billing adapter (stub → prava integracija).
- Implementirati dnevnu logiku (00–04 bonus), streak, i rangove u `core/` + `kpStore`.
- Prebaciti Home kartice na realne podatke iz store-a čim logika bude spremna.

Blueprint i Roadmap su u `docs/` (dodaj u repo).
