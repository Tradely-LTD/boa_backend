import { text, integer, real, boolean, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const applicationsTable = boaSchema.table('applications', {
  id:            serial('id').primaryKey(),
  refId:         text('ref_id').notNull().unique(),

  // ── Step 1: Identity ──────────────────────────────────────────────────────
  centreName:    text('centre_name').notNull(),
  centreType:    text('centre_type', {
                   enum: ['primary', 'secondary', 'collection_point'],
                 }).notNull(),
  regNumber:     text('reg_number'),
  tinNumber:     text('tin_number'),
  yearEstablished: integer('year_established'),

  // ── Step 2: Ownership ─────────────────────────────────────────────────────
  ownerName:     text('owner_name'),
  ownerPhone:    text('owner_phone'),
  ownerNin:      text('owner_nin'),

  // ── Step 3: Infrastructure ────────────────────────────────────────────────
  commodities:             text('commodities'),
  capacityMt:              real('capacity_mt'),
  coldStorageCapacityMt:   real('cold_storage_capacity_mt'),
  numBays:                 integer('num_bays'),
  floorAreaSqm:            real('floor_area_sqm'),
  warehouseType:           text('warehouse_type', {
                             enum: ['silo', 'shed', 'open_yard', 'cold_storage', 'mixed'],
                           }),
  facilities:              text('facilities'),
  powerSource:             text('power_source', {
                             enum: ['grid', 'generator', 'solar', 'none'],
                           }),
  waterSource:             text('water_source', {
                             enum: ['borehole', 'tap', 'none'],
                           }),
  hasAccessRoad:           boolean('has_access_road'),
  warehouseReceiptCapable: boolean('warehouse_receipt_capable'),

  // ── Step 4: Location ──────────────────────────────────────────────────────
  address:       text('address'),
  state:         text('state'),
  lga:           text('lga'),
  gpsLat:        text('gps_lat'),
  gpsLng:        text('gps_lng'),

  // ── Step 5: Manager ───────────────────────────────────────────────────────
  managerName:   text('manager_name'),
  managerPhone:  text('manager_phone'),
  managerNin:    text('manager_nin'),
  managerEmail:  text('manager_email'),

  // ── Step 6: Banking ───────────────────────────────────────────────────────
  bankName:      text('bank_name'),
  accountNumber: text('account_number'),
  bvn:           text('bvn'),

  // ── Review ────────────────────────────────────────────────────────────────
  status:        text('status', {
                   enum: ['pending', 'under_review', 'approved', 'rejected'],
                 }).notNull().default('pending'),
  reviewNotes:   text('review_notes'),
  reviewedBy:    integer('reviewed_by'),
  reviewedAt:    text('reviewed_at'),

  createdAt:     text('created_at').notNull().default(sql`now()`),
  updatedAt:     text('updated_at').notNull().default(sql`now()`),
});

export type Application    = typeof applicationsTable.$inferSelect;
export type NewApplication = typeof applicationsTable.$inferInsert;
