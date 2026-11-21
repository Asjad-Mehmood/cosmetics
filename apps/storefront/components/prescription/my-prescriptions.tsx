"use client";

import {
  type ApiResponse,
  PRESCRIPTION_STATUS_LABELS,
  type PrescriptionDTO,
  type PrescriptionStatus,
} from "@store/types";
import { cn, Skeleton } from "@store/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMe } from "@/hooks/use-auth";
import { api } from "@/lib/api";

const TONE: Record<PrescriptionStatus, string> = {
  PENDING: "bg-brand-50 text-brand-700",
  IN_REVIEW: "bg-accent-50 text-accent-700",
  CONFIRMED: "bg-success/10 text-success",
  COMPLETED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
};

export function PrescriptionStatusBadge({ status }: { status: PrescriptionStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", TONE[status])}>
      {PRESCRIPTION_STATUS_LABELS[status]}
    </span>
  );
}

export function MyPrescriptions() {
  const me = useMe();
  const { data, isLoading } = useQuery({
    queryKey: ["my-prescriptions"],
    queryFn: () => api<ApiResponse<PrescriptionDTO[]>>("/prescriptions"),
    enabled: !!me.data,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Prescriptions</h2>
        <Link
          href="/prescription"
          className="bg-brand-600 hover:bg-brand-700 inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-white"
        >
          Upload a prescription
        </Link>
      </div>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data?.data.length ? (
        <p className="text-muted">
          You haven’t sent a prescription yet. Upload a photo of it and our pharmacist will call you
          to confirm your medicines.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.data.map((p) => (
            <li key={p.id} className="border-line rounded-2xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono font-semibold tracking-wider">{p.reference}</p>
                <PrescriptionStatusBadge status={p.status} />
              </div>
              <p className="text-muted mt-1 text-sm">
                Sent {new Date(p.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })} ·{" "}
                {p.fileCount} {p.fileCount === 1 ? "file" : "files"} · for {p.name}
              </p>
              {p.pharmacistNote && (
                <p className="bg-surface mt-3 whitespace-pre-line rounded-xl p-3 text-sm">
                  <span className="block text-xs font-semibold">From our pharmacist</span>
                  {p.pharmacistNote}
                </p>
              )}
              {p.orderNumber && (
                <Link
                  href={`/orders/${p.orderNumber}`}
                  className="text-brand-700 mt-3 inline-block text-sm font-semibold hover:underline"
                >
                  View order {p.orderNumber}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
