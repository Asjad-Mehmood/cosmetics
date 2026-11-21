"use client";

import type { ApiResponse, TcsSettingsDTO } from "@store/types";
import { Badge, Button, Field, Input, Skeleton } from "@store/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/admin/components/ui/controls";
import { ErrorState, PageHeader, Section } from "@/admin/components/ui/page";
import { api, ApiError, errorMessage } from "@/admin/lib/api";

const QUERY_KEY = ["admin", "settings", "tcs"];

type Form = Pick<
  TcsSettingsDTO,
  "enabled" | "serviceCode" | "shipperName" | "shipperAddress" | "shipperCity" | "shipperMobile"
> & { defaultWeightKg: string };

/** The TCS login, set in Vercel (never in the admin). */
const ENV_VARS: [string, string][] = [
  ["TCS_CLIENT_ID", "Client ID"],
  ["TCS_CLIENT_SECRET", "Client secret"],
  ["TCS_USERNAME", "API username"],
  ["TCS_PASSWORD", "API password"],
  ["TCS_ACCOUNT_NUMBER", "Account number"],
  ["TCS_COST_CENTER_CODE", "Cost center code"],
];

const toForm = (s: TcsSettingsDTO): Form => ({
  enabled: s.enabled,
  serviceCode: s.serviceCode,
  shipperName: s.shipperName,
  shipperAddress: s.shipperAddress,
  shipperCity: s.shipperCity,
  shipperMobile: s.shipperMobile,
  defaultWeightKg: String(s.defaultWeightKg),
});

/** Store settings → TCS courier: the store's TCS API account and pickup details. */
export function TcsSettings() {
  const uid = useId();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => (await api<ApiResponse<TcsSettingsDTO>>("/admin/couriers/tcs")).data,
  });
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (query.data) setForm(toForm(query.data));
  }, [query.data]);

  const save = useMutation({
    mutationFn: async (f: Form) =>
      (
        await api<ApiResponse<TcsSettingsDTO>>("/admin/couriers/tcs", {
          method: "PUT",
          body: { ...f, defaultWeightKg: Number(f.defaultWeightKg) },
        })
      ).data,
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEY, data);
      setForm(toForm(data));
      setErrors({});
      toast.success(
        data.enabled && data.configured
          ? "TCS settings saved. You can now book orders with TCS."
          : "TCS settings saved",
      );
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setErrors(
          Object.fromEntries(
            Object.entries(err.fieldErrors).map(([k, v]) => [k, v?.[0] ?? "Check this field"]),
          ),
        );
      }
      toast.error(errorMessage(err));
    },
  });
  const test = useMutation({
    mutationFn: async () =>
      (
        await api<ApiResponse<{ environment: string; cities: number }>>(
          "/admin/couriers/tcs/test",
          {
            method: "POST",
          },
        )
      ).data,
    onSuccess: (r) =>
      toast.success(
        `Connected to TCS (${r.environment}).${r.cities ? ` ${r.cities} cities available.` : ""}`,
      ),
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (query.isError) return <ErrorState message={errorMessage(query.error)} />;
  if (!form || !query.data) return <Skeleton className="h-96" />;
  const s = query.data;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });
  const text = (
    k: keyof Form,
    label: string,
    opts: { hint?: string; placeholder?: string; type?: string } = {},
  ) => (
    <Field label={label} htmlFor={`${uid}-${k}`} error={errors[k]} hint={opts.hint}>
      <Input
        id={`${uid}-${k}`}
        type={opts.type ?? "text"}
        value={String(form[k])}
        placeholder={opts.placeholder}
        invalid={!!errors[k]}
        autoComplete="off"
        onChange={(e) => set(k, e.target.value as never)}
      />
    </Field>
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(form);
      }}
    >
      <PageHeader
        title="TCS courier"
        description="Book parcels with TCS from an order, print the airway bill, and let TCS tracking update orders automatically."
        actions={
          <Badge tone={s.enabled && s.configured ? "success" : "warning"}>
            {s.enabled && s.configured ? "Ready" : s.configured ? "Turned off" : "Not set up"}
          </Badge>
        }
      />

      <Section
        title="TCS login"
        description="For security, the TCS login is kept only on the server, in Vercel → Settings → Environment Variables. It can't be seen or changed here, so a stolen admin password can't reveal it."
      >
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {ENV_VARS.map(([name, label]) => {
            const missing = s.missingEnv.includes(name);
            return (
              <li
                key={name}
                className="border-line flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <span>
                  <span className="block font-medium">{label}</span>
                  <code className="text-muted text-xs">{name}</code>
                </span>
                <Badge tone={missing ? "warning" : "success"}>{missing ? "Missing" : "Set"}</Badge>
              </li>
            );
          })}
        </ul>
        <p className="text-muted mt-3 text-sm">
          Environment:{" "}
          <strong className="text-ink">
            {s.environment === "production" ? "Production (real parcels)" : "Sandbox (testing)"}
          </strong>{" "}
          (<code>TCS_ENV</code>)
          {s.accountNumber && (
            <>
              {" · "}Account <strong className="text-ink">{s.accountNumber}</strong>
            </>
          )}
          {s.costCenterCode && (
            <>
              {" · "}Cost center <strong className="text-ink">{s.costCenterCode}</strong>
            </>
          )}
        </p>
        {s.missingEnv.length > 0 && (
          <p className="bg-surface mt-3 rounded-lg p-3 text-sm">
            Add the missing values in Vercel (Project → Settings → Environment Variables, for
            Production), then redeploy. TCS gives them when you sign up for API access.
          </p>
        )}
      </Section>

      <Section title="Bookings">
        <div className="grid gap-4 sm:grid-cols-2">
          <Switch
            className="sm:col-span-2"
            label="Use TCS for bookings"
            hint="Shows “Book with TCS” on orders."
            checked={form.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
          />
          {text("serviceCode", "Service code", { hint: "O is overnight. Ask TCS for others." })}
        </div>
      </Section>

      <Section title="Pickup details" description="Printed on the airway bill as the sender.">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("shipperName", "Sender name")}
          {text("shipperMobile", "Sender mobile", { placeholder: "03001234567" })}
          {text("shipperAddress", "Pickup address")}
          {text("shipperCity", "Pickup city", { placeholder: "LAHORE" })}
          {text("defaultWeightKg", "Usual parcel weight (kg)", {
            type: "number",
            hint: "Suggested when booking; you can change it per order.",
          })}
        </div>
      </Section>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={save.isPending}>
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          loading={test.isPending}
          disabled={s.missingEnv.length > 0}
          onClick={() => test.mutate()}
        >
          Test connection
        </Button>
      </div>
    </form>
  );
}
