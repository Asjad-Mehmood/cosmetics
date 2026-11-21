"use client";

import { cn } from "@store/ui";
import { useId, useRef, useState } from "react";
import { useSlidingHighlight } from "@/lib/motion";
import { ChevronDownIcon } from "../icons";

export interface DetailSection {
  title: string;
  body: string;
}

/**
 * Product information: tabs on wide screens (WAI-ARIA tabs, arrow keys move
 * between them) and an accordion on phones.
 */
export function ProductDetails({ sections }: { sections: DetailSection[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const underline = useSlidingHighlight(active, '[aria-selected="true"]');

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? sections.length - 1
          : (active + step + sections.length) % sections.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const paragraphs = (body: string) =>
    body.split(/\n{2,}/).map((p, i) => (
      <p key={i} className="whitespace-pre-line">
        {p}
      </p>
    ));

  return (
    <section aria-label="Product information" className="mt-14">
      {/* Wide screens: tabs */}
      <div className="hidden lg:block">
        <div
          ref={underline.ref}
          role="tablist"
          aria-label="Product information"
          className="border-line relative flex gap-1 border-b"
        >
          {/* The underline slides to the chosen tab. */}
          <span
            aria-hidden
            className="border-brand-600 pointer-events-none absolute left-0 top-0 border-b-2"
            style={underline.style}
          />
          {sections.map((s, i) => (
            <button
              key={s.title}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${id}-panel-${i}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onKeyDown}
              className={cn(
                "-mb-px border-b-2 px-5 py-3 text-sm font-semibold transition",
                i === active
                  ? cn("text-brand-700", underline.box ? "border-transparent" : "border-brand-600")
                  : "text-muted hover:text-ink border-transparent",
              )}
            >
              {s.title}
            </button>
          ))}
        </div>
        {sections.map((s, i) => (
          <div
            key={s.title}
            role="tabpanel"
            id={`${id}-panel-${i}`}
            aria-labelledby={`${id}-tab-${i}`}
            hidden={i !== active}
            tabIndex={0}
            className="text-muted animate-fade-up max-w-3xl space-y-3 py-6 leading-relaxed"
          >
            {paragraphs(s.body)}
          </div>
        ))}
      </div>

      {/* Phones and tablets: accordion */}
      <div className="divide-line border-line divide-y border-y lg:hidden">
        {sections.map((s, i) => (
          <details key={s.title} open={i === 0} className="details-animated group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
              {s.title}
              <ChevronDownIcon className="text-muted transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <div className="text-muted mt-3 space-y-3 leading-relaxed">{paragraphs(s.body)}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
