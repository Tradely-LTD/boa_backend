import { Request, Response } from 'express';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../db';
import { inventorySalesTable } from '../../db/schemas/inventorySalesSchema';
import { commodityIntakesTable } from '../../db/schemas/commodityIntakesSchema';

const genRef = () => 'IS-' + Math.random().toString(36).substring(2, 9).toUpperCase();
const genReceiptNumber = () => 'ISR-' + Date.now().toString(36).toUpperCase();

// GET /api/inventory
export const getInventoryOverview = async (req: Request, res: Response) => {
  try {
    const user     = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.query.centreId ? parseInt(req.query.centreId as string) : undefined;

    const whereClause = centreId ? eq(commodityIntakesTable.centreId, centreId) : undefined;

    const intakeRows = await db
      .select({
        centreId:   commodityIntakesTable.centreId,
        centreName: commodityIntakesTable.centreName,
        commodity:  commodityIntakesTable.commodity,
        totalReceived: sql<number>`sum(${commodityIntakesTable.quantityKg})`,
        intakeCount:   sql<number>`count(*)`,
      })
      .from(commodityIntakesTable)
      .where(whereClause)
      .groupBy(commodityIntakesTable.centreId, commodityIntakesTable.commodity);

    const salesWhere = centreId ? eq(inventorySalesTable.centreId, centreId) : undefined;

    const salesRows = await db
      .select({
        centreId:   inventorySalesTable.centreId,
        commodity:  inventorySalesTable.commodity,
        totalSold:  sql<number>`sum(${inventorySalesTable.quantityKg})`,
      })
      .from(inventorySalesTable)
      .where(salesWhere)
      .groupBy(inventorySalesTable.centreId, inventorySalesTable.commodity);

    const salesMap = new Map<string, number>();
    for (const s of salesRows) {
      salesMap.set(`${s.centreId}:${s.commodity}`, Number(s.totalSold));
    }

    const overview = intakeRows.map(row => {
      const totalReceived = Number(row.totalReceived);
      const totalSold     = salesMap.get(`${row.centreId}:${row.commodity}`) ?? 0;
      return {
        centreId:      row.centreId,
        centreName:    row.centreName,
        commodity:     row.commodity,
        totalReceivedKg: totalReceived,
        totalSoldKg:     totalSold,
        availableKg:     totalReceived - totalSold,
        intakeCount:   Number(row.intakeCount),
      };
    });

    return res.json({ success: true, data: overview });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/inventory/intakes-for-centre — list intakes with remaining stock for POS modal
export const getIntakesWithStock = async (req: Request, res: Response) => {
  try {
    const user     = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.query.centreId ? parseInt(req.query.centreId as string) : undefined;

    if (!centreId) return res.status(400).json({ success: false, message: 'centreId is required.' });

    const intakes = await db
      .select()
      .from(commodityIntakesTable)
      .where(eq(commodityIntakesTable.centreId, centreId))
      .orderBy(desc(commodityIntakesTable.createdAt));

    const soldRows = await db
      .select({
        intakeId:  inventorySalesTable.intakeId,
        totalSold: sql<number>`sum(${inventorySalesTable.quantityKg})`,
      })
      .from(inventorySalesTable)
      .where(eq(inventorySalesTable.centreId, centreId))
      .groupBy(inventorySalesTable.intakeId);

    const soldMap = new Map<number, number>();
    for (const s of soldRows) soldMap.set(s.intakeId, Number(s.totalSold));

    const result = intakes.map(i => ({
      ...i,
      soldKg:      soldMap.get(i.id) ?? 0,
      availableKg: i.quantityKg - (soldMap.get(i.id) ?? 0),
    })).filter(i => i.availableKg > 0);

    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/inventory/pos-sales
export const listPosSales = async (req: Request, res: Response) => {
  try {
    const user     = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.query.centreId ? parseInt(req.query.centreId as string) : undefined;
    const page  = parseInt((req.query.page  as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const offset = (page - 1) * limit;

    const whereClause = centreId ? eq(inventorySalesTable.centreId, centreId) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(inventorySalesTable)
      .where(whereClause);

    const rows = await db
      .select()
      .from(inventorySalesTable)
      .where(whereClause)
      .orderBy(desc(inventorySalesTable.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json({ success: true, data: rows, total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/inventory/pos-sales/:id
export const getPosSale = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(inventorySalesTable)
      .where(eq(inventorySalesTable.id, parseInt(req.params.id)));

    if (!row) return res.status(404).json({ success: false, message: 'Sale not found.' });
    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/inventory/pos-sales
export const createPosSale = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.body.centreId;

    if (!centreId) return res.status(400).json({ success: false, message: 'Centre ID is required.' });

    const { intakeId, quantityKg, pricePerKg, buyerName, buyerPhone, paymentMethod, notes } = req.body;

    if (!intakeId || !quantityKg || !pricePerKg)
      return res.status(400).json({ success: false, message: 'intakeId, quantityKg and pricePerKg are required.' });

    const [intake] = await db
      .select()
      .from(commodityIntakesTable)
      .where(and(eq(commodityIntakesTable.id, parseInt(intakeId)), eq(commodityIntakesTable.centreId, centreId)));

    if (!intake) return res.status(404).json({ success: false, message: 'Intake not found at this centre.' });

    const [{ soldSoFar }] = await db
      .select({ soldSoFar: sql<number>`coalesce(sum(${inventorySalesTable.quantityKg}), 0)` })
      .from(inventorySalesTable)
      .where(eq(inventorySalesTable.intakeId, parseInt(intakeId)));

    const available = intake.quantityKg - Number(soldSoFar);
    if (parseFloat(quantityKg) > available)
      return res.status(400).json({ success: false, message: `Only ${available}kg available from this intake.` });

    const qty   = parseFloat(quantityKg);
    const price = parseFloat(pricePerKg);

    const [row] = await db.insert(inventorySalesTable).values({
      refId:         genRef(),
      centreId,
      centreName:    intake.centreName,
      intakeId:      parseInt(intakeId),
      commodity:     intake.commodity,
      quantityKg:    qty,
      pricePerKg:    price,
      totalAmount:   qty * price,
      buyerName:     buyerName ?? null,
      buyerPhone:    buyerPhone ?? null,
      paymentMethod: paymentMethod ?? 'cash',
      receiptNumber: genReceiptNumber(),
      soldBy:        user.userId,
      notes:         notes ?? null,
      createdAt:     new Date().toISOString(),
    }).returning();

    return res.status(201).json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
