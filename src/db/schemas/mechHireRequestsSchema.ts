import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const mechHireRequestsTable = boaSchema.table('mech_hire_requests', {
  id:                  serial('id').primaryKey(),
  refId:               text('ref_id').notNull().unique(),
  farmerName:          text('farmer_name').notNull(),
  farmerPhone:         text('farmer_phone').notNull(),
  facId:               integer('fac_id').notNull(),
  facName:             text('fac_name').notNull(),
  locationDescription: text('location_description').notNull(),
  state:               text('state').notNull(),
  lga:                 text('lga'),
  hectares:            real('hectares').notNull(),
  implements:          text('implements').notNull().default('[]'),
  preferredDate:       text('preferred_date'),
  notes:               text('notes'),
  quotedAmount:        real('quoted_amount'),
  quoteNotes:          text('quote_notes'),
  status:              text('status', {
                         enum: ['pending', 'quoted', 'payment_confirmed', 'deployed', 'completed', 'cancelled'],
                       }).notNull().default('pending'),
  tractorId:           integer('tractor_id'),
  tractorModel:        text('tractor_model'),
  createdAt:           text('created_at').notNull().default(sql`now()`),
});

export type MechHireRequest    = typeof mechHireRequestsTable.$inferSelect;
export type NewMechHireRequest = typeof mechHireRequestsTable.$inferInsert;
