"use client";

import { useEffect, useId, useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Visually hide the title (it is still announced to screen readers). */
  hideTitle?: boolean;
  /** `center` = modal, `right` / `left` = slide-in drawer, `bottom` = bottom sheet. */
  variant?: "center" | "right" | "left" | "bottom";
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const variants = {
  center: "m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl max-h-[85dvh]",
  right: "ml-auto mr-0 my-0 h-dvh max-h-dvh w-full max-w-md",
  left: "mr-auto ml-0 my-0 h-dvh max-h-dvh w-full max-w-sm",
  bottom: "mt-auto mb-0 mx-0 w-full max-w-none max-h-[88dvh] rounded-t-3xl",
} as const;

/**
 * Accessible modal / drawer built on the native <dialog> element, which gives
 * focus trapping, Escape-to-close and an inert background for free.
 */
export function Dialog({
  open,
  onClose,
  title,
  hideTitle,
  variant = "center",
  className,
  children,
  footer,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const sheet = variant === "bottom";

  // Bottom sheets can be dragged down to close; a short drag springs back.
  const drag = useRef<{ startY: number; dy: number; at: number } | null>(null);
  const endDrag = (close: boolean) => {
    const dialog = ref.current;
    drag.current = null;
    if (!dialog) return;
    dialog.style.transition = "";
    dialog.style.translate = "";
    if (close) onClose();
  };
  const dragHandlers = sheet
    ? {
        onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
          if (e.button !== 0 || (e.target as Element).closest("button")) return;
          drag.current = { startY: e.clientY, dy: 0, at: Date.now() };
          e.currentTarget.setPointerCapture(e.pointerId);
        },
        onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
          const dialog = ref.current;
          if (!drag.current || !dialog) return;
          drag.current.dy = Math.max(0, e.clientY - drag.current.startY);
          dialog.style.transition = "none";
          dialog.style.translate = `0 ${drag.current.dy}px`;
        },
        onPointerUp: () => {
          if (!drag.current) return;
          const { dy, at } = drag.current;
          const flicked = dy / Math.max(1, Date.now() - at) > 0.5;
          endDrag(dy > 80 || (flicked && dy > 20));
        },
        onPointerCancel: () => drag.current && endDrag(false),
      }
    : {};

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click on the backdrop lands on the <dialog> element itself.
      onClick={(e) => e.target === ref.current && onClose()}
      data-variant={variant}
      className={cn(
        "ui-dialog bg-canvas text-ink flex-col p-0 shadow-2xl open:flex",
        variants[variant],
        className,
      )}
    >
      <div
        {...dragHandlers}
        className={cn(
          "border-line flex items-center justify-between gap-4 border-b px-5 py-4",
          sheet && "relative cursor-grab touch-none pt-6 active:cursor-grabbing",
        )}
      >
        {sheet && (
          <span
            aria-hidden
            className="bg-line absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full"
          />
        )}
        <h2 id={titleId} className={cn("text-lg font-semibold", hideTitle && "sr-only")}>
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="hover:bg-surface -mr-2 ml-auto rounded-lg p-2"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="border-line border-t px-5 py-4">{footer}</div>}
    </dialog>
  );
}
