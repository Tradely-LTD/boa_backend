import { Request, Response } from 'express';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { commodityPricesTable } from '../../db/schemas/commodityPricesSchema';
import type { JwtPayload } from '../auth/types';

// GET /api/commodity-prices — list all prices; optionally filter by commodity
export const listPrices = async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(commodityPricesTable)
      .orderBy(commodityPricesTable.commodity, desc(commodityPricesTable.updatedAt));

    return res.json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/commodity-prices/lookup?commodity=Maize&centreId=3
// Returns the best price: centre-specific if available, otherwise global
export const lookupPrice = async (req: Request, res: Response) => {
  try {
    const { commodity, centreId } = req.query;
    if (!commodity) return res.status(400).json({ success: false, message: 'commodity is required.' });

    const cid = centreId ? parseInt(centreId as string) : null;

    const rows = await db
      .select()
      .from(commodityPricesTable)
      .where(eq(commodityPricesTable.commodity, commodity as string))
      .orderBy(desc(commodityPricesTable.updatedAt));

    // Prefer centre-specific, fall back to global
    const centreRow = cid ? rows.find(r => r.centreId === cid) : null;
    const globalRow = rows.find(r => r.centreId === null);
    const best = centreRow ?? globalRow ?? null;

    return res.json({ success: true, data: best });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/commodity-prices — create or update price for a commodity
export const upsertPrice = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as JwtPayload;
    const { commodity, centreId, pricePerKg, notes } = req.body;

    if (!commodity || !pricePerKg)
      return res.status(400).json({ success: false, message: 'commodity and pricePerKg are required.' });

    const cid = centreId ? parseInt(centreId) : null;

    // Check if a price already exists for this commodity + centre combo
    const whereClause = cid
      ? and(eq(commodityPricesTable.commodity, commodity), eq(commodityPricesTable.centreId, cid))
      : and(eq(commodityPricesTable.commodity, commodity), sql`${commodityPricesTable.centreId} is null`);

    const [existing] = await db.select().from(commodityPricesTable).where(whereClause);

    if (existing) {
      const [updated] = await db
        .update(commodityPricesTable)
        .set({
          pricePerKg: parseFloat(pricePerKg),
          notes:      notes ?? existing.notes,
          setBy:      user.userId,
          updatedAt:  new Date().toISOString(),
        })
        .where(eq(commodityPricesTable.id, existing.id))
        .returning();
      return res.json({ success: true, data: updated });
    }

    const [created] = await db.insert(commodityPricesTable).values({
      commodity,
      centreId:   cid,
      pricePerKg: parseFloat(pricePerKg),
      notes:      notes ?? null,
      setBy:      user.userId,
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    }).returning();

    return res.status(201).json({ success: true, data: created });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /api/commodity-prices/:id
export const deletePrice = async (req: Request<{ id: string }>, res: Response) => {
  try {
    await db.delete(commodityPricesTable).where(eq(commodityPricesTable.id, parseInt(req.params.id)));
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
