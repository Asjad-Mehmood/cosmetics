"use client";

import type { CategoryDTO, DeliveryZoneDTO, HomeContentDTO, VoucherDTO } from "@store/types";
import { createContext, useContext, type ReactNode } from "react";

export interface SiteData {
  contact: HomeContentDTO["contact"];
  delivery: DeliveryZoneDTO[];
  categories: CategoryDTO[];
  vouchers: VoucherDTO[];
}

const SiteContext = createContext<SiteData>({
  contact: { phone: null, email: null },
  delivery: [],
  categories: [],
  vouchers: [],
});

/** Store-wide data loaded once on the server (contact, delivery zones, categories). */
export function SiteProvider({ value, children }: { value: SiteData; children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

/** The lowest subtotal that gets free standard delivery somewhere, or null. */
export function freeDeliveryFrom(zones: DeliveryZoneDTO[]): number | null {
  const amounts = zones.map((z) => z.freeOverAmount).filter((a): a is number => a != null);
  return amounts.length ? Math.min(...amounts) : null;
}
