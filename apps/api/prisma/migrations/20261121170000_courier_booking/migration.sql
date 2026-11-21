-- Courier (TCS) booking and tracking details on orders. Only adds nullable columns.
ALTER TABLE "Order" ADD COLUMN "courierBookedAt" TIMESTAMP(3),
ADD COLUMN "courierStatus" TEXT,
ADD COLUMN "courierSyncedAt" TIMESTAMP(3);

-- Orders whose tracking is refreshed from the courier.
CREATE INDEX "Order_courier_status_idx" ON "Order"("courier", "status");
