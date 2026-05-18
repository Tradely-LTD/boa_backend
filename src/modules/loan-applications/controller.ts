import { Request, Response } from 'express';
import { eq, desc, and, sql, SQL } from 'drizzle-orm';
import { db } from '../../db';
import { loanApplicationsTable } from '../../db/schemas/loanApplicationsSchema';
import { warehouseReceiptsTable } from '../../db/schemas/warehouseReceiptsSchema';
import type { JwtPayload } from '../auth/types';

const genRefId = () => {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `LA-${ym}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
};

// GET /api/loan-applications
export const listLoans = async (req: Request, res: Response) => {
  try {
    const page   = parseInt((req.query.page   as string) || '1');
    const limit  = parseInt((req.query.limit  as string) || '20');
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(loanApplicationsTable.status, status as any));
    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(loanApplicationsTable)
      .where(whereClause);

    const rows = await db
      .select()
      .from(loanApplicationsTable)
      .where(whereClause)
      .orderBy(desc(loanApplicationsTable.createdAt))
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

// GET /api/loan-applications/:id
export const getLoan = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(loanApplicationsTable)
      .where(eq(loanApplicationsTable.id, parseInt(req.params.id)));
    if (!row) return res.status(404).json({ success: false, message: 'Loan application not found.' });
    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/loan-applications — creates loan and pledges the receipt
export const createLoan = async (req: Request, res: Response) => {
  try {
    const {
      receiptNumber, loanAmountRequested,
      farmerPhone, farmerNin,
      interestRate, repaymentPeriodMonths, reviewNotes,
    } = req.body;

    if (!receiptNumber || !loanAmountRequested)
      return res.status(400).json({ success: false, message: 'Receipt number and loan amount are required.' });

    // Look up the receipt
    const [receipt] = await db
      .select()
      .from(warehouseReceiptsTable)
      .where(eq(warehouseReceiptsTable.receiptNumber, receiptNumber.toUpperCase()));

    if (!receipt)
      return res.status(404).json({ success: false, message: 'Receipt not found.' });

    if (receipt.status !== 'active')
      return res.status(400).json({
        success: false,
        message: `Receipt is ${receipt.status} — only active receipts can be pledged as collateral.`,
      });

    const now = new Date().toISOString();

    // Create loan application
    const [loan] = await db.insert(loanApplicationsTable).values({
      refId:                 genRefId(),
      receiptId:             receipt.id,
      receiptNumber:         receipt.receiptNumber,
      centreId:              receipt.centreId,
      centreName:            receipt.centreName,
      commodity:             receipt.commodity,
      quantityKg:            receipt.quantityKg,
      farmerName:            receipt.farmerName,
      farmerPhone:           farmerPhone ?? receipt.farmerPhone ?? null,
      farmerNin:             farmerNin   ?? receipt.farmerNin   ?? null,
      loanAmountRequested:   parseFloat(loanAmountRequested),
      interestRate:          interestRate            ? parseFloat(interestRate)           : null,
      repaymentPeriodMonths: repaymentPeriodMonths   ? parseInt(repaymentPeriodMonths)    : null,
      reviewNotes:           reviewNotes ?? null,
      status:                'pending',
      createdAt:             now,
    }).returning();

    // Pledge the receipt — lock it against double-collateralisation
    await db
      .update(warehouseReceiptsTable)
      .set({ status: 'pledged' })
      .where(eq(warehouseReceiptsTable.id, receipt.id));

    return res.status(201).json({ success: true, data: loan });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/loan-applications/public — unauthenticated farmer self-service
export const createLoanPublic = async (req: Request, res: Response) => {
  try {
    const { receiptNumber, loanAmountRequested, farmerPhone, farmerNin } = req.body;

    if (!receiptNumber || !loanAmountRequested)
      return res.status(400).json({ success: false, message: 'Receipt number and loan amount are required.' });

    const [receipt] = await db
      .select()
      .from(warehouseReceiptsTable)
      .where(eq(warehouseReceiptsTable.receiptNumber, receiptNumber.toUpperCase()));

    if (!receipt)
      return res.status(404).json({ success: false, message: 'Receipt not found. Please check the number and try again.' });

    if (receipt.status === 'pledged')
      return res.status(400).json({ success: false, message: 'This receipt is already pledged as collateral for an existing loan.' });

    if (receipt.status !== 'active')
      return res.status(400).json({ success: false, message: `This receipt is ${receipt.status} and cannot be used as collateral.` });

    const now = new Date().toISOString();

    const [loan] = await db.insert(loanApplicationsTable).values({
      refId:               genRefId(),
      receiptId:           receipt.id,
      receiptNumber:       receipt.receiptNumber,
      centreId:            receipt.centreId,
      centreName:          receipt.centreName,
      commodity:           receipt.commodity,
      quantityKg:          receipt.quantityKg,
      farmerName:          receipt.farmerName,
      farmerPhone:         farmerPhone ?? receipt.farmerPhone ?? null,
      farmerNin:           farmerNin   ?? receipt.farmerNin   ?? null,
      loanAmountRequested: parseFloat(loanAmountRequested),
      status:              'pending',
      createdAt:           now,
    }).returning();

    await db
      .update(warehouseReceiptsTable)
      .set({ status: 'pledged' })
      .where(eq(warehouseReceiptsTable.id, receipt.id));

    return res.status(201).json({
      success: true,
      data: {
        refId:         loan.refId,
        farmerName:    loan.farmerName,
        commodity:     loan.commodity,
        quantityKg:    loan.quantityKg,
        centreName:    loan.centreName,
        receiptNumber: loan.receiptNumber,
        loanAmountRequested: loan.loanAmountRequested,
        status:        loan.status,
        createdAt:     loan.createdAt,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error. Please try again.' });
  }
};

// PATCH /api/loan-applications/:id/status
export const updateLoanStatus = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user   = (req as any).user as JwtPayload;
    const { status, loanAmountApproved, interestRate, repaymentPeriodMonths, reviewNotes } = req.body;

    const validStatuses = ['approved', 'disbursed', 'repaid', 'defaulted', 'rejected'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    const [existing] = await db
      .select()
      .from(loanApplicationsTable)
      .where(eq(loanApplicationsTable.id, parseInt(req.params.id)));

    if (!existing)
      return res.status(404).json({ success: false, message: 'Loan application not found.' });

    const now = new Date().toISOString();

    const patch: Partial<typeof existing> = {
      status,
      reviewedBy:  user.userId,
      reviewNotes: reviewNotes ?? existing.reviewNotes,
    };

    if (status === 'approved') {
      patch.loanAmountApproved    = loanAmountApproved    ? parseFloat(loanAmountApproved)    : existing.loanAmountApproved ?? undefined;
      patch.interestRate          = interestRate          ? parseFloat(interestRate)           : existing.interestRate       ?? undefined;
      patch.repaymentPeriodMonths = repaymentPeriodMonths ? parseInt(repaymentPeriodMonths)    : existing.repaymentPeriodMonths ?? undefined;
    }

    if (status === 'disbursed') patch.disbursedAt = now;
    if (status === 'repaid')    patch.repaidAt    = now;

    const [updated] = await db
      .update(loanApplicationsTable)
      .set(patch)
      .where(eq(loanApplicationsTable.id, parseInt(req.params.id)))
      .returning();

    // Update receipt status based on loan outcome
    if (status === 'rejected' || status === 'repaid') {
      // Release the pledge — receipt becomes active again
      await db
        .update(warehouseReceiptsTable)
        .set({ status: 'active' })
        .where(eq(warehouseReceiptsTable.id, existing.receiptId));
    }
    // defaulted → receipt stays pledged (BOA may take possession of goods)

    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
