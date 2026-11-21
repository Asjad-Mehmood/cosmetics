/** Public runtime config. Values come from env vars with development defaults. */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME ?? "Amazon Group",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** The store's API, served by this same site. */
  apiUrl: "/api/v1",
  description:
    "Amazon Group: genuine skincare, makeup, hair care, fragrance, vitamins and health essentials, delivered across Pakistan with Cash on Delivery.",
  currency: "PKR",
};

export const footerNav = {
  Shop: [
    { label: "All products", href: "/shop" },
    { label: "New arrivals", href: "/collections/new-arrivals" },
    { label: "Best sellers", href: "/collections/best-sellers" },
  ],
  Help: [
    { label: "Upload a prescription", href: "/prescription" },
    { label: "Track your order", href: "/track-order" },
    { label: "FAQ", href: "/faq" },
    { label: "Shipping", href: "/policies/shipping" },
    { label: "Returns", href: "/policies/returns" },
    { label: "Contact us", href: "/contact" },
  ],
  Company: [
    { label: "About us", href: "/about" },
    { label: "Privacy policy", href: "/policies/privacy" },
    { label: "Terms of service", href: "/policies/terms" },
  ],
};

/** Suggested searches, shown under the empty search box and on the search page. */
export const POPULAR_SEARCHES = [
  "Sunscreen",
  "Vitamin C serum",
  "Lipstick",
  "Shampoo",
  "Omega 3",
  "Thermometer",
];
