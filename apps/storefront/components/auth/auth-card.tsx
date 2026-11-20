import { Container } from "@store/ui";
import type { ReactNode } from "react";
import { BadgeCheckIcon, HeartIcon, TruckIcon } from "../icons";

const BENEFITS = [
  { icon: TruckIcon, text: "Track every order and reorder your favourites in one tap" },
  { icon: HeartIcon, text: "Save products to your wishlist and get back-in-stock alerts" },
  { icon: BadgeCheckIcon, text: "Members hear about offers and new launches first" },
];

/** Sign in / register / reset layout: the form beside a brand panel on wide screens. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Container className="py-8 sm:py-14">
      <div className="border-line mx-auto grid max-w-5xl overflow-hidden rounded-3xl border lg:grid-cols-2">
        <div className="px-6 py-10 sm:px-12 sm:py-14">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted mt-2">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="text-muted mt-8 text-center text-sm">{footer}</div>}
        </div>
        <aside
          aria-label="Why create an account"
          className="bg-brand-700 relative hidden flex-col justify-center overflow-hidden px-12 py-14 text-white lg:flex"
        >
          <span
            aria-hidden
            className="bg-accent-500/30 absolute -right-20 -top-20 size-72 rounded-full blur-3xl"
          />
          <p className="text-accent-100 text-xs font-semibold uppercase tracking-widest">
            Your account
          </p>
          <p className="mt-3 text-3xl font-extrabold leading-tight">
            Beauty and health care, made simple.
          </p>
          <ul className="mt-8 space-y-5">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
                  <Icon width={20} height={20} />
                </span>
                <span className="pt-2 text-sm text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Container>
  );
}

export function FormMessage({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "bg-danger/10 text-danger rounded-xl p-3 text-sm"
          : tone === "info"
            ? "bg-surface text-ink rounded-xl p-3 text-sm"
            : "bg-success/10 text-success rounded-xl p-3 text-sm"
      }
    >
      {children}
    </div>
  );
}

/** Only allow same-site relative redirects (prevents open redirects via ?next=). */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
