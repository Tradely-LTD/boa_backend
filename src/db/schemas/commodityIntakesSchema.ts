import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const commodityIntakesTable = boaSchema.table('commodity_intakes', {
  id:           serial('id').primaryKey(),
  refId:        text('ref_id').notNull().unique(),
  centreId:     integer('centre_id').notNull(),
  centreName:   text('centre_name').notNull(),
  commodity:    text('commodity').notNull(),
  quantityKg:   real('quantity_kg').notNull(),
  gradeQuality: text('grade_quality'),
  farmerName:   text('farmer_name'),
  farmerPhone:  text('farmer_phone'),
  farmerNin:    text('farmer_nin'),
  sourceState:  text('source_state'),
  sourceLga:    text('source_lga'),
  sourceType:   text('source_type', { enum: ['farmer', 'supplier'] }).notNull().default('farmer'),
  supplierId:   integer('supplier_id'),
  supplierName: text('supplier_name'),
  notes:        text('notes'),
  loggedBy:     integer('logged_by').notNull(),
  createdAt:    text('created_at').notNull().default(sql`now()`),
});

export type CommodityIntake    = typeof commodityIntakesTable.$inferSelect;
export type NewCommodityIntake = typeof commodityIntakesTable.$inferInsert;
