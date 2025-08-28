Stripe – kako najbrže podesiti trial 7 dana (bez backenda)

Varijanta A (jednostavnije):

U Stripe Dashboardu napravi Product: KegelPilot PRO.

Dodaj Price (monthly) – Recurring monthly.
U polju Trial period upiši 7 dana (Stripe će tražiti karticu i početi naplatu nakon 7 dana).

Dodaj Price (annual).

Popuni .env:

VITE*STRIPE_PK=pk_test*...

VITE*STRIPE_PRICE_MONTHLY=price*... (ovaj koji ima trial 7d)

VITE*STRIPE_PRICE_ANNUAL=price*...

VITE_STRIPE_PRICE_TRIAL_MONTHLY ostavi prazno

Postavi VITE_PAYMENTS_PROVIDER=stripe.

Varijanta B (odvojen trial price):

Kreiraj dva monthly Price-a: jedan običan, drugi s trial 7d.

Popuni .env:

VITE_STRIPE_PRICE_MONTHLY=price_mjesečni_bez_trial

VITE_STRIPE_PRICE_TRIAL_MONTHLY=price_mjesečni_sa_trial_7d

Home/PRO “Probaj 7 dana” će koristiti trial price, dok “Kupi mjesečni” koristi obični price.

Naš startCheckout({ plan:"monthly", trial:true }) već radi s oba scenarija.
Success/Cancel URL-ovi su ti već riješeni u kodu: /#/pro?success=1 i /#/pro?canceled=1.

Napomena: kuponi/dinamički trial preko čistog client-only Stripe-a nisu podržani → za to kasnije dodamo mali backend (ostavljeno za buduće).

Paddle Classic v3 – trial

U Paddle konzoli napravi Product (monthly) i Product (annual).

Ako želiš trial 7d, ili:

uključi trial na istom monthly proizvodu, ili

napravi poseban monthly proizvod s trial-om.

Popuni .env:

VITE_PADDLE_VENDOR_ID, VITE_PADDLE_PRODUCT_MONTHLY, VITE_PADDLE_PRODUCT_ANNUAL

(opcionalno) VITE_PADDLE_PRODUCT_TRIAL_MONTHLY – ako koristiš poseban trial proizvod.

Postavi VITE_PAYMENTS_PROVIDER=paddle.

Naš payments.ts koristi Paddle.Checkout.open(...) – ako je postavljen VITE_PADDLE_PRODUCT_TRIAL_MONTHLY i pozoveš startCheckout({ trial:true }), koristi trial proizvod; inače koristi standardni monthly product (koji možda već ima trial u Paddle dashboardu).

Kako se uklapa s trenutnim UX-om

Home “Probaj 7 dana” i PRO “Probaj 7 dana” → startCheckout({ plan:"monthly", trial:true })

mock: lokalno aktivira trial, bez kartice (brzo testiranje).

stripe/paddle: vodi u checkout sa karticom i auto-naplatom nakon 7 dana (prema konfiguraciji price/proizvoda).

“Kupi mjesečni/godišnji plan” → startCheckout({ plan: "monthly" | "annual" }) (bez triala).

Nakon uspjeha: app već hvata #/pro?success=1 ili checkout:success event, poziva markProPaid() + upgradeToPro() i briše trial → Home prikazuje “PRO aktivan”.

Kratki QA checklist

Dev (mock):

Home → “Probaj 7 dana” aktivira trial bez kartice, CTA mijenja labelu na “X dana preostalo”.

PRO strana prikazuje planove i tokom triala, kupovina trigeruje checkout:success, Home prelazi na “PRO aktivan”.

Stripe/Paddle (test):

Home/PRO “Probaj 7 dana” otvara checkout, traži karticu, kreira subskripciju s trialom.

Nakon redirecta na /#/pro?success=1 → PRO aktivan, trial obrisan.

Ako želiš, pripremim ti i README-payments.md ili .env.example razdvojim na /.env.dev, /.env.stage, /.env.prod sa tipičnim vrijednostima i dodatno dodam mali backend kostur za Stripe (Express/Netlify/CF Workers) za kupon/dinamički trial.
