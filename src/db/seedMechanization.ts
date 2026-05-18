import 'dotenv/config';
import { db } from './index';
import { tractorsTable } from './schemas/tractorsSchema';
import { eq } from 'drizzle-orm';

const TRACTORS = [
  {
    serialNumber:    'TRC-MH-2024-001',
    brand:           'Mahindra',
    model:           'Mahindra 575 DI XP Plus',
    horsepowerHp:    47,
    driveType:       '2WD' as const,
    fuelType:        'diesel',
    engineCc:        2730,
    yearManufactured: 2022,
    color:           'Red',
    status:          'available' as const,
    currentImplements: JSON.stringify(['Disc Plough', 'Ridger']),
  },
  {
    serialNumber:    'TRC-MH-2024-002',
    brand:           'Mahindra',
    model:           'Mahindra JIVO 245 DI 4WD',
    horsepowerHp:    24,
    driveType:       '4WD' as const,
    fuelType:        'diesel',
    engineCc:        1318,
    yearManufactured: 2023,
    color:           'Red',
    status:          'available' as const,
    currentImplements: JSON.stringify(['Rotavator']),
  },
  {
    serialNumber:    'TRC-SN-2024-003',
    brand:           'Sonalika',
    model:           'Sonalika DI 745 III',
    horsepowerHp:    75,
    driveType:       '4WD' as const,
    fuelType:        'diesel',
    engineCc:        3760,
    yearManufactured: 2023,
    color:           'Orange',
    status:          'available' as const,
    currentImplements: JSON.stringify(['Disc Harrow', 'Planter']),
  },
  {
    serialNumber:    'TRC-MF-2024-004',
    brand:           'Massey Ferguson',
    model:           'Massey Ferguson MF 385 4WD',
    horsepowerHp:    85,
    driveType:       '4WD' as const,
    fuelType:        'diesel',
    engineCc:        4400,
    yearManufactured: 2021,
    color:           'Grey',
    status:          'available' as const,
    currentImplements: JSON.stringify(['Disc Plough', 'Disc Harrow', 'Subsoiler']),
  },
  {
    serialNumber:    'TRC-CAT-2024-005',
    brand:           'Caterpillar',
    model:           'Caterpillar Challenger MT555E',
    horsepowerHp:    175,
    driveType:       '4WD' as const,
    fuelType:        'diesel',
    engineCc:        6600,
    yearManufactured: 2020,
    color:           'Yellow',
    status:          'maintenance' as const,
    notes:           'Undergoing routine 500-hour service',
    currentImplements: JSON.stringify([]),
  },
];

// Implement types are string labels referenced in hire requests — no separate table.
// These are the 5 standard implement options available in the system:
const IMPLEMENTS = [
  'Ridger',
  'Disc Plough',
  'Disc Harrow',
  'Planter',
  'Rotavator',
];

async function seed() {
  console.log('🌱  Seeding mechanization data...\n');

  let seeded = 0;
  let skipped = 0;

  for (const tractor of TRACTORS) {
    const [existing] = await db
      .select({ id: tractorsTable.id })
      .from(tractorsTable)
      .where(eq(tractorsTable.serialNumber, tractor.serialNumber));

    if (existing) {
      await db.update(tractorsTable).set(tractor).where(eq(tractorsTable.serialNumber, tractor.serialNumber));
      console.log(`🔄  Updated: ${tractor.serialNumber} — ${tractor.model}`);
      skipped++;
      continue;
    }

    await db.insert(tractorsTable).values(tractor);
    console.log(`✅  Tractor seeded: ${tractor.serialNumber} — ${tractor.model} (${tractor.horsepowerHp}hp ${tractor.driveType})`);
    seeded++;
  }

  console.log(`\n📋  Available implement types (used as string labels in hire requests):`);
  IMPLEMENTS.forEach((impl, i) => console.log(`    ${i + 1}. ${impl}`));

  console.log(`\n✔️   Done — ${seeded} tractor(s) seeded, ${skipped} skipped.`);
}

seed().catch(console.error);
