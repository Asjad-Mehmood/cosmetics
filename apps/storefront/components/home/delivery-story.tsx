"use client";

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

// A simplified outline of Pakistan (longitude, latitude), and the main cities.
const OUTLINE: [number, number][] = [
  [61.6, 25.2],
  [61.8, 26.2],
  [63.2, 26.6],
  [63.3, 27.2],
  [62.8, 27.3],
  [62.8, 28.3],
  [61.5, 29.0],
  [60.9, 29.8],
  [62.5, 29.4],
  [64.3, 29.5],
  [66.3, 29.9],
  [66.5, 30.9],
  [67.7, 31.4],
  [68.8, 31.6],
  [69.3, 31.9],
  [69.5, 33.0],
  [70.3, 33.4],
  [69.9, 34.0],
  [71.1, 34.4],
  [71.5, 35.0],
  [71.3, 36.0],
  [72.5, 36.8],
  [74.0, 37.0],
  [75.5, 36.9],
  [77.8, 35.5],
  [76.5, 34.8],
  [75.8, 34.5],
  [74.3, 33.8],
  [74.6, 32.8],
  [75.3, 32.3],
  [74.6, 31.9],
  [74.5, 31.1],
  [73.9, 30.4],
  [73.4, 29.9],
  [72.9, 29.0],
  [71.9, 28.0],
  [70.7, 27.7],
  [69.6, 27.2],
  [70.1, 26.5],
  [70.2, 25.7],
  [69.5, 25.0],
  [68.8, 24.3],
  [68.2, 23.7],
  [67.4, 24.8],
  [66.6, 25.4],
  [65.0, 25.3],
  [64.0, 25.3],
  [62.5, 25.1],
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
const px = (lon: number) => (lon - 60.3) * 20;
const py = (lat: number) => (37.4 - lat) * 20;
const OUTLINE_PATH = `M${OUTLINE.map(([lon, lat]) => `${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join("L")}Z`;
/** A gently curved route from the hub to a city. */
const route = (c: { lon: number; lat: number }) => {
  const [x1, y1, x2, y2] = [px(HUB.lon), py(HUB.lat), px(c.lon), py(c.lat)];
  const mx = (x1 + x2) / 2 + (y2 - y1) * 0.18;
  const my = (y1 + y2) / 2 - (x2 - x1) * 0.18;
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

      // Desktop: pinned, scroll-scrubbed story.
      mm.add("(min-width: 1024px) and (min-height: 740px)", () => {
        el.dataset.live = "";
        el.dataset.step = "0";
        gsap.set(routes, { strokeDashoffset: 1 });
        gsap.set(cities, { autoAlpha: 0.35, scale: 0.6, transformOrigin: "center" });
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top+=128",
            end: "+=2600",
            pin: true,
            scrub: 0.6,
            snap: { snapTo: [0, 0.25, 0.5, 0.75, 1], duration: 0.5, ease: "power1.inOut" },
            onUpdate: (self) => {
              el.dataset.step = String(Math.min(3, Math.floor(self.progress * 4.0001)));
            },
          },
        });
        tl.fromTo(
          el.querySelector("[data-progress]"),
          { scaleY: 0 },
          { scaleY: 1, duration: 1 },
          0,
        );
        // The last quarter: routes draw out one after another, each city lights up.
        routes.forEach((r, i) => {
          tl.to(r, { strokeDashoffset: 0, duration: 0.1 }, 0.72 + i * 0.035);
          tl.to(cities[i]!, { autoAlpha: 1, scale: 1, duration: 0.04 }, 0.8 + i * 0.035);
        });
        return () => {
          delete el.dataset.live;
          delete el.dataset.step;
        };
      });

      // Phones and tablets: the routes draw as the map scrolls by.
      mm.add("(max-width: 1023px), (max-height: 739px)", () => {
        gsap.set(routes, { strokeDashoffset: 1 });
        gsap.set(cities, { autoAlpha: 0.35 });
        const map = el.querySelector("[data-map]");
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: map, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
        });
        routes.forEach((r, i) => {
          tl.to(r, { strokeDashoffset: 0, duration: 0.3 }, i * 0.12);
          tl.to(cities[i]!, { autoAlpha: 1, duration: 0.1 }, i * 0.12 + 0.25);
        });
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
            viewBox="0 0 360 290"
            className="h-auto w-full"
            role="img"
            aria-label="Map of Pakistan with delivery routes from our Lahore store to cities across the country"
          >
            <path
              d={OUTLINE_PATH}
              fill="rgb(255 255 255 / 0.06)"
              stroke="rgb(255 255 255 / 0.25)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {CITIES.map((c) => (
              <path
                key={c.name}
                data-route
                d={route(c)}
                pathLength={1}
                fill="none"
                stroke="var(--color-accent-500)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray="1"
                strokeDashoffset="0"
              />
            ))}
            {CITIES.map((c) => (
              <g key={c.name} data-city>
                <circle cx={px(c.lon)} cy={py(c.lat)} r="3.6" fill="#ffffff" />
                <text
                  x={px(c.lon) + (c.left ? -7 : 7)}
                  y={py(c.lat) + 3.5}
                  textAnchor={c.left ? "end" : "start"}
                  className="fill-white text-[10px] font-semibold"
                >
                  {c.name}
                </text>
              </g>
            ))}
            {/* Our store */}
            <g>
              <circle
                cx={px(HUB.lon)}
                cy={py(HUB.lat)}
                r="12"
                fill="var(--color-accent-500)"
                opacity="0.25"
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
                y={py(HUB.lat) + 14}
                className="fill-white text-[11px] font-bold"
              >
                Lahore
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
