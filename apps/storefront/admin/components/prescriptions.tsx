"use client";

import {
  type AdminPrescriptionDTO,
  type ApiResponse,
  type PaginatedResponse,
  type PrescriptionStatus,
  Role,
} from "@store/types";
import { Badge, type BadgeProps, Button, cn, Input } from "@store/ui";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/admin/components/ui/confirm";
import { Textarea } from "@/admin/components/ui/controls";
import { FilterTabs, SearchBox } from "@/admin/components/ui/filters";
import { EmptyState, ErrorState, PageHeader } from "@/admin/components/ui/page";
import { Pagination } from "@/admin/components/ui/table";
import { notificationsKey } from "@/admin/hooks/use-notifications";
import { useCan } from "@/admin/hooks/use-session";
import { useUrlState } from "@/admin/hooks/use-url-state";
import { api, downloadFile, errorMessage, fetchObjectUrl } from "@/admin/lib/api";
import { formatDateTime, timeAgo } from "@/admin/lib/format";

const TONE: Record<PrescriptionStatus, NonNullable<BadgeProps["tone"]>> = {
  PENDING: "warning",
  IN_REVIEW: "brand",
  CONFIRMED: "success",
  COMPLETED: "neutral",
  REJECTED: "danger",
};
/** Staff wording (customers see PRESCRIPTION_STATUS_LABELS). */
const STAFF_LABEL: Record<PrescriptionStatus, string> = {
  PENDING: "New",
  IN_REVIEW: "In review",
  CONFIRMED: "Confirmed",
  COMPLETED: "Delivered",
  REJECTED: "Not accepted",
};

export const PrescriptionStatusBadge = ({ status }: { status: PrescriptionStatus }) => (
  <Badge tone={TONE[status]}>{STAFF_LABEL[status]}</Badge>
);

/** A photo of the prescription, loaded privately with the admin's session. */
function FileThumb({
  rx,
  fileId,
  type,
  n,
}: {
  rx: string;
  fileId: string;
  type: string;
  n: number;
}) {
  const path = `/admin/prescriptions/${rx}/files/${fileId}`;
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isPdf = type === "application/pdf";
  useEffect(() => {
    if (isPdf) return;
    let gone = false;
    let made: string | null = null;
    fetchObjectUrl(path)
      .then((u) => {
        made = u;
        if (gone) URL.revokeObjectURL(u);
        else setUrl(u);
      })
      .catch(() => setFailed(true));
    return () => {
      gone = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [path, isPdf]);

  return (
    <button
      type="button"
      onClick={() => void downloadFile(path, "open").catch((e) => toast.error(errorMessage(e)))}
      className="border-line bg-surface hover:border-brand-600 relative block aspect-[3/4] w-32 overflow-hidden rounded-lg border text-left"
      aria-label={`Open file ${n} in a new tab`}
    >
      {isPdf ? (
        <span className="text-muted grid size-full place-items-center text-sm font-semibold">
          PDF
        </span>
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element -- a private blob, not a hosted image
        <img src={url} alt={`Prescription page ${n}`} className="size-full object-cover" />
      ) : (
        <span className="text-muted grid size-full place-items-center text-xs">
          {failed ? "Couldn't load" : "Loading…"}
        </span>
      )}
    </button>
  );
}

function PrescriptionItem({ p }: { p: AdminPrescriptionDTO }) {
  const qc = useQueryClient();
  const canDelete = useCan(Role.MANAGER);
  const [open, setOpen] = useState(p.status === "PENDING");
  const [note, setNote] = useState(p.pharmacistNote ?? "");
  const [staffNotes, setStaffNotes] = useState(p.staffNotes ?? "");
  const [orderNumber, setOrderNumber] = useState(p.orderNumber ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "prescriptions"] });
    void qc.invalidateQueries({ queryKey: notificationsKey });
  };
  const save = useMutation({
    mutationFn: (status?: PrescriptionStatus) =>
      api<ApiResponse<AdminPrescriptionDTO>>(`/admin/prescriptions/${p.id}`, {
        method: "PATCH",
        body: {
          ...(status ? { status } : {}),
          pharmacistNote: note.trim() || null,
          staffNotes: staffNotes.trim() || null,
          orderNumber: orderNumber.trim().toUpperCase() || null,
        },
      }),
    onSuccess: (_res, status) => {
      toast.success(
        status
          ? `${p.reference}: ${STAFF_LABEL[status]}${p.email ? " (customer emailed)" : ""}`
          : "Saved",
      );
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const remove = useMutation({
    mutationFn: () => api(`/admin/prescriptions/${p.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(`${p.reference} deleted`);
      setConfirmDelete(false);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const phone = p.phone.replace(/^0/, "92").replace(/^\+/, "");
  const next: {
    status: PrescriptionStatus;
    label: string;
    variant: "brand" | "outline" | "danger";
  }[] = [
    ...(p.status === "PENDING"
      ? [{ status: "IN_REVIEW" as const, label: "Start review", variant: "outline" as const }]
      : []),
    ...(p.status === "PENDING" || p.status === "IN_REVIEW"
      ? [
          { status: "CONFIRMED" as const, label: "Confirm", variant: "brand" as const },
          { status: "REJECTED" as const, label: "Not accepted", variant: "danger" as const },
        ]
      : []),
    ...(p.status === "CONFIRMED"
      ? [{ status: "COMPLETED" as const, label: "Mark delivered", variant: "brand" as const }]
      : []),
  ];

  return (
    <li
      className={cn(
        "border-line bg-canvas rounded-(--radius-card) border",
        p.status === "PENDING" && "border-l-warning border-l-4",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 p-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="font-mono font-semibold tracking-wider">{p.reference}</span>
          <span className="text-muted block truncate text-sm">
            {p.name} · {p.phone} · {p.city} · {p.fileCount} {p.fileCount === 1 ? "file" : "files"}
          </span>
        </span>
        <PrescriptionStatusBadge status={p.status} />
        <span className="text-muted text-xs" title={formatDateTime(p.createdAt)}>
          {timeAgo(p.createdAt)}
        </span>
      </button>
      {open && (
        <div className="border-line grid gap-6 border-t p-4 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-wrap gap-2 lg:w-[26rem]">
            {p.files.map((f, i) => (
              <FileThumb key={f.id} rx={p.id} fileId={f.id} type={f.contentType} n={i + 1} />
            ))}
            <p className="text-muted w-full text-xs">
              Click a file to open it full size. Files are private and every view is logged.
            </p>
          </div>
          <div className="space-y-4">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted text-xs">Phone</dt>
                <dd className="flex flex-wrap gap-3 font-medium">
                  <a href={`tel:${p.phone}`} className="hover:underline">
                    {p.phone}
                  </a>
                  <a
                    href={`https://wa.me/${phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-success hover:underline"
                  >
                    WhatsApp
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Email</dt>
                <dd>{p.email ?? "Not given"}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs">City / address</dt>
                <dd>
                  {p.city}
                  {p.address ? ` · ${p.address}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Equivalent brands</dt>
                <dd>{p.allowSubstitutes ? "Allowed (ask first)" : "Not allowed"}</dd>
              </div>
              {p.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-muted text-xs">Customer’s note</dt>
                  <dd className="whitespace-pre-line">{p.notes}</dd>
                </div>
              )}
              {p.reviewedBy && p.reviewedAt && (
                <div className="sm:col-span-2">
                  <dt className="text-muted text-xs">Last status change</dt>
                  <dd>
                    {p.reviewedBy}, {formatDateTime(p.reviewedAt)}
                  </dd>
                </div>
              )}
            </dl>
            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
              <div className="space-y-1">
                <label htmlFor={`note-${p.id}`} className="text-sm font-medium">
                  Note to the customer
                </label>
                <Textarea
                  id={`note-${p.id}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. All medicines available, Rs 1,250 in total. Delivery tomorrow."
                  maxLength={1000}
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={`order-${p.id}`} className="text-sm font-medium">
                  Order number
                </label>
                <Input
                  id={`order-${p.id}`}
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="AG-10025"
                  maxLength={30}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor={`staff-${p.id}`} className="text-sm font-medium">
                Internal notes (staff only)
              </label>
              <Textarea
                id={`staff-${p.id}`}
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                maxLength={2000}
                rows={2}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {next.map((n) => (
                <Button
                  key={n.status}
                  size="sm"
                  variant={n.variant}
                  loading={save.isPending && save.variables === n.status}
                  onClick={() => save.mutate(n.status)}
                >
                  {n.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                loading={save.isPending && save.variables === undefined}
                onClick={() => save.mutate(undefined)}
              >
                Save notes
              </Button>
              {canDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger ml-auto"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </Button>
              )}
            </div>
            {p.email && (
              <p className="text-muted text-xs">
                Changing the status emails the customer, with your note.
              </p>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${p.reference}?`}
        confirmLabel="Delete for good"
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onClose={() => setConfirmDelete(false)}
      >
        The prescription and its files are removed permanently. Use this when a customer asks for
        their data to be deleted.
      </ConfirmDialog>
    </li>
  );
}

export function Prescriptions() {
  const { values, set, query } = useUrlState<"q" | "status">();
  const list = useQuery({
    queryKey: ["admin", "prescriptions", query],
    queryFn: () => api<PaginatedResponse<AdminPrescriptionDTO>>(`/admin/prescriptions?${query}`),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prescriptions"
        description="Prescriptions customers have uploaded. Check each one, call the customer to confirm the medicines and total, then confirm it."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          label="Prescription status"
          value={values.status ?? ""}
          onChange={(status) => set({ status })}
          options={[
            { value: "", label: "All" },
            { value: "PENDING", label: "New" },
            { value: "IN_REVIEW", label: "In review" },
            { value: "CONFIRMED", label: "Confirmed" },
            { value: "COMPLETED", label: "Delivered" },
            { value: "REJECTED", label: "Not accepted" },
          ]}
        />
        <SearchBox
          value={values.q ?? ""}
          onSearch={(q) => set({ q })}
          label="Search by reference, name, phone or city"
        />
      </div>
      {list.isError && <ErrorState message={errorMessage(list.error)} />}
      {list.data?.data.length === 0 ? (
        <EmptyState title="No prescriptions here">
          Prescriptions uploaded on the storefront’s “Upload a prescription” page appear here.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.data?.data.map((p) => (
            <PrescriptionItem key={p.id} p={p} />
          ))}
        </ul>
      )}
      <Pagination meta={list.data?.meta} onPage={(page) => set({ page })} label="prescriptions" />
    </div>
  );
}
