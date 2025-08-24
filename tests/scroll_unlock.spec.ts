import { test, expect } from "@playwright/test";

test("scroll unlocks after checkout success and closing modal(s)", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // 1) Otvori paywall programatski (bez klikanja kroz UI)
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("paywall:open", {
        detail: { feature: "reminders.multi" },
      })
    );
  });

  // 2) Čekaj dok modal zaključa scroll
  await page.waitForTimeout(150); // kratka pauza zbog lock-a
  const overflowLocked = await page.evaluate(
    () => document.body.style.overflow
  );
  expect(overflowLocked).toBe("hidden");

  // 3) Simuliraj checkout success (mock provider)
  await page.evaluate(() => {
    window.dispatchEvent(new Event("checkout:success"));
  });

  // 4) Zatvori modal (ESC) – za slučaj da PaywallModal traži eksplicitno zatvaranje
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);

  // 5) Scroll treba biti otključan
  const overflowFinal = await page.evaluate(
    () => document.body.style.overflow || ""
  );
  expect(overflowFinal).toBe("");
});
