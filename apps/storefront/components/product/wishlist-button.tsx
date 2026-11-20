"use client";

import { cn } from "@store/ui";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useMe } from "@/hooks/use-auth";
import { useToggleWishlist, useWishlistIds } from "@/hooks/use-wishlist";
import { HeartIcon } from "../icons";
import { Burst } from "../motion";

/** Heart toggle. Guests are sent to sign in first (and come back here). */
export function WishlistButton({
  productId,
  title,
  variant = "overlay",
  withText = false,
  className,
}: {
  productId: string;
  title: string;
  variant?: "overlay" | "button";
  /** Show "Save to wishlist" next to the heart (button variant). */
  withText?: boolean;
  className?: string;
}) {
  const me = useMe();
  const ids = useWishlistIds();
  const toggle = useToggleWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const saved = ids.data?.includes(productId) ?? false;
  // Bumped each time the shopper saves, to replay the heart pop and burst.
  const [pops, setPops] = useState(0);

  const onClick = () => {
    if (!me.data) {
      toast("Sign in to save products to your wishlist");
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!saved) setPops((n) => n + 1);
    toggle.mutate(
      { productId, saved: !saved },
      {
        onSuccess: () =>
          toast.success(saved ? "Removed from your wishlist" : "Saved to your wishlist"),
        onError: () => toast.error("Couldn't update your wishlist. Please try again."),
      },
    );
  };

  const label = saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`;
  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={withText ? undefined : label}
        className={cn(
          "border-line hover:border-ink flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition",
          withText ? "px-4" : "w-12",
          className,
        )}
      >
        <Heart saved={saved} pops={pops} className="size-5" />
        {withText && (saved ? "Saved to your wishlist" : "Save to wishlist")}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      className={cn(
        "bg-canvas/90 hover:bg-canvas absolute right-2.5 top-2.5 z-10 flex size-9 items-center justify-center rounded-full shadow-sm transition",
        className,
      )}
    >
      <Heart saved={saved} pops={pops} className="size-[18px]" />
    </button>
  );
}

/** The heart: fills with a springy pop and a burst of dots when saved; un-saving just fades. */
function Heart({ saved, pops, className }: { saved: boolean; pops: number; className: string }) {
  return (
    <span key={pops} className="relative grid place-items-center">
      <HeartIcon
        className={cn(
          className,
          "transition-[fill,stroke] duration-300",
          saved ? "fill-danger stroke-danger" : "fill-transparent",
          saved && pops > 0 && "animate-pop",
        )}
      />
      {saved && pops > 0 && <Burst />}
    </span>
  );
}
