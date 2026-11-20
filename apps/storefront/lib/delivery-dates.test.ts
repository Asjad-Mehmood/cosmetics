import { describe, expect, it } from "vitest";
import { arrivalWindow, formatWindow } from "./delivery-dates";

// Times are UTC; Pakistan is UTC+5.
const at = (iso: string) => new Date(iso);

describe("arrivalWindow", () => {
  it("counts working days from today for morning orders", () => {
    // Fri 20 Nov 2026, 10:00 PKT
    const w = arrivalWindow("1-2", at("2026-11-20T05:00:00Z"))!;
    expect(formatWindow(w)).toBe("Sat 21 – Mon 23 Nov"); // skips Sunday
  });

  it("starts from the next working day after 2 PM", () => {
    // Fri 20 Nov 2026, 15:00 PKT → packed Sat 21
    expect(formatWindow(arrivalWindow("2-3", at("2026-11-20T10:00:00Z"))!)).toBe(
      "Tue 24 – Wed 25 Nov",
    );
  });

  it("handles single numbers, month ends and junk", () => {
    expect(formatWindow(arrivalWindow("3", at("2026-11-27T05:00:00Z"))!)).toBe("Tue 1 Dec");
    expect(formatWindow(arrivalWindow("3-5", at("2026-11-26T05:00:00Z"))!)).toBe(
      "Mon 30 Nov – Wed 2 Dec",
    );
    expect(arrivalWindow("soon")).toBeNull();
  });
});
