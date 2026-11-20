import { useSyncExternalStore } from "react";

/**
 * The page navigation in progress, if any: set the moment a shop link is
 * clicked (or `startNavigation` is called), cleared when the new URL commits.
 * Drives the top progress bar and the instant skeleton of the next page.
 */
export type PendingNavigation = { pathname: string; startedAt: number } | null;

let pending: PendingNavigation = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Marks a navigation to `href` as started (no-op for the current URL). */
export function startNavigation(href: string) {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return;
  if (url.pathname + url.search === window.location.pathname + window.location.search) return;
  pending = { pathname: url.pathname, startedAt: Date.now() };
  emit();
}

export function endNavigation() {
  if (!pending) return;
  pending = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePendingNavigation(): PendingNavigation {
  return useSyncExternalStore(
    subscribe,
    () => pending,
    () => null,
  );
}

/** Paths the shop's own navigation feedback ignores (other apps on this domain). */
export function isShopPath(pathname: string) {
  return !/^\/(admin|api)(\/|$)/.test(pathname);
}
