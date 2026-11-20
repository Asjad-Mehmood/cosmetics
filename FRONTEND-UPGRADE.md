# Frontend Upgrade Plan: Amazon Group

> **Status: done.** All sections below are built. Checked with 55 end-to-end tests (including quick add, Buy now, Offers and the mobile tab bar) and zero axe violations on 13 shop pages and 10 admin pages.

The goal is a shop that feels like a modern beauty and pharmacy retailer: search first, easy to browse by category and concern, trustworthy, and fast on a phone. The design references are Pakistani and regional retailers that people already know how to use (a big search bar, a category bar, bottom navigation on mobile), with a calmer, cleaner look.

All upgrades keep what already works: server rendering, the in-process API, accessibility (WCAG 2.1 AA, checked by axe), and the end-to-end tests.

## 1. Design system

| Item    | Before                                 | After                                                                                                          |
| ------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Font    | System font                            | **Plus Jakarta Sans** (self-hosted, no Google request at runtime)                                              |
| Colours | Teal + rose tokens                     | Same tokens, plus `accent` (rose) shades, a soft `blush` surface and a `mint` surface for health sections      |
| Shape   | 8 px buttons, 12 px cards              | Pill buttons and chips, 16 px cards, soft shadows on hover                                                     |
| Buttons | primary, brand, outline, ghost, danger | + `accent`, and a `pill` shape option                                                                          |
| Icons   | 12 hand-drawn icons                    | A fuller set (pill, leaf, sparkle, phone, chat, home, grid, lock, clock, check, chevrons, x) in the same style |
| Motion  | Few                                    | Subtle: hover lift on cards, image zoom, slide-in drawers; turned off with `prefers-reduced-motion`            |

## 2. Site chrome

1. **Top bar** (desktop): the announcement on the left; "Track order", "Help" and the phone number on the right.
2. **Main header:** logo, a **full-width search bar** with live suggestions (products with photo and price, categories, popular searches when empty), and account, wishlist and a cart button that shows the item count and total.
3. **Category bar** (desktop): every category as a link with a mega-menu showing each category's photo, sub-categories and featured collections. "Offers", "New arrivals" and "Best sellers" are on the right.
4. **Mobile:** a compact header with the search bar under the logo row, plus a **bottom tab bar** (Home, Categories, Search, Cart, Account) like the apps people use every day.
5. **Footer:** a trust strip (Genuine products · Cash on Delivery · Fast delivery · Easy returns), then contact (phone, email), categories, help, company links and the newsletter. A "Cash on Delivery" payment badge and the legal line sit at the bottom.

## 3. Home page

1. **Hero carousel** of all active banners: auto-play that pauses on hover or focus, arrows, dots and swipe on mobile. Respects reduced motion.
2. **Category circles:** round photos with names, scrollable on mobile.
3. **Trust strip.**
4. **Shop by concern:** acne, dark spots, dry skin, hair fall, sun protection, immunity. Each tile opens a search for that concern.
5. **Product rails:** best sellers, new arrivals and offers, each a horizontal scroller with arrows on desktop.
6. **Split promo tiles:** makeup and health & wellness.
7. **Pharmacy panel:** "Prescription medicines are coming soon. Our pharmacist checks every prescription", with a notify-me style link to the FAQ.
8. **Newsletter band** with a soft rose background.

## 4. Product card

- Square image on a soft background, with a second image on hover.
- Badges: discount %, "Sold out", "Low stock".
- Rating, price with the old price struck through and **"Save Rs X"**.
- **Quick add** button: one tap adds a product that has a single option; otherwise it says "Choose options" and opens the product page.
- Shade dots, plus "+N" when there are many.

## 5. Listing pages (shop, category, collection, search)

- A page header with the category photo, title, description and product count.
- A sticky toolbar with results count, active filter chips, sort, and a grid density switch on desktop.
- Filters as collapsible sections: availability, size, shade (swatches) and price with quick ranges (Under Rs 1,000; 1,000-2,500; 2,500-5,000; 5,000+).
- **Mobile:** a sticky "Filter · Sort" bar; filters open in a bottom sheet.
- A friendlier empty state with popular categories.

## 6. Product page

- **Gallery:** large image with hover zoom on desktop, swipeable on mobile with dots, thumbnails.
- **Buy box:**
  - category link, title, rating;
  - price with **"You save Rs X (Y%)"** and "Inclusive of all taxes";
  - **pack-size cards that show each size's price**; shade swatches with names;
  - quantity, **Add to cart** and **Buy now** (adds, then goes straight to checkout);
  - wishlist.
- **Delivery box:** estimated days and charge for each zone, the free-delivery threshold, and Cash on Delivery.
- **Trust row:** 100% genuine · Checked for expiry · Easy returns.
- **Details:** tabs on desktop (Description, Ingredients, How to use, Warnings, Delivery & returns); an accordion on mobile.
- Reviews with a rating summary and bars.
- A "You may also like" rail and recently viewed.
- **Sticky add-to-cart bar on mobile** once the main button scrolls out of view.

## 7. Cart and checkout

- **Cart drawer:** a **free-delivery progress bar**, larger product lines, the subtotal, and "Checkout" plus "View cart". The empty state links to popular categories.
- **Cart page:** the same progress bar, an order summary card with trust points, and a "You may also like" rail.
- **Checkout:** a step header (Details → Delivery → Payment), a sticky order summary, and secure, genuine and COD reassurance. Every field and rule stays as it is.

## 8. Account, auth and content pages

- **Auth pages:** a split layout with a brand panel (benefits of an account) beside the form on desktop.
- **Account:** cards with icons for orders, addresses, wishlist and profile.
- **Content pages (about, FAQ, policies, contact):** a common page header, readable widths, and the FAQ grouped by topic with accordions.

## 9. Quality bar

- Accessibility: every new control is keyboard-usable and labelled. The carousel and rails follow the WAI patterns, and axe stays at zero violations.
- Performance: server components by default, client code only where interaction needs it, images sized correctly, and no new heavy libraries (no carousel library; CSS scroll-snap and small hooks).
- Tests: every existing end-to-end test is updated to the new UI, with new tests for quick add, buy now, the bottom tab bar and the free-delivery bar.
- Screenshots: desktop and mobile of each key page, checked before merge.

## 10. Order of work

1. Design system: font, tokens, buttons, icons.
2. Header, category bar, search, bottom tab bar, footer.
3. Product card and rails.
4. Home page.
5. Listing pages and filters.
6. Product page.
7. Cart drawer, cart page and checkout.
8. Auth, account and content pages.
9. Tests, accessibility, screenshots and docs.

## 11. Round 2: big-store features (inspired by Amazon and Daraz)

The features shoppers know from the big marketplaces, in Amazon Group's own look. No marketplace branding, colours or layouts are copied.

| Feature                                                                                                                   | Inspired by    | Where                                |
| ------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------ |
| **Collect vouchers**: public discount codes as tickets with Copy (home, product page) or Apply (cart)                     | Daraz          | Admin → Coupons → "Show in the shop" |
| **"1.2k sold"** on product cards, from the real sales counter                                                             | Daraz          | Product cards                        |
| **Free delivery** tag on items that qualify by themselves                                                                 | Daraz / Amazon | Product cards                        |
| **Search in a category**: dropdown and Search button in the header search                                                 | Amazon         | Header                               |
| **Frequently bought together**: this item plus up to two others (bought together first), with ticks and "Add all to cart" | Amazon         | Product page                         |
| **Arrival dates**: "Arrives Sat 21 – Mon 23 Nov" per zone (skips Sundays; orders after 2 PM ship the next working day)    | Amazon         | Product page                         |
| **Buy it again**: products from the customer's earlier orders                                                             | Amazon         | Home (signed in)                     |
| **Just for you**: an endless grid with Load more                                                                          | Daraz          | Home                                 |
| **Back to top** bar above the footer                                                                                      | Amazon         | Every page                           |

Deliberately not added: fake countdown timers or "X% claimed" bars. They would invent urgency the store doesn't have. A real "deal ends" time can come later, once deals have end dates in the admin.
