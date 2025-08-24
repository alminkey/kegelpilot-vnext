import { test, expect } from "@playwright/test";

test("FREE → paywall → mock checkout → PRO persist", async ({ page }) => {
  // Čist start
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // 1) Dodaj prvi podsjetnik (FREE dozvoljava 1)
  await page.getByRole("button", { name: "Dodaj još" }).click();
  await page.getByRole("button", { name: /Spremi|Sačuvaj/ }).click();

  // 2) Pokušaj dodati drugi → limit poruka sa "Postani PRO"
  await page.getByRole("button", { name: "Dodaj još" }).click();
  await page.getByRole("button", { name: /Spremi|Sačuvaj/ }).click();
  const proCta = page.getByRole("button", { name: "Postani PRO" });
  await expect(proCta).toBeVisible();
  await proCta.click();

  // 3) Paywall modal je VIDLJIV → klikni dugme UNUTAR modala
  const modal = page.getByRole("dialog", { name: /KegelPilot PRO/i });
  await expect(modal).toBeVisible();

  // Dugmad imaju aria-label "Kupi mjesečni plan" / "Kupi godišnji plan"
  // Klikni jedno od njih dok je modal vidljiv:
  await modal.getByRole("button", { name: /Kupi godišnji plan/i }).click();
  // (ili mjesečni)
  // await modal.getByRole("button", { name: /Kupi mjesečni plan/i }).click();

  // 4) Nakon mock checkout-a modal nestaje i PRO se aktivira
  await expect(modal).toBeHidden();

  // 5) Persist provjera (localStorage + reload)
  const lsVal = await page.evaluate(() => localStorage.getItem("kp_is_pro"));
  expect(lsVal).toBe("1");

  await page.reload();
  const lsVal2 = await page.evaluate(() => localStorage.getItem("kp_is_pro"));
  expect(lsVal2).toBe("1");
});
