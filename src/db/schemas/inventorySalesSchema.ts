import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const inventorySalesTable = boaSchema.table('inventory_sales', {
  id:            serial('id').primaryKey(),
  refId:         text('ref_id').notNull().unique(),
  centreId:      integer('centre_id').notNull(),
  centreName:    text('centre_name').notNull(),
  intakeId:      integer('intake_id').notNull(),
  commodity:     text('commodity').notNull(),
  quantityKg:    real('quantity_kg').notNull(),
  pricePerKg:    real('price_per_kg').notNull(),
  totalAmount:   real('total_amount').notNull(),
  buyerName:     text('buyer_name'),
  buyerPhone:    text('buyer_phone'),
  paymentMethod: text('payment_method', { enum: ['cash', 'mobile_money', 'bank_transfer'] }).notNull().default('cash'),
  receiptNumber: text('receipt_number').notNull(),
  soldBy:        integer('sold_by').notNull(),
  notes:         text('notes'),
  createdAt:     text('created_at').notNull().default(sql`now()`),
});

export type InventorySale    = typeof inventorySalesTable.$inferSelect;
export type NewInventorySale = typeof inventorySalesTable.$inferInsert;
