/**
 * Demo catalogue + store content used by `pnpm db:seed`.
 * Prices are in minor units (paisa): 249900 = Rs 2,499.
 *
 * This is a small starter catalogue so every page works out of the box. Replace
 * it with your real products in Admin → Products (or a fresh seed).
 */
import type { ProductStatus } from "@prisma/client";

/**
 * Photo on Unsplash's CDN (free to use commercially under the Unsplash
 * License). `id` is the part after "photo-" in an images.unsplash.com URL.
 */
export const unsplash = (id: string, width = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;

export const categories = [
  {
    slug: "skincare",
    image: "1713768704571-6aeb0d0e5105",
    name: "Skincare",
    description: "Serums, sunscreens, cleansers and moisturisers for every skin type.",
  },
  {
    slug: "makeup",
    image: "1583209814683-c023dd293cc6",
    name: "Makeup",
    description: "Lips, face and eyes, in shades for Pakistani skin tones.",
  },
  {
    slug: "hair-care",
    image: "1747858989102-cca0f4dc4a11",
    name: "Hair Care",
    description: "Shampoos, conditioners, oils and treatments.",
  },
  {
    slug: "fragrance",
    image: "1784183972601-17a1b00ea05e",
    name: "Fragrance",
    description: "Perfumes and body mists for every day and special occasions.",
  },
  {
    slug: "health-wellness",
    image: "1707129785947-ddc627a8bab9",
    name: "Health & Wellness",
    description: "Vitamins, supplements and health devices for the whole family.",
  },
] as const;

export const collections = [
  {
    slug: "new-arrivals",
    name: "New Arrivals",
    description: "Just landed at Amazon Group.",
    isFeatured: true,
  },
  {
    slug: "best-sellers",
    name: "Best Sellers",
    description: "Our customers' favourites.",
    isFeatured: true,
  },
  {
    slug: "daily-essentials",
    name: "Daily Essentials",
    description: "The basics worth keeping in every home.",
    isFeatured: false,
  },
] as const;

interface ShadeDef {
  /** "Standard" for products that come in one shade only (the shade picker is then hidden). */
  name: string;
  hex: string;
  /** Unsplash photo ids, first one is the main photo for the shade. */
  photos: string[];
}

export interface ProductDef {
  slug: string;
  title: string;
  skuPrefix: string;
  description: string;
  ingredients?: string;
  howToUse?: string;
  warnings?: string;
  basePrice: number;
  compareAtPrice?: number;
  /** Price per pack size when it differs from `basePrice`. */
  sizePrices?: Record<string, number>;
  status: ProductStatus;
  isFeatured: boolean;
  categories: string[];
  collections: string[];
  sizes: string[];
  colors: ShadeDef[];
  /** Shipping weight of the smallest size, in grams. */
  weightGrams: number;
  soldCount: number;
}

const STANDARD = "#E5E7EB";

/** Prices are in paisa and in line with Pakistani beauty and pharmacy retailers. */
export const products: ProductDef[] = [
  {
    slug: "vitamin-c-brightening-serum",
    title: "Vitamin C Brightening Serum",
    skuPrefix: "VCS",
    description:
      "A lightweight daily serum with 15% vitamin C and ferulic acid that brightens dull skin, evens out tone and helps fade dark spots. Suitable for all skin types.",
    ingredients:
      "Aqua, Ascorbic Acid, Propanediol, Glycerin, Sodium Hyaluronate, Ferulic Acid, Tocopherol, Panthenol, Phenoxyethanol, Ethylhexylglycerin.",
    howToUse:
      "Every morning, apply 3-4 drops to clean, dry face and neck. Follow with moisturiser and sunscreen.",
    warnings:
      "For external use only. Avoid contact with eyes. Patch test before first use. A mild tingling is normal; stop using it if irritation continues. Store in a cool, dark place.",
    basePrice: 249900,
    sizePrices: { "30 ml": 399900 },
    status: "ACTIVE",
    isFeatured: true,
    categories: ["skincare"],
    collections: ["best-sellers"],
    sizes: ["15 ml", "30 ml"],
    colors: [
      {
        name: "Standard",
        hex: STANDARD,
        photos: ["1713768704571-6aeb0d0e5105", "1679394270597-e90694d70350"],
      },
    ],
    weightGrams: 80,
    soldCount: 384,
  },
  {
    slug: "hyaluronic-hydrating-serum",
    title: "Hyaluronic Acid Hydrating Serum",
    skuPrefix: "HAS",
    description:
      "Multi-weight hyaluronic acid with vitamin B5 draws moisture into the skin for a plump, smooth look. Fragrance-free and gentle enough for sensitive skin.",
    ingredients:
      "Aqua, Sodium Hyaluronate, Hydrolyzed Hyaluronic Acid, Panthenol, Glycerin, Allantoin, Phenoxyethanol.",
    howToUse: "Morning and evening, apply 2-3 drops to damp skin, then seal in with moisturiser.",
    warnings: "For external use only. Avoid contact with eyes.",
    basePrice: 189900,
    status: "ACTIVE",
    isFeatured: false,
    categories: ["skincare"],
    collections: ["new-arrivals", "daily-essentials"],
    sizes: ["30 ml"],
    colors: [{ name: "Standard", hex: STANDARD, photos: ["1710410815589-dd83514104d0"] }],
    weightGrams: 90,
    soldCount: 142,
  },
  {
    slug: "daily-sunscreen-spf-50",
    title: "Daily Sunscreen Lotion SPF 50",
    skuPrefix: "SUN",
    description:
      "Broad-spectrum SPF 50 PA++++ protection in a light, non-greasy lotion that leaves no white cast. Made for daily use in Pakistan's strong sun.",
    ingredients:
      "Aqua, Homosalate, Ethylhexyl Salicylate, Octocrylene, Butyl Methoxydibenzoylmethane, Glycerin, Niacinamide, Tocopheryl Acetate, Phenoxyethanol.",
    howToUse:
      "Apply generously as the last step of your morning skincare, 15 minutes before going out. Reapply every 2 hours outdoors and after swimming or sweating.",
    warnings:
      "For external use only. Avoid contact with eyes; rinse with water if it gets in. Keep out of direct sunlight.",
    basePrice: 149900,
    sizePrices: { "100 ml": 249900 },
    status: "ACTIVE",
    isFeatured: true,
    categories: ["skincare"],
    collections: ["best-sellers", "daily-essentials"],
    sizes: ["50 ml", "100 ml"],
    colors: [{ name: "Standard", hex: STANDARD, photos: ["1594055103006-7871176f1a7e"] }],
    weightGrams: 90,
    soldCount: 296,
  },
  {
    slug: "velvet-matte-lipstick",
    title: "Velvet Matte Lipstick",
    skuPrefix: "VML",
    description:
      "A creamy matte lipstick with rich colour in one swipe and up to 8 hours of comfortable wear. Enriched with vitamin E so lips don't feel dry.",
    ingredients:
      "Isododecane, Dimethicone, Kaolin, Polyethylene, Tocopheryl Acetate, Ricinus Communis Seed Oil. May contain: CI 77891, CI 77491, CI 15850.",
    howToUse:
      "Start at the centre of the upper lip and work outwards, then glide along the lower lip.",
    basePrice: 99900,
    compareAtPrice: 129900,
    status: "ACTIVE",
    isFeatured: true,
    categories: ["makeup"],
    collections: ["new-arrivals", "best-sellers"],
    sizes: ["3.5 g"],
    colors: [
      { name: "Nude Rose", hex: "#C98B83", photos: ["1773372238338-f26460145162"] },
      { name: "Classic Red", hex: "#B3262E", photos: ["1596462502278-27bfdc403348"] },
      { name: "Berry Wine", hex: "#7E2E4A", photos: [] },
    ],
    weightGrams: 30,
    soldCount: 263,
  },
  {
    slug: "argan-oil-repair-shampoo",
    title: "Argan Oil Repair Shampoo",
    skuPrefix: "ARS",
    description:
      "A sulphate-free shampoo with argan oil and keratin that gently cleanses, smooths frizz and repairs dry, damaged hair. Safe for coloured hair.",
    ingredients:
      "Aqua, Sodium Cocoyl Isethionate, Cocamidopropyl Betaine, Argania Spinosa Kernel Oil, Hydrolyzed Keratin, Glycerin, Panthenol, Parfum, Citric Acid.",
    howToUse: "Massage into wet hair and scalp, lather, then rinse well. Follow with conditioner.",
    warnings: "Avoid contact with eyes. If it gets in, rinse well with water.",
    basePrice: 119900,
    sizePrices: { "500 ml": 199900 },
    status: "ACTIVE",
    isFeatured: false,
    categories: ["hair-care"],
    collections: ["new-arrivals"],
    sizes: ["250 ml", "500 ml"],
    colors: [
      {
        name: "Standard",
        hex: STANDARD,
        photos: ["1747858989102-cca0f4dc4a11", "1762815716180-1d3a167828f8"],
      },
    ],
    weightGrams: 300,
    soldCount: 118,
  },
  {
    slug: "bloom-eau-de-parfum",
    title: "Bloom Eau de Parfum",
    skuPrefix: "BEP",
    description:
      "A soft floral fragrance with notes of pear and jasmine over warm musk and sandalwood. Long-lasting, made for every day.",
    ingredients: "Alcohol Denat., Parfum, Aqua, Linalool, Limonene, Coumarin, Citronellol.",
    howToUse: "Spray onto pulse points: wrists, neck and behind the ears.",
    warnings: "Flammable. Keep away from heat and flames. Do not spray near eyes.",
    basePrice: 449900,
    sizePrices: { "100 ml": 699900 },
    status: "ACTIVE",
    isFeatured: true,
    categories: ["fragrance"],
    collections: ["new-arrivals"],
    sizes: ["50 ml", "100 ml"],
    colors: [{ name: "Standard", hex: STANDARD, photos: ["1784183972601-17a1b00ea05e"] }],
    weightGrams: 250,
    soldCount: 87,
  },
  {
    slug: "omega-3-fish-oil",
    title: "Omega-3 Fish Oil 1000 mg",
    skuPrefix: "OMG",
    description:
      "Purified fish oil softgels with EPA and DHA to support heart, brain and joint health. Food supplement.",
    ingredients:
      "Each softgel: fish oil 1000 mg (EPA 180 mg, DHA 120 mg). Capsule shell: gelatin, glycerin, purified water.",
    howToUse: "Adults: take 1 softgel twice a day with meals, or as advised by your doctor.",
    warnings:
      "Food supplement, not a medicine. Do not exceed the recommended dose. Ask your doctor before use if you are pregnant, breastfeeding or taking blood thinners. Keep out of reach of children. Store below 25°C.",
    basePrice: 159900,
    sizePrices: { "60 softgels": 289900 },
    status: "ACTIVE",
    isFeatured: false,
    categories: ["health-wellness"],
    collections: ["best-sellers", "daily-essentials"],
    sizes: ["30 softgels", "60 softgels"],
    colors: [
      {
        name: "Standard",
        hex: STANDARD,
        photos: ["1624362772755-4d5843e67047", "1664956618021-73c47736845e"],
      },
    ],
    weightGrams: 120,
    soldCount: 205,
  },
  {
    slug: "digital-thermometer",
    title: "Digital Thermometer",
    skuPrefix: "DTH",
    description:
      "A fast, accurate digital thermometer for oral, underarm or rectal use, with a fever beep, a memory of the last reading and a flexible, waterproof tip.",
    howToUse:
      "Clean the tip, press the button and place it under the tongue or arm. Read the result after the beep (about 10 seconds).",
    warnings:
      "Clean the tip with alcohol before and after each use. Not for use in the ear. Keep away from children when not supervised. Contains a button battery.",
    basePrice: 79900,
    status: "ACTIVE",
    isFeatured: false,
    categories: ["health-wellness"],
    collections: ["daily-essentials"],
    sizes: ["One size"],
    colors: [
      {
        name: "Standard",
        hex: STANDARD,
        photos: ["1609725236589-d987ffc8133a", "1594790628624-9e563bea851d"],
      },
    ],
    weightGrams: 50,
    soldCount: 94,
  },
  {
    slug: "daily-multivitamin-tablets",
    title: "Daily Multivitamin Tablets",
    skuPrefix: "DMV",
    description: "Coming soon: a once-a-day multivitamin and mineral tablet for adults.",
    basePrice: 129900,
    status: "DRAFT",
    isFeatured: false,
    categories: ["health-wellness"],
    collections: [],
    sizes: ["30 tablets"],
    colors: [{ name: "Standard", hex: STANDARD, photos: [] }],
    weightGrams: 60,
    soldCount: 0,
  },
];

/** Products from earlier demo catalogues, archived when the seed runs. */
export const retiredProductSlugs: string[] = [];
/** Categories from earlier demo catalogues, hidden when the seed runs. */
export const retiredCategorySlugs: string[] = [];

export const shippingZones = [
  {
    id: "zone_lahore",
    name: "Lahore",
    regions: ["lahore"],
    standardRate: 15000,
    expressRate: 30000,
    freeOverAmount: 300000,
    codFee: 5000,
    estimatedDays: "1-2",
    position: 0,
  },
  {
    id: "zone_major_cities",
    name: "Karachi & Islamabad / Rawalpindi",
    regions: ["karachi", "islamabad", "rawalpindi"],
    standardRate: 25000,
    expressRate: 45000,
    freeOverAmount: 300000,
    codFee: 5000,
    estimatedDays: "2-3",
    position: 1,
  },
  {
    id: "zone_rest_pk",
    name: "Rest of Pakistan",
    regions: ["*"],
    standardRate: 30000,
    expressRate: null,
    freeOverAmount: 500000,
    codFee: 10000,
    estimatedDays: "3-5",
    position: 2,
  },
];

export const coupons = [
  {
    code: "WELCOME10",
    description: "10% off your first order",
    type: "PERCENTAGE" as const,
    value: 10,
    minOrderAmount: 200000,
    maxUsesPerUser: 1,
  },
  {
    code: "FREESHIP",
    description: "Free shipping on orders over Rs 2,000",
    type: "FREE_SHIPPING" as const,
    value: 0,
    minOrderAmount: 200000,
  },
  {
    code: "GLOW500",
    description: "Rs 500 off orders over Rs 5,000",
    type: "FIXED" as const,
    value: 50000,
    minOrderAmount: 500000,
    maxUses: 200,
  },
];

export const banners = [
  {
    id: "banner_skincare",
    title: "Glow starts here",
    subtitle: "Serums, sunscreens and moisturisers for every skin type.",
    imageUrl: `${unsplash("1713768704571-6aeb0d0e5105", 1600)}&h=700`,
    link: "/categories/skincare",
    ctaLabel: "Shop skincare",
    position: 0,
  },
  {
    id: "banner_makeup",
    title: "New lip shades",
    subtitle: "Velvet matte colour that lasts all day, from Rs 999.",
    imageUrl: `${unsplash("1583209814683-c023dd293cc6", 1600)}&h=700`,
    link: "/categories/makeup",
    ctaLabel: "Shop makeup",
    position: 1,
  },
  {
    id: "banner_wellness",
    title: "Everyday health essentials",
    subtitle: "Vitamins, supplements and health devices for the whole family.",
    imageUrl: `${unsplash("1707129785947-ddc627a8bab9", 1600)}&h=700`,
    link: "/categories/health-wellness",
    ctaLabel: "Shop health",
    position: 2,
  },
];

/**
 * Store pages. Plain text: blank lines separate paragraphs, "## " starts a
 * heading and lines starting with "- " make a list. Edit them in Admin → Content.
 */
export const pages = [
  {
    slug: "shipping",
    title: "Shipping Policy",
    seoDescription: "Delivery times, charges and Cash on Delivery across Pakistan.",
    content: `We deliver to every city in Pakistan through our courier partners. Every parcel gets a tracking number once it ships.

## Delivery times
- Lahore: 1-2 working days
- Karachi, Islamabad and Rawalpindi: 2-3 working days
- Rest of Pakistan: 3-5 working days

Orders placed before 2 PM on a working day are packed the same day.

## Packing
Every order is sealed and packed to protect it in transit. Liquids are packed upright and sealed against leaks, and heat-sensitive products are kept out of direct sunlight until they ship.

## Delivery charges
Delivery charges depend on your city and are shown at checkout before you place the order. Delivery is free on orders over Rs 3,000 in Lahore, Karachi, Islamabad and Rawalpindi, and over Rs 5,000 elsewhere.

## Cash on Delivery
Pay in cash when your parcel arrives. A small Cash on Delivery fee (Rs 50 in major cities, Rs 100 elsewhere) is added at checkout. Please keep the exact amount ready and check that the parcel is sealed before paying.

## Tracking
Track your order at any time from the Track Order page with your order number and email address, or from your account.`,
  },
  {
    slug: "returns",
    title: "Returns & Refunds",
    seoDescription: "Returns within 7 days for unopened beauty and personal care items.",
    content: `We want you to love what you buy. For hygiene and safety reasons, our returns policy depends on the type of product.

## What can be returned
- Unopened, unused beauty and personal care items in their original sealed packaging, within 7 days of delivery.
- Anything that arrives damaged, leaking, faulty, expired or different from what you ordered, at any time within 7 days of delivery.

## What can't be returned
- Opened or used cosmetics, skincare, hair care and fragrance, unless faulty.
- Medicines, vitamins and supplements, unless they arrive damaged, expired or wrong.
- Health devices that have been used, unless faulty.

## How to return
- Signed in: open the order in your account and choose "Request a return".
- Guest orders: open the link to your order (from the order confirmation page) or contact us with your order number.

We review requests within one working day and send you the return address. Once we receive and check the items, refunds for Cash on Delivery orders are sent by bank transfer or JazzCash / Easypaisa within 5 working days.

## Damaged, wrong or expired items
If something arrives damaged, leaking, expired or isn't what you ordered, contact us within 48 hours with a photo and we will replace it or refund you at our cost.`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    seoDescription: "What information Amazon Group collects and how it is used.",
    content: `Amazon Group respects your privacy. This policy explains what we collect and why.

## What we collect
- Your name, phone number, email and delivery address, to deliver your order and contact you about it.
- Your order history and wishlist, if you create an account.
- Basic, anonymous usage statistics that help us improve the website.

## How we use it
We use your details only to process and deliver orders, provide customer support, and, if you subscribe, send our newsletter. We share your name, phone number and address with our courier partner only to deliver your parcel.

We never sell or rent your personal information. What you buy, including health products, is kept confidential and is only seen by the staff who prepare and deliver your order.

## Payments
Orders are paid by Cash on Delivery. We do not collect or store card details.

## Your choices
You can update your details in your account at any time, unsubscribe from emails with the link in every email, or ask us to delete your account by contacting us.

## Cookies
We use essential cookies to keep you signed in and remember your cart. We don't use advertising cookies.`,
  },
  {
    slug: "terms",
    title: "Terms of Service",
    seoDescription: "The terms for shopping at Amazon Group.",
    content: `By using this website and placing an order you agree to these terms.

## Orders
An order is confirmed when you receive an order number on screen. We may cancel an order if an item is out of stock, the price was shown incorrectly, or the order looks fraudulent. We may also limit the quantity of some products per order. If we cancel, we will contact you and you will not be charged.

## Prices
All prices are in Pakistani Rupees and include applicable taxes. Delivery and Cash on Delivery charges are shown at checkout. Prices and availability can change without notice, but never after your order is confirmed.

## Health information
Product descriptions are for general information only and are not medical advice. Always read the label and the leaflet, and ask a doctor or pharmacist before using a health product if you are pregnant, breastfeeding, have a medical condition or take other medicines.

## Cash on Delivery
Please only place an order if you can receive and pay for it. Repeatedly refused deliveries may lead to Cash on Delivery being turned off for your phone number.

## Product photos
We try to show shades and packaging accurately, but they can look slightly different on different screens, and brands sometimes update their packaging.

## Contact
Questions about these terms? Contact us through the Contact page.`,
  },
];

export const faqs = [
  {
    id: "faq_genuine",
    category: "Products",
    question: "Are your products genuine?",
    answer:
      "Yes. We buy only from brands and their authorised distributors in Pakistan, and store everything away from heat and sunlight.",
  },
  {
    id: "faq_expiry",
    category: "Products",
    question: "How do you check expiry dates?",
    answer:
      "Every product is checked before it is packed, and we don't send products that are close to their expiry date. If anything arrives expired, we replace it or refund you.",
  },
  {
    id: "faq_cod",
    category: "Payments",
    question: "How do I pay?",
    answer:
      "All orders are Cash on Delivery: you pay the rider in cash when your parcel arrives. A small COD fee (Rs 50 in major cities, Rs 100 elsewhere) is added at checkout.",
  },
  {
    id: "faq_delivery",
    category: "Shipping",
    question: "How long does delivery take?",
    answer:
      "1-2 working days in Lahore, 2-3 in Karachi, Islamabad and Rawalpindi, and 3-5 working days for the rest of Pakistan.",
  },
  {
    id: "faq_returns",
    category: "Returns",
    question: "Can I return a product?",
    answer:
      "Unopened beauty and personal care items can be returned within 7 days of delivery. For hygiene and safety, opened items and medicines can only be returned if they are damaged, expired or wrong.",
  },
  {
    id: "faq_advice",
    category: "Products",
    question: "Which product is right for my skin?",
    answer:
      "Check the product description, ingredients and how-to-use sections, or send us a message through the Contact page with your skin type and concern and we will help you choose.",
  },
  {
    id: "faq_prescription",
    category: "Medicines",
    question: "Do you sell prescription medicines?",
    answer:
      "Not yet. Prescription medicines are coming soon: you will upload your prescription at checkout and our pharmacist will check it before the order is sent.",
  },
  {
    id: "faq_track",
    category: "Shipping",
    question: "How do I track my order?",
    answer:
      "Use the Track Order page with your order number and email address, or open the order in your account.",
  },
];

export const settings: Record<string, unknown> = {
  "store.name": "Amazon Group",
  "store.email": "support@amazongroup.pk",
  "store.phone": "+92 300 0000000",
  "store.currency": "PKR",
  "store.locale": "en-PK",
  "tax.rate": 0,
  "tax.inclusive": true,
  "payments.card.enabled": false,
  "payments.cod.enabled": true,
  "orders.numberPrefix": "AG-",
  "returns.windowDays": 7,
  "reviews.autoApprove": false,
  "notifications.dailyDigest": true,
  "announcement.text": "100% genuine products · Free delivery over Rs 3,000 in major cities",
  "announcement.enabled": true,
};

/** Demo reviews by product slug (development only, never seeded in production). */
export const demoReviews: Record<string, { rating: number; title: string; body: string }[]> = {
  "vitamin-c-brightening-serum": [
    {
      rating: 5,
      title: "Visible glow in two weeks",
      body: "My dark spots have faded and my skin looks brighter. Absorbs quickly and doesn't feel sticky under sunscreen.",
    },
    {
      rating: 4,
      title: "Works, slight tingle",
      body: "Tingles a little for the first few days, then it's fine. Keep it in a drawer away from light.",
    },
    {
      rating: 5,
      title: "Genuine and fresh",
      body: "Arrived sealed with a long expiry date. Already ordered the bigger bottle.",
    },
  ],
  "velvet-matte-lipstick": [
    {
      rating: 5,
      title: "Perfect nude for my skin tone",
      body: "Nude Rose is exactly the shade I was looking for, and it lasts through lunch.",
    },
    {
      rating: 3,
      title: "Nice colour, a bit drying",
      body: "Beautiful red but I need a lip balm underneath by the evening.",
    },
  ],
  "daily-sunscreen-spf-50": [
    {
      rating: 5,
      title: "No white cast",
      body: "Finally a sunscreen that doesn't leave me grey. Light enough for Karachi humidity.",
    },
  ],
  "argan-oil-repair-shampoo": [
    {
      rating: 4,
      title: "Less frizz",
      body: "My hair is much softer after a week. Smells lovely too.",
    },
  ],
};
