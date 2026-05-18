import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const farmInputsTable = boaSchema.table('farm_inputs', {
  id:                   serial('id').primaryKey(),
  refId:                text('ref_id').notNull().unique(),
  centreId:             integer('centre_id').notNull(),
  centreName:           text('centre_name').notNull(),
  supplierId:           integer('supplier_id'),
  supplierName:         text('supplier_name'),
  inputType:            text('input_type', { enum: ['seed', 'fertilizer', 'equipment', 'other'] }).notNull(),
  inputName:            text('input_name').notNull(),
  brand:                text('brand'),
  unit:                 text('unit', { enum: ['kg', 'bag', 'liter', 'piece', 'set'] }).notNull().default('kg'),
  quantityReceived:     real('quantity_received').notNull(),
  quantityAvailable:    real('quantity_available').notNull(),
  quantitySold:         real('quantity_sold').notNull().default(0),
  purchasePricePerUnit: real('purchase_price_per_unit'),
  sellingPricePerUnit:  real('selling_price_per_unit'),
  receivedBy:           integer('received_by').notNull(),
  receivedAt:           text('received_at').notNull(),
  notes:                text('notes'),
  createdAt:            text('created_at').notNull().default(sql`now()`),
  updatedAt:            text('updated_at').notNull().default(sql`now()`),
});

export type FarmInput    = typeof farmInputsTable.$inferSelect;
export type NewFarmInput = typeof farmInputsTable.$inferInsert;
