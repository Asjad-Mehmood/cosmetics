"use client";

import type { ProductDetailDTO, VariantDTO } from "@store/types";
import { formatMoney } from "@store/types";
import { MAX_QTY_PER_ITEM } from "@store/validation";
import { Button, cn } from "@store/ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAddToCart } from "@/hooks/use-cart";
import { ApiError } from "@/lib/api";
import { useUi } from "@/store/ui";
import { BadgeCheckIcon, CashIcon, ClockIcon, RefreshIcon, TruckIcon } from "../icons";
import { freeDeliveryFrom, useSite } from "../site-context";
import { NotifyMe } from "./notify-me";
import { QuantityStepper } from "./quantity-stepper";
import { Stars } from "./stars";
import { WishlistButton } from "./wishlist-button";

function Gallery({ images, title }: { images: ProductDetailDTO["images"]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const strip = useRef<HTMLUListElement>(null);
  const current = images[Math.min(active, images.length - 1)];

  // Phones: a swipeable strip; keep the dots in sync with the visible photo.
  const onScroll = () => {
    const el = strip.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (!images.length) {
    return <div className="bg-surface aspect-square rounded-3xl" aria-hidden />;
  }

  return (
    <div>
      {/* Phones */}
      <div className="relative md:hidden">
        <ul
          ref={strip}
          onScroll={onScroll}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto"
          aria-label="Product images"
        >
          {images.map((img, i) => (
            <li
              key={img.url}
              className="bg-surface relative aspect-square w-full shrink-0 snap-center"
            >
              <Image
                src={img.url}
                alt={img.alt ?? title}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
            {images.map((img, i) => (
              <span
                key={img.url}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === active ? "w-5 bg-white" : "w-1.5 bg-white/60",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tablets and up: thumbnails + main photo with hover zoom */}
      <div className="hidden gap-4 md:flex">
        {images.length > 1 && (
          <ul className="flex w-20 shrink-0 flex-col gap-3" aria-label="Product images">
            {images.map((img, i) => (
              <li key={img.url}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1} of ${images.length}`}
                  aria-current={i === active}
                  className={cn(
                    "bg-surface relative block aspect-square w-full overflow-hidden rounded-xl border-2 transition",
                    i === active ? "border-brand-600" : "hover:border-line border-transparent",
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div
          className="bg-surface relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-3xl"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({
              x: ((e.clientX - r.left) / r.width) * 100,
              y: ((e.clientY - r.top) / r.height) * 100,
            });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          {current && (
            <Image
              key={current.url}
              src={current.url}
              alt={current.alt ?? title}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover transition-transform duration-200"
              style={
                zoom
                  ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

const firstAvailable = (variants: VariantDTO[]) =>
  variants.find((v) => v.stockStatus !== "out_of_stock");

/** Delivery times and charges by zone, from the store's shipping settings. */
function DeliveryInfo() {
  const { delivery } = useSite();
  if (!delivery.length) return null;
  const free = freeDeliveryFrom(delivery);
  return (
    <div className="border-line mt-6 rounded-2xl border p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <TruckIcon width={18} height={18} className="text-brand-700" /> Delivery
      </p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {delivery.map((z) => (
          <li key={z.name} className="flex justify-between gap-4">
            <span className="text-muted">{z.name}</span>
            <span className="text-right font-medium">
              {z.estimatedDays} working days · {formatMoney(z.standardRate)}
            </span>
          </li>
        ))}
      </ul>
      {free !== null && (
        <p className="text-success mt-3 text-sm font-semibold">
          Free delivery on orders over {formatMoney(free)}
        </p>
      )}
      <p className="text-muted mt-1 flex items-center gap-1.5 text-sm">
        <CashIcon width={16} height={16} /> Cash on Delivery available everywhere
      </p>
    </div>
  );
}

const PROMISES = [
  { icon: BadgeCheckIcon, label: "100% genuine" },
  { icon: ClockIcon, label: "Checked for expiry" },
  { icon: RefreshIcon, label: "Easy returns" },
];

/** Gallery + shade/size/quantity selection + add to cart / buy now. */
export function ProductView({ product }: { product: ProductDetailDTO }) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const openCart = useUi((s) => s.openCart);
  const buyBox = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  const [color, setColor] = useState(
    () => firstAvailable(product.variants)?.color ?? product.colors[0]?.name ?? "",
  );
  const [size, setSize] = useState<string | null>(() =>
    product.sizes.length === 1 ? product.sizes[0]! : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [buying, setBuying] = useState(false);

  const colorVariants = useMemo(
    () => product.variants.filter((v) => v.color === color),
    [product.variants, color],
  );
  const variant = colorVariants.find((v) => v.size === size) ?? null;
  const images = useMemo(() => {
    const forColor = product.images.filter((i) => i.color === color);
    return forColor.length ? forColor : product.images;
  }, [product.images, color]);

  const soldOut = variant?.stockStatus === "out_of_stock";
  const maxQty = Math.min(variant?.lowStockCount ?? MAX_QTY_PER_ITEM, MAX_QTY_PER_ITEM);
  const price = variant?.price ?? product.price;
  const compareAt =
    product.compareAtPrice && product.compareAtPrice > price ? product.compareAtPrice : null;
  const category = product.categories[0];

  // Phones: show the sticky buy bar once the main buttons scroll out of view.
  useEffect(() => {
    const el = buyBox.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) =>
      setShowBar(!entry!.isIntersecting && entry!.boundingClientRect.top < 0),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function selectSize(s: string) {
    setSize(s);
    setSizeError(false);
    setQuantity(1);
  }

  function add(then: "cart" | "checkout" = "cart") {
    if (!variant) {
      setSizeError(true);
      buyBox.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (then === "checkout") setBuying(true);
    addToCart.mutate(
      { variantId: variant.id, quantity },
      {
        onSuccess: () => {
          setQuantity(1);
          if (then === "checkout") router.push("/checkout");
          else openCart();
        },
        onError: (err) => {
          setBuying(false);
          toast.error(
            err instanceof ApiError ? err.message : "Could not add to cart. Please try again.",
          );
        },
      },
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
      <div className="md:sticky md:top-36 md:self-start">
        <Gallery key={color} images={images} title={product.title} />
      </div>

      <div>
        {category && (
          <Link
            href={`/categories/${category.slug}`}
            className="text-brand-700 text-xs font-semibold uppercase tracking-widest hover:underline"
          >
            {category.name}
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{product.title}</h1>
        {product.reviewCount > 0 ? (
          <a
            href="#reviews"
            className="mt-2 inline-flex items-center gap-2 text-sm hover:underline"
          >
            <Stars rating={product.avgRating} size={14} />
            <span className="text-muted">
              {product.avgRating.toFixed(1)} · {product.reviewCount} review
              {product.reviewCount === 1 ? "" : "s"}
            </span>
          </a>
        ) : (
          <p className="text-muted mt-2 text-sm">No reviews yet</p>
        )}

        {/* Price */}
        <div className="bg-surface mt-5 rounded-2xl p-4">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={cn("text-3xl font-extrabold", compareAt && "text-accent-700")}>
              {!variant && product.hasPriceRange && (
                <span className="text-muted text-base font-medium">From </span>
              )}
              {formatMoney(price)}
            </span>
            {compareAt && (
              <s className="text-muted" aria-label={`was ${formatMoney(compareAt)}`}>
                {formatMoney(compareAt)}
              </s>
            )}
            {compareAt && (
              <span className="bg-success/10 text-success rounded-full px-2.5 py-0.5 text-xs font-bold">
                You save {formatMoney(compareAt - price)} (
                {Math.round(((compareAt - price) / compareAt) * 100)}%)
              </span>
            )}
          </p>
          <p className="text-muted mt-1 text-xs">Inclusive of all taxes</p>
        </div>

        {/* Shade (hidden when the product comes in one shade only) */}
        <fieldset className={cn("mt-6", product.colors.length < 2 && "hidden")}>
          <legend className="text-sm font-semibold">
            Shade: <span className="text-muted font-normal">{color}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const allSoldOut = product.variants
                .filter((v) => v.color === c.name)
                .every((v) => v.stockStatus === "out_of_stock");
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  aria-pressed={c.name === color}
                  aria-label={`${c.name}${allSoldOut ? " (sold out)" : ""}`}
                  title={c.name}
                  className={cn(
                    "relative size-11 rounded-full border-2 p-0.5 transition",
                    c.name === color ? "border-brand-600" : "hover:border-line border-transparent",
                  )}
                >
                  <span
                    className="border-line block size-full rounded-full border"
                    style={{ backgroundColor: c.hex ?? undefined }}
                  />
                  {allSoldOut && (
                    <span
                      aria-hidden
                      className="bg-muted absolute left-0 top-1/2 h-0.5 w-full -rotate-45"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Size: each option shows its own price */}
        <fieldset className="mt-6" aria-describedby={sizeError ? "size-error" : undefined}>
          <legend className="text-sm font-semibold">
            Size{size && <span className="text-muted font-normal">: {size}</span>}
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const v = colorVariants.find((x) => x.size === s);
              const unavailable = !v || v.stockStatus === "out_of_stock";
              const selected = s === size;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!v}
                  onClick={() => selectSize(s)}
                  aria-pressed={selected}
                  className={cn(
                    "min-w-24 rounded-2xl border-2 px-4 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40",
                    selected
                      ? "border-brand-600 bg-brand-50"
                      : "border-line hover:border-brand-600",
                  )}
                >
                  <span
                    className={cn("block text-sm font-semibold", unavailable && "line-through")}
                  >
                    <span className="sr-only">Size </span>
                    {s}
                  </span>
                  <span className="text-muted block text-xs">
                    {unavailable ? "Sold out" : v ? formatMoney(v.price) : ""}
                  </span>
                </button>
              );
            })}
          </div>
          {sizeError && (
            <p id="size-error" role="alert" className="text-danger mt-2 text-sm">
              Please choose a size.
            </p>
          )}
          {variant?.stockStatus === "low_stock" && (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium" role="status">
              <span aria-hidden className="bg-warning size-2 rounded-full" />
              Hurry, only {variant.lowStockCount} left in {variant.size}.
            </p>
          )}
        </fieldset>

        {/* Purchase */}
        <div ref={buyBox} className="mt-6">
          {variant && soldOut ? (
            <div className="space-y-3">
              <NotifyMe
                key={variant.id}
                variantId={variant.id}
                label={`${product.title} (${variant.color}, ${variant.size})`}
              />
              <WishlistButton
                productId={product.id}
                title={product.title}
                variant="button"
                withText
                className="w-full"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3">
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  max={maxQty}
                  disabled={!variant}
                />
                <Button
                  size="lg"
                  pill
                  variant="brand"
                  className="h-12 flex-1"
                  onClick={() => add("cart")}
                  loading={addToCart.isPending && !buying}
                  disabled={!product.inStock}
                >
                  {product.inStock ? "Add to cart" : "Sold out"}
                </Button>
                <WishlistButton
                  productId={product.id}
                  title={product.title}
                  variant="button"
                  className="size-12 rounded-full"
                />
              </div>
              {product.inStock && (
                <Button
                  size="lg"
                  pill
                  className="h-12 w-full"
                  onClick={() => add("checkout")}
                  loading={buying}
                >
                  Buy now
                </Button>
              )}
            </div>
          )}
        </div>

        <ul className="mt-6 grid grid-cols-3 gap-2">
          {PROMISES.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="bg-surface flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center text-xs font-medium"
            >
              <Icon width={20} height={20} className="text-brand-700" />
              {label}
            </li>
          ))}
        </ul>

        <DeliveryInfo />
      </div>

      {/* Phones: sticky buy bar above the tab bar once the main buttons are off screen */}
      {product.inStock && (
        <div
          hidden={!showBar}
          className="border-line bg-canvas/95 fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t px-4 py-3 backdrop-blur md:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{product.title}</p>
              <p className="text-sm">
                {formatMoney(price)}
                {size && <span className="text-muted"> · {size}</span>}
              </p>
            </div>
            <Button
              variant="brand"
              pill
              onClick={() => add("cart")}
              aria-label={`Add to cart: ${product.title}`}
            >
              Add to cart
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
