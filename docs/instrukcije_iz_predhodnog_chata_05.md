Sprint sažetak / handoff za sljedeći chat

Ovo je “snapshot” stanja nakon završetka sprinta, da možemo bezbolno nastaviti.

Cilj sprinta (iz blueprint/roadmap konteksta)

Dovršiti integraciju kpStore/kp sa Home/Progress (dnevni cilj, sažetak, kalendar).

Popraviti paywall rutu i UX sitnice.

Uvesti sigurni reset napretka (sa potvrdom).

Stabilizovati E2E (paywall test).

Grane i repo

Glavna: main

Radna: feat/m1-kpstore (rebaseovan na remote; konflikt u App.svelte riješen; push završen nakon --force-with-lease).

Commit (ključni):
feat(kp): vNext stabilizacija – Home: zadržan originalni UI; PRO dugme → #/pro; Progress: confirm modal; A11y fix; e2e strict mode fix

Arhitektura podataka (kratko objašnjenje)
src/store/kp.ts (vNext – IndexedDB via localforage)

Persist: kp_v1 (IndexedDB), polja:

daily_progress: Record<string, number> – broj sesija po lokalnom danu YYYY-MM-DD

plan: { rank, rankStartDateKey, goalDays, targetPerDay }

sessions: {id, at, durationSec?}[]

Derivati (Svelte stores):

today: { dateKey, done, target }

goal: { rank, day, length, percent, completedDays, rankStartDateKey, targetPerDay }

homeSummary, stats { totalSessions, bestStreak }

Event bus: on('progress-updated' | 'session-complete' | 'day-rollover', …)

Ključne funkcije:

init(), recordSession() / completeSession()

setDailyTarget(n), resetDailyIfRollover()

hardReset(), getDailyProgressMap(), getSnapshot()

Dodatno: “bonus window” 00–03:59 → sesija se može pripisati jučerašnjem danu ako jučerašnji cilj nije ispunjen.

src/store/kpStore.ts (legacy – localStorage)

Ostaje kompatibilan: today, goal, completeSession(), resetAll(), feedback per-rank, čuvar ponoći i progress-updated DOM event.

Koristi se još na Home/Training (vidi ispod). Postepeno ćemo ga zamijeniti vNext store-om.

Integracije po ekranima
Home.svelte

UI vraćen na original (tvoj dizajn: hero, “Trening za danas”, “Savjet dana”, quick akicije, edu lane, streak, podsjetnici, PRO kartica).

PRO dugme “Probaj 7 dana” sada otvara #/pro (isti paywall host kao badge u headeru).

Podsjetnik header više nije lažni <div role="button"> (osvjetljavalo E2E i A11y); aktivan je samo “Dodaj još” sa data-testid="btn-rem-add".

Podsjetnici: addValidated() i FREE limit ostao; modal radi; switch ima role="switch" i aria-checked.

Streak (weekly) ostaje lokalni vizuelni istorijat (LS kp_history_v1) zasnovan na današnjem statusu (done/target), kao i ranije.

Napomena: Home trenutno čita legacy kpStore.today/goal – svjesno, da zadržimo izgled/ponašanje 1:1. U sljedećem sprintu planiramo prebaciti na kp.ts (vidi “Šta slijedi”).

Progress.svelte

Prebačen na vNext kp.ts: koristi getDailyProgressMap() i goal.targetPerDay.

Kalendar (mjesec):

status tačke: 0 (nema), 1 (djelimično), 2 (ispunjen cilj).

generiše grid 6×7 sa leading/padding ćelijama.

KPI “pills”: Dan ranga, Današnje sesije, Ukupno.

Reset: dodan modal potvrde (“Jeste li sigurni…”) → potvrdom zove:

kp.hardReset() (IndexedDB)

kpStore.resetAll() (legacy)

potom rebuild grida; osluškuje progress-updated i day-rollover.

A11y: modal role="dialog" aria-modal="true", Esc zatvara.

Training.svelte

Ostao engine + vizualni ring; onDone → completeSession() (legacy/kpStore).

Popravljeni proračuni da “Danas” u kratkoj statistici raste za +1 po sesiji (nestao +3 bug).

Feedback modal (teškoća) ostaje; state sync OK.

App.svelte

Hash-router i rute: home | training | progress | profile | edu | pro

PaywallHost montiran jednom (globalno).

Konflikt sa remote riješen tako da sve gore radi (posebno #/pro).

Paywall / PRO gating

Home PRO kartica vodi na #/pro (isti kao badge u headeru).

Edu PRO lekcije zovu openPaywall("edu.advanced", …); FREE lekcije direktno otvaraju #/edu.

Mock checkout i persist PRO status rade kao i prije (E2E pokriven testom).

Testiranje
E2E (npm run e2e)

Popravljen strict mode u paywall.spec.ts:

Problem: getByRole('button', { name: 'Dodaj još' }) nalazio 2 elementa (row-top + dugme).

Rješenje: row-top više nije button; ostalo je samo pravo dugme sa data-testid="btn-rem-add".

Trenutno: 2 testa / oba prolaze lokalno.

Ručni sanity

1–2 trening sesije → Home “Danas” +1 po sesiji; Progress dot → half/full prema targetu.

“Resetuj sve” → modal → potvrdi → sve se čisti i grid se update-a.

Android / Capacitor

Konfiguracija ostaje valjana: Java 17, SDK 33, build-tools 30.0.3.

Android build i dalje prolazi (nijesmo dirali mobilne konfiguracije).

Git operacije (šta je urađeno)

git add -A → commit (poruka iznad).

git fetch → git pull --rebase origin feat/m1-kpstore → riješen konflikt u App.svelte.

Spremanje poruke u editoru (:wq u vim).

git push --force-with-lease origin feat/m1-kpstore.

PR: preporuka da otvoriš feat/m1-kpstore → main sa opisom (predložak isporučen ranije).

Poznati problemi / odluke

Dvostruki store (privremeno):

Home/Training koriste legacy kpStore.ts; Progress koristi vNext kp.ts.

Ovo je namjerno da očuvamo UI i ponašanje dok migraciju radimo korak po korak.

Weekly streak (Home) vs store mape (Progress):

Home koristi lokalni LS (kp_history_v1) za 7 dana samo za vizuelni “dot” (brz prikaz).

Dugoročno ćemo unified streak računati iz kp.ts.daily_progress.

Rollover i TZ promjene:

kp.ts računa dnevne ključeve lokalno; postoji i tz watcher u date.ts.

Dnevni reset radi; bonus window 00–03:59 dodjeljuje sesiju jučerašnjem danu ako cilj nije bio ispunjen.

Šta slijedi (prioriteti za sljedeći sprint)

UI polish

Hover/active na planovima (PRO sekcija): blagi scale, jači border.

Mali toast “PRO aktiviran” kad isPro pređe false → true (auto-hide ~2.5s).

A11y dodatno

Focus ring na danima u Reminder editoru (:focus-visible, aria-pressed za odabrane).

Esc u Reminder modalu (trenutno X i “Zatvori” rade).

Play Store/Billing skeleton (Issue M8)

billing/GooglePlay.ts: initBilling(), startPurchaseMock(), restorePurchasesMock().

Integracija kroz PaywallHost → set isPro.

README + how to run

README.md: instalacija, skripte (dev, build, e2e), Android build, poznate napomene.

Dodati .gitattributes (LF na web fajlove) radi stabilnih diffova.

Migracija Home/Training → vNext kp.ts

Zamijeniti kpStore referense: today, goal, completeSession().

Uskladiti weekly streak da crpi iz getDailyProgressMap().

Dodatni E2E

Test za reset modal (da postoji potvrda i da resetuje oba store-a).

Test za toast PRO aktiviran.

Test za focus ring u Reminder editoru (keyboard navigacija).

Kako pokrenuti / provjeriti (kratko)
npm i
npm run dev # http://localhost:5173
npm run e2e # Playwright testovi

Reset podataka (ručno):

U aplikaciji: Progress → “Resetuj sve” → potvrdi, ili

Programski: kp.hardReset() i kpStore.resetAll(), ili

DevTools Application/Storage: obriši IndexedDB entry kegelpilot/kp*store i LocalStorage ključeve (kp*\*).

Checklista za početak sljedećeg chata

Potvrdi PR i merge u main (ako već nije).

Krenuti od tačke UI polish + A11y (mogu isporučiti gotove patcheve).

Napraviti skeleton za Play Billing (mock), spojiti u PaywallHost.

Dodati README i .gitattributes.

Plan migracije Home/Training na kp.ts (uz sačuvani look&feel).

Ako želiš, u sljedećem chatu mogu odmah isporučiti:

minimalni toast komponent + trigger na isPro promjenu,

CSS hover/active na PRO planove,

a11y fokus ring za Reminder editor.
