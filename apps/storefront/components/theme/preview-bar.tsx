import Link from "next/link";

/** Shown only to a browser previewing a design from the admin. */
export function ThemePreviewBar({ theme }: { theme: string }) {
  return (
    <div
      role="status"
      className="bg-ink fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-50 flex items-center justify-center gap-3 px-4 py-2.5 text-sm text-white shadow-lg md:bottom-0"
    >
      <span>
        Previewing the <strong className="capitalize">{theme}</strong> design. Visitors still see
        the live one.
      </span>
      <Link
        href="/theme-preview?exit=1"
        prefetch={false}
        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black hover:bg-white/90"
      >
        Exit preview
      </Link>
    </div>
  );
}
