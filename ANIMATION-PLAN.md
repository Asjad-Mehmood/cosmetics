# Animation Plan: Amazon Group storefront

> **Status: all eight phases are built** (see the notes under each).

## Goal

Make the shop feel quick, smooth and responsive on a mid-range Android phone in
Pakistan, without making it slower or harder to use. Every animation should do
one of three jobs:

1. **Show that something happened.** Added to cart, saved to the wishlist,
   voucher copied, coupon applied or rejected.
2. **Show where things came from and went.** A drawer slides in from the cart
   icon side, a sheet rises from the bottom, a menu drops from its button.
3. **Make waiting feel shorter.** On every page switch, show the new page's
   layout right away while its data loads.

No animation is there just for decoration. If one doesn't do one of these jobs,
it's cut.

> Part of the lag on page switches is the database being in the USA while the
> site runs in Singapore (see the chat about moving Neon to Singapore). Moving it
> fixes the real delay; this plan fixes how the wait _feels_. Do both.

## Ground rules

| Rule                                                                           | Why                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Animate only `transform` and `opacity` (plus `clip-path` and colours)          | These run on the GPU, so they don't cause layout jank or hurt INP.                                                                                                                                                                       |
| UI feedback 120–200 ms; panels 200–300 ms; nothing over 500 ms except the hero | It feels fast. People shouldn't wait for an animation.                                                                                                                                                                                   |
| Exits are faster than entrances (about 70%)                                    | Closing should feel instant.                                                                                                                                                                                                             |
| Never block input while animating                                              | You can tap "Add to cart" again, or close a drawer mid-slide.                                                                                                                                                                            |
| Respect **Reduce motion**: no movement, only quick fades, or nothing           | Accessibility (WCAG 2.3.3) and motion sickness. The global reset in `globals.css` stays. New effects also use Tailwind's `motion-safe:` so they're opt-in.                                                                               |
| No layout shift (CLS stays 0)                                                  | Skeletons have the same size as the real content.                                                                                                                                                                                        |
| No new animation library                                                       | Modern CSS covers it: `@starting-style`, `transition-behavior: allow-discrete`, scroll-driven animations and View Transitions. The bundle stays the same size. If one effect later truly needs a library, it's loaded only on that page. |
| Progressive enhancement                                                        | Browsers without a newer feature just skip that animation. Nothing breaks.                                                                                                                                                               |

## Phase 1: Motion foundation (shared UI package)

Add to `packages/ui/src/styles/theme.css`:

- **Durations:** `--duration-fast` (120 ms), `--duration-base` (200 ms), `--duration-slow` (320 ms) and `--duration-hero` (600 ms).
- **Easings:**
  - `--ease-out` (standard): `cubic-bezier(.2,.8,.2,1)`
  - `--ease-in` (exits)
  - `--ease-spring`: a light overshoot built with CSS `linear()`, used for "pop" feedback.
- **Keyframes and `animate-*` utilities:**
  - `fade-in`, `fade-up` and `scale-in`
  - `slide-in-right`, `slide-in-left` and `slide-in-bottom`
  - `pop`: for badges and hearts
  - `shake`: for errors
  - `shimmer`: for skeletons
  - `draw`: SVG checkmark stroke
- **Helpers:**
  - a `stagger` utility using a `--i` index on list items
  - a small `useReducedMotion()` hook for the few JavaScript-driven effects

**Done when:** tokens are documented in the file, the `Skeleton` component uses
`shimmer`, and Reduce motion turns every one of them off.

> **Built (phase 1).** The tokens, keyframes and `stagger` utility are in
> `packages/ui/src/styles/theme.css`; `Skeleton` shimmers; `useReducedMotion()`
> is exported from `@store/ui`. Under "Reduce motion" looping animations now run
> once instead of flickering (`apps/storefront/app/globals.css`).

## Phase 2: Instant page switches (fixes the "jerk")

Currently only `/shop` and `/search` have a `loading.tsx`. Every other page waits
on a blank screen until its data arrives.

- **Skeletons that match each page's real layout.** Add a `loading.tsx` to:
  - home
  - product page
  - category, collection and offers pages
  - cart
  - the account pages, orders and order detail
  - track order and the content pages
- **Page enter:** the main content fades up 8 px over 200 ms when it mounts. The header, category bar and bottom nav stay still.
- **Navigation progress bar:**
  - A 2 px bar in the brand colour runs along the top while a page is loading. It uses Next's `useLinkStatus`, so there's no extra library.
  - It appears only if the switch takes more than 150 ms.
  - Tapping a link that's still loading dims it slightly.
- **Prefetch:**
  - Category bar, mega menu and product cards prefetch on hover (desktop) and when visible (mobile). With skeletons in place, the next page shows immediately.
  - Rails only prefetch the first few cards, to save data.
- **Later, optional:** View Transitions cross-fade between pages, and a product photo that "flies" from the card into the product page. This only works in supporting browsers, behind Next's `viewTransition` flag once it's stable.

**Done when:** in a throttled Fast 3G Playwright run, every shop route shows its skeleton within 100 ms of the click. CLS stays 0.

> **Built (phase 2), with one change from the plan.** A `loading.tsx` on a
> page that can be "not found" (products, categories, collections, orders,
> policies) makes a missing page answer 200 instead of 404, which hurts search
> ranking. So the skeletons are shown on the client instead, the moment a link
> is clicked, and the server's responses are unchanged:
>
> - `apps/storefront/lib/navigation.ts`: the page switch in progress.
> - `apps/storefront/components/layout/navigation-feedback.tsx`:
>   - It detects link clicks.
>   - It prefetches the next page when a mouse rests on a link (80 ms), a finger touches one or a link gets keyboard focus.
>   - It shows the progress bar (in the rose accent, so it shows on the teal bar too).
>   - In `RouteView`, it swaps in the next page's skeleton after 100 ms and fades the new page in. The first page of a visit is not animated.
> - `apps/storefront/components/skeletons/page-skeletons.tsx`: the home, product, listing, cart, account and content skeletons.
> - `e2e/motion.spec.ts`: tests for the skeleton, the progress bar, hover prefetch and ignored clicks. The rest of the suite runs with Reduce motion.
>
> Measured with every page request delayed by 1.2 s:
>
> - The skeleton shows about 0.2 s after a click.
> - A switch to a page prefetched on hover takes about 70 ms.
> - A missing product still returns 404.

## Phase 3: Overlays: drawers, sheets, menus

All of these come from the shared `Dialog` and the header components. Fix them once and they're fixed everywhere, admin included.

- **`Dialog`:**
  - `center` scales from 96% and fades in; `right` and `left` slide in from their side; `bottom` slides up as a bottom sheet.
  - The backdrop fades in and its blur grows.
  - **Exit animations too.** The native `<dialog>` currently vanishes at once. Fix with `@starting-style` plus `transition-behavior: allow-discrete` on `display` and `overlay`.
- **Bottom sheet (mobile filters, quick add):**
  - Drag the handle down to close; a short drag springs back.
  - Content scrolls on its own, not the page behind it.
- **Small menus:**
  - Mega menu: drops 4 px and fades; its chevron already rotates.
  - Search suggestions: fade and scale from the top. The highlighted row's background slides between rows.
  - Account and mobile menus use the same motion.
- **Toasts (`sonner`):** match its timing and easing to our tokens, so they slide up on mobile and in from the bottom-right on desktop.

**Done when:** every overlay animates both opening and closing, and Escape, the backdrop click and the back button still close it instantly.

> **Built (phase 3).** Overlay styles are in `packages/ui/src/styles/theme.css`
> (`.ui-dialog`, `.ui-popover`):
>
> - **`Dialog`:** the centre dialog scales and fades in, drawers slide in from their side, and the bottom sheet rises. All of them animate closed as well, and the backdrop fades in and blurs slightly.
> - **Bottom sheets:** drag the top bar down more than 80 px (or flick it) to close; a short drag springs back.
> - **Dropdowns:** the mega menu and search suggestions fade and drop in and out.
> - **Reduce motion:** overlays open and close instantly, with no transition at all.
> - **Toasts (`sonner`):** left on their own animation for now.
> - **Tests:** `e2e/motion.spec.ts` covers the drawer exit and the sheet drag.
>
> A finding from testing: a closed overlay stays on screen until its closing
> animation ends. Tests and other code must not expect it to vanish instantly
> unless Reduce motion is on.

## Phase 4: Shopping feedback (the "it worked" moments)

| Where                                       | Animation                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Add to cart** button                      | Label turns into a spinner, then a ✓ "Added" for 1.2 s, then back. The button keeps its size.                             |
| **Cart badge** in the header and bottom nav | "Pop" when the count changes; the number rolls to the new value.                                                          |
| **Fly to cart** (desktop and mobile)        | A small copy of the product photo arcs to the cart icon in 450 ms. Skipped under Reduce motion and on very small screens. |
| **Wishlist heart**                          | Fills with a spring "pop" and a small burst of 6 dots. Un-saving just fades.                                              |
| **Quantity stepper**                        | The number slides up or down; buttons press in (`scale .95`).                                                             |
| **Cart lines**                              | A removed item collapses its height and fades; the totals tick to the new amount.                                         |
| **Free-delivery bar**                       | The fill animates to the new width. On reaching free delivery: one shimmer and a ✓.                                       |
| **Voucher "Copy" / "Apply"**                | Changes to "Copied ✓"; the ticket has a light stamp effect.                                                               |
| **Coupon form**                             | Success: a green ✓ draws in. Error: the field shakes (2 cycles, 300 ms) and the message fades in.                         |
| **Size and shade chips**                    | The selected ring slides between options, not a hard swap.                                                                |

**Done when:**

- These run off the existing React Query mutation states, with no fake delays.
- Screen readers still hear the same text announcements; these already exist through `sonner` and live regions.

> **Built (phase 4).** Shared pieces are in `apps/storefront/app/motion.css`,
> `apps/storefront/lib/motion.ts` (`flyToCart`, `useFlash`, `shake`,
> `useTweenedNumber`, `useSlidingHighlight`) and `apps/storefront/components/motion.tsx`
> (`RollingNumber`, `TweenedMoney`, `DrawnCheck`, `Burst`, `Confetti`).
>
> - **Differences from the plan:**
>   - The fly-to-cart takes 650 ms, not 450 ms. It is easier to follow.
>   - The cart opens when the photo lands.
>   - A removed cart line folds away while the request runs, and comes back if the request fails.
>   - The coupon shake uses the Web Animations API, so the field keeps what was typed and keeps focus.

## Phase 5: Product page

- **Gallery:**
  - Photos cross-fade on desktop. On mobile you can swipe them, with scroll-snap and page dots.
  - The thumbnail selection ring slides between thumbnails.
  - The existing hover zoom fades in instead of popping.
- **Sticky "Add to cart" bar (mobile):** slides up once the main button scrolls out of view, and back down when it returns. The state already exists (`showBar`).
- **Details tabs and accordion:** on mobile, sections open with an animated height using `interpolate-size: allow-keywords`; other browsers just open instantly. On desktop, the tab underline slides between tabs.
- **Frequently bought together:** "Add all" adds the items one after another, 80 ms apart, with a ✓ on each.
- **Reviews:** star bars fill when they scroll into view, once.

> **Built (phase 5).**
>
> - **Gallery:** the photo cross-fades and the thumbnail ring slides.
> - **Hover zoom:** eases in over 500 ms.
> - **Sticky bar:** slides up instead of appearing.
> - **Details:** the tab underline slides; on phones the accordion opens with an animated height (`.details-animated`).
> - **Frequently bought together:** "Add all" puts a ✓ on each photo in turn.
> - **Reviews:** the star bars fill as they scroll into view.
> - **Low stock:** the dot pings.

## Phase 6: Home and listing pages

- **Hero carousel:**
  - Swipe support on touch.
  - The active dot fills like a progress bar for the autoplay timer.
  - Pauses on hover, on focus and when the tab is hidden.
  - Under Reduce motion: cross-fade, no autoplay.
- **Scroll reveal:**
  - Section headings and rails fade up as they enter the screen, once.
  - Product cards appear in a short stagger (40 ms each, at most 6).
  - Uses CSS scroll-driven animations (`animation-timeline: view()`), with an IntersectionObserver fallback.
  - Content above the fold never animates, so it doesn't delay LCP.
- **Rails:** scroll-snap, desktop arrow buttons that fade in on hover, and edge fades showing there's more.
- **Product cards:**
  - Keep the current lift and photo swap.
  - Add a press-in effect on touch.
  - Badges (Sale, New) slide in from the corner.
- **Filters and sorting:**
  - When results update, the old grid dims to 60% and new cards fade in. Nothing jumps.
  - Active filter chips scale in and out.
  - The results count ticks to the new number.
- **Shop by category / concern tiles:** the hover ring and icon lift already exist. Add a press effect on mobile.

> **Built (phase 6).**
>
> - **Hero:** each slide's text comes in line by line, and the photo drifts closer.
> - **Hero dot and timer:** the active dot fills as a progress bar, and the slide changes when it is full. Pausing on hover, on focus or in a hidden tab freezes both together.
> - **`<Reveal>`** (`components/reveal.tsx`): sections and rails fade up the first time they scroll into view, and cards come in one after another. It uses an IntersectionObserver instead of scroll-driven CSS, because rails scroll sideways and the CSS version would not work inside them. Content on screen at load, content without JavaScript, and content under Reduce motion is never hidden.
> - **Rails:** edge fades show there is more to scroll.
> - **Cards and tiles:** cards lift on hover, cards and tiles press in on touch, and sale badges slide in.
> - **Filters:** the results dim and blur slightly while loading, then the new cards fade up in turn. The first load is not animated, so LCP is not delayed.
> - **Counts and chips:** the count ticks to its new value, and filter chips scale in.

## Phase 7: Checkout, orders and account

- **Checkout:**
  - Steps (address → delivery → payment) slide left and right to show direction.
  - An error summary scrolls into view and pulses once.
- **Order placed:**
  - A checkmark draws in (SVG `stroke-dashoffset`).
  - A short confetti burst from the brand and accent colours (CSS only, about 1 s, once). Skipped under Reduce motion.
  - The order number fades in.
- **Order progress timeline:** the line fills up to the current step; the current step pulses gently twice.
- **Account:** the address book, wishlist and returns lists use the same remove-collapse and add-fade as the cart.

> **Built (phase 7).**
>
> - **Checkout:** sections fade up in turn, and the one being filled in is highlighted. A form error shakes so it is noticed after the scroll up. Checkout is one page, not separate steps, so the planned sliding between steps does not apply.
> - **Order placed:** the check draws itself, confetti in the logo colours, and the text fades in.
> - **Order progress:** the steps fill one after another, and the current step pulses twice.
> - **Address book:** addresses fade in, and fade and shrink away while being deleted.

## Phase 8: Admin (keep it calm)

Staff use the admin all day, so motion stays minimal:

- It inherits the `Dialog`, toast and skeleton improvements from phases 1–3.
- Table rows fade when filtered.
- Save buttons go spinner → ✓.
- Nothing else.

> **Built (phase 8).**
>
> - **Table rows:** new admin table rows fade in.
> - **Save buttons:** a button that started a successful save shows a ✓ for 1.2 s. This is done once, in the admin's React Query `MutationCache`, so every save button gets it without changes to each form.

## GSAP layer

Added on request, on top of phases 1–8. GSAP 3.15 (free for commercial use, all plugins included) is used where CSS cannot do the job well.

**Loading (`apps/storefront/lib/gsap.ts`)**

- GSAP and its plugins (ScrollTrigger, SplitText, MotionPath, Physics2D, CustomEase) are loaded with a dynamic import after the page is interactive. They are not in the first-load JavaScript.
- GSAP is never loaded at all with Reduce motion.
- House easings are `ag.out` (0.16, 1, 0.3, 1) and `ag.pop`.

**Scroll scenes (`components/gsap-scenes.tsx`)**

- Switched on with `data-gsap` attributes, so server components can use them:
  - `split`: heading words rise out of a mask, line by line.
  - `reveal`: a block fades and rises into place.
  - `stagger`: children arrive one by one, in ScrollTrigger batches.
  - `zoom`: a panel grows into place, tied to the scroll.
  - `parallax`: the photo inside moves slower than the page.
  - `tilt`: 3D tilt towards the pointer.
  - `magnetic`: a button is pulled towards the pointer and springs back.
- They are set up again after each page change and for content that arrives later, and cleaned up with `gsap.context().revert()`.
- Content on screen at load is never hidden or delayed, and nothing is hidden before GSAP has loaded.
- SplitText keeps the heading's accessible name (`aria-label` on the heading, and the split pieces are `aria-hidden`).

**Hero**

- As the page scrolls, the text lifts away (with a slight blur instead of a fade, so contrast stays) and the photo moves slower.
- Each new slide's headline comes in letter by letter.
- The main button is magnetic.

**Promise ticker** (`components/home/promise-marquee.tsx`)

- An endless navy ticker that speeds up while scrolling, runs backwards when scrolling up, and slows on hover.
- Without GSAP it is a still, wrapping row.

**Fly to cart:** the photo pops, then follows a MotionPath curve into the cart icon, spinning and shrinking. A ring and a "+1" answer at the icon. If GSAP cannot load, the Web Animations version is used instead.

**Order placed:** about 90 pieces of confetti in the logo colours, thrown up and falling with gravity (Physics2D).

**Checks**

- axe passes with GSAP running on the home, shop, category and product pages (after scrolling through every scene).
- Full-motion tests cover GSAP loading, scroll-triggered entrances and the ticker.

## Home page additions

**Photo carry-over** (`components/photo-transition.tsx`)

- Clicking a product card makes its photo grow into the big photo on the product page, using the browser's View Transitions.
- The card photo is captured first, then the navigation starts. The transition waits up to 0.9 s for the new page's photo, polling with a timer because frames are paused during a view transition.
- Browsers without View Transitions (and visitors with Reduce motion) get the normal page switch.

**Delivery story** (`components/home/delivery-story.tsx`)

- "How your order reaches you" shows four steps beside a map of Pakistan.
- **Desktop with GSAP** (1024 px wide and at least 740 px tall): the section stays on screen while you scroll through it. Each step lights up in turn, and a card with its picture appears on the map. At the last step, delivery routes draw out from Lahore to seven cities and each city lights up.
- **Smaller screens:** the routes draw as the map scrolls by.
- **Without GSAP:** everything is shown, with the routes drawn.
- The delivery times come from the store's shipping settings.

**Keyboard fix in the scroll scenes:** elements waiting to animate in are hidden with opacity only, not visibility, so keyboard users can still tab to them. axe passes at several points while scrolling through the story.

## Testing and quality checks (every phase)

- **Playwright:**
  - Run the existing end-to-end suite with `reducedMotion: "reduce"`, so tests stay fast and stable.
  - Add a small `motion.spec.ts` with full motion that checks: drawers open and close, the add-to-cart ✓ shows, skeletons appear on navigation, and nothing is still animating after 1 s.
- **Accessibility:**
  - axe stays at zero violations.
  - Manual pass with Reduce motion on (Windows "Animation effects" off; Android "Remove animations").
- **Performance budget:**
  - No increase in JavaScript size beyond about 2 KB.
  - Vercel Speed Insights: LCP, INP and CLS no worse than before each phase is merged.
  - Check with 4× CPU throttling on a mid-range Android profile.
- **Screenshots:** before and after each phase, desktop and mobile.

## Order and size

| Phase | What                  | Size | Why this order                          |
| ----- | --------------------- | ---- | --------------------------------------- |
| 1     | Motion foundation     | S    | Everything else uses it                 |
| 2     | Instant page switches | M    | Fixes the lag people feel most          |
| 3     | Overlays              | M    | Used on every page, including the admin |
| 4     | Shopping feedback     | M    | Directly helps people buy               |
| 5     | Product page          | M    | The most-viewed page                    |
| 6     | Home and listings     | M    | Polish and browsing feel                |
| 7     | Checkout and orders   | S    | The trust moments                       |
| 8     | Admin                 | S    | Small, mostly inherited                 |

Each phase is its own pull request, with tests and screenshots, merged only
after CI passes.
