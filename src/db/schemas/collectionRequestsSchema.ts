import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const collectionRequestsTable = boaSchema.table('collection_requests', {
  id:                  serial('id').primaryKey(),
  refId:               text('ref_id').notNull().unique(),
  farmerName:          text('farmer_name').notNull(),
  farmerPhone:         text('farmer_phone').notNull(),
  farmerNin:           text('farmer_nin'),
  address:             text('address').notNull(),
  state:               text('state').notNull(),
  lga:                 text('lga').notNull(),
  commodity:           text('commodity').notNull(),
  estimatedQuantityKg: real('estimated_quantity_kg').notNull(),
  collectionType:      text('collection_type', { enum: ['tricycle', 'motorcycle', 'truck', 'packer'] }).notNull(),
  preferredDate:       text('preferred_date').notNull(),
  preferredTime:       text('preferred_time'),
  notes:               text('notes'),
  status:              text('status', {
    enum: ['pending', 'assigned', 'in_transit', 'collected', 'cancelled'],
  }).notNull().default('pending'),
  centreId:            integer('centre_id'),
  centreName:          text('centre_name'),
  collectorId:         integer('collector_id'),
  collectorName:       text('collector_name'),
  assignedAt:          text('assigned_at'),
  inTransitAt:         text('in_transit_at'),
  collectedAt:         text('collected_at'),
  actualQuantityKg:    real('actual_quantity_kg'),
  collectionNotes:     text('collection_notes'),
  gpsLat:              text('gps_lat'),
  gpsLng:              text('gps_lng'),
  createdAt:           text('created_at').notNull().default(sql`now()`),
  updatedAt:           text('updated_at').notNull().default(sql`now()`),
});

export type CollectionRequest    = typeof collectionRequestsTable.$inferSelect;
export type NewCollectionRequest = typeof collectionRequestsTable.$inferInsert;
