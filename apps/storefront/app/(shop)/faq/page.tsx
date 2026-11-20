import type { FaqDTO } from "@store/types";
import { Container } from "@store/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { getDataSafe } from "@/lib/server-api";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about sizing, delivery, payments and returns.",
};

export default async function FaqPage() {
  const faqs = await getDataSafe<FaqDTO[]>("/cms/faq", [], { revalidate: 300 });
  const groups = new Map<string, FaqDTO[]>();
  for (const f of faqs) {
    const key = f.category ?? "General";
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <PageHeader title="Frequently asked questions" eyebrow="Help">
        Answers about orders, delivery, returns and our products.
      </PageHeader>
      <div className="space-y-10">
        {[...groups].map(([group, items]) => (
          <section key={group}>
            <h2 className="text-brand-700 text-sm font-semibold uppercase tracking-wider">
              {group}
            </h2>
            <div className="mt-3 space-y-3">
              {items.map((f) => (
                <details
                  key={f.id}
                  className="border-line open:shadow-(--shadow-card) group rounded-2xl border px-5 py-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {f.question}
                    <span
                      aria-hidden
                      className="text-muted text-xl transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-muted mt-3 leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="text-muted mt-10">
        Still have a question?{" "}
        <Link href="/contact" className="text-ink underline">
          Contact us
        </Link>
        .
      </p>
    </Container>
  );
}
