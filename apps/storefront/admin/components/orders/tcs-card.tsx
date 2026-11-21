"use client";

import type { AdminOrderDTO, ApiResponse, OrderStatus, TcsBookingDraftDTO } from "@store/types";
import { Button, Dialog, Field, Input } from "@store/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Checkbox, Select } from "@/admin/components/ui/controls";
import { Section } from "@/admin/components/ui/page";
import { notificationsKey } from "@/admin/hooks/use-notifications";
import { useCan } from "@/admin/hooks/use-session";
import Link from "@/admin/lib/link";
import { api, downloadFile, errorMessage } from "@/admin/lib/api";
import { formatDateTime, formatMoney } from "@/admin/lib/format";

const BOOKABLE: OrderStatus[] = ["CONFIRMED", "PAID", "PROCESSING", "PACKED"];

/**
 * TCS on the order page: book the parcel (TCS gives a consignment number),
 * print the airway bill, follow tracking, or cancel before pickup.
 */
export function TcsCard({ order }: { order: AdminOrderDTO }) {
  const qc = useQueryClient();
  const uid = useId();
  const isOwner = useCan("SUPER_ADMIN");
  const booked = order.courier === "TCS" && !!order.courierBookedAt && !!order.trackingNumber;
  const canBook = !booked && !order.trackingNumber && BOOKABLE.includes(order.status);
  const [open, setOpen] = useState(false);

  const setOrder = (o: AdminOrderDTO) => {
    qc.setQueryData(["admin", "order", order.number], o);
    void qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    void qc.invalidateQueries({ queryKey: notificationsKey });
  };
  const call = (method: "POST" | "DELETE", path: string, body?: Record<string, unknown>) =>
    api<ApiResponse<AdminOrderDTO>>(`/admin/orders/${order.number}/tcs${path}`, {
      method,
      body,
    }).then((r) => r.data);

  const draft = useQuery({
    queryKey: ["admin", "order", order.number, "tcs-draft"],
    queryFn: async () =>
      (await api<ApiResponse<TcsBookingDraftDTO>>(`/admin/orders/${order.number}/tcs`)).data,
    enabled: open,
  });

  const [city, setCity] = useState("");
  const [weight, setWeight] = useState("0.5");
  const [pieces, setPieces] = useState("1");
  const [fragile, setFragile] = useState(false);
  const [remarks, setRemarks] = useState("");
  useEffect(() => {
    if (!draft.data) return;
    setCity(draft.data.city?.name ?? "");
    setWeight(String(draft.data.weightKg));
    setPieces(String(draft.data.pieces));
  }, [draft.data]);

  const book = useMutation({
    mutationFn: () => {
      const match = draft.data?.cities.find((c) => c.name === city);
      return call("POST", "", {
        cityName: city,
        ...(match?.code ? { cityCode: match.code } : {}),
        weightKg: Number(weight),
        pieces: Number(pieces),
        fragile,
        remarks: remarks.trim() || undefined,
      });
    },
    onSuccess: (o) => {
      setOrder(o);
      setOpen(false);
      toast.success(`Booked with TCS: ${o.trackingNumber}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const sync = useMutation({
    mutationFn: () => call("POST", "/sync"),
    onSuccess: (o) => {
      setOrder(o);
      toast.success(o.courierStatus ? `TCS: ${o.courierStatus}` : "Tracking is up to date");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const cancel = useMutation({
    mutationFn: () => call("DELETE", ""),
    onSuccess: (o) => {
      setOrder(o);
      toast.success("TCS booking cancelled");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!booked && !canBook) return null;

  return (
    <Section title="TCS courier">
      {booked ? (
        <div className="space-y-3 text-sm">
          <p>
            <span className="text-muted block text-xs">Consignment number</span>
            <span className="font-mono text-base font-semibold tracking-wider">
              {order.trackingNumber}
            </span>
          </p>
          {order.courierStatus && (
            <p>
              <span className="text-muted block text-xs">Latest from TCS</span>
              {order.courierStatus}
            </p>
          )}
          {order.courierSyncedAt && (
            <p className="text-muted text-xs">Checked {formatDateTime(order.courierSyncedAt)}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() =>
                void downloadFile(`/admin/orders/${order.number}/tcs/label`, "open").catch((e) =>
                  toast.error(errorMessage(e)),
                )
              }
            >
              Print airway bill
            </Button>
            <Button
              size="sm"
              variant="outline"
              loading={sync.isPending}
              onClick={() => sync.mutate()}
            >
              Refresh tracking
            </Button>
            {order.status === "PACKED" && (
              <Button
                size="sm"
                variant="ghost"
                className="text-danger"
                loading={cancel.isPending}
                onClick={() => {
                  if (window.confirm(`Cancel TCS booking ${order.trackingNumber}?`))
                    cancel.mutate();
                }}
              >
                Cancel booking
              </Button>
            )}
          </div>
          <p className="text-muted text-xs">
            Tracking updates the order automatically (shipped, in transit, out for delivery,
            delivered) and emails the customer.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-muted text-sm">
            Book this parcel with TCS: you get a consignment number and an airway bill to print, and
            the order then follows TCS tracking automatically.
          </p>
          <Button onClick={() => setOpen(true)}>Book with TCS</Button>
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Book ${order.number} with TCS`}
        footer={
          draft.data?.configured ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button loading={book.isPending} disabled={!city} onClick={() => book.mutate()}>
                Book with TCS
              </Button>
            </div>
          ) : undefined
        }
      >
        {draft.isLoading ? (
          <p className="text-muted text-sm">Loading TCS details…</p>
        ) : draft.isError ? (
          <p className="text-danger text-sm">{errorMessage(draft.error)}</p>
        ) : !draft.data?.configured ? (
          <p className="text-sm">
            TCS isn’t set up yet.{" "}
            {isOwner ? (
              <Link href="/settings/tcs" className="underline">
                Enter your TCS account details
              </Link>
            ) : (
              "Ask the store owner to enter the TCS account details in Store settings."
            )}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="bg-surface rounded-xl p-3 text-sm">
              <p>
                <span className="text-muted">Deliver to:</span> {order.shippingAddress.fullName},{" "}
                {order.shippingAddress.city}
              </p>
              <p>
                <span className="text-muted">Rider collects:</span>{" "}
                <strong>
                  {draft.data.codAmount > 0
                    ? formatMoney(draft.data.codAmount)
                    : "Nothing (already paid)"}
                </strong>
              </p>
            </div>
            <Field
              label="TCS destination city"
              htmlFor={`${uid}-city`}
              hint={
                draft.data.city
                  ? undefined
                  : `No TCS city matched “${order.shippingAddress.city}”. Choose the nearest one.`
              }
            >
              {draft.data.cities.length ? (
                <Select id={`${uid}-city`} value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">Choose a city</option>
                  {draft.data.cities.map((c) => (
                    <option key={`${c.code}-${c.name}`} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  id={`${uid}-city`}
                  value={city}
                  onChange={(e) => setCity(e.target.value.toUpperCase())}
                />
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Weight (kg)" htmlFor={`${uid}-weight`}>
                <Input
                  id={`${uid}-weight`}
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </Field>
              <Field label="Pieces" htmlFor={`${uid}-pieces`}>
                <Input
                  id={`${uid}-pieces`}
                  type="number"
                  min={1}
                  value={pieces}
                  onChange={(e) => setPieces(e.target.value)}
                />
              </Field>
            </div>
            <Checkbox
              label="Fragile"
              checked={fragile}
              onChange={(e) => setFragile(e.target.checked)}
            />
            <Field label="Note for TCS (optional)" htmlFor={`${uid}-remarks`}>
              <Input
                id={`${uid}-remarks`}
                value={remarks}
                maxLength={200}
                placeholder="e.g. Call before delivery"
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Field>
          </div>
        )}
      </Dialog>
    </Section>
  );
}
