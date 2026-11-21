/** TCS courier settings as the admin sees them (secrets are never sent back). */
export interface TcsSettingsDTO {
  enabled: boolean;
  /** "sandbox" while testing with TCS's UAT credentials, then "production". */
  environment: "sandbox" | "production";
  clientId: string;
  hasClientSecret: boolean;
  username: string;
  hasPassword: boolean;
  /** TCS account number (tcsaccount), e.g. 04011K1. */
  accountNumber: string;
  /** Cost center code TCS set up for the store's pickup address. */
  costCenterCode: string;
  /** TCS service, e.g. "O" (overnight). */
  serviceCode: string;
  /** Pickup (shipper) details printed on the airway bill. */
  shipperName: string;
  shipperAddress: string;
  shipperCity: string;
  shipperMobile: string;
  /** Default parcel weight in kg when booking. */
  defaultWeightKg: number;
  /** True when everything needed to book is filled in. */
  configured: boolean;
}

export interface TcsCityDTO {
  code: string;
  name: string;
}

/** What the booking dialog needs for an order: suggested values and whether it can be booked. */
export interface TcsBookingDraftDTO {
  configured: boolean;
  /** The TCS city matching the delivery address, if one was found. */
  city: TcsCityDTO | null;
  cities: TcsCityDTO[];
  weightKg: number;
  pieces: number;
  /** Cash the rider collects, in paisa (0 for paid orders). */
  codAmount: number;
  description: string;
}
