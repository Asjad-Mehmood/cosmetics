import { Container } from "@store/ui";
import type { Metadata } from "next";
import { PageHeader } from "@/components/content/page-header";
import { CashIcon, PhoneIcon, ShieldIcon, UploadIcon } from "@/components/icons";
import { PrescriptionForm } from "@/components/prescription/prescription-form";

export const metadata: Metadata = {
  title: "Upload a prescription",
  description:
    "Send a photo of your prescription. Our pharmacist checks it, calls you to confirm the medicines and price, and we deliver across Pakistan. Pay cash on delivery.",
  alternates: { canonical: "/prescription" },
};

const STEPS = [
  {
    icon: UploadIcon,
    title: "Upload your prescription",
    body: "A clear photo or PDF of a prescription from a registered doctor.",
  },
  {
    icon: PhoneIcon,
    title: "Our pharmacist calls you",
    body: "We check it, confirm your medicines and the total, usually within working hours the same day.",
  },
  {
    icon: CashIcon,
    title: "Delivered, pay in cash",
    body: "Your medicines are packed and delivered to your door. Pay when they arrive.",
  },
];

export default function PrescriptionPage() {
  return (
    <Container className="max-w-6xl py-8 sm:py-12">
      <PageHeader title="Upload a prescription" eyebrow="Pharmacy">
        Order prescription medicines in three easy steps. Nothing is charged until you agree to the
        total on the phone.
      </PageHeader>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-14">
        <aside className="space-y-6">
          <ol id="how" className="space-y-5">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex gap-4">
                <span className="bg-brand-50 text-brand-700 relative grid size-12 shrink-0 place-items-center rounded-full">
                  <Icon width={22} height={22} />
                  <span className="bg-accent-500 text-brand-700 absolute -right-1 -top-1 grid size-5 place-items-center rounded-full text-[11px] font-bold">
                    {i + 1}
                  </span>
                </span>
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="text-muted mt-0.5 text-sm leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="bg-surface flex gap-3 rounded-2xl p-4 text-sm">
            <ShieldIcon className="text-brand-700 shrink-0" />
            <p className="leading-relaxed">
              <strong>Private and secure.</strong> Your prescription is seen only by our pharmacist.
              Prescription-only medicines are dispensed only against a valid prescription.
            </p>
          </div>
        </aside>
        <div className="border-line rounded-3xl border p-5 sm:p-8">
          <PrescriptionForm />
        </div>
      </div>
    </Container>
  );
}
