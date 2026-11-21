"use client";

import type { ApiResponse, EmailSettingsDTO } from "@store/types";
import { Badge, Button, Field, Input, Skeleton } from "@store/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/admin/components/ui/confirm";
import { ErrorState, PageHeader, Section } from "@/admin/components/ui/page";
import { useSession } from "@/admin/hooks/use-session";
import { api, errorMessage } from "@/admin/lib/api";

const QUERY_KEY = ["admin", "settings", "email"];

/** Set in Vercel → Settings → Environment Variables (never in the admin). */
const SMTP_VARS: [string, string][] = [
  ["SMTP_HOST", "SMTP server, e.g. smtp.gmail.com"],
  ["SMTP_PORT", "465 or 587 (default 587)"],
  ["SMTP_SECURE", "true for port 465"],
  ["SMTP_USER", "the email account, e.g. orders@yourdomain.com"],
  ["SMTP_PASSWORD", "its password (for Gmail, an app password)"],
  ["EMAIL_FROM", "sender, e.g. Amazon Group <orders@yourdomain.com>"],
];

/**
 * Settings → Email. Read only: the email login lives in the server's
 * environment variables, so it can't be seen or changed from the admin.
 */
export function EmailSettings() {
  const qc = useQueryClient();
  const { data: user } = useSession();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => (await api<ApiResponse<EmailSettingsDTO>>("/admin/settings/email")).data,
  });
  const [testTo, setTestTo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const test = useMutation({
    mutationFn: () =>
      api("/admin/settings/email/test", { method: "POST", body: { to: testTo.trim() } }),
    onSuccess: () => toast.success(`Test email sent to ${testTo.trim()}`),
    onError: (err) => toast.error(errorMessage(err)),
  });
  const removeSaved = useMutation({
    mutationFn: async () =>
      (await api<ApiResponse<EmailSettingsDTO>>("/admin/settings/email", { method: "DELETE" }))
        .data,
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEY, data);
      void qc.invalidateQueries({ queryKey: ["admin", "settings"], exact: true });
      setConfirmDelete(false);
      toast.success("The email login saved in the admin was deleted");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (query.isError) return <ErrorState message={errorMessage(query.error)} />;
  if (!query.data) return <Skeleton className="h-96" />;
  const s = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email"
        description="Order confirmations, shipping updates, password resets and staff invitations."
        actions={
          <Badge tone={s.configured ? "success" : "warning"}>
            {s.configured ? "Sending" : "Not set up"}
          </Badge>
        }
      />

      <Section
        title="Email login"
        description="For security, the email login is kept only on the server, in Vercel → Settings → Environment Variables. It can't be seen or changed here, so a stolen admin password can't reveal it."
      >
        {s.configured ? (
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted text-xs">Sent with</dt>
              <dd className="font-medium">
                {s.provider === "smtp" ? `SMTP (${s.smtp?.host}:${s.smtp?.port})` : "Resend"}
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs">From</dt>
              <dd className="font-medium">{s.from}</dd>
            </div>
            {s.smtp?.user && (
              <div>
                <dt className="text-muted text-xs">Account</dt>
                <dd className="font-medium">{s.smtp.user}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted text-xs">Login comes from</dt>
              <dd className="font-medium">
                {s.source === "environment"
                  ? "Vercel environment variables"
                  : "Saved in the admin (older setup)"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm">
            Email isn’t set up, so the store sends no emails. Orders still work: customers see their
            order details on screen.
          </p>
        )}

        {s.source !== "environment" && (
          <div className="bg-surface mt-4 space-y-3 rounded-xl p-4 text-sm">
            <p className="font-medium">
              To {s.configured ? "move email to" : "set up email in"} Vercel, add these environment
              variables (for Production), then redeploy:
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {SMTP_VARS.map(([name, hint]) => (
                <li key={name}>
                  <code className="font-semibold">{name}</code>
                  <span className="text-muted block text-xs">{hint}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted text-xs">
              Using Resend instead? Add <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code>.
            </p>
          </div>
        )}
      </Section>

      {s.hasSavedLogin && (
        <Section
          title="Login saved in the admin"
          description={
            s.source === "environment"
              ? "Email now uses the environment variables, so the copy saved in the admin earlier isn't needed any more. Delete it."
              : "An email login was saved in the admin before it moved to the environment variables. It still works for now. Add the environment variables above, redeploy, then delete it here."
          }
        >
          <Button
            variant={s.source === "environment" ? "danger" : "outline"}
            onClick={() => setConfirmDelete(true)}
          >
            Delete the saved login
          </Button>
        </Section>
      )}

      {s.configured && (
        <Section title="Send a test email">
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              test.mutate();
            }}
          >
            <Field label="Send to" htmlFor="test-email-to" className="min-w-64 flex-1">
              <Input
                id="test-email-to"
                type="email"
                value={testTo}
                placeholder={user?.email ?? "you@example.com"}
                onChange={(e) => setTestTo(e.target.value)}
              />
            </Field>
            <Button
              type="submit"
              variant="outline"
              loading={test.isPending}
              disabled={!testTo.trim()}
            >
              Send test
            </Button>
          </form>
        </Section>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete the email login saved in the admin?"
        confirmLabel="Delete"
        tone="danger"
        loading={removeSaved.isPending}
        onConfirm={() => removeSaved.mutate()}
        onClose={() => setConfirmDelete(false)}
      >
        {s.source === "environment"
          ? "Email keeps working from the Vercel environment variables."
          : "The environment variables aren't set yet, so the store will stop sending email until they are."}
      </ConfirmDialog>
    </div>
  );
}
