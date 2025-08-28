// src/lib/payments.ts
export type Plan = "monthly" | "annual";
export type StartCheckoutOptions = {
  plan: Plan;
  email?: string;
  coupon?: string; // (opcionalno, ignorisano u stripe client-only)
  returnUrl?: string; // ako želiš custom success/cancel
  trial?: boolean; // ⬅ NOVO: trial flow (Home CTA, "7 dana besplatno")
};

// Provider iz .env (VITE_PAYMENTS_PROVIDER=mock|stripe|paddle)
const RAW_PROVIDER = (import.meta.env.VITE_PAYMENTS_PROVIDER ?? "mock") + "";
export const PROVIDER = RAW_PROVIDER.toLowerCase() as
  | "mock"
  | "stripe"
  | "paddle";

declare global {
  interface Window {
    Paddle?: any;
    __PAY_DEBUG_BOUND?: boolean; // dev flag da ne dupliramo listener
  }
}

if (import.meta.env.DEV) console.debug("[payments] provider =", PROVIDER);

import { startTrial } from "@/store/trial";
import { showToast } from "@/store/toast";

export async function startCheckout(opts: StartCheckoutOptions): Promise<void> {
  try {
    if (PROVIDER === "stripe") return await stripeCheckout(opts);
    if (PROVIDER === "paddle") return await paddleCheckout(opts);
    return await mockCheckout(opts);
  } catch (err) {
    console.error("[payments] startCheckout error → fallback to mock", err);
    return await mockCheckout(opts);
  }
}

/* -------------------------- DEV DEBUG -------------------------- */
if (import.meta.env.DEV && !window.__PAY_DEBUG_BOUND) {
  window.addEventListener("checkout:success", (e: any) => {
    console.debug("[payments] success event", e?.detail);
  });
  window.__PAY_DEBUG_BOUND = true;
}

/* ------------------------- MOCK (dev) ------------------------- */
async function mockCheckout(opts: StartCheckoutOptions) {
  console.debug("[payments] mock startCheckout", opts);

  // Trial bez kartice u MOCK modu: samo lokalno aktiviraj trial i gotovo
  if (opts.trial) {
    startTrial();
    try {
      showToast("Trial aktiviran (MOCK) 🎉");
    } catch {}
    return;
  }

  await new Promise((r) => setTimeout(r, 450));
  window.dispatchEvent(
    new CustomEvent("checkout:success", { detail: { plan: opts.plan } })
  );
}

/* ------------------------- STRIPE ----------------------------- */
/**
 * Client-only redirectToCheckout: jednostavno, bez servera.
 * Trial:
 *  - Najlakše je da Stripe Price (npr. MONTHLY) već ima podešen trial_period_days=7.
 *  - Alternativa (dinamički trial) zahtijeva backend (Create Checkout Session sa subscription_data.trial_period_days).
 *  - Ovdje podržavamo i varijantu sa odvojenim PRICE za trial:
 *      VITE_STRIPE_PRICE_TRIAL_MONTHLY (opcionalno)
 */
async function stripeCheckout(opts: StartCheckoutOptions) {
  const pk = import.meta.env.VITE_STRIPE_PK;
  const priceMonthly = import.meta.env.VITE_STRIPE_PRICE_MONTHLY;
  const priceAnnual = import.meta.env.VITE_STRIPE_PRICE_ANNUAL;
  const priceTrialMonthly = import.meta.env.VITE_STRIPE_PRICE_TRIAL_MONTHLY; // ⬅ opcionalno: price koji ima ugrađen trial

  if (!pk || !priceMonthly || !priceAnnual) {
    console.warn("[payments] stripe env vars missing → mock");
    return mockCheckout(opts);
  }

  const { loadStripe } = await import("@stripe/stripe-js");
  const stripe = await loadStripe(pk);

  if (!stripe || typeof (stripe as any).redirectToCheckout !== "function") {
    console.warn("[payments] stripe not ready → mock");
    return mockCheckout(opts);
  }

  // Ako tražimo trial i postoji posebna cijena za trial, koristi je.
  // Inače koristi standardnu cijenu (koja može imati trial_period_days u Stripe konzoli).
  const priceId =
    opts.plan === "monthly"
      ? opts.trial && priceTrialMonthly
        ? priceTrialMonthly
        : priceMonthly
      : priceAnnual;

  const base = opts.returnUrl ?? window.location.origin;
  const successUrl = `${base}/#/pro?success=1`;
  const cancelUrl = `${base}/#/pro?canceled=1`;

  const res: any = await (stripe as any).redirectToCheckout({
    mode: "subscription",
    lineItems: [{ price: priceId, quantity: 1 }],
    successUrl,
    cancelUrl,
    customerEmail: opts.email,
    // Napomena: coupon/discount nije podržan client-only putem ovog polja; treba backend.
  });

  if (res?.error) {
    console.error("[payments] stripe redirect error → mock", res.error);
    return mockCheckout(opts);
  }
}

/* ------------------------- PADDLE (Classic v3) ---------------- */
/**
 * Trial:
 *  - U Paddle Classic v3 se trial tipično podešava na nivou proizvoda (u dashboardu).
 *  - Ako imaš poseban proizvod sa trialom za mjesečni plan, koristi env var:
 *      VITE_PADDLE_PRODUCT_TRIAL_MONTHLY (opcionalno)
 */
async function paddleCheckout(opts: StartCheckoutOptions) {
  const vendorId = import.meta.env.VITE_PADDLE_VENDOR_ID;
  const prodMonthly = import.meta.env.VITE_PADDLE_PRODUCT_MONTHLY;
  const prodAnnual = import.meta.env.VITE_PADDLE_PRODUCT_ANNUAL;
  const prodTrialMonthly = import.meta.env.VITE_PADDLE_PRODUCT_TRIAL_MONTHLY; // ⬅ opcionalno

  if (!vendorId || !prodMonthly || !prodAnnual) {
    console.warn("[payments] paddle env vars missing → mock");
    return mockCheckout(opts);
  }

  await loadPaddle();
  if (!window.Paddle) {
    console.warn("[payments] paddle not loaded → mock");
    return mockCheckout(opts);
  }

  window.Paddle.Setup({ vendor: Number(vendorId) });

  // Ako je trial i ima poseban proizvod za trial → koristi njega.
  const product =
    opts.plan === "monthly"
      ? opts.trial && prodTrialMonthly
        ? prodTrialMonthly
        : prodMonthly
      : prodAnnual;

  window.Paddle.Checkout.open({
    product,
    email: opts.email,
    successCallback: () =>
      window.dispatchEvent(
        new CustomEvent("checkout:success", { detail: { plan: opts.plan } })
      ),
    closeCallback: () => {
      // optional: cancel
    },
  });
}

function loadPaddle(): Promise<void> {
  if (window.Paddle) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/paddle.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
