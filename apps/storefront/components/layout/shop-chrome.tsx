import type { CategoryDTO, CollectionDTO, HomeContentDTO } from "@store/types";
import { Logo } from "@store/ui";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { GsapScenes } from "@/components/gsap-scenes";
import { PhotoTransition } from "@/components/photo-transition";
import { Preloader } from "@/components/preloader";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Footer } from "@/components/layout/footer";
import { Header, TopBar } from "@/components/layout/header";
import { MinimalHeader, MinimalTopBar } from "@/components/layout/minimal-header";
import { NavigationFeedback, RouteView } from "@/components/layout/navigation-feedback";
import { Providers } from "@/components/providers";
import { SiteProvider } from "@/components/site-context";
import { ThemePreviewBar } from "@/components/theme/preview-bar";
import { ThemeAttr } from "@/components/theme/theme-attr";
import { PRELOAD_SCRIPT } from "@/lib/preloader";
import { getDataSafe } from "@/lib/server-api";
import { resolveTheme, themeScript } from "@/lib/theme";

/** The shop's header, footer, cart and mobile tab bar around a page. */
export async function ShopChrome({ children }: { children: ReactNode }) {
  const [home, categories, collections] = await Promise.all([
    getDataSafe<HomeContentDTO | null>("/cms/home", null, { revalidate: 300 }),
    getDataSafe<CategoryDTO[]>("/categories", [], { revalidate: 300 }),
    getDataSafe<CollectionDTO[]>("/collections", [], { revalidate: 300 }),
  ]);
  const contact = home?.contact ?? { phone: null, email: null };
  const { theme, preview } = await resolveTheme(home);
  const minimal = theme === "minimal";

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* The preloader: shown from the first paint until the page is ready. */}
      <script dangerouslySetInnerHTML={{ __html: PRELOAD_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: themeScript(theme) }} />
      <div id="preloader" aria-hidden="true">
        <div className="preloader-inner">
          <Logo imgClassName="h-10 sm:h-12" />
          <span className="preloader-track">
            <span className="preloader-bar" />
          </span>
        </div>
      </div>
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
          <GsapScenes />
          <PhotoTransition />
          <SmoothScroll />
          <ThemeAttr theme={theme} />
          {/* At the very top, in the page flow, so it never covers buttons. */}
          {preview && <ThemePreviewBar theme={theme} />}
          {minimal ? (
            <>
              <MinimalTopBar text={home?.announcement ?? null} />
              <MinimalHeader categories={categories} collections={collections} contact={contact} />
            </>
          ) : (
            <>
              <TopBar text={home?.announcement ?? null} phone={contact.phone} />
              <Header categories={categories} collections={collections} />
            </>
          )}
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            <RouteView>{children}</RouteView>
          </main>
          <Footer categories={categories} contact={contact} />
          <BottomNav />
          <CartDrawer />
          <Preloader />
        </SiteProvider>
      </Providers>
    </div>
  );
}
