import { integer, text, real, serial, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const marketplaceListingsTable = boaSchema.table('marketplace_listings', {
  id:                   serial('id').primaryKey(),
  refId:                text('ref_id').notNull().unique(),

  // ── Centre ────────────────────────────────────────────────────────────────
  centreId:             integer('centre_id').notNull(),
  centreName:           text('centre_name').notNull(),
  centreState:          text('centre_state').notNull(),
  centreLga:            text('centre_lga'),

  // ── Commodity ─────────────────────────────────────────────────────────────
  commodity:            text('commodity').notNull(),
  gradeQuality:         text('grade_quality'),
  description:          text('description'),

  // ── Quantity & Price ──────────────────────────────────────────────────────
  quantityAvailableKg:  real('quantity_available_kg').notNull(),
  pricePerKg:           real('price_per_kg').notNull(),

  // ── Media ─────────────────────────────────────────────────────────────────
  images:               text('images').default('[]'),   // JSON array of S3 URLs

  // ── Status ────────────────────────────────────────────────────────────────
  status:               text('status', {
                          enum: ['active', 'paused', 'sold_out', 'expired'],
                        }).notNull().default('active'),

  isReceiptBacked:      boolean('is_receipt_backed').notNull().default(false),

  // ── Delivery ──────────────────────────────────────────────────────────────
  deliveryAvailable:    boolean('delivery_available').notNull().default(false),
  deliveryZones:        text('delivery_zones').notNull().default('[]'),  // JSON: [{state,lga?,charge}]

  // ── Quality specs ─────────────────────────────────────────────────────────
  specs:                text('specs').notNull().default('{}'),           // JSON: {moisture?,protein?,…}

  // ── Packaging ─────────────────────────────────────────────────────────────
  packaging:            text('packaging').notNull().default('{}'),       // JSON: PackagingInfo

  // ── Bank details (for Bank Transfer payment) ──────────────────────────────
  bankName:             text('bank_name'),
  bankAccountNumber:    text('bank_account_number'),
  bankAccountName:      text('bank_account_name'),

  postedBy:             integer('posted_by').notNull(),
  expiresAt:            text('expires_at'),
  createdAt:            text('created_at').notNull().default(sql`now()`),
  updatedAt:            text('updated_at').notNull().default(sql`now()`),
});

export type MarketplaceListing    = typeof marketplaceListingsTable.$inferSelect;
export type NewMarketplaceListing = typeof marketplaceListingsTable.$inferInsert;
