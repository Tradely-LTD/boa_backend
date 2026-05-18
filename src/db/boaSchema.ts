import { pgSchema } from 'drizzle-orm/pg-core';

// All BOA tables live in the 'boa' PostgreSQL schema, keeping them isolated
// from other projects that share the same Supabase instance.
export const boaSchema = pgSchema('boa');
