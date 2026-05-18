import 'dotenv/config';
import { db } from './index';
import { marketplaceListingsTable } from './schemas/marketplaceListingsSchema';
import { eq } from 'drizzle-orm';

const listings = [
  {
    refId: 'MKT-2025-001',
    centreId: 1, centreName: 'Kano North Grain Store', centreState: 'Kano', centreLga: 'Ungogo',
    commodity: 'Maize', gradeQuality: 'Grade A',
    description: 'Freshly harvested white maize, sun-dried and cleaned. Moisture content <13%. Ideal for milling, animal feed, and industrial starch processing.',
    quantityAvailableKg: 48000, pricePerKg: 310,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80',
      'https://images.unsplash.com/photo-1601593346740-925612772716?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: true, postedBy: 3,
    expiresAt: '2025-08-30',
  },
  {
    refId: 'MKT-2025-002',
    centreId: 6, centreName: 'Kebbi Rice Processing Centre', centreState: 'Kebbi', centreLga: 'Birnin Kebbi',
    commodity: 'Rice (Paddy)', gradeQuality: 'Grade A',
    description: 'Long-grain paddy rice from Kebbi lowlands. High milling recovery (~65%). Clean, free of stones and foreign matter. Packed in 50kg jute bags.',
    quantityAvailableKg: 30000, pricePerKg: 480,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
      'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: true, postedBy: 8,
    expiresAt: '2025-09-15',
  },
  {
    refId: 'MKT-2025-003',
    centreId: 4, centreName: 'Zaria Central Commodity Store', centreState: 'Kaduna', centreLga: 'Zaria',
    commodity: 'Soybean', gradeQuality: 'Grade B',
    description: 'Yellow soybeans, locally grown in Kaduna. Protein content ~38%. Suitable for oil extraction, flour production, and livestock feed formulation.',
    quantityAvailableKg: 22000, pricePerKg: 560,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1599940778173-e276d4acb2bb?w=800&q=80',
      'https://images.unsplash.com/photo-1617634777009-f8aaef4fe9a7?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: false, postedBy: 6,
    expiresAt: '2025-09-01',
  },
  {
    refId: 'MKT-2025-004',
    centreId: 2, centreName: 'Daura Grain Processing Hub', centreState: 'Katsina', centreLga: 'Daura',
    commodity: 'Sorghum', gradeQuality: 'Grade A',
    description: 'Red sorghum (guinea corn) from Katsina State. Excellent for brewing, flour, and animal feed. Low tannin variety. Moisture <12%, well-cleaned.',
    quantityAvailableKg: 35000, pricePerKg: 270,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80',
      'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: true, postedBy: 4,
    expiresAt: '2025-08-25',
  },
  {
    refId: 'MKT-2025-005',
    centreId: 3, centreName: 'Sokoto Multipurpose Agro Store', centreState: 'Sokoto', centreLga: 'Wamakko',
    commodity: 'Groundnut', gradeQuality: 'Grade A',
    description: 'Shelled groundnuts (peanuts), harvested from Sokoto smallholders. Aflatoxin tested (<10 ppb). Suitable for oil pressing, confectionery, and export.',
    quantityAvailableKg: 12000, pricePerKg: 720,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1567158736285-cc7de7cfb4ac?w=800&q=80',
      'https://images.unsplash.com/photo-1605256585680-47b7e8cc0d73?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: false, postedBy: 5,
    expiresAt: '2025-10-01',
  },
  {
    refId: 'MKT-2025-006',
    centreId: 7, centreName: 'Dutse Grain Store', centreState: 'Jigawa', centreLga: 'Dutse',
    commodity: 'Millet', gradeQuality: 'Grade B',
    description: 'Pearl millet (fonio) from Jigawa. Small-grained, well-dried to 11% moisture. Common staple in the Sahel belt. Ideal for flour, porridge, and fermented drinks.',
    quantityAvailableKg: 18500, pricePerKg: 240,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=800&q=80',
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: false, postedBy: 9,
    expiresAt: '2025-09-20',
  },
  {
    refId: 'MKT-2025-007',
    centreId: 8, centreName: 'Bauchi Integrated Agro Hub', centreState: 'Bauchi', centreLga: 'Bauchi',
    commodity: 'Cowpea', gradeQuality: 'Grade A',
    description: 'White and brown cowpeas (beans) from Bauchi plateau. Insect-free, hermetically stored. High protein (~24%), suitable for human consumption and value-added products.',
    quantityAvailableKg: 9800, pricePerKg: 650,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
      'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: true, postedBy: 10,
    expiresAt: '2025-11-01',
  },
  {
    refId: 'MKT-2025-008',
    centreId: 5, centreName: 'Gusau Farmers Warehouse', centreState: 'Zamfara', centreLga: 'Gusau',
    commodity: 'Sesame', gradeQuality: 'Grade A',
    description: 'White sesame seeds (benniseed) from Zamfara. Oil content >50%. Sorted and cleaned. Export-ready. Packed in polypropylene sacks of 50kg.',
    quantityAvailableKg: 6500, pricePerKg: 1100,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=800&q=80',
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: false, postedBy: 7,
    expiresAt: '2025-12-01',
  },
  {
    refId: 'MKT-2025-009',
    centreId: 9, centreName: 'Gombe Commodity Aggregation Centre', centreState: 'Gombe', centreLga: 'Gombe',
    commodity: 'Maize', gradeQuality: 'Grade B',
    description: 'Yellow maize from Gombe smallholder cooperatives. Slightly higher moisture (14-15%), priced accordingly. Suitable for animal feed and industrial fermentation.',
    quantityAvailableKg: 60000, pricePerKg: 280,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=800&q=80',
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: false, postedBy: 11,
    expiresAt: '2025-08-15',
  },
  {
    refId: 'MKT-2025-010',
    centreId: 10, centreName: 'Yola AgriConnect Storage', centreState: 'Adamawa', centreLga: 'Yola',
    commodity: 'Rice (Paddy)', gradeQuality: 'Grade B',
    description: 'Medium-grain paddy rice from Adamawa river plains. Good milling potential. Moisture 13-14%. Packed in 50kg woven polypropylene bags, minimum order 2 tonnes.',
    quantityAvailableKg: 16000, pricePerKg: 420,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1565302536640-09ad81e37f1c?w=800&q=80',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: true, postedBy: 12,
    expiresAt: '2025-10-15',
  },
];

const moreListings = [
  {
    refId: 'MKT-2025-011',
    centreId: 11, centreName: 'Benue Cassava Processing Hub', centreState: 'Benue', centreLga: 'Makurdi',
    commodity: 'Cassava', gradeQuality: 'Grade A',
    description: 'Fresh cassava roots from Benue — the food basket of Nigeria. Harvested 3 days ago, sorted for size uniformity. Suitable for flour, starch, and ethanol production. Available for immediate collection.',
    quantityAvailableKg: 40000, pricePerKg: 95,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=800&q=80',
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: false, postedBy: 13,
    expiresAt: '2025-07-01',
  },
  {
    refId: 'MKT-2025-012',
    centreId: 12, centreName: 'Calabar Cocoa Store', centreState: 'Cross River', centreLga: 'Calabar',
    commodity: 'Cocoa Beans', gradeQuality: 'Grade A',
    description: 'Fermented and sun-dried cocoa beans from Cross River rainforest farms. Moisture <7.5%. Excellent flavour profile. Graded and bagged in standard 65kg jute sacks. Export-quality.',
    quantityAvailableKg: 8000, pricePerKg: 3200,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&q=80',
      'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: true, postedBy: 14,
    expiresAt: '2025-10-30',
  },
  {
    refId: 'MKT-2025-013',
    centreId: 13, centreName: 'Oyo Grain Aggregation Centre', centreState: 'Oyo', centreLga: 'Ibadan North',
    commodity: 'Maize', gradeQuality: 'Grade A',
    description: 'White maize from Oyo State cooperatives. Moisture 12.5%. Aflatoxin tested. Ideal for human consumption and food processing. Packed in clean 100kg polypropylene sacks.',
    quantityAvailableKg: 25000, pricePerKg: 320,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1601593346740-925612772716?w=800&q=80',
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: true, postedBy: 15,
    expiresAt: '2025-09-10',
  },
  {
    refId: 'MKT-2025-014',
    centreId: 14, centreName: 'Enugu Commodity Warehouse', centreState: 'Enugu', centreLga: 'Enugu North',
    commodity: 'Palm Oil', gradeQuality: 'Grade A',
    description: 'Unrefined red palm oil from Enugu community processors. Free fatty acid (FFA) <5%. Stored in food-grade steel drums of 200L. Rich carotene content. Suitable for local food market and soap manufacturing.',
    quantityAvailableKg: 5000, pricePerKg: 1650,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80',
      'https://images.unsplash.com/photo-1596470904694-8c76fc665e5b?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: false, postedBy: 16,
    expiresAt: '2025-11-15',
  },
  {
    refId: 'MKT-2025-015',
    centreId: 15, centreName: 'Kogi River Basin FAC', centreState: 'Kogi', centreLga: 'Lokoja',
    commodity: 'Soybean', gradeQuality: 'Grade A',
    description: 'Premium yellow soybeans from Kogi river basin plots. Protein >40%. Cleaned, sorted, and bagged at 50kg. No foreign matter. Well-suited for tofu, soy milk, and animal feed concentrates.',
    quantityAvailableKg: 14000, pricePerKg: 590,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1617634777009-f8aaef4fe9a7?w=800&q=80',
      'https://images.unsplash.com/photo-1599940778173-e276d4acb2bb?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: true, postedBy: 17,
    expiresAt: '2025-10-05',
  },
  {
    refId: 'MKT-2025-016',
    centreId: 16, centreName: 'Niger State Grain Hub', centreState: 'Niger', centreLga: 'Minna',
    commodity: 'Sorghum', gradeQuality: 'Grade B',
    description: 'White sorghum from Niger State. Moderate tannin. Suitable for industrial starch, brewing adjunct, and animal feed compounding. Moisture ~13.5%, well-stored in ventilated silos.',
    quantityAvailableKg: 42000, pricePerKg: 245,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&q=80',
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: false, postedBy: 18,
    expiresAt: '2025-09-25',
  },
  {
    refId: 'MKT-2025-017',
    centreId: 17, centreName: 'Plateau Multipurpose Agro Store', centreState: 'Plateau', centreLga: 'Jos North',
    commodity: 'Irish Potato', gradeQuality: 'Grade A',
    description: 'Fresh highland Irish potatoes from Jos Plateau. Sizes 60–120mm. Firm, no sprouting. Ideal for chips production, processing plants, and fresh market retail. Packed in ventilated mesh bags.',
    quantityAvailableKg: 18000, pricePerKg: 380,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1518977676405-d674f4c5ef8e?w=800&q=80',
      'https://images.unsplash.com/photo-1508313880080-c4bef0730395?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: false, postedBy: 19,
    expiresAt: '2025-07-20',
  },
  {
    refId: 'MKT-2025-018',
    centreId: 18, centreName: 'Taraba Agricultural Store', centreState: 'Taraba', centreLga: 'Jalingo',
    commodity: 'Sesame', gradeQuality: 'Grade B',
    description: 'Mixed sesame (white and brown varieties) from Taraba State. Oil content ~48%. Cleaned but with minor foreign matter present. Priced competitively for domestic oil mills. 50kg PP bags.',
    quantityAvailableKg: 9200, pricePerKg: 980,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&q=80',
      'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: false, postedBy: 20,
    expiresAt: '2025-12-20',
  },
  {
    refId: 'MKT-2025-019',
    centreId: 19, centreName: 'Ondo Palm Produce Centre', centreState: 'Ondo', centreLga: 'Akure',
    commodity: 'Palm Kernel', gradeQuality: 'Grade A',
    description: 'Dry palm kernel nuts from Ondo State. Shell content <6%. Oil extraction rate ~45%. Cleaned and bagged in 50kg. Suitable for kernel oil mills and confectionery fat production.',
    quantityAvailableKg: 11000, pricePerKg: 890,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1596470904694-8c76fc665e5b?w=800&q=80',
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: true, postedBy: 24,
    expiresAt: '2025-11-30',
  },
  {
    refId: 'MKT-2025-020',
    centreId: 20, centreName: 'Edo Commodity Hub', centreState: 'Edo', centreLga: 'Benin City',
    commodity: 'Cowpea', gradeQuality: 'Grade B',
    description: 'Reddish-brown cowpeas from Edo State farmers. Some slight insect damage (<3%). Good for processed snacks, flour, and animal feed supplements. 50kg woven bags. Priced for volume buyers.',
    quantityAvailableKg: 6800, pricePerKg: 580,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=800&q=80',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    ]),
    status: 'active' as const, isReceiptBacked: false, postedBy: 34,
    expiresAt: '2025-10-20',
  },
];

async function seedListings() {
  console.log('🌱  Seeding marketplace listings…');

  for (const listing of [...listings, ...moreListings]) {
    const [existing] = await db
      .select({ id: marketplaceListingsTable.id })
      .from(marketplaceListingsTable)
      .where(eq(marketplaceListingsTable.refId, listing.refId));

    if (existing) {
      console.log(`  ⏩  ${listing.refId} already exists, skipping`);
      continue;
    }

    await db.insert(marketplaceListingsTable).values(listing);
    console.log(`  ✅  Inserted ${listing.refId} — ${listing.commodity} @ ₦${listing.pricePerKg}/kg (${(listing.quantityAvailableKg / 1000).toFixed(1)}t)`);
  }

  console.log('\n✅  Done.');
}

seedListings().catch(console.error).finally(() => process.exit(0));
