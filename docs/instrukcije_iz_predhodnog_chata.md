KegelPilot vNext — Instrukcije iz prethodnog chata

Sažetak organizacije GitHub projekata, milestone-a, labela, razvojnih skripti, CI/e2e testova i Android build koraka. Dokument služi kao vodič za nove chat sesije i kao interni README za projekat.

1. Pregled repozitorija

Frontend: Svelte 4 + Vite 5

Mobilni build: Capacitor 5 (Android)

Testovi: Vitest (unit), Playwright (e2e)

Plaćanja: mock sa Stripe/Paddle scaffoldom (kasnije Play Billing)

PRO status: localStorage (store isPro)

Glavne staze/fajlovi:

src/app/App.svelte — root, hash-router (home / edu / pro), mount PaywallHost

src/app/Header.svelte — logo “KegelPilot” (mint), FREE/PRO badge (klik #/pro)

src/components/PaywallHost.svelte — sluša globalni event paywall:open i prikazuje PaywallModal

src/components/PaywallModal.svelte — paywall UI, fokus trap, mock checkout, scroll-lock

src/components/ReminderEditorModal.svelte — editor podsjetnika (a11y + skraćena visina, CTA iznad tabbara)

src/components/ReminderCard.svelte — lista, CRUD i paywall dugme kada je prekoračen FREE limit

src/features/edu/Edu.svelte — lista lekcija (vertikalno), PRO kartice otvaraju paywall ako korisnik nije PRO

src/features/edu/EduDetailModal.svelte — modal sa opisom lekcija; X i “Zatvori” rade; a11y riješen

src/features/home/Home.svelte — kartice: napredak dana, brzi start, edukacija i podsjetnici (sa e2e hookom)

src/store/user.ts — isPro store + persist kp_is_pro

src/store/reminders.ts — podsjetnici: tipovi, validacije, servis, FREE=1 / PRO=10

src/lib/gate.ts — PRO_ONLY_KEYS, isAllowed/ensureAllowed/openPaywall

src/lib/scrollLock.ts — globalni ref-count scroll lock

src/lib/payments.ts — mock / stripe / paddle scaffold

src/store/kp.ts — IndexedDB (localforage) skeleton, event bus, day-rollover

2. Labeli
   Label Opis
   type:feature Nova funkcionalnost
   type:bug Greška/defekt
   a11y Pristupačnost i fokus ringovi
   area:core Arhitektura: store, gate, scrollLock, App/Router
   area:home Home ekran i kartice
   area:reminders Podsjetnici i editor
   area:edu Edu ekrani, modal i data
   area:android Capacitor, build, SDK/Gradle, notifikacije, deep-link
   area:billing Plaćanja (Stripe/Paddle mock), Play Billing (kasnije)
   good-first-issue Početnički zadaci / manji fix-evi
3. Milestone-i (Sprint A–D)

Sprint A — Core & Trening (M1 + M2): kpStore (IndexedDB), osnovni trening engine + ring UI

Sprint B — Home & Progress (M3 + M5): Home kartice “Trenutni cilj” & “Trening za danas”, sažetak napretka (v1 bez grafa)

Sprint C — Podsjetnici & Billing (M6 + M8): Lokalne notifikacije (Android), kanali, retries; Play Billing skeleton

Sprint D — Polish & QA (M7 + M9): a11y fokus ringovi, toast “PRO aktiviran”, i18n skeleton, crash reporting

Primjeri tipičnih issue-a:

M1/Core — kpStore + IndexedDB migracija (area:core, type:feature)

M2/Training — engine + ring UI (v1) (area:training, area:android)

M3/Home — kartice “Trenutni cilj” i “Trening za danas” (area:home)

M5/Progress — sažetak napretka + cilj dana (v1 bez grafa) (area:progress)

M6/Podsjetnici (Android) — lokalne notifikacije + kanali + deep-link (area:android, area:reminders)

M8/Billing — Google Play Billing, entitlement cache (7d) + restore (area:billing, area:android)

M9/Polish & QA — a11y fokus ring, toast “PRO aktiviran”, i18n skeleton, crash reporting

4. Workflow (grananje, commit, PR)

Grane: main (stabilna), feature grane po šemi feat/<milestone>-<kratko-ime> npr. feat/m1-kpstore

Commit: konvencija type(scope): opis npr. feat(core): kpStore skeleton ili fix(reminder): vrati .title

PR naslov: [M#] Kratak opis npr. [M1] Core — kpStore skeleton

CI: svaki PR prolazi unit + e2e; Squash & merge preporučen

Korisne git komande:

git checkout -b feat/m1-kpstore
git add <fajlovi> && git commit -m "feat(core): kpStore skeleton"
git push -u origin feat/m1-kpstore

# ako push odbije:

git pull --rebase origin feat/m1-kpstore && git push

# stash prije rebase-a:

git stash push -u -m "wip" ; git pull --rebase ... ; git stash pop

5. NPM skripte
   Skripta Komanda / Svrha
   dev vite — lokalni razvoj
   dev:lan vite --host 0.0.0.0 — test na telefonu
   build vite build — produkcijski bundle
   preview vite preview — lokalni preview builda
   test vitest — unit testovi
   e2e playwright test — e2e testovi
   cap:sync vite build && npx cap sync
   cap:open:android vite build && npx cap sync android && npx cap open android

E2E hookovi

Home.svelte: dugme “Dodaj još” ima data-testid="btn-rem-add"

Modali koriste globalni scroll-lock (ref-count); test provjerava da se body.style.overflow vrati na ""

6. Android build (Capacitor)

Preduvjeti: Node 18+, JDK 17, Android Studio (SDK Platform 33 + Build-Tools 30.0.3).
Tok:

npm run build
npx cap copy
npx cap open android # Build > Build Bundle(s)/APK(s) > Build APK(s)

# Debug APK izlaz:

android/app/build/outputs/apk/debug/app-debug.apk

# ADB instalacija (USB, Developer mode):

adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

Problemi i rješenja

JAVA_HOME nije postavljen → postavi na JDK 17 (npr. C:\\Program Files\\Java\\jdk-17)

Gradle/JVM nekompatibilnost → Gradle 8.5+ i JDK 17 (max kompatibilni JVM=19)

Nedostaje SDK/Build-Tools → u SDK Manager instaliraj “Android 13 (API 33)” i “Build-Tools 30.0.3”

Trenutno u APK-u

Paywall/gate (mock), PRO badge i ruta #/pro

Home, Edu, Podsjetnici – funkcionalni i prilagođeni za mobilni prikaz

Edu: PRO kartice otvaraju paywall kada korisnik nije PRO; FREE kartice se otvaraju u modal

7. Roadmap vs. trenutno stanje (update)

Završeno / stabilno

PRO simulacija i persistencija (localStorage, user store)

Podsjetnici: CRUD, validacije, FREE=1 / PRO=10, editor modal (a11y + skraćen CTA)

Paywall: host + modal (fokus trap), mock plaćanje, ProBadge u headeru

Edu: vertikalne kartice, detaljni modal, paywall za PRO iteme kad je korisnik FREE

Tabbar fiksno dno; modali iznad tabbara

Globalni scroll-lock (ref-count) — riješen “zalijepljen scroll” bug

E2E testovi: paywall flow i scroll unlock prolaze

U toku / djelimično

kpStore (IndexedDB + event bus) — skeleton dodat (M1), integracija s Home/Progress ostaje

Android build pipeline — ručni APK build radi; notifikacije i billing ostaju

Sljedeće (prema milestone-ima)

M1/M2: Integrisati kpStore sa Home karticama (trenutni cilj, “Trening za danas”), trening engine + ring (v1)

M5: Sažetak napretka + cilj dana (v1 bez grafa)

M6: Android lokalne notifikacije (kanali, retries) + deep-link na editor

M8: Play Billing skeleton (entitlement cache + restore)

M9: Polish & QA (a11y fokus ring, toast “PRO aktiviran”, i18n skeleton, crash reporting)

8. UX/UI dogovori (podsjetnik)

Primarni CTA: #0be2a0 (na tamnoj pozadini)

Akcent/Hint: #FFA657 (savjet dana, time chip)

PRO/FREE badge uz logo u headeru; FREE crven, PRO mint; badge je klikabilan

Modali jedini smiju dirati scroll-lock — koristimo globalni util

Edu kartice stoje jedna ispod druge na mobitelu

9. CI/E2E problemi i rješenja

Dialog detektovan 2x (strict mode) → PaywallHost mountati jednom; modal zatvarati ispravno

Playwright nije nalazio dugme “Dodaj još” → dodan data-testid="btn-rem-add"

Scroll-lock nije popuštao nakon checkout-a → centralizovan lock u utilu; pozivi samo iz modala
