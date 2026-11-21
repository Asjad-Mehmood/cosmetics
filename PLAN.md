# Cosmetics & Pharmacy Store: Conversion Plan

The plan turns a copy of **Urban Store** (the hoodie shop in `Asjad-Mehmood/E-commerce-`) into an online **cosmetics, personal-care and pharmacy store** for Pakistan. The shop, admin panel and API stay one site and one Vercel project.

> **Store name:** **Amazon Group** (order numbers `AG-10001`). Phase 1 is done: see the checklist in section 6.

---

## Contents

0. [Summary](#0-summary)
1. [Decisions needed from you](#1-decisions-needed-from-you)
2. [Legal and compliance checklist (Pakistan)](#2-legal-and-compliance-checklist-pakistan)
3. [How the copy is made](#3-how-the-copy-is-made)
4. [What stays exactly as it is](#4-what-stays-exactly-as-it-is)
5. [What changes, area by area](#5-what-changes-area-by-area)
6. [Phases, tasks and acceptance criteria](#6-phases-tasks-and-acceptance-criteria)
7. [Testing plan](#7-testing-plan)
8. [What you need to provide](#8-what-you-need-to-provide)
9. [Risks and how they are handled](#9-risks-and-how-they-are-handled)
10. [Later (after launch)](#10-later-after-launch)

---

## 0. Summary

**Reuse about 80%, change about 20%.** Urban Store already has everything a shop needs. The work is in four areas:

1. **Brand and content:** new name, logo, colours, pages and catalogue.
2. **Product model:**
   - hoodie "size × colour" becomes general **options**: shade, size (ml/g), pack size, strength;
   - adds **brands**, ingredients, how to use, warnings, skin type and concern;
   - medicine fields: generic name (salt), strength, dosage form, manufacturer, MRP, DRAP registration.
3. **Pharmacy rules:**
   - **batch and expiry tracking** (first-expiry-first-out);
   - limits per order, cold-chain items, non-returnable items, controlled drugs blocked;
   - pharmacist and licence details on the site.
4. **Prescriptions:** upload at checkout, a pharmacist reviews and approves or rejects, and only then is the order confirmed.

**Launch in two stages:**

| Stage                | Sells                                                                                                                      | When                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **A: launch**        | Cosmetics, skincare, hair, fragrance, personal and baby care, vitamins and supplements, **OTC medicines**, medical devices | As soon as Phases 1–5, 7 and 8 are done                                                   |
| **B: prescriptions** | Prescription (Rx) medicines with a pharmacist-verified upload                                                              | After Phase 6 **and** once the drug-sale licence and pharmacist are confirmed (section 2) |

Payments stay **Cash on Delivery only**. As in Urban Store, email is set up in the admin and nothing is sent until then, and images need no paid account.

---

## 1. Decisions needed from you

Please answer these before Phase 1. The default used if you don't decide is in brackets.

1. **Store name and domain.** ✅ **Amazon Group**. Domain still to choose (the docs use `amazongroup.pk` as an example).
2. **Look and feel:** ✅ left to us: deep teal `#0F5E63` with a rose accent `#E0697E`, and a white care droplet with a rose plus on a teal tile.
3. **Stage B:** ✅ prescriptions are in scope. A **retail drug-sale licence** and a **registered pharmacist** are still needed before prescription medicines go live.
4. **Cities you deliver to** and delivery fees. [Same three zones as Urban Store: Lahore; Karachi/Islamabad/Rawalpindi; rest of Pakistan]
5. **Cold-chain items** (insulin, some vaccines and eye drops). Sell them? Only in your own city? [Not in Stage A]
6. **Return rules:**
   - medicines: only if damaged, wrong or expired;
   - cosmetics: unopened, within 7 days.
   - [as above]
7. **Starter catalogue:** which brands and products you actually stock. [About 60 demo products, replaced by your stock list]
8. **WhatsApp number** for a "Ask a pharmacist" button. [none until provided]
9. **Keep Git history** from Urban Store in the new repo, or start with one clean commit? [Keep history]

---

## 2. Legal and compliance checklist (Pakistan)

> This is a practical checklist, **not legal advice**. Drug-sale rules are set by DRAP and the provincial health departments, and they change. Confirm each point with a pharmacy-licensing consultant or lawyer before Stage B.

**For Stage A (cosmetics, OTC, supplements, devices):**

- [ ] Business registration and NTN (FBR). Add sales tax registration if your turnover requires it.
- [ ] Buy only from **authorised distributors**, and keep invoices. Fakes are the biggest risk in cosmetics.
- [ ] OTC medicines are sold under a pharmacy or medical-store licence in most provinces. Confirm whether your licence category covers selling online.
- [ ] Never sell above the printed **MRP** (maximum retail price) on medicine packs. The system enforces this.
- [ ] Supplements and nutraceuticals: sell only DRAP-enlisted or registered products.
- [ ] Medical devices (glucometers, BP monitors): sell only DRAP-registered or enlisted ones.

**Extra for Stage B (prescription medicines):**

- [ ] A **retail drug-sale licence** for your premises, under your province's drug rules.
- [ ] A **qualified pharmacist** (Category A, registered with the Pharmacy Council) in charge. The pharmacist reviews every prescription; the site records who approved each one.
- [ ] Show the licence number, the pharmacist in charge with registration number, and the premises address on every page (footer). The system has settings for these.
- [ ] **Never sell controlled drugs online**: narcotics, psychotropics, and anything your licence or DRAP says needs special handling. The system makes it impossible to publish a product marked controlled.
- [ ] Keep prescription records for the period your licence requires. The system keeps them, private, with who approved them and when.
- [ ] Privacy: prescriptions are health data. Only pharmacists, and the customer who uploaded one, can open it. Never use them for marketing.
- [ ] No "testimonials" for medicines. Reviews are switched off for medicine product types.

---

## 3. How the copy is made

1. **Merge the open fix first.** Urban Store PR #3 (database transaction timeouts) is merged into `E-commerce-` `main`, so the copy starts with it.
2. **Import the code into `cosmetics`.** Push `E-commerce-` `main` to the empty `cosmetics` repo, keeping history (or as one clean commit, if you prefer).
3. **Branch:** all conversion work happens on a feature branch, through pull requests, with CI green before each merge, as before.
4. **New services, nothing shared with Urban Store:**
   - a new Vercel project, Root Directory `apps/storefront`;
   - a new Neon database in Singapore;
   - new secrets (`JWT_ACCESS_SECRET`, `CRON_SECRET`, seed admin).
5. **The two stores live independently after the copy.** A fix in one is ported to the other by hand. This is simpler and safer than one codebase serving both shops.

---

## 4. What stays exactly as it is

These parts move across unchanged, apart from renaming and copy.

- **Architecture:** one Next.js site with the shop at `/`, the admin at `/admin` and the API at `/api/v1`; the Vercel build migrates and seeds; daily cron; `DEPLOYMENT.md` flow.
- **Accounts:** register and log in, cookies with refresh rotation, password reset, email verification, Google sign-in (optional), addresses, account pages.
- **Shopping:**
  - cart (guest and signed in, merged at login), wishlist, recently viewed;
  - back-in-stock alerts, abandoned-cart reminders, newsletter.
- **Checkout:**
  - live quote, shipping zones and COD fee, coupons, idempotent ordering;
  - atomic stock updates, order numbers, guest order links, track order, cancel;
  - PDF invoice and packing slip.
- **Admin:**
  - dashboard, reports and CSV exports, orders (fulfil, cancel, refund);
  - customers, messages, coupons, content (banners, pages, FAQ, announcement);
  - shipping zones, staff and roles, store settings, email settings, activity log.
- **Infrastructure:**
  - images in the database or from a CDN, with the custom loader;
  - rate limits, CSRF origin check, audit log, encrypted secrets, accessibility tests;
  - the CI pipeline and the Playwright suite structure.

---

## 5. What changes, area by area

### 5.1 Branding and naming

| Item                                         | Urban Store            | New store                                                                         |
| -------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------- |
| Store name, logo, favicon, OG image          | Urban Store, hood mark | Amazon Group (droplet + plus); new SVG mark, favicon and generated share image    |
| Colours (`packages/ui/src/styles/theme.css`) | ink + orange           | rose + teal + ink. Status colours stay WCAG AA                                    |
| Package scope                                | `@hoodie/*`            | `@store/*` (about 190 imports, scripted rename)                                   |
| Order number prefix                          | `US-`                  | `AG-`                                                                             |
| Emails, addresses, footer text               | Urban Store            | new name, with the licence and pharmacist line once set                           |
| Descriptions, SEO, structured data           | hoodies, "streetwear"  | beauty, skincare and pharmacy. Structured data becomes `Pharmacy` + `OnlineStore` |

### 5.2 Product data model (Prisma)

**Removed:** `enum Fit`, and `Product.fit`, `fabric` and `careInfo`.

**New enums**

```prisma
enum ProductType {
  MAKEUP
  SKINCARE
  HAIRCARE
  FRAGRANCE
  BATH_BODY
  PERSONAL_CARE
  MOTHER_BABY
  SUPPLEMENT
  OTC_MEDICINE
  PRESCRIPTION_MEDICINE
  MEDICAL_DEVICE
}

enum DosageForm {
  TABLET CAPSULE SYRUP SUSPENSION DROPS SPRAY INHALER
  CREAM OINTMENT GEL LOTION SACHET INJECTION PATCH OTHER
}

enum PrescriptionStatus { PENDING APPROVED REJECTED }
```

**New `Brand` model**

```prisma
model Brand {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  logoUrl     String?
  description String?
  country     String?  // "Pakistan", "France"…
  isFeatured  Boolean  @default(false)
  position    Int      @default(0)
  products    Product[]
}
```

**`Product`: new fields**

| Field                         | Type                 | Purpose                                                                                              |
| ----------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| `type`                        | `ProductType`        | Drives the rules: reviews, returns, Rx, which fields the admin form shows                            |
| `brandId`                     | `String?`            | Brand pages and filter                                                                               |
| `option1Name` / `option2Name` | `String` / `String?` | Labels for the two variant options, e.g. "Size" + "Shade", "Pack size" + –, "Strength" + "Pack size" |
| `ingredients`                 | `String?`            | Full INCI list for cosmetics; composition for medicines                                              |
| `howToUse`                    | `String?`            | Directions or dosage text, shown as a tab                                                            |
| `warnings`                    | `String?`            | Warnings, side effects, contraindications                                                            |
| `skinTypes`                   | `String[]`           | `OILY`, `DRY`, `COMBINATION`, `SENSITIVE`, `NORMAL` (cosmetics filter)                               |
| `concerns`                    | `String[]`           | `ACNE`, `PIGMENTATION`, `ANTI_AGEING`, `HYDRATION`, `SUN_PROTECTION`, `HAIR_FALL`, `DANDRUFF`…       |
| `gender`                      | `String?`            | `WOMEN`, `MEN`, `UNISEX` (fragrance and grooming)                                                    |
| `genericName`                 | `String?`            | Salt or formula, e.g. "Paracetamol", "Ibuprofen + Paracetamol" (search, alternatives)                |
| `strength`                    | `String?`            | e.g. "500 mg", "120 mg/5 ml"                                                                         |
| `dosageForm`                  | `DosageForm?`        | Tablet, syrup…                                                                                       |
| `manufacturer`                | `String?`            | e.g. "GSK Pakistan"                                                                                  |
| `drapRegNo`                   | `String?`            | DRAP registration number, shown on medicine pages                                                    |
| `requiresPrescription`        | `Boolean`            | True for Rx items; checkout asks for a prescription                                                  |
| `isControlled`                | `Boolean`            | Validation refuses `ACTIVE` while true                                                               |
| `storage`                     | `String?`            | "Store below 25 °C", "Refrigerate 2–8 °C"                                                            |
| `coldChain`                   | `Boolean`            | Only deliverable to zones that allow cold chain                                                      |
| `returnable`                  | `Boolean`            | Default false for medicines; drives the returns flow                                                 |
| `maxPerOrder`                 | `Int?`               | Quantity cap per order (e.g. 3 packs of a painkiller)                                                |

**`ProductVariant` changes**

- Rename `size` → `option1`, `color` → `option2` (nullable), `colorHex` → `swatchHex`. Shade swatches reuse the colour swatch UI.
- Add `mrp Int?`: the printed maximum retail price. Validation keeps the selling price at or below MRP.
- Add `barcode String?`: the EAN on the pack, for scanning when receiving stock and packing.
- `stock` becomes the **sum of usable batches**, kept in sync by the inventory service (5.6).

**New: batch and expiry tracking**

```prisma
model StockBatch {
  id         String   @id @default(cuid())
  variantId  String
  batchNo    String
  expiryDate DateTime
  quantity   Int               // units left in this batch
  costPrice  Int?              // for margin reports (optional)
  supplier   String?
  receivedAt DateTime @default(now())
  variant    ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  allocations OrderItemBatch[]
  @@unique([variantId, batchNo])
  @@index([variantId, expiryDate])
}

model OrderItemBatch {           // which batch each sold unit came from (recalls, packing slip)
  orderItemId String
  batchId     String
  quantity    Int
  @@id([orderItemId, batchId])
}
```

**New: prescriptions (Stage B)**

```prisma
model Prescription {
  id              String             @id @default(cuid())
  userId          String?
  orderId         String?            @unique
  mediaIds        String[]           // private uploads (photos/PDF), up to 3 pages
  patientName     String
  doctorName      String?
  issuedOn        DateTime?
  status          PrescriptionStatus @default(PENDING)
  reviewedById    String?            // pharmacist who decided
  reviewedAt      DateTime?
  pharmacistNote  String?            // internal
  rejectionReason String?            // shown to the customer
  createdAt       DateTime           @default(now())
}
```

**Other model changes**

- `Media`: add `isPrivate Boolean` and `ownerId String?`. Private files are never served from the public `/media` route, only through an authenticated route (5.8).
- `OrderStatus`: add `AWAITING_PRESCRIPTION`.
- `OrderItem` snapshot: add `requiresPrescription`, `genericName` and `strength`, so the invoice stays right if the product changes later.
- `User`: add `pharmacistRegNo String?`. Only staff with this set can approve prescriptions (5.11).
- `ShippingZone`: add `coldChainAvailable Boolean`.
- `Coupon`: add `excludeTypes ProductType[]`, e.g. no discount codes on prescription medicines.

**Migrations:** the new store starts with an empty database, so the Urban Store migrations are squashed into one fresh baseline migration with the new schema. This is cleaner than a chain of renames.

### 5.3 Categories and navigation

The tree uses the existing `Category.parentId` (two levels). The header becomes a **mega menu**.

- **Makeup:** Face (foundation, concealer, powder, blush, primer), Eyes (mascara, liner, kajal, eyeshadow, brows), Lips (lipstick, gloss, liner, balm), Nails, Brushes & tools
- **Skincare:** Cleansers, Toners, Serums, Moisturisers, Sunscreen, Masks, Eye care, Acne care, Lip care
- **Hair care:** Shampoo, Conditioner, Oils & serums, Hair colour, Treatments, Styling
- **Fragrance:** Women, Men, Body mists, Attar
- **Bath & body:** Body wash, Lotions, Deodorants, Hand & foot care
- **Personal care:** Oral care, Shaving, Feminine care, Men's grooming
- **Mother & baby:** Diapers & wipes, Baby skin & hair, Feeding, Maternity
- **Vitamins & supplements:** Multivitamins, Calcium & vitamin D, Omega-3, Iron, Immunity, Protein & sports
- **Pharmacy (OTC):** Pain & fever, Cold & flu, Allergy, Digestive care, First aid, Eye & ear, Skin treatments, ORS & rehydration
- **Prescription medicines** (Stage B): Diabetes, Blood pressure, Heart, Cholesterol, Thyroid, Antibiotics, Respiratory…
- **Medical devices:** BP monitors, Glucometers & strips, Thermometers, Nebulisers, Masks & gloves

**Collections** (curated): New arrivals, Best sellers, Deals, Sun care edit, Winter skincare, Ramadan & Eid gifts, Under Rs 1,000.

### 5.4 Shop pages

| Page                  | Change                                                                                                                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                  | Hero banners (beauty plus pharmacy), shop by category (icons), shop by brand (logo strip), shop by concern (acne, pigmentation…), deals, best sellers, a "Pharmacy essentials" row, an upload-prescription call to action (Stage B), trust badges (100% authentic, COD, pharmacist-checked) |
| Category / listing    | Filters: **brand**, **product type**, **skin type**, **concern**, price, in stock, Rx/OTC; sort by popularity, price, newest                                                                                                                                                                |
| **Brand pages** (new) | `/brands` A–Z, and `/brands/[slug]` with logo, description and products                                                                                                                                                                                                                     |
| Product page          | See 5.5                                                                                                                                                                                                                                                                                     |
| Size guide            | **Removed** (page, button, `lib/size-guide.ts`)                                                                                                                                                                                                                                             |
| Account               | New **Prescriptions** tab (Stage B): upload, status, reuse a valid one                                                                                                                                                                                                                      |
| Footer                | Licence number, pharmacist in charge, address, WhatsApp, "Authentic products" and "Prescription policy" links                                                                                                                                                                               |

### 5.5 Product page

- Brand name links to the brand page; then title, rating (non-medicine types only).
- **Price block:** the selling price, the MRP struck through when discounted, and "You save Rs X".
- **Options:**
  - `option1` / `option2` labelled by the product, e.g. "Shade" swatches + "Size: 30 ml / 50 ml";
  - "Strength: 250 mg / 500 mg" + "Pack: 10 / 20 tablets".
- **Badges:** "Prescription required", "Refrigerated item", "Non-returnable", "Only N per order", "100% authentic".
- **Tabs:** Description · Ingredients · How to use / Dosage · Warnings & side effects · Storage.
- **Medicine facts box:** generic name, strength, form, manufacturer, DRAP registration number.
- **"Same formula alternatives":** other products with the same generic name and strength, cheapest first.
- **Disclaimer on medicines:** "This information is for reference only. Follow your doctor's or pharmacist's advice."
- **Ask a pharmacist:** a WhatsApp link with the product name pre-filled.

### 5.6 Inventory, batches and expiry

**Receiving stock (admin):** pick the variant (or scan the barcode), then enter the batch number, expiry date, quantity and optionally cost and supplier. This creates or adds to a `StockBatch` and writes the inventory adjustment log as today.

**Selling (FEFO, first expiry first out):** inside the existing order transaction, units are taken from the earliest-expiring **usable** batch first. Each allocation is recorded in `OrderItemBatch`. Cancelling or restocking a return puts units back into the same batches.

**Usable** means the batch expires after today plus the **minimum shelf life** setting (default 90 days for medicines, 180 for cosmetics). No customer receives short-dated stock.

**Daily cron additions:**

- expired batches are taken out of available stock;
- the daily summary email lists items **expiring within 90 days** and expired stock to write off.

**Packing slip:** shows the batch number and expiry for each line, so the packer picks the right box.

**Reports:**

- expiry report (by month);
- stock valuation at cost (now possible because cost price is stored);
- batch trace ("who received batch X?") for recalls.

### 5.7 Cart and checkout rules

| Rule                                                     | Where it's enforced                                                                                      |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `maxPerOrder`                                            | Add to cart, change quantity, quote and checkout. The message reads "You can order up to 3 of this item" |
| Selling price ≤ MRP                                      | Admin product validation                                                                                 |
| Controlled items cannot be active                        | Admin validation and a database check                                                                    |
| Cold-chain items only to zones with `coldChainAvailable` | Quote says "Not deliverable to your city", and checkout refuses                                          |
| Coupons exclude some product types (e.g. Rx)             | Coupon evaluation; the excluded lines are shown                                                          |
| Rx in cart → prescription step (Stage B)                 | Checkout UI and API (5.8)                                                                                |

### 5.8 Prescription workflow (Stage B)

```
Customer adds an Rx item → checkout shows "Upload prescription" (photo or PDF, up to 3 pages)
   or picks a still-valid approved prescription from their account
→ order placed with status AWAITING_PRESCRIPTION; stock is RESERVED (not sold) for 48 h
→ pharmacist queue in the admin: view images (zoom/rotate), patient, doctor, date, cart lines
     ├─ Approve → stock reserved → sold (FEFO), order CONFIRMED, customer emailed
     └─ Reject (reason required) → reservation released, order CANCELLED, customer emailed with the reason
→ not reviewed in 48 h → cancelled automatically (daily/hourly job), customer told
```

- **Reuses the card-payment reservation logic:** reserve now, sell on confirmation, release on expiry. Rx orders behave like an unpaid card order that a pharmacist confirms instead of Stripe.
- **Private storage:** uploads go into `Media` with `isPrivate: true`. They are served by `GET /api/v1/prescriptions/:id/files/:n` only to the owner or to a staff member with `pharmacistRegNo`. They are never cached publicly (`Cache-Control: private, no-store`) and never in sitemaps.
- **Audit:** approve and reject decisions go to the audit log with the pharmacist's name and registration number.
- **Mixed carts** (Rx + cosmetics): one order; the whole order waits for approval. This is simpler for COD delivery.

### 5.9 Orders, returns and reviews

- **Order timeline:** gains "Prescription received", "Approved by pharmacist (name)" and "Rejected: reason".
- **Returns:** the request form only lists `returnable` items. Medicines can only be returned as "Damaged / wrong item / expired on arrival", and need a photo. The window comes from settings (default 7 days).
- **Reviews:** turned off for `OTC_MEDICINE` and `PRESCRIPTION_MEDICINE` (no review form, no stars). Kept for all other types, with moderation as today. The "How's your hoodie?" email becomes "How are you finding your purchase?" and skips medicines.

### 5.10 Search and discovery

- The search index adds **generic name, brand name and ingredients** next to the title. "paracetamol" finds Panadol and Calpol; "niacinamide" finds serums.
- **Synonyms table** (admin-editable): e.g. "sunblock" ↔ "sunscreen", "facewash" ↔ "cleanser", plus common misspellings.
- Suggestions show the brand and an Rx badge.
- "Shop by concern" and "shop by skin type" landing pages, using the new fields.

### 5.11 Admin panel

| Area                             | Change                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product form                     | **Type** selector first. The fields shown depend on it: cosmetics show brand, shade/size, ingredients, skin types, concerns; medicines show generic name, strength, form, manufacturer, DRAP number, MRP, Rx and controlled flags, storage, cold chain, max per order. The variant generator uses the option labels |
| **Brands** (new)                 | Create and edit, logo upload, featured order                                                                                                                                                                                                                                                                        |
| Inventory                        | Batches per variant: receive stock, adjust, write off expired; filters for expiring soon and expired                                                                                                                                                                                                                |
| **Prescriptions** (new, Stage B) | Queue (oldest first), viewer, approve and reject, history, search by customer                                                                                                                                                                                                                                       |
| Dashboard                        | New cards: "Prescriptions waiting", "Expiring in 90 days", "Expired in stock"                                                                                                                                                                                                                                       |
| Reports                          | Expiry report, stock at cost, sales by brand and by product type                                                                                                                                                                                                                                                    |
| Store settings                   | Pharmacist in charge (name, registration number), drug licence number, minimum shelf life (medicines / cosmetics), prescription review window (48 h), WhatsApp number                                                                                                                                               |
| Staff                            | Pharmacist registration number field. Only those staff can approve prescriptions, **whatever their role** (a manager who isn't a pharmacist can't approve)                                                                                                                                                          |
| Notifications badge              | Adds prescriptions waiting                                                                                                                                                                                                                                                                                          |

### 5.12 Roles and permissions

The roles stay `SUPPORT < MANAGER < SUPER_ADMIN`.

**Prescription approval is a capability, not a rank:** it needs `pharmacistRegNo` on the staff account. Prescription images are visible to pharmacists and Super Admins only (Super Admins for audit).

### 5.13 Emails

| New or changed                    | Content                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| Prescription received             | "We've received your prescription for order AG-…; a pharmacist will review it within 48 hours" |
| Prescription approved             | Order confirmation, with "Checked by pharmacist (name)"                                        |
| Prescription rejected             | The reason, how to upload a new one, and confirmation that nothing will be charged (COD)       |
| Prescription not reviewed in time | Apology, order cancelled, how to reorder                                                       |
| Daily summary (staff)             | Adds prescriptions waiting, expiring and expired stock                                         |
| Review request                    | Generic wording; skips medicines                                                               |

All of these still send nothing until email is set up in the admin.

### 5.14 Content pages (seeded, editable in the admin)

- **About us:** who we are, authentic sourcing, the pharmacist on staff.
- **Authenticity guarantee:** authorised distributors only, batch and expiry checked.
- **Prescription policy:** what we accept, how to upload, what we can't sell (controlled drugs), privacy.
- **Shipping:** cities, times, cold chain rules.
- **Returns & refunds:** cosmetics (unopened, 7 days) and medicines (only damaged, wrong or expired), COD refunds by bank transfer or JazzCash/Easypaisa.
- **Privacy:** adds a section on health data and prescriptions.
- **Terms:** adds a medical disclaimer, no medical advice, and our right to refuse Rx orders.
- **FAQ:** how to upload a prescription, are products authentic, expiry dates, shades, COD.

### 5.15 Starter catalogue (seed)

- **About 60 demo products** across the categories (for example 25 beauty/skincare/hair, 6 fragrance, 8 personal and baby care, 8 vitamins, 9 OTC, 4 devices), with 10–15 real brands.
- Prices are researched from current Pakistani retail listings when the seed is written. Medicines use the printed MRP.
- **Images:**
  - Banners and category tiles use free Unsplash photos of beauty and pharmacy scenes, with no brand logos visible.
  - **Product photos must be your own or from your distributors.** Brand packaging photos from other websites belong to their owners.
  - Until real photos exist, the seed uses clean generated placeholders: a coloured tile with the product type icon and name.
- When you send your stock list (a spreadsheet: name, brand, type, generic, strength, size/shade, MRP, price, barcode), it is loaded by a small **CSV import** in the admin, added in Phase 3.

### 5.16 SEO

- Product structured data: `Product` for cosmetics; `Drug` / `MedicalWebPage` details for medicines (generic name, dosage form, prescription status).
- Store structured data: `Pharmacy` + `OnlineStore`, with the address and licence once set.
- Sitemap: products, brands, categories and pages. Never prescriptions, account or admin pages.

### 5.17 Deployment

The same as Urban Store's `DEPLOYMENT.md`:

1. a new Vercel project (Root Directory `apps/storefront`);
2. Neon (Singapore) connected through Storage;
3. four variables: `JWT_ACCESS_SECRET`, `CRON_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`;
4. deploy.

The custom domain is added in the project settings.

---

## 6. Phases, tasks and acceptance criteria

Each phase is one pull request (or two for the large ones), merged only with CI green: lint, typecheck, unit and API tests, build, and e2e. Size: **S** ≈ one working session, **M** ≈ 2–3, **L** ≈ 4–6.

### Phase 0: Decisions and preparation (you) · S

- [ ] Answer section 1. Start the licence checklist (section 2).
- [ ] Send the logo idea or colours, and the brand list or stock spreadsheet if you have one.

### Phase 1: Copy and rebrand · S · ✅ done

- [x] Import Urban Store into `cosmetics` with its history, including the order fix from Urban Store PR #3.
- [x] Rename packages `@hoodie/*` → `@store/*`. Rename the store, emails, order prefix `AG-`, footer, metadata, database and queue names.
- [x] New logo (SVG mark + wordmark), favicon, OG image and colour tokens (teal + rose). Contrast checked by the accessibility tests.
- [x] Remove hoodie-specific code: `Fit`, the size guide and clothing copy in emails, invoices, pages and tests.
- [x] Pulled forward from Phase 2: product **ingredients**, **how to use** and **warnings** (replacing fabric and care), free-text pack sizes ("30 ml", "60 softgels") sorted naturally, the colour picker renamed **Shade** and hidden when there is only one.
- [x] Returns: 7-day window for unopened items; reasons "Wrong shade or size" and "Expired or close to expiry".
- [x] Temporary seed: 9 demo products (8 live, 1 draft) in 5 categories, brand-free Unsplash photos, pack sizes with their own prices.
- **Done when:** the site builds and every test passes (246 API, 51 end-to-end, unit tests), with no "hoodie"/"Urban Store" left in the app except in Git history. ✅

### Phase 2: Product model, brands and categories · L

- [ ] Schema changes in 5.2 except batches and prescriptions: `ProductType`, `Brand`, options rename, cosmetic and medicine fields, MRP, barcode, coupon exclusions, cold-chain zone flag. Fresh baseline migration.
- [ ] API: product, brand and filter endpoints; validation (price ≤ MRP, controlled ≠ active); mappers and DTOs in `packages/types`; Zod schemas in `packages/validation`.
- [ ] Category tree, mega menu, brand pages, new filters (brand, type, skin type, concern, Rx/OTC).
- [ ] Product page (5.5) with option labels, tabs, medicine facts, badges, MRP block, disclaimer, WhatsApp button.
- [ ] Admin product form by type, Brands page, variant generator with option labels.
- **Done when:** a manager can create a lipstick (shades) and an OTC tablet (strength × pack) in the admin. Both show correctly in the shop and filter correctly, and API tests cover every rule.

### Phase 3: Catalogue, content and import · M

- [ ] Seed about 60 products, 10–15 brands, the category tree and collections. Banners from Unsplash; product placeholders generated.
- [ ] Write all content pages (5.14) and the FAQ.
- [ ] Admin **CSV import** (create or update products and variants by SKU or barcode) with a preview and error report.
- **Done when:** the home page, category pages and brand pages look complete on phone and desktop, and importing a 50-row spreadsheet works.

### Phase 4: Batches and expiry · M

- [ ] `StockBatch` and `OrderItemBatch`; stock kept equal to the sum of usable batches.
- [ ] FEFO allocation in the checkout transaction; restock to the same batch on cancel or return.
- [ ] Admin receiving (with barcode entry), batch list, write-off; expiry filters and report; packing slip batch and expiry.
- [ ] Minimum-shelf-life setting; the daily cron removes expired stock and adds expiry to the daily summary.
- **Done when:** tests prove a sale takes the earliest-expiring usable batch, never an expired or short-dated one, and stays correct with two shoppers buying the last units at once.

### Phase 5: Pharmacy rules (Stage A complete) · M

- [ ] Max per order, cold-chain zones, coupon exclusions, non-returnable items and the medicine return reasons.
- [ ] Reviews off for medicine types; neutral review-request email.
- [ ] Settings: pharmacist, licence, WhatsApp; footer and structured data use them.
- [ ] Medicine disclaimers and "same formula alternatives".
- **Done when:** every rule in 5.7 and 5.9 has an API test and at least one e2e test. **Stage A can launch after Phases 7–8.**

### Phase 6: Prescriptions (Stage B) · L · _start once the licence and pharmacist are confirmed_

- [ ] `Prescription` model, private media and the authenticated file route; uploads (images or PDF, resized in the browser, at most 3 pages).
- [ ] Checkout prescription step; account Prescriptions tab with reuse of an approved one.
- [ ] Order status `AWAITING_PRESCRIPTION`, a 48-hour reservation, and auto-cancel.
- [ ] Admin pharmacist queue with viewer, approve and reject, audit log, and dashboard and notification counts.
- [ ] Emails in 5.13.
- **Done when:** e2e covers upload → reject with reason → re-upload → approve → deliver. Security tests show another customer, or staff without `pharmacistRegNo`, can't open or approve a prescription.

### Phase 7: Search and discovery · M

- [ ] Search on generic name, brand and ingredients; admin-editable synonyms; suggestions with badges.
- [ ] Concern and skin-type landing pages; brand A–Z.
- **Done when:** "paracetamol", "sunblock" and "niacinamde" (misspelt) all return the right products.

### Phase 8: QA, launch and handover · M

- [ ] Accessibility (axe) on all new pages; Lighthouse ≥ 90 on mobile.
- [ ] Security review: prescriptions, private media, permissions, uploads.
- [ ] Full e2e run; a load test on listing, search and checkout.
- [ ] `README`, `DEPLOYMENT.md` and a short **staff guide** (receiving stock, packing with batches, reviewing prescriptions, writing off expired stock).
- [ ] Vercel and Neon set up, a production deploy, and a test order.
- **Done when:** a real COD order is placed and delivered end to end on the live site.

**Order of work:** 1 → 2 → 3 → 4 → 5 → 7 → 8 (**Stage A live**) → 6 (**Stage B**, when licensed).

---

## 7. Testing plan

**API tests (Vitest + Supertest)**, added per phase:

- **Products:** price ≤ MRP; controlled can't be active; options validate by type; brand CRUD; filters (brand, type, skin type, concern, Rx).
- **Cart and checkout:** max per order (cart, quote, checkout); cold-chain zone refusal; coupon exclusions.
- **Batches:** FEFO order; minimum shelf life; expired excluded; concurrent last-unit sale; cancel and return restock to the same batch; the daily expiry job.
- **Returns:** non-returnable items refused; medicine return reasons only.
- **Reviews:** refused for medicine types.
- **Prescriptions:**
  - upload limits and types;
  - private file access (owner, pharmacist, nobody else);
  - approve and reject transitions, reservation and release, 48-hour auto-cancel;
  - only `pharmacistRegNo` staff can approve;
  - audit log entries.

**E2E (Playwright)**, extending the 51 Urban Store tests:

- browse by brand and concern;
- shade selection;
- an OTC order over the per-order limit is refused;
- an OTC order by COD succeeds;
- the expiry report;
- receiving stock with batch and expiry in the admin;
- prescription upload → pharmacist approval → order confirmed (Stage B);
- accessibility checks on all new pages.

**Manual checks before launch:**

- phone (Android Chrome) checkout;
- PDF invoice and packing slip with batch numbers;
- emails rendered in Gmail.

---

## 8. What you need to provide

| When           | What                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before Phase 1 | Store name and domain; colours or logo idea; whether Stage B is planned                                                                                       |
| Phase 3        | Brand list, or your stock spreadsheet (name, brand, type, generic name, strength, size/shade, MRP, selling price, barcode); product photos when you have them |
| Phase 5        | Pharmacist in charge (name, registration number), drug licence number, premises address, WhatsApp number, delivery cities and fees                            |
| Phase 8        | Vercel and Neon set up (as for Urban Store); email (Gmail app password or Resend)                                                                             |

---

## 9. Risks and how they are handled

| Risk                                                         | Handling                                                                                                                    |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Selling Rx or controlled medicines without the right licence | Stage B is built but switched off until the licence is confirmed; controlled items can never be published                   |
| Counterfeit cosmetics                                        | Brand pages show "sourced from authorised distributors"; batch numbers are recorded for every sale, so recalls are possible |
| Expired or short-dated stock reaching customers              | FEFO plus the minimum-shelf-life rule; daily expiry alerts                                                                  |
| Health-data privacy                                          | Private storage, strict access, no public caching, audit log                                                                |
| Product photo rights                                         | Only your own or distributor photos for products; Unsplash only for general imagery                                         |
| Slow pages if the database is far away                       | Neon in Singapore, matching the function region; transaction timeouts already raised (PR #3)                                |
| The two stores drift apart                                   | A short "ported fixes" list in each README; important fixes copied across                                                   |

---

## 10. Later (after launch)

- **Refill reminders** for monthly medicines (email or WhatsApp a few days before they run out).
- **Loyalty points** and referral codes.
- **WhatsApp order updates** (WhatsApp Business API).
- **Urdu** interface and Roman-Urdu search terms.
- **Card payments** (Stripe is already built in and just needs keys) or local wallets (JazzCash/Easypaisa).
- **Doctor e-consultation** partner link; **lab test booking**.
- **Mobile app** (the API is ready for it).

## Prescriptions (upload and pharmacist review)

- **Customers** (`/prescription`, linked from the header, mobile menu, footer and home page): upload up to 3 photos or PDFs of a prescription with the patient's name, phone, city, optional address, email and note, and whether an equivalent brand is allowed. Photos are resized to 2,000 px and re-saved as JPEG in the browser (smaller uploads on mobile data, and the photo's hidden location details are dropped). Guests can upload; signed-in customers see theirs, with the pharmacist's note and order number, under **Account → Prescriptions**.
- **Pharmacist** (admin **Sales → Prescriptions**, with a badge for new ones): views the files privately, calls or WhatsApps the customer, then marks it **In review**, **Confirmed** (with a note and the order number), **Not accepted** or **Delivered**. The customer is emailed at each status change when they gave an email. Managers can delete a prescription and its files for good (privacy requests).
- **Privacy:** files are stored in their own table, never public. Only staff can open them, they are never cached, and every view is in the audit log. The file type is checked from its bytes (photos and PDFs only), up to 2 MB each and 3 MB together.
- **API:** `POST /prescriptions` (guests and customers, rate-limited), `GET /prescriptions` (mine), `GET|PATCH|DELETE /admin/prescriptions…`. Migration `20261121120000_prescriptions` only adds two tables.
- **Next step (not built yet):** marking products as "prescription required" and asking for the prescription at checkout for those products.

## Detailed order tracking

- Orders now go through: Confirmed → Being prepared → **Packed** → Shipped → **In transit** → **Out for delivery** → Delivered. Migration `20261121130000_order_tracking_statuses` only adds the three new values; existing orders are unchanged.
- Staff can skip steps the courier didn't report: being prepared can go straight to shipped, and shipped or in transit straight to delivered. Packed orders can still be cancelled (stock goes back); once shipped they can't.
- The customer's tracker (order page and Track order) shows six steps with the date and time of each, vertical on phones and horizontal on wider screens. "In transit" shows on the Shipped step.
- When an order goes out for delivery, the customer is emailed that it arrives today and, for Cash on Delivery, how much cash to keep ready.
- Admin: the usual next step is the main button and the others are secondary. "To fulfil" includes packed orders, and the "With courier" filter shows shipped, in-transit and out-for-delivery orders.
