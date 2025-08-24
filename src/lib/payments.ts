// src/lib/payments.ts
export type Plan = "monthly" | "annual";
export type StartCheckoutOptions = {
  plan: Plan;
  email?: string;
  coupon?: string; // (opcionalno, ignorisano u stripe client-only)
  returnUrl?: string; // ako želiš custom success/cancel
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
// U dev modu loguj uspjeh da je lako vidjeti flow u konzoli.
if (import.meta.env.DEV && !window.__PAY_DEBUG_BOUND) {
  window.addEventListener("checkout:success", (e: any) => {
    console.debug("[payments] success event", e?.detail);
  });
  window.__PAY_DEBUG_BOUND = true;
}

/* ------------------------- MOCK (dev) ------------------------- */
async function mockCheckout(opts: StartCheckoutOptions) {
  console.debug("[payments] mock startCheckout", opts);
  await new Promise((r) => setTimeout(r, 450));
  window.dispatchEvent(
    new CustomEvent("checkout:success", { detail: { plan: opts.plan } })
  );
}

/* ------------------------- STRIPE ----------------------------- */
// Client-only redirectToCheckout: jednostavno, bez servera.
// Napomena: kuponi/discounts nisu podržani u ovom klijentskom modu.
async function stripeCheckout(opts: StartCheckoutOptions) {
  const pk = import.meta.env.VITE_STRIPE_PK;
  const priceMonthly = import.meta.env.VITE_STRIPE_PRICE_MONTHLY;
  const priceAnnual = import.meta.env.VITE_STRIPE_PRICE_ANNUAL;

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

  const priceId = opts.plan === "monthly" ? priceMonthly : priceAnnual;
  const base = opts.returnUrl ?? window.location.origin;
  const successUrl = `${base}/#/pro?success=1`;
  const cancelUrl = `${base}/#/pro?canceled=1`;

  const res: any = await (stripe as any).redirectToCheckout({
    mode: "subscription",
    lineItems: [{ price: priceId, quantity: 1 }],
    successUrl,
    cancelUrl,
    customerEmail: opts.email,
  });

  if (res?.error) {
    console.error("[payments] stripe redirect error → mock", res.error);
    return mockCheckout(opts);
  }
}

/* ------------------------- PADDLE (Classic v3) ---------------- */
// Ako koristiš Paddle v4, javi pa prilagodim.
async function paddleCheckout(opts: StartCheckoutOptions) {
  const vendorId = import.meta.env.VITE_PADDLE_VENDOR_ID;
  const prodMonthly = import.meta.env.VITE_PADDLE_PRODUCT_MONTHLY;
  const prodAnnual = import.meta.env.VITE_PADDLE_PRODUCT_ANNUAL;

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

  const product = opts.plan === "monthly" ? prodMonthly : prodAnnual;
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
