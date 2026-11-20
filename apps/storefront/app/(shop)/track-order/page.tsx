import { Container } from "@store/ui";
import type { Metadata } from "next";
import { TrackOrder } from "@/components/orders/track-order";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your order with your order number and email.",
};

export default function TrackOrderPage() {
  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <PageHeader title="Track your order" eyebrow="Orders">
        Enter the order number from your confirmation email.
      </PageHeader>
      <div>
        <TrackOrder />
      </div>
    </Container>
  );
}
