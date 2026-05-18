import { text, integer, boolean, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const usersTable = boaSchema.table('users', {
  id:           serial('id').primaryKey(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name:         text('name').notNull(),
  role:         text('role', { enum: ['admin', 'super_admin', 'centre_manager', 'collector'] }).notNull().default('admin'),
  centreId:     integer('centre_id'),
  isActive:     boolean('is_active').notNull().default(true),
  createdAt:    text('created_at').notNull().default(sql`now()`),
  updatedAt:    text('updated_at').notNull().default(sql`now()`),
});

export type User    = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
