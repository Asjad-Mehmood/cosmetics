import { cn } from "@store/ui";
import type { ElementType, ReactNode } from "react";

/**
 * Marks a block for a scroll-in entrance (run by <GsapScenes />). With
 * `stagger`, its children marked `.reveal-item` come in one after another.
 * Nothing is hidden until GSAP has loaded, content already on screen is left
 * alone, and with Reduce motion GSAP never loads, so everything is shown.
 */
export function Reveal({
  children,
  className,
  stagger = false,
  as: Tag = "div",
  ...props
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  as?: ElementType;
} & Record<string, unknown>) {
  return (
    <Tag data-gsap={stagger ? "stagger" : "reveal"} className={cn(className)} {...props}>
      {children}
    </Tag>
  );
}
