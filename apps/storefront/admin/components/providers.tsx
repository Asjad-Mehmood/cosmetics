"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { sessionKey } from "@/admin/hooks/use-session";
import { ApiError } from "@/admin/lib/api";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    // Save buttons: the button that started a successful save shows a ✓ briefly.
    const pressed = new Map<number, HTMLButtonElement>();
    const qc: QueryClient = new QueryClient({
      mutationCache: new MutationCache({
        onMutate: (_vars, mutation) => {
          const el = document.activeElement;
          if (el instanceof HTMLButtonElement) pressed.set(mutation.mutationId, el);
        },
        onSuccess: (_data, _vars, _ctx, mutation) => {
          const button = pressed.get(mutation.mutationId);
          if (!button?.isConnected) return;
          button.dataset.done = "";
          setTimeout(() => delete button.dataset.done, 1200);
        },
        onSettled: (_data, _err, _vars, _ctx, mutation) => {
          pressed.delete(mutation.mutationId);
        },
      }),
      queryCache: new QueryCache({
        // The session ended (expired and could not refresh, or the account was
        // blocked): drop it, and the shell sends the user to the login page.
        onError: (err, query) => {
          const ended =
            err instanceof ApiError &&
            (err.status === 401 || (err.status === 403 && err.code === "ACCOUNT_BLOCKED"));
          if (ended && query.queryKey[0] !== sessionKey[0]) qc.setQueryData(sessionKey, null);
        },
      }),
      defaultOptions: {
        queries: {
          staleTime: 15 * 1000,
          refetchOnWindowFocus: true,
          retry: (count, err) =>
            !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
        },
      },
    });
    return qc;
  });
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
