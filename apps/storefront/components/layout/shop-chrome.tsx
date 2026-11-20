import type { CategoryDTO, CollectionDTO, HomeContentDTO } from "@store/types";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";
import { Header, TopBar } from "@/components/layout/header";
import { NavigationFeedback, RouteView } from "@/components/layout/navigation-feedback";
import { Providers } from "@/components/providers";
import { SiteProvider } from "@/components/site-context";
import { getDataSafe } from "@/lib/server-api";

/** The shop's header, footer, cart and mobile tab bar around a page. */
export async function ShopChrome({ children }: { children: ReactNode }) {
  const [home, categories, collections] = await Promise.all([
    getDataSafe<HomeContentDTO | null>("/cms/home", null, { revalidate: 300 }),
    getDataSafe<CategoryDTO[]>("/categories", [], { revalidate: 300 }),
    getDataSafe<CollectionDTO[]>("/collections", [], { revalidate: 300 }),
  ]);
  const contact = home?.contact ?? { phone: null, email: null };

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Providers>
        <SiteProvider
          value={{
            contact,
            delivery: home?.delivery ?? [],
            categories,
            vouchers: home?.vouchers ?? [],
          }}
        >
          <a
            href="#main"
            className="focus:bg-ink sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:px-3 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <NavigationFeedback />
          <TopBar text={home?.announcement ?? null} phone={contact.phone} />
          <Header categories={categories} collections={collections} />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            <RouteView>{children}</RouteView>
          </main>
          <Footer categories={categories} contact={contact} />
          <BottomNav />
          <CartDrawer />
        </SiteProvider>
      </Providers>
    </div>
  );
}
