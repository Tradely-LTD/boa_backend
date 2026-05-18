import { Request, Response } from 'express';
import { eq, desc, and, like, sql, SQL } from 'drizzle-orm';
import { db } from '../../db';
import { aggregationCentresTable } from '../../db/schemas/aggregationCentresSchema';
import type { UpdateCentreBody, CentreFilters } from './types';

// GET /api/aggregation-centres
export const listCentres = async (
  req: Request<{}, {}, {}, CentreFilters>,
  res: Response,
) => {
  try {
    const { status, state, search, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(aggregationCentresTable.status, status as any));
    if (state)  conditions.push(eq(aggregationCentresTable.state, state));
    if (search) conditions.push(like(sql`lower(${aggregationCentresTable.centreName})`, `%${search.toLowerCase()}%`));

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(aggregationCentresTable)
      .where(conditions.length ? and(...conditions) : undefined);

    const rows = await db
      .select()
      .from(aggregationCentresTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(aggregationCentresTable.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    return res.json({
      success: true,
      data: rows,
      total: Number(total),
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(Number(total) / limitNum),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/aggregation-centres/:id
export const getCentre = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(aggregationCentresTable)
      .where(eq(aggregationCentresTable.id, parseInt(req.params.id)));

    if (!row) return res.status(404).json({ success: false, message: 'Centre not found.' });

    return res.json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/aggregation-centres/:id
export const updateCentre = async (
  req: Request<{ id: string }, {}, UpdateCentreBody>,
  res: Response,
) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(aggregationCentresTable).where(eq(aggregationCentresTable.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Centre not found.' });

    const [updated] = await db
      .update(aggregationCentresTable)
      .set({ ...req.body, updatedAt: new Date().toISOString() })
      .where(eq(aggregationCentresTable.id, id))
      .returning();

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/aggregation-centres/ref/:refId — public lookup
export const getCentreByRef = async (req: Request<{ refId: string }>, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(aggregationCentresTable)
      .where(eq(aggregationCentresTable.refId, req.params.refId.toUpperCase()));

    if (!row) return res.status(404).json({ success: false, message: 'Centre not found.' });

    return res.json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
