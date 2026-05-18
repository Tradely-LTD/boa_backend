import { integer, text, real, serial, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const marketplaceOrdersTable = boaSchema.table('marketplace_orders', {
  id:           serial('id').primaryKey(),
  refId:        text('ref_id').notNull().unique(),

  // ── References ────────────────────────────────────────────────────────────
  listingId:    integer('listing_id').notNull(),
  buyerId:      integer('buyer_id').notNull(),
  centreId:     integer('centre_id').notNull(),

  // ── Snapshot of listing details at time of order ──────────────────────────
  centreName:   text('centre_name').notNull(),
  commodity:    text('commodity').notNull(),
  quantityKg:   real('quantity_kg').notNull(),
  pricePerKg:   real('price_per_kg').notNull(),
  totalAmount:  real('total_amount').notNull(),

  // ── Buyer info snapshot ────────────────────────────────────────────────────
  buyerName:    text('buyer_name').notNull(),
  buyerEmail:   text('buyer_email').notNull(),
  buyerPhone:   text('buyer_phone').notNull(),

  // ── Status ────────────────────────────────────────────────────────────────
  status:       text('status', {
                  enum: ['pending_payment', 'paid', 'processing', 'completed', 'cancelled'],
                }).notNull().default('pending_payment'),

  isManual:       boolean('is_manual').notNull().default(false),
  notes:          text('notes'),

  // ── Delivery ──────────────────────────────────────────────────────────────
  deliveryType:   text('delivery_type', { enum: ['pickup', 'delivery'] }).notNull().default('pickup'),
  deliveryState:  text('delivery_state'),
  deliveryLga:    text('delivery_lga'),
  deliveryCharge: real('delivery_charge').notNull().default(0),

  // ── Payment gateway used ──────────────────────────────────────────────────
  paymentGateway: text('payment_gateway'),

  createdAt:    text('created_at').notNull().default(sql`now()`),
  updatedAt:    text('updated_at').notNull().default(sql`now()`),
});

export type MarketplaceOrder    = typeof marketplaceOrdersTable.$inferSelect;
export type NewMarketplaceOrder = typeof marketplaceOrdersTable.$inferInsert;
