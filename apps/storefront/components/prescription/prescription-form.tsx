"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ApiResponse, PRESCRIPTION_LIMITS, type PrescriptionDTO } from "@store/types";
import { prescriptionSchema } from "@store/validation";
import { Button, cn, Field, Input } from "@store/ui";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMe } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api";
import { applyApiError } from "@/lib/forms";
import { type PreparedFile, prepareFile, toBase64 } from "@/lib/prescription-files";
import { FormMessage } from "../auth/auth-card";
import { DrawnCheck } from "../motion";
import { useSite } from "../site-context";
import { FileIcon, UploadIcon, XIcon } from "../icons";

const detailsSchema = prescriptionSchema.omit({ files: true });
const mb = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function PrescriptionForm() {
  const { data: me } = useMe();
  const { contact } = useSite();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<PreparedFile[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<PrescriptionDTO | null>(null);
  const [dragging, setDragging] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(detailsSchema),
    values: {
      name: me?.name ?? "",
      phone: "",
      email: me?.email ?? "",
      city: "",
      address: "",
      notes: "",
      allowSubstitutes: true,
    },
  });

  // Free the thumbnails' memory when they go.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const total = files.reduce((sum, f) => sum + f.blob.size, 0);

  const add = async (list: FileList | File[]) => {
    setFileError(null);
    const incoming = [...list].slice(0, PRESCRIPTION_LIMITS.maxFiles - files.length);
    if (list.length > incoming.length) {
      setFileError(`You can add up to ${PRESCRIPTION_LIMITS.maxFiles} files.`);
    }
    setPreparing(true);
    const ready: PreparedFile[] = [];
    for (const file of incoming) {
      try {
        const prepared = await prepareFile(file);
        if (prepared.preview) previews.current.add(prepared.preview);
        ready.push(prepared);
      } catch (err) {
        setFileError((err as Error).message);
      }
    }
    setPreparing(false);
    setFiles((current) => {
      const next = [...current];
      for (const f of ready) if (!next.some((n) => n.id === f.id)) next.push(f);
      return next;
    });
  };

  const remove = (id: string) =>
    setFiles((current) => {
      const gone = current.find((f) => f.id === id);
      if (gone?.preview) URL.revokeObjectURL(gone.preview);
      return current.filter((f) => f.id !== id);
    });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    if (!files.length) {
      setFileError("Add a photo or PDF of your prescription.");
      return;
    }
    if (total > PRESCRIPTION_LIMITS.maxTotalBytes) {
      setFileError(`The files add up to ${mb(total)}. Please keep them under 3 MB together.`);
      return;
    }
    try {
      const encoded = await Promise.all(files.map((f) => toBase64(f.blob)));
      const res = await api<ApiResponse<PrescriptionDTO>>("/prescriptions", {
        method: "POST",
        body: { ...values, files: encoded },
      });
      setDone(res.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // Our side failed (or the connection dropped): say so, and offer another way.
      const ours = !(err instanceof ApiError) || err.status >= 500;
      setFormError(
        ours
          ? `We couldn’t send your prescription just now. Please try again in a minute${
              contact.phone ? `, or call or WhatsApp us on ${contact.phone}` : ""
            }.`
          : applyApiError(err, setError),
      );
    }
  });

  if (done) {
    return (
      <div className="border-line rounded-3xl border p-6 text-center sm:p-10" role="status">
        <DrawnCheck className="text-success mx-auto size-14" />
        <h2 className="mt-4 text-2xl font-bold">Prescription received</h2>
        <p className="text-muted mt-2">
          Your reference is{" "}
          <strong className="text-ink font-mono text-lg tracking-wider">{done.reference}</strong>
        </p>
        <p className="mx-auto mt-4 max-w-md leading-relaxed">
          Our pharmacist will check it and call you on <strong>{done.phone}</strong> to confirm your
          medicines and the total. Nothing is charged until you agree, and you pay in cash when your
          order arrives.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {me ? (
            <Link
              href="/account/prescriptions"
              className="bg-ink hover:bg-ink/85 inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-white"
            >
              See my prescriptions
            </Link>
          ) : null}
          <Button
            variant="outline"
            pill
            onClick={() => {
              setDone(null);
              setFiles([]);
              reset();
            }}
          >
            Upload another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={(e) => {
        // Flag a missing photo together with any other missing details.
        if (!files.length) setFileError("Add a photo or PDF of your prescription.");
        void submit(e);
      }}
    >
      {formError && <FormMessage>{formError}</FormMessage>}

      {/* The prescription itself */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Your prescription</legend>
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void add(e.dataTransfer.files);
          }}
          className={cn(
            "border-line hover:border-brand-600 hover:bg-surface flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
            dragging && "border-brand-600 bg-surface",
            files.length >= PRESCRIPTION_LIMITS.maxFiles && "pointer-events-none opacity-50",
          )}
        >
          <span className="bg-brand-50 text-brand-700 grid size-12 place-items-center rounded-full">
            <UploadIcon />
          </span>
          <span className="font-semibold">
            {preparing ? "Preparing…" : "Take a photo or choose a file"}
          </span>
          <span className="text-muted text-sm">
            Photo or PDF · up to {PRESCRIPTION_LIMITS.maxFiles} files · make sure the doctor’s name,
            date and medicines are readable
          </span>
        </label>
        <input
          ref={input}
          id={inputId}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="sr-only"
          disabled={files.length >= PRESCRIPTION_LIMITS.maxFiles}
          onChange={(e) => {
            if (e.target.files) void add(e.target.files);
            e.target.value = "";
          }}
        />
        {fileError && (
          <p role="alert" className="text-danger mt-2 text-sm">
            {fileError}
          </p>
        )}
        {files.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-3" aria-label="Files to upload">
            {files.map((f) => (
              <li
                key={f.id}
                className="border-line bg-surface relative aspect-[3/4] overflow-hidden rounded-xl border"
              >
                {f.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a local preview, not a hosted image
                  <img src={f.preview} alt={f.name} className="size-full object-cover" />
                ) : (
                  <span className="text-muted flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-xs">
                    <FileIcon width={28} height={28} />
                    <span className="line-clamp-2 break-all">{f.name}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  aria-label={`Remove ${f.name}`}
                  className="bg-ink/80 hover:bg-ink absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full text-white"
                >
                  <XIcon width={14} height={14} />
                </button>
                <span className="bg-ink/70 absolute bottom-1.5 left-1.5 rounded px-1.5 text-[11px] tabular-nums text-white">
                  {mb(f.blob.size)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {/* Patient and delivery */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Patient’s name" htmlFor="rx-name" error={errors.name?.message}>
          <Input id="rx-name" autoComplete="name" invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field
          label="Phone (we’ll call you on this)"
          htmlFor="rx-phone"
          error={errors.phone?.message}
        >
          <Input
            id="rx-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="03xx xxxxxxx"
            invalid={!!errors.phone}
            {...register("phone")}
          />
        </Field>
        <Field label="City" htmlFor="rx-city" error={errors.city?.message}>
          <Input
            id="rx-city"
            autoComplete="address-level2"
            invalid={!!errors.city}
            {...register("city")}
          />
        </Field>
        <Field
          label="Email (optional, for updates)"
          htmlFor="rx-email"
          error={errors.email?.message}
        >
          <Input
            id="rx-email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
      </div>
      <Field
        label="Delivery address (optional)"
        htmlFor="rx-address"
        error={errors.address?.message}
      >
        <Input id="rx-address" autoComplete="street-address" {...register("address")} />
      </Field>
      <Field
        label="Anything we should know? (optional)"
        htmlFor="rx-notes"
        error={errors.notes?.message}
      >
        <textarea
          id="rx-notes"
          rows={3}
          placeholder="e.g. one month’s supply, or only the first two medicines"
          className="border-line focus:border-ink focus:ring-ink/10 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          {...register("notes")}
        />
      </Field>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="accent-brand-700 mt-0.5 size-4"
          {...register("allowSubstitutes")}
        />
        <span>
          If a medicine is out of stock, the pharmacist may offer an equivalent with the same
          formula (they will ask you first).
        </span>
      </label>

      <div className="space-y-3">
        <Button
          type="submit"
          size="lg"
          pill
          variant="brand"
          loading={isSubmitting}
          disabled={preparing}
        >
          Send to pharmacist
        </Button>
        <p className="text-muted text-xs leading-relaxed">
          Only our pharmacist sees your prescription. We use it to prepare your order and nothing
          else. See our{" "}
          <Link href="/policies/privacy" className="underline">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
