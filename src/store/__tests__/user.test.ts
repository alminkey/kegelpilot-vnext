import { describe, it, expect, beforeEach } from "vitest";
import { isPro, upgradeToPro, downgradeToFree } from "@/store/user";

beforeEach(() => {
  localStorage.clear();
  isPro.set(false);
});

describe("user isPro persistence", () => {
  it("upgradeToPro postavlja store i localStorage", () => {
    upgradeToPro();
    let v = false;
    const unsub = isPro.subscribe((x) => (v = x));
    unsub();
    expect(v).toBe(true);
    expect(localStorage.getItem("kp_is_pro")).toBe("1");
  });

  it("downgradeToFree resetuje store i localStorage", () => {
    upgradeToPro();
    downgradeToFree();
    let v = true;
    const unsub = isPro.subscribe((x) => (v = x));
    unsub();
    expect(v).toBe(false);
    expect(localStorage.getItem("kp_is_pro")).toBeNull();
  });
});
