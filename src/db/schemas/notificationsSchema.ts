import { integer, text, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const notificationsTable = boaSchema.table('notifications', {
  id:               serial('id').primaryKey(),
  type:             text('type').notNull(),
  message:          text('message').notNull(),
  applicationRefId: text('application_ref_id'),
  // null = admin/super_admin only; set = scoped to that centre
  centreId:         integer('centre_id'),
  createdAt:        text('created_at').notNull().default(sql`now()`),
});
