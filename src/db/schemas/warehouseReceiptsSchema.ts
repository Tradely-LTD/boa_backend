import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const warehouseReceiptsTable = boaSchema.table('warehouse_receipts', {
  id:            serial('id').primaryKey(),
  receiptNumber: text('receipt_number').notNull().unique(),
  centreId:      integer('centre_id').notNull(),
  centreName:    text('centre_name').notNull(),
  intakeId:      integer('intake_id'),
  commodity:     text('commodity').notNull(),
  quantityKg:    real('quantity_kg').notNull(),
  gradeQuality:  text('grade_quality'),
  farmerName:    text('farmer_name').notNull(),
  farmerPhone:   text('farmer_phone'),
  farmerNin:     text('farmer_nin'),
  issuedBy:      integer('issued_by').notNull(),
  issuedAt:      text('issued_at').notNull(),
  expiresAt:     text('expires_at'),
  status:        text('status', { enum: ['active', 'pledged', 'redeemed', 'expired'] }).notNull().default('active'),
  notes:         text('notes'),
  createdAt:     text('created_at').notNull().default(sql`now()`),
});

export type WarehouseReceipt    = typeof warehouseReceiptsTable.$inferSelect;
export type NewWarehouseReceipt = typeof warehouseReceiptsTable.$inferInsert;
