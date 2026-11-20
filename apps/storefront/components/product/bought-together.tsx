"use client";

import type { ApiResponse, ProductCardDTO, ProductDetailDTO } from "@store/types";
import { formatMoney } from "@store/types";
import { Button, cn } from "@store/ui";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAddToCart } from "@/hooks/use-cart";
import { api, ApiError } from "@/lib/api";
import { useUi } from "@/store/ui";
import { PlusIcon } from "../icons";
import { isSingleOption } from "./quick-add";

interface Item {
  key: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  /** Known for this product; looked up on add for the others. */
  variantId?: string;
  note?: string;
}

/**
 * "Frequently bought together": this product plus up to two related ones
 * (products bought in the same orders come first), added in one click.
 */
export function BoughtTogether({
  product,
  related,
}: {
  product: ProductDetailDTO;
  related: ProductCardDTO[];
}) {
  const addToCart = useAddToCart();
  const openCart = useUi((s) => s.openCart);
  const [adding, setAdding] = useState(false);

  const mine = product.variants.find((v) => v.stockStatus !== "out_of_stock");
  const others = related.filter(isSingleOption).slice(0, 2);
  const items: Item[] = mine
    ? [
        {
          key: product.id,
          slug: product.slug,
          title: product.title,
          image: product.images[0]?.url ?? null,
          price: mine.price,
          variantId: mine.id,
          note: product.variants.length > 1 ? mine.size : undefined,
        },
        ...others.map((p) => ({
          key: p.id,
          slug: p.slug,
          title: p.title,
          image: p.image?.url ?? null,
          price: p.price,
        })),
      ]
    : [];
  const [picked, setPicked] = useState(() => new Set(items.map((i) => i.key)));

  if (!mine || others.length === 0) return null;
  const chosen = items.filter((i) => picked.has(i.key));
  const total = chosen.reduce((sum, i) => sum + i.price, 0);

  async function addAll() {
    setAdding(true);
    try {
      for (const item of chosen) {
        let variantId = item.variantId;
        if (!variantId) {
          const detail = (await api<ApiResponse<ProductDetailDTO>>(`/products/${item.slug}`)).data;
          variantId = detail.variants.find((v) => v.stockStatus !== "out_of_stock")?.id;
        }
        if (variantId) await addToCart.mutateAsync({ variantId, quantity: 1 });
      }
      openCart();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not add to cart. Please try again.",
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <section
      aria-labelledby="together-heading"
      className="border-line mt-14 rounded-3xl border p-5 sm:p-7"
    >
      <h2 id="together-heading" className="text-xl font-bold tracking-tight">
        Frequently bought together
      </h2>
      <div className="mt-5 grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <ul className="flex items-center gap-2" aria-hidden>
          {items.map((item, i) => (
            <li key={item.key} className="flex items-center gap-2">
              {i > 0 && <PlusIcon className="text-muted" />}
              <span
                className={cn(
                  "bg-surface relative block size-20 overflow-hidden rounded-xl transition sm:size-24",
                  !picked.has(item.key) && "opacity-30",
                )}
              >
                {item.image && (
                  <Image src={item.image} alt="" fill sizes="96px" className="object-cover" />
                )}
              </span>
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={item.key}>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={picked.has(item.key)}
                  onChange={() =>
                    setPicked((s) => {
                      const next = new Set(s);
                      if (next.has(item.key)) next.delete(item.key);
                      else next.add(item.key);
                      return next;
                    })
                  }
                  className="accent-brand-600 mt-0.5 size-4"
                />
                <span>
                  {i === 0 ? <strong>This item: </strong> : null}
                  {i === 0 ? (
                    item.title
                  ) : (
                    <Link href={`/products/${item.slug}`} className="hover:underline">
                      {item.title}
                    </Link>
                  )}
                  {item.note && <span className="text-muted"> ({item.note})</span>}
                  <span className="ml-2 font-semibold">{formatMoney(item.price)}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="bg-surface rounded-2xl p-4 lg:w-60">
          <p className="text-muted text-sm">
            Total for {chosen.length} {chosen.length === 1 ? "item" : "items"}
          </p>
          <p className="text-2xl font-extrabold">{formatMoney(total)}</p>
          <Button
            variant="brand"
            pill
            className="mt-3 w-full"
            onClick={addAll}
            loading={adding}
            disabled={chosen.length === 0}
          >
            Add {chosen.length === items.length ? "all" : chosen.length} to cart
          </Button>
        </div>
      </div>
    </section>
  );
}
