import type { HomeContentDTO } from "@store/types";
import { Container } from "@store/ui";
import type { Metadata } from "next";
import { ContactForm } from "@/components/content/contact-form";
import { PageHeader } from "@/components/content/page-header";
import { ClockIcon, MailIcon, PhoneIcon } from "@/components/icons";
import { getDataSafe } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about an order, a product or returns? Send us a message.",
};

export default async function ContactPage() {
  const home = await getDataSafe<HomeContentDTO | null>("/cms/home", null, { revalidate: 300 });
  const contact = home?.contact ?? { phone: null, email: null };
  const items = [
    contact.phone && {
      icon: PhoneIcon,
      label: "Phone",
      value: contact.phone,
      href: `tel:${contact.phone.replace(/\s/g, "")}`,
    },
    contact.email && {
      icon: MailIcon,
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    { icon: ClockIcon, label: "Hours", value: "Mon–Sat, 10am–7pm PKT" },
  ].filter((x) => !!x);

  return (
    <Container className="max-w-5xl py-8 sm:py-12">
      <PageHeader title="Contact us" eyebrow="Help">
        Questions about an order, a product or which one suits you? We usually reply within one
        working day.
      </PageHeader>
      <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
        <ul className="space-y-3">
          {items.map(({ icon: Icon, label, value, ...rest }) => {
            const href = "href" in rest ? rest.href : undefined;
            return (
              <li
                key={label}
                className="border-line flex items-center gap-4 rounded-2xl border p-4"
              >
                <span className="bg-brand-50 text-brand-700 grid size-11 place-items-center rounded-full">
                  <Icon width={20} height={20} />
                </span>
                <span>
                  <span className="text-muted block text-xs">{label}</span>
                  {href ? (
                    <a href={href} className="font-semibold hover:underline">
                      {value}
                    </a>
                  ) : (
                    <span className="font-semibold">{value}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <ContactForm />
      </div>
    </Container>
  );
}
