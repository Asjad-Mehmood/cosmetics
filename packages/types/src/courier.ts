/**
 * TCS courier settings as the admin sees them. The TCS API login (client ID
 * and secret, username, password, account and cost center) lives only in the
 * server's environment variables, never in the database or the admin.
 */
export interface TcsSettingsDTO {
  enabled: boolean;
  /** From TCS_ENV on the server. */
  environment: "sandbox" | "production";
  /** Required environment variables that aren't set yet on the server. */
  missingEnv: string[];
  /** From TCS_ACCOUNT_NUMBER, shown so staff can see which account is used. */
  accountNumber: string;
  /** From TCS_COST_CENTER_CODE. */
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
  /** True when everything needed to book is in place. */
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
