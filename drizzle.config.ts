import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schemas/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ['boa'],
} satisfies Config;
