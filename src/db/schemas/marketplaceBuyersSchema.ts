import { text, serial, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const marketplaceBuyersTable = boaSchema.table('marketplace_buyers', {
  id:           serial('id').primaryKey(),
  refId:        text('ref_id').notNull().unique(),
  fullName:     text('full_name').notNull(),
  email:        text('email').notNull().unique(),
  phone:        text('phone').notNull(),
  passwordHash: text('password_hash').notNull(),
  isVerified:   boolean('is_verified').notNull().default(false),
  createdAt:    text('created_at').notNull().default(sql`now()`),
});

export type MarketplaceBuyer    = typeof marketplaceBuyersTable.$inferSelect;
export type NewMarketplaceBuyer = typeof marketplaceBuyersTable.$inferInsert;
