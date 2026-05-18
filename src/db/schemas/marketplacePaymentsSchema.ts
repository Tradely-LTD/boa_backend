import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const marketplacePaymentsTable = boaSchema.table('marketplace_payments', {
  id:             serial('id').primaryKey(),
  refId:          text('ref_id').notNull().unique(),
  orderId:        integer('order_id').notNull(),
  gateway:        text('gateway', { enum: ['paystack', 'moniepoint', 'bank_transfer', 'pos_terminal'] }).notNull().default('paystack'),
  gatewayRef:     text('gateway_ref'),
  amount:         real('amount').notNull(),
  status:         text('status', { enum: ['pending', 'success', 'failed'] }).notNull().default('pending'),
  webhookPayload: text('webhook_payload'),
  paidAt:         text('paid_at'),
  stan:           text('stan'),
  rrn:            text('rrn'),
  createdAt:      text('created_at').notNull().default(sql`now()`),
});

export type MarketplacePayment    = typeof marketplacePaymentsTable.$inferSelect;
export type NewMarketplacePayment = typeof marketplacePaymentsTable.$inferInsert;
