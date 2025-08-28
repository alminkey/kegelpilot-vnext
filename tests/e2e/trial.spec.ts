import { test, expect } from "@playwright/test";

/**
 * Pretpostavke:
 * - Dev server radi na baseURL iz playwright.config.ts (npr. http://localhost:5173)
 * - Aplikacija koristi hash-ruter i Home je default (/#/ ili /#/home)
 * - Home PRO kartica je <button class="card pro"> sa <span class="pro-cta">
 * - Trial store koristi localStorage ključ: "kp_trial_start_v1" (YYYY-MM-DD u lokalnoj TZ)
 * - User store koristi "kp_is_pro"
 */

const TRIAL_KEY = "kp_trial_start_v1";
const PRO_KEY = "kp_is_pro";

// Helper koji u browser kontekstu postavi localStorage trial start na N dana u prošlost
async function setTrialStartDaysAgo(page, daysAgo: number) {
  await page.evaluate(
    ([trialKey, days]) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
      localStorage.setItem(trialKey, key);
      // aplikacija sluša ove evente i računa stanje na lokalnu TZ
      document.dispatchEvent(new Event("day-rollover"));
    },
    [TRIAL_KEY, daysAgo]
  );
}

test.describe("7-dnevni PRO trial", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Očisti stanje prije svakog testa
    await page.goto(baseURL! + "/#/");

    await page.evaluate(
      ([trialKey, proKey]) => {
        localStorage.removeItem(trialKey);
        localStorage.removeItem(proKey);
      },
      [TRIAL_KEY, PRO_KEY]
    );

    // Reload da UI krene od čistog stanja
    await page.reload();
  });

  test("aktivacija, odbrojavanje i istek triala", async ({ page, baseURL }) => {
    await page.goto(baseURL! + "/#/");

    const proCard = page.locator("button.card.pro");
    const cta = proCard.locator(".pro-cta");

    // 1) Inicijalno: prikazuje "Probaj 7 dana"
    await expect(cta).toHaveText(/Probaj 7 dana/i);

    // 2) Klik na karticu -> startTrial(); očekujemo "7 dana preostalo"
    await proCard.click();

    await expect(cta).toContainText(/preostalo/i);
    // Daj malo vremena da trial store izračuna; očekujemo 7 dana
    await expect
      .poll(async () => (await cta.innerText()).trim())
      .toMatch(/7\s+dana\s+preostalo/i);

    // 3) "Pomjeri" vrijeme: postavi start na prije 6 dana -> treba ostati 1 dan preostalo
    await setTrialStartDaysAgo(page, 6);
    await expect
      .poll(async () => (await cta.innerText()).trim(), { timeout: 2000 })
      .toMatch(/1\s+dan\s+preostalo/i);

    // 4) Postavi start na prije 7 dana i okini "day-rollover" -> trial ističe, vraća se na FREE
    await setTrialStartDaysAgo(page, 7);

    // Po isteku očekujemo da CTA ponovo nudi trial
    await expect
      .poll(async () => (await cta.innerText()).trim(), { timeout: 3000 })
      .toMatch(/Probaj 7 dana/i);

    // (opciono) provjeri da je storage KEY očišćen
    const trialKeyExists = await page.evaluate(
      (trialKey) => !!localStorage.getItem(trialKey),
      TRIAL_KEY
    );
    expect(trialKeyExists).toBeFalsy();
  });
});
