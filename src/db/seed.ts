import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './index';
import { usersTable } from './schemas/usersSchema';
import { eq } from 'drizzle-orm';

async function seed() {
  const email    = process.env.ADMIN_EMAIL    ?? 'admin@boa.gov.ng';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
  const name     = 'BOA Super Admin';

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    console.log(`ℹ️  Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(usersTable).values({ email, passwordHash, name, role: 'super_admin' });

  console.log(`✅  Admin seeded:`);
  console.log(`    Email:    ${email}`);
  console.log(`    Password: ${password}`);
  console.log(`    Role:     super_admin`);
}

seed().catch(console.error);
