-- Discount codes the shop may advertise as vouchers.
ALTER TABLE "Coupon" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
