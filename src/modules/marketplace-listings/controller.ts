import { Request, Response } from 'express';
import { eq, and, desc, asc, sql, ilike, gte, lte } from 'drizzle-orm';
import { db } from '../../db';
import { marketplaceListingsTable } from '../../db/schemas/marketplaceListingsSchema';
import { marketplaceOrdersTable }   from '../../db/schemas/marketplaceOrdersSchema';
import type { CreateListingBody, UpdateListingBody, ManualSaleBody } from './types';

const genRef = () => 'ML-' + Math.random().toString(36).substring(2, 9).toUpperCase();

// GET /api/marketplace/listings  (public)
export const getListings = async (req: Request, res: Response) => {
  try {
    const {
      commodity, state, grade, minPrice, maxPrice,
      search, sort = 'newest', deliveryOnly,
      page = '1', limit = '12',
    } = req.query as Record<string, string>;
    const p = parseInt(page);
    const l = parseInt(limit);
    const offset = (p - 1) * l;

    const conditions: ReturnType<typeof eq>[] = [eq(marketplaceListingsTable.status, 'active')];
    if (commodity)              conditions.push(eq(marketplaceListingsTable.commodity, commodity) as any);
    if (search)                 conditions.push(ilike(marketplaceListingsTable.commodity, `%${search}%`) as any);
    if (state)                  conditions.push(ilike(marketplaceListingsTable.centreState, `%${state}%`) as any);
    if (grade)                  conditions.push(ilike(marketplaceListingsTable.gradeQuality, `%${grade}%`) as any);
    if (minPrice)               conditions.push(gte(marketplaceListingsTable.pricePerKg, parseFloat(minPrice)) as any);
    if (maxPrice)               conditions.push(lte(marketplaceListingsTable.pricePerKg, parseFloat(maxPrice)) as any);
    if (deliveryOnly === 'true') conditions.push(eq(marketplaceListingsTable.deliveryAvailable, true) as any);

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const sortMap: Record<string, any> = {
      newest:     desc(marketplaceListingsTable.createdAt),
      oldest:     asc(marketplaceListingsTable.createdAt),
      price_asc:  asc(marketplaceListingsTable.pricePerKg),
      price_desc: desc(marketplaceListingsTable.pricePerKg),
      qty_desc:   desc(marketplaceListingsTable.quantityAvailableKg),
    };
    const orderByClause = sortMap[sort] ?? desc(marketplaceListingsTable.createdAt);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(marketplaceListingsTable)
      .where(where as any);

    const rows = await db
      .select()
      .from(marketplaceListingsTable)
      .where(where as any)
      .orderBy(orderByClause)
      .limit(l)
      .offset(offset);

    const parsed = rows.map(r => ({ ...r, images: JSON.parse(r.images ?? '[]'), deliveryZones: JSON.parse(r.deliveryZones ?? '[]'), specs: JSON.parse(r.specs ?? '{}'), packaging: JSON.parse(r.packaging ?? '{}') }));
    return res.json({ success: true, data: parsed, total: Number(total), page: p, limit: l, totalPages: Math.ceil(Number(total) / l) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/marketplace/listings/featured  (public – for landing page)
export const getFeaturedListings = async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(marketplaceListingsTable)
      .where(eq(marketplaceListingsTable.status, 'active'))
      .orderBy(desc(marketplaceListingsTable.createdAt))
      .limit(6);

    const parsed = rows.map(r => ({ ...r, images: JSON.parse(r.images ?? '[]'), deliveryZones: JSON.parse(r.deliveryZones ?? '[]'), specs: JSON.parse(r.specs ?? '{}'), packaging: JSON.parse(r.packaging ?? '{}') }));
    return res.json({ success: true, data: parsed });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/marketplace/listings/:id  (public)
export const getListing = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(marketplaceListingsTable)
      .where(eq(marketplaceListingsTable.id, parseInt(req.params.id)));

    if (!row) return res.status(404).json({ success: false, message: 'Listing not found.' });
    return res.json({ success: true, data: { ...row, images: JSON.parse(row.images ?? '[]'), deliveryZones: JSON.parse(row.deliveryZones ?? '[]'), specs: JSON.parse(row.specs ?? '{}') } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/marketplace/listings/mine  (manager auth)
export const getMyListings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const centreId = user.centreId;
    if (!centreId) return res.status(403).json({ success: false, message: 'No centre assigned.' });

    const rows = await db
      .select()
      .from(marketplaceListingsTable)
      .where(eq(marketplaceListingsTable.centreId, centreId))
      .orderBy(desc(marketplaceListingsTable.createdAt));

    const parsed = rows.map(r => ({ ...r, images: JSON.parse(r.images ?? '[]'), deliveryZones: JSON.parse(r.deliveryZones ?? '[]'), specs: JSON.parse(r.specs ?? '{}'), packaging: JSON.parse(r.packaging ?? '{}') }));
    return res.json({ success: true, data: parsed });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/marketplace/listings  (manager auth)
export const createListing = async (req: Request<{}, {}, CreateListingBody>, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user.centreId) return res.status(403).json({ success: false, message: 'No centre assigned.' });

    const { commodity, gradeQuality, description, quantityAvailableKg, pricePerKg, images, centreState, centreLga, isReceiptBacked, expiresAt, deliveryAvailable, deliveryZones, specs, packaging, bankName, bankAccountNumber, bankAccountName } = req.body;

    if (!commodity || !quantityAvailableKg || !pricePerKg || !centreState)
      return res.status(400).json({ success: false, message: 'commodity, quantityAvailableKg, pricePerKg and centreState are required.' });

    const [row] = await db.insert(marketplaceListingsTable).values({
      refId:               genRef(),
      centreId:            user.centreId,
      centreName:          user.centreName ?? `Centre ${user.centreId}`,
      centreState,
      centreLga:           centreLga ?? null,
      commodity,
      gradeQuality:        gradeQuality ?? null,
      description:         description ?? null,
      quantityAvailableKg,
      pricePerKg,
      images:              JSON.stringify(images ?? []),
      isReceiptBacked:     isReceiptBacked ?? false,
      deliveryAvailable:   deliveryAvailable ?? false,
      deliveryZones:       JSON.stringify(deliveryZones ?? []),
      specs:               JSON.stringify(specs ?? {}),
      packaging:           JSON.stringify(packaging ?? {}),
      bankName:            bankName ?? null,
      bankAccountNumber:   bankAccountNumber ?? null,
      bankAccountName:     bankAccountName ?? null,
      postedBy:            user.userId,
      expiresAt:           expiresAt ?? null,
      status:              'active',
      createdAt:           new Date().toISOString(),
      updatedAt:           new Date().toISOString(),
    }).returning();

    return res.status(201).json({ success: true, data: { ...row, images: JSON.parse(row.images ?? '[]'), deliveryZones: JSON.parse(row.deliveryZones ?? '[]'), specs: JSON.parse(row.specs ?? '{}') } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/marketplace/listings/:id  (manager auth)
export const updateListing = async (req: Request<{ id: string }, {}, UpdateListingBody>, res: Response) => {
  try {
    const user = (req as any).user;
    const id   = parseInt(req.params.id);

    const [existing] = await db.select().from(marketplaceListingsTable).where(eq(marketplaceListingsTable.id, id));
    if (!existing)                          return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (existing.centreId !== user.centreId) return res.status(403).json({ success: false, message: 'Not your listing.' });

    const { images, deliveryZones, specs, packaging, ...rest } = req.body;
    const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date().toISOString() };
    if (images)        updateData.images        = JSON.stringify(images);
    if (deliveryZones) updateData.deliveryZones = JSON.stringify(deliveryZones);
    if (specs)         updateData.specs         = JSON.stringify(specs);
    if (packaging)     updateData.packaging     = JSON.stringify(packaging);

    const [updated] = await db
      .update(marketplaceListingsTable)
      .set(updateData as any)
      .where(eq(marketplaceListingsTable.id, id))
      .returning();

    return res.json({ success: true, data: { ...updated, images: JSON.parse(updated.images ?? '[]') } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /api/marketplace/listings/:id  (manager auth)
export const deleteListing = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = (req as any).user;
    const id   = parseInt(req.params.id);

    const [existing] = await db.select().from(marketplaceListingsTable).where(eq(marketplaceListingsTable.id, id));
    if (!existing)                          return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (existing.centreId !== user.centreId) return res.status(403).json({ success: false, message: 'Not your listing.' });

    await db.delete(marketplaceListingsTable).where(eq(marketplaceListingsTable.id, id));
    return res.json({ success: true, message: 'Listing deleted.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/marketplace/listings/:id/manual-sale  (manager auth)
// Records a manual off-platform sale and deducts quantity atomically
export const recordManualSale = async (req: Request<{ id: string }, {}, ManualSaleBody>, res: Response) => {
  try {
    const user       = (req as any).user;
    const listingId  = parseInt(req.params.id);
    const { quantityKg, buyerName, buyerPhone, notes } = req.body;

    if (!quantityKg || quantityKg <= 0)
      return res.status(400).json({ success: false, message: 'quantityKg must be greater than 0.' });

    await db.transaction(async (tx) => {
      const [listing] = await tx
        .select()
        .from(marketplaceListingsTable)
        .where(eq(marketplaceListingsTable.id, listingId))
        .for('update');

      if (!listing)                          throw Object.assign(new Error('Listing not found.'), { status: 404 });
      if (listing.centreId !== user.centreId) throw Object.assign(new Error('Not your listing.'),   { status: 403 });
      if (listing.quantityAvailableKg < quantityKg)
        throw Object.assign(new Error(`Only ${listing.quantityAvailableKg}kg available.`), { status: 400 });

      const newQty = listing.quantityAvailableKg - quantityKg;

      await tx.update(marketplaceListingsTable).set({
        quantityAvailableKg: newQty,
        status:              newQty <= 0 ? 'sold_out' : listing.status,
        updatedAt:           new Date().toISOString(),
      }).where(eq(marketplaceListingsTable.id, listingId));

      await tx.insert(marketplaceOrdersTable).values({
        refId:        'MO-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        listingId,
        buyerId:      0,
        centreId:     listing.centreId,
        centreName:   listing.centreName,
        commodity:    listing.commodity,
        quantityKg,
        pricePerKg:   listing.pricePerKg,
        totalAmount:  quantityKg * listing.pricePerKg,
        buyerName:    buyerName ?? 'Walk-in Buyer',
        buyerEmail:   '',
        buyerPhone:   buyerPhone ?? '',
        status:       'completed',
        isManual:     true,
        notes:        notes ?? null,
        createdAt:    new Date().toISOString(),
        updatedAt:    new Date().toISOString(),
      });
    });

    return res.json({ success: true, message: 'Manual sale recorded and inventory deducted.' });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return res.status(status).json({ success: false, message: err.message ?? 'Internal server error.' });
  }
};
