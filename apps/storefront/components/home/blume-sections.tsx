import type { CategoryDTO, FaqDTO } from "@store/types";
import { Container } from "@store/ui";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRightIcon, ChevronDownIcon, PillIcon } from "../icons";
import { TRUST_POINTS } from "../layout/trust-strip";

/*
 * Homepage sections in the Blume style: big uppercase headings under small
 * gold labels, numbered glass cards, photo cards with dark gradients, a navy
 * ticker and dark navy panels with gold accents. Everything shown comes from
 * the store's own data (categories, settings, FAQs); nothing is made up.
 */

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

function SectionHeading({
  eyebrow,
  title,
  id,
  align = "left",
  onDark = false,
}: {
  eyebrow: string;
  title: string;
  id: string;
  align?: "left" | "center";
  onDark?: boolean;
}) {
  return (
    <div className={align === "center" ? "text-center" : undefined}>
      <p className={`eyebrow ${onDark ? "text-accent-500" : "text-accent-700"}`}>{eyebrow}</p>
      <h2
        id={id}
        className={`display mt-4 text-3xl sm:text-4xl lg:text-5xl ${onDark ? "text-white" : ""}`}
      >
        {title}
      </h2>
    </div>
  );
}

/** Four facts in a row with thin dividers: big numbers, small gold labels. */
export function StatsRow({ categories }: { categories: CategoryDTO[] }) {
  const products = categories.reduce((n, c) => n + c.productCount, 0);
  const stats = [
    { value: `${products}+`, label: "Products in stock", note: "Skincare to supplements" },
    { value: String(categories.length), label: "Categories", note: "Beauty and health care" },
    { value: "100%", label: "Genuine", note: "Authorised distributors only" },
    { value: "7 days", label: "Easy returns", note: "On unopened items" },
  ];
  return (
    <section aria-label="Amazon Group in numbers" className="border-line border-b bg-white">
      <Container className="px-0 sm:px-0">
        <dl className="divide-line grid grid-cols-2 divide-x lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`reveal px-4 py-8 text-center sm:py-10 ${i >= 2 ? "border-line border-t lg:border-t-0" : ""}`}
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="display block text-4xl tracking-[-0.04em] sm:text-5xl">
                  {s.value}
                </span>
                <span className="eyebrow text-accent-700 mt-3 justify-center before:hidden">
                  {s.label}
                </span>
                <span className="text-muted mt-1 block text-xs">{s.note}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

/** A large statement with small rounded photos set into the text. */
export function Statement({ categories }: { categories: CategoryDTO[] }) {
  const pic = (c: CategoryDTO | undefined) =>
    c?.imageUrl ? (
      <span className="relative mx-1.5 inline-block h-[0.85em] w-[1.9em] translate-y-[0.08em] overflow-hidden rounded-full align-baseline shadow-sm">
        <Image src={c.imageUrl} alt="" fill sizes="96px" className="object-cover" />
      </span>
    ) : null;
  const find = (slug: string) => categories.find((c) => c.slug === slug);
  return (
    <section aria-label="About Amazon Group" className="bg-white">
      <Container className="py-20 sm:py-24">
        <p className="reveal mx-auto max-w-4xl text-center text-2xl font-semibold leading-[1.6] tracking-[-0.02em] sm:text-3xl lg:text-[2.6rem] lg:leading-[1.55]">
          From skincare {pic(find("skincare"))} and makeup to fragrance {pic(find("fragrance"))} and
          everyday health, we bring genuine products from authorised distributors to your door,
          anywhere in Pakistan, and you pay when it arrives.
        </p>
      </Container>
    </section>
  );
}

/** The navy ticker of categories and promises (decorative: the links are elsewhere). */
export function Marquee({ categories }: { categories: CategoryDTO[] }) {
  const items = [
    ...categories.map((c) => c.name),
    "100% genuine",
    "Cash on delivery",
    "7-day returns",
  ];
  const run = (copy: number) =>
    items.map((t, i) => (
      <li
        key={`${copy}-${t}`}
        className={`flex items-center gap-3 whitespace-nowrap px-6 text-xs font-bold uppercase tracking-[0.2em] ${i % 2 ? "text-white" : "text-accent-500"}`}
      >
        <span className="bg-accent-500 size-1.5 rounded-full" />
        {t}
      </li>
    ));
  return (
    <div aria-hidden className="bg-brand-700 overflow-hidden py-5">
      <ul className="animate-marquee flex w-max hover:[animation-play-state:paused]">
        {run(0)}
        {run(1)}
      </ul>
    </div>
  );
}

/** Categories as numbered glass cards ("01", "02"…) with an arrow button. */
export function CategoryCards({ categories }: { categories: CategoryDTO[] }) {
  if (!categories.length) return null;
  return (
    <section
      aria-labelledby="categories-heading"
      className="bg-surface relative overflow-hidden py-20 sm:py-24"
    >
      <Container>
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="What we stock"
            title="Shop by category"
            id="categories-heading"
          />
          <Link
            href="/shop"
            className="border-line hover:border-brand-600 group inline-flex items-center gap-2 rounded-full border bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            All products
            <ArrowRightIcon
              width={14}
              height={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <li key={c.id} className="reveal-card" style={stagger(i)}>
              <Link
                href={`/categories/${c.slug}`}
                className="hover:shadow-(--shadow-card) group flex h-full flex-col rounded-3xl border border-white bg-white/70 p-7 shadow-sm backdrop-blur transition duration-500 ease-[var(--ease-out)] hover:-translate-y-1.5"
              >
                <span className="flex items-start justify-between">
                  {/* A faint decorative index ("01"), drawn as decoration, not text. */}
                  <span
                    aria-hidden
                    data-n={String(i + 1).padStart(2, "0")}
                    className="group-hover:before:text-accent-500 text-4xl font-black tracking-tight before:text-slate-200 before:transition-colors before:content-[attr(data-n)]"
                  />
                  <span className="bg-surface group-hover:bg-brand-600 grid size-10 place-items-center rounded-full transition-colors duration-300 group-hover:text-white">
                    <ArrowRightIcon
                      width={16}
                      height={16}
                      className="transition-transform duration-300 group-hover:-rotate-45"
                    />
                  </span>
                </span>
                <span className="mt-8 flex items-center gap-4">
                  {c.imageUrl && (
                    <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl">
                      <Image
                        src={c.imageUrl}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover transition-transform duration-[1.6s] group-hover:scale-110"
                      />
                    </span>
                  )}
                  <span>
                    <span className="block text-xl font-black tracking-tight">{c.name}</span>
                    <span className="eyebrow text-accent-700 mt-1.5 before:hidden">
                      {c.productCount} {c.productCount === 1 ? "product" : "products"}
                    </span>
                  </span>
                </span>
                {c.description && (
                  <span className="text-muted mt-4 block text-sm leading-relaxed">
                    {c.description}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** Big photo cards with a dark gradient, glass tags and an uppercase title. */
export function Showcase({ categories }: { categories: CategoryDTO[] }) {
  const items = categories.filter((c) => c.imageUrl).slice(0, 4);
  if (items.length < 2) return null;
  // Wide / narrow, then narrow / wide, like a magazine layout.
  const spans = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];
  return (
    <section aria-labelledby="showcase-heading" className="py-20 sm:py-24">
      <Container>
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionHeading
              eyebrow="Our showcase"
              title="Find your routine"
              id="showcase-heading"
            />
            <p className="text-muted mt-4 max-w-lg">
              Explore our most-shopped categories, every product genuine and delivered to your door.
            </p>
          </div>
        </div>
        <ul className="mt-12 grid gap-5 lg:grid-cols-12">
          {items.map((c, i) => (
            <li key={c.id} className={`reveal-card ${spans[i]}`} style={stagger(i)}>
              <Link
                href={`/categories/${c.slug}`}
                className="group relative flex h-80 overflow-hidden rounded-3xl sm:h-96"
              >
                <Image
                  src={c.imageUrl!}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover transition-transform duration-[8s] ease-out group-hover:scale-110"
                />
                <span className="from-brand-900/95 via-brand-900/40 absolute inset-0 bg-gradient-to-t to-transparent" />
                <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                  {c.productCount} {c.productCount === 1 ? "product" : "products"}
                </span>
                <span className="relative mt-auto p-7">
                  <span className="eyebrow text-accent-500">Shop {c.name.toLowerCase()}</span>
                  <span className="display mt-3 block text-3xl text-white sm:text-4xl">
                    {c.name}
                  </span>
                  {c.description && (
                    <span className="mt-3 block max-w-md text-sm text-white/75">
                      {c.description}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** The pharmacy announcement as a dark navy panel with gold accents. */
export function PharmacyPanel() {
  const steps = [
    {
      title: "Upload your prescription",
      body: "Add a photo of your prescription at checkout.",
    },
    {
      title: "Pharmacist check",
      body: "Our registered pharmacist reviews it before your order is sent.",
    },
    {
      title: "Delivered to you",
      body: "Packed carefully and delivered, cash on delivery.",
    },
  ];
  return (
    <section
      aria-labelledby="pharmacy-heading"
      className="bg-brand-900 relative overflow-hidden rounded-[2rem] text-white"
    >
      <div
        aria-hidden
        className="bg-accent-500/15 pointer-events-none absolute -left-24 -top-24 size-96 rounded-full blur-3xl"
      />
      <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
        <div className="reveal">
          <p className="border-accent-500/30 bg-accent-500/10 text-accent-500 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
            <span className="relative flex size-2">
              <span className="bg-accent-500 absolute inline-flex size-full animate-ping rounded-full opacity-60" />
              <span className="bg-accent-500 relative inline-flex size-2 rounded-full" />
            </span>
            Pharmacy desk opening soon
          </p>
          <h2 id="pharmacy-heading" className="display mt-6 text-4xl sm:text-5xl">
            Prescription medicines are coming soon
          </h2>
          <p className="mt-5 max-w-lg text-white/70">
            Until then, shop vitamins, supplements and health devices, all genuine and delivered to
            your door.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/categories/health-wellness"
              className="bg-accent-500 text-brand-700 group inline-flex h-12 items-center gap-3 rounded-full pl-6 pr-1.5 text-sm font-bold uppercase tracking-wider transition hover:brightness-105"
            >
              Shop health
              <span className="bg-brand-700 text-accent-500 grid size-9 place-items-center rounded-full transition-transform duration-300 group-hover:-rotate-45">
                <ArrowRightIcon width={16} height={16} />
              </span>
            </Link>
            <Link
              href="/faq"
              className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-white/10"
            >
              How it will work
            </Link>
          </div>
        </div>
        <ol className="space-y-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="reveal-card hover:border-accent-500/30 flex gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors"
              style={stagger(i)}
            >
              <span className="bg-accent-500/10 text-accent-500 grid size-12 shrink-0 place-items-center rounded-xl">
                {i === 0 ? <PillIcon /> : <span className="text-lg font-black">0{i + 1}</span>}
              </span>
              <span>
                <span className="block font-bold">{s.title}</span>
                <span className="mt-1 block text-sm text-white/65">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Store promises and a few real FAQs, Blume style: heading left, questions right. */
export function FaqTeaser({ faqs }: { faqs: FaqDTO[] }) {
  const items = faqs.length
    ? faqs.slice(0, 5).map((f) => ({ q: f.question, a: f.answer }))
    : TRUST_POINTS.map((t) => ({ q: t.title, a: t.body }));
  return (
    <section aria-labelledby="faq-heading" className="py-20 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="reveal">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" id="faq-heading" />
          <p className="text-muted mt-5 max-w-sm">
            Delivery, payment, returns and more. Still curious? Our team is happy to help.
          </p>
          <Link
            href="/contact"
            className="bg-brand-600 hover:bg-brand-700 group mt-8 inline-flex h-12 items-center gap-3 rounded-full pl-6 pr-1.5 text-sm font-bold uppercase tracking-wider text-white transition-colors"
          >
            Contact us
            <span className="text-brand-700 grid size-9 place-items-center rounded-full bg-white transition-transform duration-300 group-hover:-rotate-45">
              <ArrowRightIcon width={16} height={16} />
            </span>
          </Link>
        </div>
        <div className="reveal border-line border-t">
          {items.map((item, i) => (
            <details key={item.q} open={i === 0} className="border-line group border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-bold sm:text-lg [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="bg-surface group-open:bg-brand-600 grid size-8 shrink-0 place-items-center rounded-full transition-colors group-open:text-white">
                  <ChevronDownIcon className="transition-transform duration-300 group-open:rotate-180" />
                </span>
              </summary>
              <p className="text-muted -mt-1 pb-5 pr-12 text-sm leading-relaxed sm:text-base">
                {item.a}
              </p>
            </details>
          ))}
          <Link
            href="/faq"
            className="text-brand-700 mt-6 inline-flex items-center gap-2 text-sm font-bold hover:underline"
          >
            See all FAQs <ArrowRightIcon width={14} height={14} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
