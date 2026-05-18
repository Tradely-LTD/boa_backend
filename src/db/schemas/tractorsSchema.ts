import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const tractorsTable = boaSchema.table('tractors', {
  id:                serial('id').primaryKey(),
  serialNumber:      text('serial_number').notNull().unique(),
  brand:             text('brand'),
  model:             text('model').notNull(),
  yearManufactured:  integer('year_manufactured'),
  horsepowerHp:      real('horsepower_hp').notNull(),
  driveType:         text('drive_type', { enum: ['2WD', '4WD'] }).notNull(),
  fuelType:          text('fuel_type').default('diesel'),
  engineCc:          real('engine_cc'),
  color:             text('color'),
  status:            text('status', { enum: ['available', 'deployed', 'maintenance'] }).notNull().default('available'),
  facId:             integer('fac_id'),
  facName:           text('fac_name'),
  currentImplements: text('current_implements').notNull().default('[]'),
  notes:             text('notes'),
  createdAt:         text('created_at').notNull().default(sql`now()`),
  updatedAt:         text('updated_at').notNull().default(sql`now()`),
});

export type Tractor    = typeof tractorsTable.$inferSelect;
export type NewTractor = typeof tractorsTable.$inferInsert;
