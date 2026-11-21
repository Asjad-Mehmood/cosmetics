"use client";

import type { gsap } from "gsap";
import { type CSSProperties, useEffect, useRef } from "react";
import { loadGsap } from "@/lib/gsap";
import { BadgeCheckIcon, CashIcon, CheckIcon, ClockIcon, TruckIcon } from "../icons";
import { useSite } from "../site-context";

/*
 * "How your order reaches you": four steps beside a map of Pakistan.
 *
 * Desktop with GSAP: the section stays on screen while you scroll through it;
 * each step lights up in turn (its picture appears on the map card), and at
 * the last step delivery routes draw out from Lahore to each city.
 * Phones with GSAP: no pinning; the routes draw as the map scrolls by.
 * Without GSAP (or with Reduce motion): everything is shown, routes drawn.
 */

// Pakistan's border (longitude, latitude; Natural Earth, simplified) and the main cities.
const OUTLINE: [number, number][] = [
  [77.84, 35.49],
  [76.87, 34.65],
  [75.76, 34.5],
  [74.24, 34.75],
  [73.75, 34.32],
  [74.1, 33.44],
  [74.45, 32.76],
  [75.26, 32.27],
  [74.41, 31.69],
  [74.42, 30.98],
  [73.45, 29.98],
  [72.82, 28.96],
  [71.78, 27.91],
  [70.62, 27.99],
  [69.51, 26.94],
  [70.17, 26.49],
  [70.28, 25.72],
  [70.84, 25.22],
  [71.04, 24.36],
  [68.84, 24.36],
  [68.18, 23.69],
  [67.44, 23.94],
  [67.15, 24.66],
  [66.37, 25.43],
  [64.53, 25.24],
  [62.91, 25.22],
  [61.5, 25.08],
  [61.87, 26.24],
  [63.32, 26.76],
  [63.23, 27.22],
  [62.76, 27.38],
  [62.73, 28.26],
  [61.77, 28.7],
  [61.37, 29.3],
  [60.87, 29.83],
  [62.55, 29.32],
  [63.55, 29.47],
  [64.15, 29.34],
  [64.35, 29.56],
  [65.05, 29.47],
  [66.35, 29.89],
  [66.38, 30.74],
  [66.94, 31.3],
  [67.68, 31.3],
  [67.79, 31.58],
  [68.56, 31.71],
  [68.93, 31.62],
  [69.32, 31.9],
  [69.26, 32.5],
  [69.69, 33.11],
  [70.32, 33.36],
  [69.93, 34.02],
  [70.88, 33.99],
  [71.16, 34.35],
  [71.12, 34.73],
  [71.61, 35.15],
  [71.5, 35.65],
  [71.26, 36.07],
  [71.85, 36.51],
  [72.92, 36.72],
  [74.07, 36.84],
  [74.58, 37.02],
  [75.16, 37.13],
  [75.9, 36.67],
  [76.19, 35.9],
];
const HUB = { name: "Lahore", lon: 74.34, lat: 31.55 };
// `left`: the label goes on the left of the dot (so labels don't overlap).
const CITIES = [
  { name: "Islamabad", lon: 73.05, lat: 33.68, left: false },
  { name: "Peshawar", lon: 71.58, lat: 34.01, left: true },
  { name: "Faisalabad", lon: 73.08, lat: 31.42, left: true },
  { name: "Multan", lon: 71.47, lat: 30.2, left: false },
  { name: "Quetta", lon: 67.0, lat: 30.18, left: true },
  { name: "Hyderabad", lon: 68.37, lat: 25.4, left: false },
  { name: "Karachi", lon: 67.0, lat: 24.86, left: true },
];
// Equirectangular projection centred on 30.5°N: a degree of longitude is
// cos(30.5°) ≈ 0.86 of a degree of latitude, so the country isn't stretched.
const SCALE = 20;
const px = (lon: number) => (lon - 59.6) * SCALE * 0.86;
const py = (lat: number) => (38 - lat) * SCALE;
const VIEW = `0 0 ${Math.ceil(px(78.6))} ${Math.ceil(py(23))}`;
const OUTLINE_PATH = `M${OUTLINE.map(([lon, lat]) => `${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join("L")}Z`;
/** A gently curved route from the hub to a city (bending more for longer trips). */
const route = (c: { lon: number; lat: number }) => {
  const [x1, y1, x2, y2] = [px(HUB.lon), py(HUB.lat), px(c.lon), py(c.lat)];
  const mx = (x1 + x2) / 2 + (y2 - y1) * 0.2;
  const my = (y1 + y2) / 2 - (x2 - x1) * 0.2;
  return `M${x1.toFixed(1)},${y1.toFixed(1)}Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
};

const STEPS = [
  {
    icon: BadgeCheckIcon,
    title: "100% genuine stock",
    body: "Every product comes from the brand or an authorised distributor, never the grey market.",
  },
  {
    icon: ClockIcon,
    title: "Checked before it ships",
    body: "We check expiry dates, seals and batch numbers on every item we pack.",
  },
  {
    icon: TruckIcon,
    title: "Packed with care",
    body: "Sealed, padded and labelled at our Lahore store, the same day if you order before 2 PM.",
  },
  {
    icon: CashIcon,
    title: "At your door, pay in cash",
    body: "Our couriers deliver across Pakistan. Check your parcel, then pay on delivery.",
  },
];

export function DeliveryStory() {
  const root = useRef<HTMLElement>(null);
  const { delivery } = useSite();

  useEffect(() => {
    const ready = loadGsap();
    const el = root.current;
    if (!ready || !el) return;
    let revert: (() => void) | undefined;
    let cancelled = false;
    void ready.then(({ gsap }) => {
      if (cancelled) return;
      const mm = gsap.matchMedia();
      const routes = el.querySelectorAll<SVGPathElement>("[data-route]");
      const cities = el.querySelectorAll<SVGGElement>("[data-city]");

      const parcels = el.querySelectorAll<SVGGElement>("[data-parcel]");
      const rings = el.querySelectorAll<SVGCircleElement>("[data-ring]");
      /** Route i draws out from Lahore, a parcel rides along it, and the city lights up. */
      const deliver = (tl: gsap.core.Timeline, i: number, at: number, length: number) => {
        const path = routes[i]!;
        tl.to(path, { strokeDashoffset: 0, duration: length }, at)
          .set(parcels[i]!, { autoAlpha: 1 }, at)
          .to(
            parcels[i]!,
            {
              motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true },
              duration: length,
            },
            at,
          )
          .to(parcels[i]!, { autoAlpha: 0, duration: length * 0.15 }, at + length * 0.9)
          .to(cities[i]!, { autoAlpha: 1, scale: 1, duration: length * 0.3 }, at + length * 0.85)
          .fromTo(
            rings[i]!,
            { scale: 0.4, autoAlpha: 0.9 },
            { scale: 3, autoAlpha: 0, duration: length * 0.6, immediateRender: false },
            at + length * 0.85,
          );
      };
      const start = () => {
        gsap.set(routes, { strokeDashoffset: 1 });
        gsap.set(parcels, { autoAlpha: 0 });
        gsap.set(rings, { autoAlpha: 0, transformOrigin: "center" });
        gsap.set(cities, { autoAlpha: 0.35 });
        // Each city grows from its own dot (not the middle of dot + label).
        cities.forEach((c) => gsap.set(c, { scale: 0.6, svgOrigin: c.dataset.origin }));
      };

      // Desktop: pinned, scroll-scrubbed story. Each step snaps into place, the
      // last one being "delivered", when every route has reached its city.
      mm.add("(min-width: 1024px) and (min-height: 740px)", () => {
        el.dataset.live = "";
        el.dataset.step = "0";
        start();
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top+=128",
            end: "+=2600",
            pin: true,
            scrub: 0.6,
            snap: {
              snapTo: [0, 1 / 3, 2 / 3, 1],
              duration: 0.6,
              delay: 0.05,
              ease: "power2.inOut",
            },
            onUpdate: (self) => {
              el.dataset.step = String(Math.round(self.progress * 3));
            },
          },
        });
        tl.fromTo(
          el.querySelector("[data-progress]"),
          { scaleY: 0 },
          { scaleY: 1, duration: 1 },
          0,
        );
        // From "packed" to "delivered": parcels leave one after another.
        routes.forEach((_, i) => deliver(tl, i, 0.6 + i * 0.045, 0.12));
        return () => {
          delete el.dataset.live;
          delete el.dataset.step;
        };
      });

      // Phones and tablets: the parcels travel as the map scrolls by.
      mm.add("(max-width: 1023px), (max-height: 739px)", () => {
        start();
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el.querySelector("[data-map]"),
            start: "top 80%",
            end: "bottom 45%",
            scrub: 0.6,
          },
        });
        routes.forEach((_, i) => deliver(tl, i, i * 0.12, 0.3));
      });

      revert = () => mm.revert();
    });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <section
      ref={root}
      aria-labelledby="journey-heading"
      className="delivery-story bg-surface overflow-hidden rounded-[2rem] px-5 py-10 sm:px-10 lg:py-14"
    >
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div>
          <p className="text-accent-700 text-xs font-semibold uppercase tracking-widest">
            From our shelf to your door
          </p>
          <h2
            id="journey-heading"
            className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            How your order reaches you
          </h2>

          <div className="relative mt-8">
            {/* The progress line beside the steps (filled by the scroll on desktop). */}
            <span
              aria-hidden
              className="bg-line absolute bottom-6 left-[19px] top-6 w-0.5 rounded-full"
            >
              <span
                data-progress
                className="bg-accent-500 block h-full w-full origin-top rounded-full"
              />
            </span>
            <ol className="space-y-6">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} data-step-item={i} className="story-step relative flex gap-4">
                  <span className="story-dot bg-canvas border-line relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 transition duration-500">
                    <Icon width={18} height={18} />
                  </span>
                  <div>
                    <h3 className="story-title font-bold transition-colors duration-500">
                      <span className="sr-only">Step {i + 1}: </span>
                      {title}
                    </h3>
                    <p className="text-muted mt-1 text-sm leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* The map card */}
        <div
          data-map
          className="bg-brand-700 shadow-(--shadow-pop) relative overflow-hidden rounded-3xl p-4 text-white sm:p-6"
        >
          <svg
            viewBox={VIEW}
            className="mx-auto h-auto w-full max-w-[34rem]"
            role="img"
            aria-label="Map of Pakistan with delivery routes from our Lahore store to cities across the country"
          >
            <defs>
              <pattern id="story-dots" width="9" height="9" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="0.9" fill="#ffffff" />
              </pattern>
              <radialGradient id="story-glow">
                <stop offset="0" stopColor="var(--color-accent-500)" stopOpacity="0.45" />
                <stop offset="1" stopColor="var(--color-accent-500)" stopOpacity="0" />
              </radialGradient>
              <clipPath id="story-land">
                <path d={OUTLINE_PATH} />
              </clipPath>
            </defs>
            {/* The country: a soft fill with a dotted texture, and its border. */}
            <path d={OUTLINE_PATH} fill="rgb(255 255 255 / 0.07)" />
            <rect
              width="100%"
              height="100%"
              fill="url(#story-dots)"
              opacity="0.16"
              clipPath="url(#story-land)"
            />
            <path
              d={OUTLINE_PATH}
              fill="none"
              stroke="rgb(255 255 255 / 0.35)"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
            <circle cx={px(HUB.lon)} cy={py(HUB.lat)} r="70" fill="url(#story-glow)" />
            {CITIES.map((c) => (
              <g key={c.name}>
                {/* The road, faint, then the route drawn over it. */}
                <path
                  d={route(c)}
                  fill="none"
                  stroke="rgb(255 255 255 / 0.16)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <path
                  data-route
                  d={route(c)}
                  pathLength={1}
                  fill="none"
                  stroke="var(--color-accent-500)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeDasharray="1"
                  strokeDashoffset="0"
                />
              </g>
            ))}
            {CITIES.map((c) => (
              <g key={c.name}>
                <circle
                  data-ring
                  cx={px(c.lon)}
                  cy={py(c.lat)}
                  r="4"
                  fill="none"
                  stroke="var(--color-accent-500)"
                  strokeWidth="1.2"
                  opacity="0"
                />
                <g data-city data-origin={`${px(c.lon)} ${py(c.lat)}`}>
                  <circle cx={px(c.lon)} cy={py(c.lat)} r="3.4" fill="#ffffff" />
                  <text
                    x={px(c.lon) + (c.left ? -7 : 7)}
                    y={py(c.lat) + 3.5}
                    textAnchor={c.left ? "end" : "start"}
                    className="fill-white text-[10px] font-semibold"
                  >
                    {c.name}
                  </text>
                </g>
              </g>
            ))}
            {/* Parcels, one per route (only seen while travelling). */}
            {CITIES.map((c) => (
              <g key={c.name} data-parcel opacity="0">
                <rect
                  x="-5"
                  y="-4"
                  width="10"
                  height="8"
                  rx="1.5"
                  fill="var(--color-accent-500)"
                  stroke="#fff"
                  strokeWidth="1.2"
                />
                <path d="M-5 -1h10" stroke="#fff" strokeWidth="0.8" />
              </g>
            ))}
            {/* Our store */}
            <g>
              <circle
                cx={px(HUB.lon)}
                cy={py(HUB.lat)}
                r="12"
                fill="var(--color-accent-500)"
                opacity="0.3"
                className="story-ping"
              />
              <circle
                cx={px(HUB.lon)}
                cy={py(HUB.lat)}
                r="6"
                fill="var(--color-accent-500)"
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={px(HUB.lon) + 10}
                y={py(HUB.lat) + 15}
                className="fill-white text-[11px] font-bold"
              >
                Lahore
              </text>
              <text
                x={px(HUB.lon) + 10}
                y={py(HUB.lat) + 26}
                className="fill-white/70 text-[8px] font-semibold uppercase tracking-wider"
              >
                Our store
              </text>
            </g>
          </svg>

          {/* What each step looks like, shown over the map on desktop as you scroll. */}
          <div className="story-cards pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-6">
            <div data-card={0} className="story-card">
              <BadgeCheckIcon width={20} height={20} className="text-success" />
              Sourced from authorised distributors
            </div>
            <div data-card={1} className="story-card flex-col !items-start">
              {["Expiry date", "Seal intact", "Batch number"].map((t, i) => (
                <span
                  key={t}
                  className="flex items-center gap-2"
                  style={{ "--d": `${i * 160}ms` } as CSSProperties}
                >
                  <span className="story-tick bg-success grid size-4 place-items-center rounded-full text-white">
                    <CheckIcon width={11} height={11} />
                  </span>
                  {t}
                </span>
              ))}
            </div>
            <div data-card={2} className="story-card">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="text-accent-700"
              >
                <path
                  d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 7.5 12 12l9-4.5M12 12v9M7.5 5.2l9 4.6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              Packed today, on its way
            </div>
            <div data-card={3} className="story-card">
              <CashIcon width={20} height={20} className="text-success" />
              Delivered · pay in cash
            </div>
          </div>

          {delivery.length > 0 && (
            <ul className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
              {delivery.map((z) => (
                <li key={z.name} className="rounded-xl bg-white/10 px-3 py-2">
                  <span className="block font-semibold">{z.name}</span>
                  <span className="text-white/75">{z.estimatedDays} working days</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
