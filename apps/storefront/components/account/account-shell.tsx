"use client";

import { Container, cn, Skeleton } from "@store/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { useLogout, useMe } from "@/hooks/use-auth";

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/prescriptions", label: "Prescriptions" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile & password" },
  { href: "/account/addresses", label: "Addresses" },
];

/** Account area: redirects guests to sign in, then shows the account navigation. */
export function AccountShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  // Signing out clears the session, which would otherwise trigger the
  // "guests must sign in" redirect below instead of going home.
  const signingOut = useRef(false);

  // Phones: bring the current tab into view in the sideways-scrolling row.
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const row = nav.current?.querySelector("ul");
    const tab = nav.current?.querySelector<HTMLElement>("[aria-current=page]");
    if (row && tab && row.scrollWidth > row.clientWidth) {
      row.scrollLeft = tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2;
    }
  }, [pathname, me.data]);

  useEffect(() => {
    if (me.isFetched && !me.data && !signingOut.current)
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [me.isFetched, me.data, pathname, router]);

  if (!me.data) {
    return (
      <Container className="py-12">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-8 h-48" />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight">My account</h1>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        {/* min-w-0: on phones the tabs scroll sideways instead of widening the page. */}
        <nav ref={nav} aria-label="Account" className="min-w-0">
          <ul className="no-scrollbar relative -mx-4 flex snap-x gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:flex-col">
            {NAV.map((item) => (
              <li key={item.href} className="snap-start">
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium",
                    pathname === item.href ? "bg-brand-600 text-white" : "hover:bg-surface",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => {
                  signingOut.current = true;
                  logout.mutate(undefined, {
                    onSuccess: () => {
                      toast.success("You've been signed out");
                      router.push("/");
                    },
                    onError: () => {
                      signingOut.current = false;
                      toast.error("Could not sign out. Please try again.");
                    },
                  });
                }}
                className="text-muted hover:bg-surface hover:text-ink block w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium"
              >
                Sign out
              </button>
            </li>
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
