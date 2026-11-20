import type { ProductCardDTO } from "@store/types";
import { formatMoney } from "@store/types";
import { cn } from "@store/ui";
import Image from "next/image";
import Link from "next/link";
import { FreeDeliveryTag } from "./free-delivery-tag";
import { Price } from "./price";
import { QuickAdd } from "./quick-add";
import { Stars } from "./stars";
import { WishlistButton } from "./wishlist-button";

/** 1234 → "1.2k" */
const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);

const SIZES = "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductCardDTO;
  priority?: boolean;
  className?: string;
}) {
  const { image, hoverImage } = product;
  const saving =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice - product.price
      : 0;

  return (
    <article
      className={cn(
        "border-line bg-canvas hover:shadow-(--shadow-card) group relative flex h-full flex-col rounded-2xl border p-2.5 transition hover:-translate-y-0.5 sm:p-3",
        className,
      )}
    >
      <WishlistButton productId={product.id} title={product.title} className="right-4 top-4" />
      <Link href={`/products/${product.slug}`} className="block flex-1">
        <div className="bg-surface relative aspect-square overflow-hidden rounded-xl">
          {image && (
            <Image
              src={image.url}
              alt={image.alt ?? product.title}
              fill
              priority={priority}
              sizes={SIZES}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          )}
          {hoverImage && (
            <Image
              src={hoverImage.url}
              alt=""
              fill
              sizes={SIZES}
              className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
            {!product.inStock && (
              <span className="bg-ink rounded-full px-2.5 py-1 text-[11px] font-semibold text-white">
                Sold out
              </span>
            )}
            {product.inStock && product.discountPercent > 0 && (
              <span className="bg-accent-700 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
                -{product.discountPercent}%
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 space-y-1.5 px-0.5">
          <h3 className="line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-snug group-hover:underline">
            {product.title}
          </h3>
          <p className="text-muted flex h-4 items-center gap-1.5 text-xs">
            {product.reviewCount > 0 ? (
              <>
                <Stars rating={product.avgRating} size={12} />
                <span>
                  {product.avgRating.toFixed(1)} ({product.reviewCount}
                  <span className="sr-only"> reviews</span>)
                </span>
              </>
            ) : (
              <span>New</span>
            )}
            {product.soldCount >= 10 && (
              <>
                <span aria-hidden>·</span>
                <span>{compact(product.soldCount)} sold</span>
              </>
            )}
          </p>
          <Price
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            from={product.hasPriceRange}
            className="text-[15px]"
          />
          <p className="flex h-5 items-center gap-2 text-xs">
            {saving > 0 && (
              <span className="text-success font-semibold">Save {formatMoney(saving)}</span>
            )}
            <FreeDeliveryTag price={product.price} />
          </p>
        </div>
      </Link>
      {product.colors.length > 1 && (
        <ul
          className="mt-1 flex items-center gap-1.5 px-0.5"
          aria-label={`${product.colors.length} shades`}
        >
          {product.colors.slice(0, 5).map((c) => (
            <li
              key={c.name}
              title={c.name}
              className="border-line size-3.5 rounded-full border"
              style={{ backgroundColor: c.hex ?? undefined }}
            />
          ))}
          {product.colors.length > 5 && (
            <li className="text-muted text-xs">+{product.colors.length - 5}</li>
          )}
        </ul>
      )}
      <div className="mt-3">
        <QuickAdd product={product} />
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: ProductCardDTO[];
  priorityCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
