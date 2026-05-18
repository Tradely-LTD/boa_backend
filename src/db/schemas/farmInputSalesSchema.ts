import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const farmInputSalesTable = boaSchema.table('farm_input_sales', {
  id:            serial('id').primaryKey(),
  refId:         text('ref_id').notNull().unique(),
  centreId:      integer('centre_id').notNull(),
  centreName:    text('centre_name').notNull(),
  inputId:       integer('input_id').notNull(),
  inputName:     text('input_name').notNull(),
  inputType:     text('input_type').notNull(),
  quantitySold:  real('quantity_sold').notNull(),
  unit:          text('unit').notNull(),
  pricePerUnit:  real('price_per_unit').notNull(),
  totalAmount:   real('total_amount').notNull(),
  buyerName:     text('buyer_name'),
  buyerPhone:    text('buyer_phone'),
  buyerNin:      text('buyer_nin'),
  paymentMethod: text('payment_method', { enum: ['cash', 'mobile_money', 'bank_transfer'] }).notNull().default('cash'),
  receiptNumber: text('receipt_number').notNull(),
  soldBy:        integer('sold_by').notNull(),
  notes:         text('notes'),
  createdAt:     text('created_at').notNull().default(sql`now()`),
});

export type FarmInputSale    = typeof farmInputSalesTable.$inferSelect;
export type NewFarmInputSale = typeof farmInputSalesTable.$inferInsert;
