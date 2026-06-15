import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const commodityPricesTable = boaSchema.table('commodity_prices', {
  id:        serial('id').primaryKey(),
  commodity: text('commodity').notNull(),
  // centreId null = global/default price; non-null = centre-specific override
  centreId:  integer('centre_id'),
  pricePerKg: real('price_per_kg').notNull(),
  setBy:     integer('set_by').notNull(),
  notes:     text('notes'),
  createdAt: text('created_at').notNull().default(sql`now()`),
  updatedAt: text('updated_at').notNull().default(sql`now()`),
});

export type CommodityPrice    = typeof commodityPricesTable.$inferSelect;
export type NewCommodityPrice = typeof commodityPricesTable.$inferInsert;
