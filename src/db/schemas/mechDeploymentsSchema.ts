import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { boaSchema } from '../boaSchema';

export const mechDeploymentsTable = boaSchema.table('mech_deployments', {
  id:                 serial('id').primaryKey(),
  refId:              text('ref_id').notNull().unique(),
  tractorId:          integer('tractor_id').notNull(),
  tractorModel:       text('tractor_model').notNull(),
  tractorSerial:      text('tractor_serial').notNull(),
  farmerName:         text('farmer_name').notNull(),
  farmerPhone:        text('farmer_phone').notNull(),
  facId:              integer('fac_id').notNull(),
  facName:            text('fac_name').notNull(),
  requestId:          integer('request_id').notNull(),
  implementsAttached: text('implements_attached').notNull().default('[]'),
  deployedAt:         text('deployed_at').notNull(),
  expectedReturnAt:   text('expected_return_at').notNull(),
  actualReturnAt:     text('actual_return_at'),
  status:             text('status', { enum: ['active', 'returned', 'overdue'] }).notNull().default('active'),
  lastKnownLat:       real('last_known_lat'),
  lastKnownLng:       real('last_known_lng'),
  lastLocationAt:     text('last_location_at'),
  notes:              text('notes'),
});

export type MechDeployment    = typeof mechDeploymentsTable.$inferSelect;
export type NewMechDeployment = typeof mechDeploymentsTable.$inferInsert;
