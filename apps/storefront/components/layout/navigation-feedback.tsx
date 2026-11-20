"use client";

import { cn } from "@store/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { skeletonFor } from "@/components/skeletons/page-skeletons";
import { endNavigation, isShopPath, startNavigation, usePendingNavigation } from "@/lib/navigation";

/** Same-origin shop link under the event target, if any. */
function shopLinkFrom(target: EventTarget | null): URL | null {
  const anchor = target instanceof Element ? target.closest("a[href]") : null;
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download") || anchor.getAttribute("aria-disabled") === "true") {
    return null;
  }
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin || !isShopPath(url.pathname)) return null;
  return url;
}

const isCurrent = (url: URL) =>
  url.pathname === window.location.pathname && url.search === window.location.search;

/**
 * Starts the navigation feedback on link clicks and prefetches the next page
 * as soon as the visitor shows intent (mouse resting on a link, a finger
 * touching it, keyboard focus), so most page switches are instant.
 */
function NavigationEvents() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  // The new URL has committed: the navigation is over.
  useEffect(() => endNavigation(), [pathname, search]);

  useEffect(() => {
    const prefetched = new Map<string, number>();
    const prefetch = (url: URL) => {
      if (isCurrent(url)) return;
      const key = url.pathname + url.search;
      // Next's router keeps prefetched pages for a few minutes; don't re-ask sooner.
      if (Date.now() - (prefetched.get(key) ?? 0) < 60_000) return;
      prefetched.set(key, Date.now());
      router.prefetch(key);
    };

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const url = shopLinkFrom(e.target);
      if (url && !isCurrent(url)) startNavigation(url.href);
    };

    let hover: number | undefined;
    const onPointerOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const url = shopLinkFrom(e.target);
      window.clearTimeout(hover);
      // A short rest filters out the cursor just passing over a grid of cards.
      if (url) hover = window.setTimeout(() => prefetch(url), 80);
    };
    const onPointerOut = () => window.clearTimeout(hover);
    const onTouchStart = (e: TouchEvent) => {
      const url = shopLinkFrom(e.target);
      if (url) prefetch(url);
    };
    const onFocusIn = (e: FocusEvent) => {
      const url = shopLinkFrom(e.target);
      if (url) prefetch(url);
    };

    const opts = { capture: true, passive: true } as const;
    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerover", onPointerOver, opts);
    document.addEventListener("pointerout", onPointerOut, opts);
    document.addEventListener("touchstart", onTouchStart, opts);
    document.addEventListener("focusin", onFocusIn, opts);
    window.addEventListener("popstate", endNavigation);
    return () => {
      window.clearTimeout(hover);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerover", onPointerOver, opts);
      document.removeEventListener("pointerout", onPointerOut, opts);
      document.removeEventListener("touchstart", onTouchStart, opts);
      document.removeEventListener("focusin", onFocusIn, opts);
      window.removeEventListener("popstate", endNavigation);
    };
  }, [router]);

  return null;
}

/**
 * A thin bar along the top of the screen while a page is loading. Hidden for
 * switches faster than 150 ms (prefetched pages), so it never just flashes.
 */
function NavigationProgress() {
  const pending = usePendingNavigation();
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    if (pending) {
      const show = window.setTimeout(() => setPhase("loading"), 150);
      return () => window.clearTimeout(show);
    }
    setPhase((p) => (p === "loading" ? "done" : "idle"));
  }, [pending]);

  useEffect(() => {
    if (phase !== "done") return;
    const hide = window.setTimeout(() => setPhase("idle"), 400);
    return () => window.clearTimeout(hide);
  }, [phase]);

  if (phase === "idle") return null;
  return (
    <div
      aria-hidden
      data-testid="nav-progress"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
    >
      <div
        className={cn(
          "bg-accent-500 h-full origin-left shadow-[0_0_8px_var(--color-accent-500)]",
          phase === "loading"
            ? "animate-nav-progress"
            : "scale-x-100 opacity-0 transition-opacity delay-150 duration-200",
        )}
      />
    </div>
  );
}

/** Mount once in the shop layout. */
export function NavigationFeedback() {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationEvents />
      </Suspense>
      <NavigationProgress />
    </>
  );
}

/**
 * The page area. While a page switch is loading it shows the next page's
 * skeleton in place of the old page (after 100 ms, so prefetched switches go
 * straight to the new page); new pages then fade in. The first page of a
 * visit is never animated, so it paints as early as possible.
 */
export function RouteView({ children }: { children: ReactNode }) {
  const pending = usePendingNavigation();
  const pathname = usePathname();
  const [skeleton, setSkeleton] = useState<string | null>(null);
  // Decided during render (not in an effect), so a new page never paints
  // once at full opacity before its fade starts.
  const [lastPath, setLastPath] = useState(pathname);
  const [navigated, setNavigated] = useState(false);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setNavigated(true);
  }
  // Hidden the moment the navigation ends, in the same render as the new page.
  const showSkeleton = skeleton !== null && pending !== null;

  useEffect(() => {
    if (!pending) {
      setSkeleton(null);
      return;
    }
    const show = window.setTimeout(() => {
      setSkeleton(pending.pathname);
      window.scrollTo({ top: 0 });
    }, 100);
    // Never leave a skeleton up if a navigation silently goes nowhere.
    const giveUp = window.setTimeout(endNavigation, 15_000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(giveUp);
    };
  }, [pending]);

  return (
    <>
      <div
        key={pathname}
        hidden={showSkeleton}
        className={navigated ? "motion-safe:animate-fade-up" : undefined}
      >
        {children}
      </div>
      {showSkeleton && (
        <div data-testid="route-skeleton" className="motion-safe:animate-fade-in">
          {skeletonFor(skeleton)}
        </div>
      )}
    </>
  );
}
