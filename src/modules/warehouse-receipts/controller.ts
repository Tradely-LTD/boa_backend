import { Request, Response } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { warehouseReceiptsTable } from '../../db/schemas/warehouseReceiptsSchema';
import { commodityIntakesTable } from '../../db/schemas/commodityIntakesSchema';
import { aggregationCentresTable } from '../../db/schemas/aggregationCentresSchema';
import { loanApplicationsTable } from '../../db/schemas/loanApplicationsSchema';

const genReceiptNumber = () => {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `WR-${ym}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
};

// GET /api/warehouse-receipts
export const listReceipts = async (req: Request, res: Response) => {
  try {
    const user     = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.query.centreId ? parseInt(req.query.centreId as string) : undefined;
    const page  = parseInt((req.query.page  as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const offset = (page - 1) * limit;

    const whereClause = centreId ? eq(warehouseReceiptsTable.centreId, centreId) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(warehouseReceiptsTable)
      .where(whereClause);

    const rows = await db
      .select()
      .from(warehouseReceiptsTable)
      .where(whereClause)
      .orderBy(desc(warehouseReceiptsTable.createdAt))
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

// GET /api/warehouse-receipts/:id
export const getReceipt = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(warehouseReceiptsTable)
      .where(eq(warehouseReceiptsTable.id, parseInt(req.params.id)));

    if (!row) return res.status(404).json({ success: false, message: 'Receipt not found.' });
    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/warehouse-receipts — generate from an intake or manually
export const createReceipt = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.body.centreId;

    if (!centreId) return res.status(400).json({ success: false, message: 'Centre ID is required.' });

    const [centre] = await db
      .select({ centreName: aggregationCentresTable.centreName })
      .from(aggregationCentresTable)
      .where(eq(aggregationCentresTable.id, centreId));

    if (!centre) return res.status(404).json({ success: false, message: 'Centre not found.' });

    const { intakeId, commodity, quantityKg, gradeQuality, farmerName, farmerPhone, farmerNin, expiresAt, notes } = req.body;

    // If intakeId provided, prefill from intake
    let resolvedCommodity   = commodity;
    let resolvedQuantityKg  = quantityKg;
    let resolvedGrade       = gradeQuality;
    let resolvedFarmerName  = farmerName;
    let resolvedFarmerPhone = farmerPhone;
    let resolvedFarmerNin   = farmerNin;

    if (intakeId) {
      const [intake] = await db
        .select()
        .from(commodityIntakesTable)
        .where(eq(commodityIntakesTable.id, parseInt(intakeId)));
      if (intake) {
        resolvedCommodity   = resolvedCommodity   ?? intake.commodity;
        resolvedQuantityKg  = resolvedQuantityKg  ?? intake.quantityKg;
        resolvedGrade       = resolvedGrade       ?? intake.gradeQuality;
        resolvedFarmerName  = resolvedFarmerName  ?? intake.farmerName;
        resolvedFarmerPhone = resolvedFarmerPhone ?? intake.farmerPhone;
        resolvedFarmerNin   = resolvedFarmerNin   ?? intake.farmerNin;
      }
    }

    if (!resolvedCommodity || !resolvedQuantityKg || !resolvedFarmerName)
      return res.status(400).json({ success: false, message: 'Commodity, quantity, and farmer name are required.' });

    const now = new Date().toISOString();

    const [row] = await db.insert(warehouseReceiptsTable).values({
      receiptNumber: genReceiptNumber(),
      centreId,
      centreName:    centre.centreName,
      intakeId:      intakeId ? parseInt(intakeId) : null,
      commodity:     resolvedCommodity,
      quantityKg:    parseFloat(resolvedQuantityKg),
      gradeQuality:  resolvedGrade ?? null,
      farmerName:    resolvedFarmerName,
      farmerPhone:   resolvedFarmerPhone ?? null,
      farmerNin:     resolvedFarmerNin ?? null,
      issuedBy:      user.userId,
      issuedAt:      now,
      expiresAt:     expiresAt ?? null,
      notes:         notes ?? null,
      createdAt:     now,
    }).returning();

    return res.status(201).json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/warehouse-receipts/verify/:receiptNumber — public
export const verifyReceipt = async (req: Request<{ receiptNumber: string }>, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(warehouseReceiptsTable)
      .where(eq(warehouseReceiptsTable.receiptNumber, req.params.receiptNumber.toUpperCase()));

    if (!row) return res.status(404).json({ success: false, message: 'Receipt not found. It may be invalid or the number is incorrect.' });

    // If pledged, include the loan application status so the public page can show a meaningful message
    let loanRef: string | null = null;
    let loanStatus: string | null = null;

    if (row.status === 'pledged') {
      const [loan] = await db
        .select({ refId: loanApplicationsTable.refId, status: loanApplicationsTable.status })
        .from(loanApplicationsTable)
        .where(eq(loanApplicationsTable.receiptId, row.id))
        .orderBy(desc(loanApplicationsTable.createdAt))
        .limit(1);
      loanRef    = loan?.refId    ?? null;
      loanStatus = loan?.status   ?? null;
    }

    return res.json({
      success: true,
      data: {
        receiptNumber: row.receiptNumber,
        centreName:    row.centreName,
        commodity:     row.commodity,
        quantityKg:    row.quantityKg,
        gradeQuality:  row.gradeQuality,
        farmerName:    row.farmerName,
        issuedAt:      row.issuedAt,
        expiresAt:     row.expiresAt,
        status:        row.status,
        loanRef,
        loanStatus,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/warehouse-receipts/:id/status
export const updateReceiptStatus = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { status } = req.body;
    if (!['active', 'pledged', 'redeemed', 'expired'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    const [row] = await db
      .update(warehouseReceiptsTable)
      .set({ status })
      .where(eq(warehouseReceiptsTable.id, parseInt(req.params.id)))
      .returning();

    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
