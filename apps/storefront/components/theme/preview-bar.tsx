import Link from "next/link";

/** Shown only to a browser previewing a design from the admin. */
export function ThemePreviewBar({ theme }: { theme: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 bg-[#2b5cff] px-4 py-2 text-xs text-white sm:text-sm"
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
