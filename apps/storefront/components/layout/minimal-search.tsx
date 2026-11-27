"use client";

import { Container } from "@store/ui";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchIcon, XIcon } from "../icons";
import { OPEN_SEARCH_EVENT, SearchBar } from "./search-box";

/** Minimal design: a search icon that folds a full-width search bar out under the header. */
export function MinimalSearch() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, show);
  }, []);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLInputElement>("[data-site-search]")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close search" : "Search"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="hover:bg-surface rounded-full p-2"
      >
        {open ? <XIcon /> : <SearchIcon />}
      </button>
      {open && (
        <div
          ref={panel}
          className="border-line bg-canvas animate-fade-in shadow-(--shadow-card) absolute inset-x-0 top-full z-30 border-b py-4"
        >
          <Container className="max-w-3xl">
            <SearchBar />
          </Container>
        </div>
      )}
    </>
  );
}
