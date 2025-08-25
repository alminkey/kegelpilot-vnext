
# GitHub Issues – predložak batcha

> Kopiraj pojedinačno kao nove issue‑e u repo. Dodaj labele prema predloženim.

---

## [A11y] Fokus/outline na danima u sedmici
**Opis:** Omogućiti punu tastaturu (Lijevo/Desno/Enter/Space) i vidljiv fokus ring. `aria-pressed` uvijek sinhronizovan sa stanjem.
**Acceptance:**
- Navigacija kroz dane bez miša.
- Fokus ring jasan na tamnoj temi.
- `aria-pressed` i `aria-label` ažurni.
**Testovi:** Vitest za state; Playwright putanja kroz sve dane.
**Label:** `a11y`, `frontend`

---

## [E2E] Scroll se otključava nakon checkouta i zatvaranja modala
**Opis:** Nakon mock checkouta (`checkout:success`) i zatvaranja *oba* modala, `overflow` je vraćen u prvobitno stanje.
**Acceptance:**
- Scroll radi na `body` nakon sekvence (open → pay → close).
- Ref‑count u `scrollLock` je 0.
**Testovi:** Playwright (provjera `document.body.style.overflow`).
**Label:** `e2e`, `qa`

---

## [UI] PRO plan kartice: hover/active + toast “PRO aktiviran”
**Opis:** Vizualni feedback na karticama + kratki toast nakon uspješne kupovine; redirect na prethodni feature kontekst.
**Acceptance:**
- Hover/active stanja na desktopu.
- Toast se pojavljuje nakon `checkout:success` i nestaje.
**Label:** `frontend`, `ux`

---

## [Docs] README – how to run + ENV primjer
**Opis:** Sažeti README sa koracima za dev/build/test i `.env.local` primjerom.
**Acceptance:**
- README sekcije: *Setup*, *Run*, *Build*, *Test*, *ENV*.
**Label:** `docs`

---

## [Backend] Stripe webhook (kasnije)
**Opis:** Server side potvrda kupovine i restore; `isPro` sinhronizovan iz backenda.
**Acceptance:**
- Webhook endpoint prima evente; verifikacija potpisom.
- App preuzima “entitlement” i postavlja `isPro`.
**Label:** `backend`, `payments`
