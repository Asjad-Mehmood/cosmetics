import { describe, expect, it } from "vitest";
import { skuPrefixFor } from "./sku";

describe("SKU prefix", () => {
  it("uses the initials plus a short id code", () => {
    expect(skuPrefixFor("Vitamin C Brightening Serum", "cmw4vojwg000e7d2p45sg759g")).toBe(
      "VCBS-59G",
    );
    expect(skuPrefixFor("  ", "abc")).toBe("AG-ABC");
    expect(skuPrefixFor("SPF-50 (Limited) Sunscreen!", "x1")).toMatch(/^[A-Z0-9-]{2,20}$/);
  });
});
