import { Request, Response } from 'express';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../db';
import { commodityIntakesTable } from '../../db/schemas/commodityIntakesSchema';
import { aggregationCentresTable } from '../../db/schemas/aggregationCentresSchema';

const genRef = () => 'CI-' + Math.random().toString(36).substring(2, 9).toUpperCase();

// GET /api/commodity-intake
export const listIntakes = async (req: Request, res: Response) => {
  try {
    const user     = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.query.centreId ? parseInt(req.query.centreId as string) : undefined;
    const page  = parseInt((req.query.page  as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const offset = (page - 1) * limit;

    const whereClause = centreId ? eq(commodityIntakesTable.centreId, centreId) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(commodityIntakesTable)
      .where(whereClause);

    const rows = await db
      .select()
      .from(commodityIntakesTable)
      .where(whereClause)
      .orderBy(desc(commodityIntakesTable.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json({
      success: true,
      data: rows,
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/commodity-intake/:id
export const getIntake = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(commodityIntakesTable)
      .where(eq(commodityIntakesTable.id, parseInt(req.params.id)));

    if (!row) return res.status(404).json({ success: false, message: 'Intake not found.' });
    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/commodity-intake
export const createIntake = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.body.centreId;

    if (!centreId) return res.status(400).json({ success: false, message: 'Centre ID is required.' });

    const [centre] = await db
      .select({ centreName: aggregationCentresTable.centreName })
      .from(aggregationCentresTable)
      .where(eq(aggregationCentresTable.id, centreId));

    if (!centre) return res.status(404).json({ success: false, message: 'Centre not found.' });

    const {
      commodity, quantityKg, gradeQuality,
      farmerName, farmerPhone, farmerNin,
      sourceState, sourceLga,
      sourceType, supplierId, supplierName,
      notes,
    } = req.body;

    if (!commodity || !quantityKg)
      return res.status(400).json({ success: false, message: 'Commodity and quantity are required.' });

    const [row] = await db.insert(commodityIntakesTable).values({
      refId:        genRef(),
      centreId,
      centreName:   centre.centreName,
      commodity,
      quantityKg:   parseFloat(quantityKg),
      gradeQuality: gradeQuality  ?? null,
      sourceType:   sourceType    ?? 'farmer',
      supplierId:   supplierId    ? parseInt(supplierId) : null,
      supplierName: supplierName  ?? null,
      farmerName:   farmerName    ?? null,
      farmerPhone:  farmerPhone   ?? null,
      farmerNin:    farmerNin     ?? null,
      sourceState:  sourceState   ?? null,
      sourceLga:    sourceLga     ?? null,
      notes:        notes         ?? null,
      loggedBy:     user.userId,
      createdAt:    new Date().toISOString(),
    }).returning();

    return res.status(201).json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
