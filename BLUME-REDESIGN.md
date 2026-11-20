# Blume-style redesign: Amazon Group storefront

The client liked the Blume Technical Services site, so the shop now uses its
design language: navy and gold, huge uppercase headings, frosted-glass
surfaces and calm, premium motion. Only Blume's look is used. Amazon Group's
own content, data and features are unchanged.

## What was taken from Blume

| Blume                                                             | Amazon Group                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navy `#0A1128` / `#050A18`, gold `#D4AF37`                        | Same. `brand-*` is now navy and `accent-*` is gold, in `packages/ui/src/styles/theme.css`. Gold text on white uses the darker `accent-700` (`#8C6D10`, contrast 4.9:1). The bright gold is for fills (with navy text) and for text on navy.                                |
| Plus Jakarta Sans, 900-weight uppercase headings, tight tracking  | Same font as before. New `display` utility for hero and section headings.                                                                                                                                                                                                  |
| Small gold labels with a dot ("• OUR STORY")                      | New `eyebrow` utility, used above every section heading.                                                                                                                                                                                                                   |
| Floating glass pill header with a pill nav                        | `components/layout/header.tsx` and `nav-pills.tsx`. The header floats as a frosted pill. The categories sit in a white pill where the current page is a navy chip, and Offers is gold. The cart is a navy pill.                                                            |
| Dark hero, giant type, glass card                                 | `components/home/hero-carousel.tsx`: navy stage with the banner photo slowly zooming (8 s), giant uppercase title, gold pill button with an arrow circle, and a glass card featuring the top best seller.                                                                  |
| Stats row with thin dividers                                      | `StatsRow`: products in stock and number of categories (both from the catalogue), 100% genuine, 7-day returns.                                                                                                                                                             |
| A sentence with photos set into the text                          | `Statement`, using the category photos.                                                                                                                                                                                                                                    |
| Navy ticker                                                       | `Marquee`: the categories and the store's promises. Pauses on hover.                                                                                                                                                                                                       |
| Numbered glass cards ("01") with arrow circles                    | `CategoryCards`: each category with its photo, count and description.                                                                                                                                                                                                      |
| Project photo cards with gradients and glass tags                 | `Showcase`: four categories in a magazine-style grid.                                                                                                                                                                                                                      |
| Dark panel with a pulsing "open" dot                              | `PharmacyPanel`: the "prescription medicines coming soon" message, with a 3-step explanation.                                                                                                                                                                              |
| FAQ: heading on the left, questions on the right                  | `FaqTeaser`: the store's real FAQs from the CMS.                                                                                                                                                                                                                           |
| Navy footer with gold column markers                              | `components/layout/footer.tsx`. The newsletter band is now dark navy with a gold button.                                                                                                                                                                                   |
| Motion: reveal on scroll, hover lift, slow zoom, arrows that move | `.reveal` and `.reveal-card` in `apps/storefront/app/globals.css`, driven by scroll position (no JavaScript, nothing hidden if unsupported). Cards lift 6 px on hover. Photos zoom slowly. Arrow circles turn on hover. Easing is `cubic-bezier(.16,1,.3,1)`, as on Blume. |

Product cards, rails, page headers, the logo (navy tile, gold plus), the
favicon, the social share image and the admin panel all use the new palette.

## Not copied, on purpose

- **Smooth-scrolling library (Lenis):** it adds JavaScript and can fight
  keyboard and assistive scrolling. The browser's own scrolling is used.
- **Gold body text on white:** it fails contrast, so the darker gold is used for text.
- **Uppercase product names and buttons:** names stay in normal case, which is easier to read and search.
- **Reduce motion:** reveals, the ticker and the hero zoom are off with Reduce
  motion, and everything is shown in place.

## Checks

- Accessibility checks (axe) pass on all shop and admin pages, including colour contrast.
- The full Playwright suite and the animation tests pass.
