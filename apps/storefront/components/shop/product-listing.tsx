import type { CategoryDTO, FiltersDTO, ProductCardDTO } from "@store/types";
import { cn, Container } from "@store/ui";
import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { countActiveFilters, parseFilters, toApiQuery, type SearchParams } from "@/lib/listing";
import { getData, getDataSafe, getList } from "@/lib/server-api";
import { ChevronRightIcon } from "../icons";
import { ProductGrid } from "../product/product-card";
import { FilterPanel, MobileFilters } from "./filter-panel";
import { ListingNavProvider, ResultsArea } from "./listing-nav";
import { Pagination } from "./pagination";
import { ActiveFilters, SortSelect } from "./toolbar";

export interface ListingProps {
  title: string;
  description?: string | null;
  /** Photo shown in the page header (e.g. the category's). */
  image?: string | null;
  /** Small label above the title, e.g. "Category". */
  eyebrow?: string;
  pathname: string;
  searchParams: SearchParams;
  scope?: { category?: string; collection?: string };
  breadcrumbs?: ReactNode;
  /** Shown above the grid, e.g. the search box. */
  header?: ReactNode;
  /** Category chips under the header (the current one is highlighted). */
  showCategories?: boolean;
  /** Offers page: the on-sale filter is always on. */
  lockedOnSale?: boolean;
}

const EMPTY_FILTERS: FiltersDTO = { sizes: [], colors: [], price: { min: 0, max: 0 } };

/** Shared listing page for shop, category, collection, offers and search. */
export async function ProductListing({
  title,
  description,
  image,
  eyebrow,
  pathname,
  searchParams,
  scope = {},
  breadcrumbs,
  header,
  showCategories = true,
  lockedOnSale = false,
}: ListingProps) {
  const filters = parseFilters(lockedOnSale ? { ...searchParams, onSale: "true" } : searchParams);
  const scopeQuery = new URLSearchParams(scope as Record<string, string>).toString();

  const [products, options, categories] = await Promise.all([
    getList<ProductCardDTO>(`/products?${toApiQuery(filters, scope)}`),
    getData<FiltersDTO>(`/filters?${scopeQuery}`, { revalidate: 300 }),
    showCategories
      ? getDataSafe<CategoryDTO[]>("/categories", [], { revalidate: 300 })
      : Promise.resolve([] as CategoryDTO[]),
  ]);
  const filterOptions = options ?? EMPTY_FILTERS;
  const { total, totalPages } = products.meta;
  const activeCount = countActiveFilters(filters) - (lockedOnSale ? 1 : 0);

  return (
    <Suspense>
      <ListingNavProvider>
        <Container className="py-6 sm:py-8">
          {breadcrumbs}
          <div className="bg-blush relative mb-6 overflow-hidden rounded-3xl">
            <div className="relative z-10 max-w-xl px-6 py-8 sm:px-10 sm:py-10 md:w-3/5">
              {eyebrow && <p className="eyebrow text-accent-700">{eyebrow}</p>}
              <h1 className="display mt-4 text-4xl sm:text-5xl">{title}</h1>
              {description && <p className="text-muted mt-3 max-w-lg">{description}</p>}
              <p className="mt-4 text-sm font-medium" aria-live="polite">
                {total} {total === 1 ? "product" : "products"}
              </p>
            </div>
            {image && (
              <div className="absolute inset-y-0 right-0 hidden w-2/5 md:block">
                <Image src={image} alt="" fill sizes="40vw" className="object-cover" />
                <span className="from-blush absolute inset-0 bg-gradient-to-r to-transparent" />
              </div>
            )}
          </div>

          {categories.length > 0 && (
            <nav aria-label="Categories" className="mb-6">
              <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {[{ slug: "", name: "All products" }, ...categories].map((c) => {
                  const href = c.slug ? `/categories/${c.slug}` : "/shop";
                  const on = href === pathname;
                  return (
                    <li key={href} className="shrink-0">
                      <Link
                        href={href}
                        aria-current={on ? "page" : undefined}
                        className={cn(
                          "block rounded-full border px-4 py-2 text-sm font-medium transition",
                          on
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-line hover:border-brand-600",
                        )}
                      >
                        {c.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
          {header}

          <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
            <aside aria-label="Filters" className="hidden lg:block">
              <div className="sticky top-36">
                <p className="mb-4 text-lg font-bold">Filters</p>
                <FilterPanel filters={filterOptions} lockedOnSale={lockedOnSale} />
              </div>
            </aside>

            <div>
              <div className="bg-canvas/95 sticky top-[120px] z-20 -mx-4 mb-4 flex items-center justify-between gap-3 px-4 py-2 backdrop-blur md:top-16 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
                <p className="text-muted hidden text-sm lg:block">
                  Showing {products.data.length} of {total}
                </p>
                <div className="flex flex-1 items-center justify-between gap-2 lg:flex-none">
                  <MobileFilters
                    filters={filterOptions}
                    activeCount={activeCount}
                    resultCount={total}
                    lockedOnSale={lockedOnSale}
                  />
                  <SortSelect value={filters.sort} search={!!filters.q} />
                </div>
              </div>
              <div className="mb-6">
                <ActiveFilters lockedOnSale={lockedOnSale} />
              </div>

              <ResultsArea>
                <h2 className="sr-only">Products</h2>
                {products.data.length > 0 ? (
                  <ProductGrid products={products.data} priorityCount={4} />
                ) : (
                  <div className="bg-surface rounded-3xl px-6 py-16 text-center">
                    <p className="text-lg font-semibold">No products match these filters</p>
                    <p className="text-muted mt-2 text-sm">
                      Try removing a filter, or browse a category instead.
                    </p>
                    <Link
                      href={pathname}
                      className="bg-ink mt-6 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-white"
                    >
                      Clear filters
                    </Link>
                  </div>
                )}
                <Pagination
                  page={filters.page}
                  totalPages={totalPages}
                  pathname={pathname}
                  searchParams={searchParams}
                />
              </ResultsArea>
            </div>
          </div>
        </Container>
      </ListingNavProvider>
    </Suspense>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-muted mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRightIcon width={14} height={14} aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="hover:text-ink hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink line-clamp-1 font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
