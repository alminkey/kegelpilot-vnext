import { describe, it, expect, beforeEach } from "vitest";
import { reminders, addValidated, validateReminder } from "@/store/reminders";
import type { Reminder } from "@/store/reminders";
import { isPro } from "@/store/user";

function getAll(): Reminder[] {
  let v: Reminder[] = [];
  const unsub = reminders.subscribe((x) => (v = x));
  unsub();
  return v;
}

beforeEach(() => {
  localStorage.clear();
  reminders.setAll([]);
  isPro.set(false); // FREE by default
});

describe("reminders store", () => {
  it("FREE limit: validateReminder vraća limit grešku kad je već 1 podsjetnik", () => {
    const r1 = addValidated({
      label: "A",
      hour: 9,
      minute: 0,
      daysOfWeek: [1],
      enabled: true,
    });
    expect(r1.ok).toBe(true);

    const errs = validateReminder({
      label: "B",
      hour: 10,
      minute: 0,
      daysOfWeek: [2],
    });
    expect(errs.some((e) => e.kind === "limit")).toBe(true);
  });

  it("downgrade na FREE onemogućava sve osim jednog aktivnog", () => {
    isPro.set(true);
    reminders.setAll([
      { id: "a", label: "A", hour: 9, minute: 0, enabled: true },
      { id: "b", label: "B", hour: 8, minute: 0, enabled: true },
      { id: "c", label: "C", hour: 7, minute: 0, enabled: true },
    ]);
    // Sada user postaje FREE
    isPro.set(false);

    const list = getAll();
    const active = list.filter((r) => r.enabled);
    expect(active.length).toBe(1);
    // Najraniji (07:00) ostaje aktivan
    expect(active[0].hour).toBe(7);
    expect(active[0].minute).toBe(0);
  });

  it("FREE: pokušaj uključivanja drugog podsjetnika ne prolazi (ostaje false)", () => {
    reminders.setAll([
      { id: "a", label: "A", hour: 9, minute: 0, enabled: true },
      { id: "b", label: "B", hour: 10, minute: 0, enabled: false },
    ]);
    // toggle na 'b' bi trebao biti blokiran u FREE
    reminders.toggle("b");
    const list = getAll();
    const b = list.find((x) => x.id === "b")!;
    expect(b.enabled).toBe(false);
  });
});
