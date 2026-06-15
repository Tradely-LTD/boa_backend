import { integer, text, boolean, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const shopsTable = boaSchema.table('shops', {
  id:           serial('id').primaryKey(),
  shopRefId:    text('shop_ref_id').notNull().unique(),  // BOA-assigned: e.g. "SHP-KN001"
  centreId:     integer('centre_id').notNull(),           // which BOA centre they occupy
  shopName:     text('shop_name').notNull(),
  ownerName:    text('owner_name').notNull(),
  ownerPhone:   text('owner_phone').notNull(),
  ownerNin:     text('owner_nin'),
  businessType: text('business_type'),                    // e.g. "Grain Trader", "Agro-dealer"
  spaceNumber:  text('space_number'),                     // container/space at the centre
  status:       text('status', { enum: ['active', 'suspended'] }).notNull().default('active'),
  createdBy:    integer('created_by').notNull(),           // centre manager who onboarded them
  createdAt:    text('created_at').notNull().default(sql`now()`),
  updatedAt:    text('updated_at').notNull().default(sql`now()`),
});

// Shop inventory intakes (separate from BOA centre intakes)
export const shopIntakesTable = boaSchema.table('shop_intakes', {
  id:           serial('id').primaryKey(),
  refId:        text('ref_id').notNull().unique(),
  shopId:       integer('shop_id').notNull(),
  centreId:     integer('centre_id').notNull(),
  commodity:    text('commodity').notNull(),
  quantityKg:   text('quantity_kg').notNull(),             // stored as text to avoid float precision
  gradeQuality: text('grade_quality'),
  sourceType:   text('source_type').notNull().default('purchase'),
  notes:        text('notes'),
  loggedBy:     integer('logged_by').notNull(),
  createdAt:    text('created_at').notNull().default(sql`now()`),
});

// Shop sales (tracked by Sales Reps)
export const shopSalesTable = boaSchema.table('shop_sales', {
  id:            serial('id').primaryKey(),
  refId:         text('ref_id').notNull().unique(),
  shopId:        integer('shop_id').notNull(),
  centreId:      integer('centre_id').notNull(),
  intakeId:      integer('intake_id'),
  commodity:     text('commodity').notNull(),
  quantityKg:    text('quantity_kg').notNull(),
  pricePerKg:    text('price_per_kg').notNull(),
  totalAmount:   text('total_amount').notNull(),
  buyerName:     text('buyer_name'),
  buyerPhone:    text('buyer_phone'),
  paymentMethod: text('payment_method').notNull().default('cash'),
  receiptNumber: text('receipt_number').notNull(),
  soldBy:        integer('sold_by').notNull(),
  notes:         text('notes'),
  createdAt:     text('created_at').notNull().default(sql`now()`),
});

// Shop expenses (tracked by Sales Reps / Shop Owner)
export const shopExpensesTable = boaSchema.table('shop_expenses', {
  id:          serial('id').primaryKey(),
  refId:       text('ref_id').notNull().unique(),
  shopId:      integer('shop_id').notNull(),
  centreId:    integer('centre_id').notNull(),
  category:    text('category').notNull(),   // e.g. "Rent", "Staff", "Transport", "Other"
  description: text('description'),
  amount:      text('amount').notNull(),
  loggedBy:    integer('logged_by').notNull(),
  createdAt:   text('created_at').notNull().default(sql`now()`),
});

export type Shop          = typeof shopsTable.$inferSelect;
export type NewShop       = typeof shopsTable.$inferInsert;
export type ShopIntake    = typeof shopIntakesTable.$inferSelect;
export type ShopSale      = typeof shopSalesTable.$inferSelect;
export type ShopExpense   = typeof shopExpensesTable.$inferSelect;
