import { Request, Response } from 'express';
import { eq, desc, and, sql, SQL, inArray } from 'drizzle-orm';
import { db } from '../../db';
import { loanApplicationsTable } from '../../db/schemas/loanApplicationsSchema';
import { loanReceiptPledgesTable } from '../../db/schemas/loanReceiptPledgesSchema';
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

    // Attach pledged receipts to each loan
    const loanIds = rows.map(r => r.id);
    const pledges = loanIds.length
      ? await db.select().from(loanReceiptPledgesTable).where(inArray(loanReceiptPledgesTable.loanId, loanIds))
      : [];

    const pledgeMap = new Map<number, typeof pledges>();
    for (const p of pledges) {
      if (!pledgeMap.has(p.loanId)) pledgeMap.set(p.loanId, []);
      pledgeMap.get(p.loanId)!.push(p);
    }

    const data = rows.map(r => ({ ...r, pledgedReceipts: pledgeMap.get(r.id) ?? [] }));

    return res.json({
      success: true, data,
      total: Number(total), page, limit,
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

    const pledges = await db
      .select()
      .from(loanReceiptPledgesTable)
      .where(eq(loanReceiptPledgesTable.loanId, row.id));

    return res.json({ success: true, data: { ...row, pledgedReceipts: pledges } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/loan-applications
// Body: { receiptNumbers: string[], loanAmountRequested, farmerPhone?, farmerNin?, interestRate?, repaymentPeriodMonths?, reviewNotes? }
export const createLoan = async (req: Request, res: Response) => {
  try {
    const {
      receiptNumbers,   // string[] — one or more AHR numbers
      loanAmountRequested,
      farmerPhone, farmerNin,
      interestRate, repaymentPeriodMonths, reviewNotes,
    } = req.body;

    if (!receiptNumbers?.length || !loanAmountRequested)
      return res.status(400).json({ success: false, message: 'At least one receipt number and loan amount are required.' });

    const numbers: string[] = (Array.isArray(receiptNumbers) ? receiptNumbers : [receiptNumbers])
      .map((n: string) => n.toUpperCase());

    // Fetch all receipts
    const receipts = await db
      .select()
      .from(warehouseReceiptsTable)
      .where(inArray(warehouseReceiptsTable.receiptNumber, numbers));

    if (receipts.length !== numbers.length) {
      const found = receipts.map(r => r.receiptNumber);
      const missing = numbers.filter(n => !found.includes(n));
      return res.status(404).json({ success: false, message: `Receipt(s) not found: ${missing.join(', ')}` });
    }

    for (const r of receipts) {
      if (r.status !== 'active')
        return res.status(400).json({
          success: false,
          message: `Receipt ${r.receiptNumber} is ${r.status} — only active receipts can be pledged.`,
        });
    }

    const primary = receipts[0];
    const totalQty = receipts.reduce((s, r) => s + r.quantityKg, 0);
    const now = new Date().toISOString();

    // Create loan
    const [loan] = await db.insert(loanApplicationsTable).values({
      refId:                 genRefId(),
      receiptId:             primary.id,
      receiptNumber:         primary.receiptNumber,
      receiptCount:          receipts.length,
      centreId:              primary.centreId,
      centreName:            primary.centreName,
      commodity:             primary.commodity,
      quantityKg:            totalQty,
      farmerName:            primary.farmerName,
      farmerPhone:           farmerPhone ?? primary.farmerPhone ?? null,
      farmerNin:             farmerNin   ?? primary.farmerNin   ?? null,
      loanAmountRequested:   parseFloat(loanAmountRequested),
      interestRate:          interestRate          ? parseFloat(interestRate)          : null,
      repaymentPeriodMonths: repaymentPeriodMonths ? parseInt(repaymentPeriodMonths)   : null,
      reviewNotes:           reviewNotes ?? null,
      status:                'pending',
      createdAt:             now,
    }).returning();

    // Insert pledge rows for ALL receipts
    await db.insert(loanReceiptPledgesTable).values(
      receipts.map(r => ({
        loanId:        loan.id,
        receiptId:     r.id,
        receiptNumber: r.receiptNumber,
        commodity:     r.commodity,
        quantityKg:    r.quantityKg,
        createdAt:     now,
      }))
    );

    // Pledge all receipts
    await db
      .update(warehouseReceiptsTable)
      .set({ status: 'pledged' })
      .where(inArray(warehouseReceiptsTable.id, receipts.map(r => r.id)));

    const pledges = await db.select().from(loanReceiptPledgesTable).where(eq(loanReceiptPledgesTable.loanId, loan.id));
    return res.status(201).json({ success: true, data: { ...loan, pledgedReceipts: pledges } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/loan-applications/public — unauthenticated farmer self-service
export const createLoanPublic = async (req: Request, res: Response) => {
  try {
    const { receiptNumbers, receiptNumber: singleReceipt, loanAmountRequested, farmerPhone, farmerNin } = req.body;

    const numbers: string[] = (
      Array.isArray(receiptNumbers) ? receiptNumbers :
      receiptNumbers ? [receiptNumbers] :
      singleReceipt ? [singleReceipt] : []
    ).map((n: string) => n.toUpperCase());

    if (!numbers.length || !loanAmountRequested)
      return res.status(400).json({ success: false, message: 'Receipt number and loan amount are required.' });

    const receipts = await db
      .select()
      .from(warehouseReceiptsTable)
      .where(inArray(warehouseReceiptsTable.receiptNumber, numbers));

    if (receipts.length !== numbers.length) {
      const found = receipts.map(r => r.receiptNumber);
      const missing = numbers.filter(n => !found.includes(n));
      return res.status(404).json({ success: false, message: `Receipt(s) not found: ${missing.join(', ')}. Please check the numbers and try again.` });
    }

    for (const r of receipts) {
      if (r.status === 'pledged')
        return res.status(400).json({ success: false, message: `Receipt ${r.receiptNumber} is already pledged as collateral for an existing loan.` });
      if (r.status !== 'active')
        return res.status(400).json({ success: false, message: `Receipt ${r.receiptNumber} is ${r.status} and cannot be used as collateral.` });
    }

    const primary  = receipts[0];
    const totalQty = receipts.reduce((s, r) => s + r.quantityKg, 0);
    const now = new Date().toISOString();

    const [loan] = await db.insert(loanApplicationsTable).values({
      refId:               genRefId(),
      receiptId:           primary.id,
      receiptNumber:       primary.receiptNumber,
      receiptCount:        receipts.length,
      centreId:            primary.centreId,
      centreName:          primary.centreName,
      commodity:           primary.commodity,
      quantityKg:          totalQty,
      farmerName:          primary.farmerName,
      farmerPhone:         farmerPhone ?? primary.farmerPhone ?? null,
      farmerNin:           farmerNin   ?? primary.farmerNin   ?? null,
      loanAmountRequested: parseFloat(loanAmountRequested),
      status:              'pending',
      createdAt:           now,
    }).returning();

    await db.insert(loanReceiptPledgesTable).values(
      receipts.map(r => ({
        loanId:        loan.id,
        receiptId:     r.id,
        receiptNumber: r.receiptNumber,
        commodity:     r.commodity,
        quantityKg:    r.quantityKg,
        createdAt:     now,
      }))
    );

    await db
      .update(warehouseReceiptsTable)
      .set({ status: 'pledged' })
      .where(inArray(warehouseReceiptsTable.id, receipts.map(r => r.id)));

    return res.status(201).json({
      success: true,
      data: {
        refId:               loan.refId,
        farmerName:          loan.farmerName,
        commodity:           loan.commodity,
        quantityKg:          loan.quantityKg,
        receiptCount:        loan.receiptCount,
        receiptNumbers:      receipts.map(r => r.receiptNumber),
        centreName:          loan.centreName,
        loanAmountRequested: loan.loanAmountRequested,
        status:              loan.status,
        createdAt:           loan.createdAt,
      },
    });
  } catch (err: any) {
    console.error('[loan-public] createLoanPublic error:', err?.message ?? err);
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

    // On repaid or rejected: release ALL pledged receipts
    if (status === 'rejected' || status === 'repaid') {
      const pledges = await db
        .select()
        .from(loanReceiptPledgesTable)
        .where(eq(loanReceiptPledgesTable.loanId, existing.id));

      const receiptIds = pledges.map(p => p.receiptId);
      if (receiptIds.length) {
        await db
          .update(warehouseReceiptsTable)
          .set({ status: 'active' })
          .where(inArray(warehouseReceiptsTable.id, receiptIds));
      }
    }

    const pledges = await db.select().from(loanReceiptPledgesTable).where(eq(loanReceiptPledgesTable.loanId, existing.id));
    return res.json({ success: true, data: { ...updated, pledgedReceipts: pledges } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
