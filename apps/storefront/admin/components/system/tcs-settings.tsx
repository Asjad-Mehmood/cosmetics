"use client";

import type { ApiResponse, TcsSettingsDTO } from "@store/types";
import { Badge, Button, Field, Input, Skeleton } from "@store/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Select, Switch } from "@/admin/components/ui/controls";
import { ErrorState, PageHeader, Section } from "@/admin/components/ui/page";
import { api, ApiError, errorMessage } from "@/admin/lib/api";

const QUERY_KEY = ["admin", "settings", "tcs"];

type Form = Omit<
  TcsSettingsDTO,
  "hasClientSecret" | "hasPassword" | "configured" | "defaultWeightKg"
> & {
  clientSecret: string;
  password: string;
  defaultWeightKg: string;
};

const toForm = (s: TcsSettingsDTO): Form => ({
  enabled: s.enabled,
  environment: s.environment,
  clientId: s.clientId,
  clientSecret: "",
  username: s.username,
  password: "",
  accountNumber: s.accountNumber,
  costCenterCode: s.costCenterCode,
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
            {s.enabled && s.configured ? "Connected" : s.configured ? "Turned off" : "Not set up"}
          </Badge>
        }
      />

      <Section
        title="TCS API account"
        description="TCS gives these when you sign up for API access (start with the sandbox, then ask TCS for production access)."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Switch
            className="sm:col-span-2"
            label="Use TCS for bookings"
            hint="Shows “Book with TCS” on orders."
            checked={form.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
          />
          <Field label="Environment" htmlFor={`${uid}-env`}>
            <Select
              id={`${uid}-env`}
              value={form.environment}
              onChange={(e) => set("environment", e.target.value as Form["environment"])}
            >
              <option value="sandbox">Sandbox (testing)</option>
              <option value="production">Production (real parcels)</option>
            </Select>
          </Field>
          {text("accountNumber", "TCS account number", { placeholder: "e.g. 04011K1" })}
          {text("clientId", "Client ID")}
          {text("clientSecret", "Client secret", {
            type: "password",
            placeholder: s.hasClientSecret ? "Saved. Leave empty to keep it" : "",
          })}
          {text("username", "API username")}
          {text("password", "API password", {
            type: "password",
            placeholder: s.hasPassword ? "Saved. Leave empty to keep it" : "",
          })}
          {text("costCenterCode", "Cost center code", {
            hint: "Set up by TCS for your pickup address.",
          })}
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
          disabled={!s.hasClientSecret || !s.hasPassword}
          onClick={() => test.mutate()}
        >
          Test connection
        </Button>
      </div>
      <p className="text-muted text-xs">
        The client secret and password are stored encrypted and are never shown again.
      </p>
    </form>
  );
}
