-- More detailed order tracking: packed, in transit and out for delivery.
-- Only adds values to the enum; existing orders are unchanged.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKED' AFTER 'PROCESSING';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'IN_TRANSIT' AFTER 'SHIPPED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY' AFTER 'IN_TRANSIT';
