import { text, integer, real, boolean, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const aggregationCentresTable = boaSchema.table('aggregation_centres', {
  id:            serial('id').primaryKey(),
  refId:         text('ref_id').notNull().unique(),
  applicationId: integer('application_id'),

  // ── Identity ──────────────────────────────────────────────────────────────
  centreName:    text('centre_name').notNull(),
  centreType:    text('centre_type').notNull(),
  regNumber:     text('reg_number'),
  tinNumber:     text('tin_number'),
  yearEstablished: integer('year_established'),

  // ── Ownership ─────────────────────────────────────────────────────────────
  ownerName:     text('owner_name'),
  ownerPhone:    text('owner_phone'),
  ownerNin:      text('owner_nin'),

  // ── Infrastructure ────────────────────────────────────────────────────────
  commodities:             text('commodities'),
  capacityMt:              real('capacity_mt'),
  coldStorageCapacityMt:   real('cold_storage_capacity_mt'),
  numBays:                 integer('num_bays'),
  floorAreaSqm:            real('floor_area_sqm'),
  warehouseType:           text('warehouse_type'),
  facilities:              text('facilities'),
  powerSource:             text('power_source'),
  waterSource:             text('water_source'),
  hasAccessRoad:           boolean('has_access_road'),
  warehouseReceiptCapable: boolean('warehouse_receipt_capable'),

  // ── Location ──────────────────────────────────────────────────────────────
  state:         text('state').notNull(),
  lga:           text('lga'),
  address:       text('address'),
  gpsLat:        text('gps_lat'),
  gpsLng:        text('gps_lng'),

  // ── Manager ───────────────────────────────────────────────────────────────
  managerName:   text('manager_name'),
  managerPhone:  text('manager_phone'),
  managerNin:    text('manager_nin'),
  managerEmail:  text('manager_email'),

  // ── Banking ───────────────────────────────────────────────────────────────
  bankName:      text('bank_name'),
  accountNumber: text('account_number'),
  bvn:           text('bvn'),

  // ── Status ────────────────────────────────────────────────────────────────
  status:        text('status', {
                   enum: ['active', 'suspended', 'decommissioned'],
                 }).notNull().default('active'),

  approvedBy:    integer('approved_by'),
  approvedAt:    text('approved_at'),
  createdAt:     text('created_at').notNull().default(sql`now()`),
  updatedAt:     text('updated_at').notNull().default(sql`now()`),
});

export type AggregationCentre    = typeof aggregationCentresTable.$inferSelect;
export type NewAggregationCentre = typeof aggregationCentresTable.$inferInsert;
