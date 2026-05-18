import 'dotenv/config';
import { db } from './index';
import { mechHireRequestsTable } from './schemas/mechHireRequestsSchema';
import { mechDeploymentsTable } from './schemas/mechDeploymentsSchema';
import { tractorsTable } from './schemas/tractorsSchema';
import { eq } from 'drizzle-orm';

// ── Test data ─────────────────────────────────────────────────────────────────
// Tractor: Massey Ferguson MF 385 4WD (id:4) assigned to Kano North Grain Store (id:1)
const TRACTOR_ID     = 4;
const TRACTOR_MODEL  = 'Massey Ferguson MF 385 4WD';
const TRACTOR_SERIAL = 'TRC-MF-2024-004';
const FAC_ID         = 1;
const FAC_NAME       = 'Kano North Grain Store';

// Dummy farmer
const FARMER = {
  name:  'Musa Ibrahim Dankoli',
  phone: '08033456789',
};

// GPS: Gezawa LGA, Kano State (field location)
const GPS_LAT = 12.1654;
const GPS_LNG =  8.7203;

async function seed() {
  console.log('🌱  Seeding test deployment...\n');

  // 1. Mark tractor as deployed
  await db
    .update(tractorsTable)
    .set({ status: 'deployed', updatedAt: new Date().toISOString() })
    .where(eq(tractorsTable.id, TRACTOR_ID));
  console.log(`✅  Tractor ${TRACTOR_SERIAL} → status: deployed`);

  // 2. Insert hire request (already in 'deployed' state — skip quote/payment steps for demo)
  const [req] = await db.insert(mechHireRequestsTable).values({
    refId:               'HR-TEST-' + Date.now().toString(36).toUpperCase(),
    farmerName:          FARMER.name,
    farmerPhone:         FARMER.phone,
    facId:               FAC_ID,
    facName:             FAC_NAME,
    locationDescription: 'Gezawa-Dawakin Kudu road, near Rijiyar Zaki village',
    state:               'Kano',
    lga:                 'Gezawa',
    hectares:            12.5,
    implements:          JSON.stringify(['Disc Plough', 'Disc Harrow']),
    preferredDate:       '2026-05-20',
    quotedAmount:        185000,
    quoteNotes:          '12.5 hectares × ₦14,800/ha. Includes fuel.',
    status:              'deployed',
    tractorId:           TRACTOR_ID,
    tractorModel:        TRACTOR_MODEL,
  }).returning();
  console.log(`✅  Hire request created: ${req.refId}`);

  // 3. Insert deployment with GPS coordinates (simulating IoT ping)
  const deployedAt       = new Date().toISOString();
  const expectedReturnAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days out

  const [dep] = await db.insert(mechDeploymentsTable).values({
    refId:              'DEP-TEST-' + Date.now().toString(36).toUpperCase(),
    tractorId:          TRACTOR_ID,
    tractorModel:       TRACTOR_MODEL,
    tractorSerial:      TRACTOR_SERIAL,
    farmerName:         FARMER.name,
    farmerPhone:        FARMER.phone,
    facId:              FAC_ID,
    facName:            FAC_NAME,
    requestId:          req.id,
    implementsAttached: JSON.stringify(['Disc Plough', 'Disc Harrow']),
    deployedAt,
    expectedReturnAt,
    status:             'active',
    lastKnownLat:       GPS_LAT,
    lastKnownLng:       GPS_LNG,
    lastLocationAt:     deployedAt,
    notes:              'Test deployment — Gezawa LGA, Kano. IoT unit installed.',
  }).returning();

  console.log(`✅  Deployment created: ${dep.refId}`);
  console.log(`    GPS: ${GPS_LAT}, ${GPS_LNG}  (Gezawa, Kano)`);
  console.log(`    Farmer: ${FARMER.name} · ${FARMER.phone}`);
  console.log(`    Implements: Disc Plough, Disc Harrow`);
  console.log(`    Expected return: ${new Date(expectedReturnAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`);

  console.log('\n🎉  Test deployment ready — open the Live Tracker to see the pin on the map.');
}

seed().catch(console.error);
