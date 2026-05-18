import { integer, text, boolean, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const suppliersTable = boaSchema.table('suppliers', {
  id:           serial('id').primaryKey(),
  name:         text('name').notNull(),
  phone:        text('phone'),
  email:        text('email'),
  address:      text('address'),
  state:        text('state'),
  lga:          text('lga'),
  supplierType: text('supplier_type', { enum: ['individual', 'company'] }).notNull().default('individual'),
  centreId:     integer('centre_id'),
  isActive:     boolean('is_active').notNull().default(true),
  createdAt:    text('created_at').notNull().default(sql`now()`),
  updatedAt:    text('updated_at').notNull().default(sql`now()`),
});

export type Supplier    = typeof suppliersTable.$inferSelect;
export type NewSupplier = typeof suppliersTable.$inferInsert;
