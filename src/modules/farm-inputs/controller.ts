import { Request, Response } from 'express';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../db';
import { farmInputsTable } from '../../db/schemas/farmInputsSchema';
import { farmInputSalesTable } from '../../db/schemas/farmInputSalesSchema';
import { suppliersTable } from '../../db/schemas/suppliersSchema';
import { aggregationCentresTable } from '../../db/schemas/aggregationCentresSchema';

const genInputRef = () => 'FI-' + Math.random().toString(36).substring(2, 9).toUpperCase();
const genSaleRef  = () => 'FS-' + Math.random().toString(36).substring(2, 9).toUpperCase();
const genReceiptNumber = () => 'FIR-' + Date.now().toString(36).toUpperCase();

// GET /api/farm-inputs
export const listInputs = async (req: Request, res: Response) => {
  try {
    const user      = (req as any).user;
    const centreId  = user.role === 'centre_manager' ? user.centreId : req.query.centreId ? parseInt(req.query.centreId as string) : undefined;
    const inputType = req.query.inputType as string | undefined;
    const page  = parseInt((req.query.page  as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const offset = (page - 1) * limit;

    const conditions = [];
    if (centreId)  conditions.push(eq(farmInputsTable.centreId, centreId));
    if (inputType) conditions.push(eq(farmInputsTable.inputType, inputType as any));
    const whereClause = conditions.length ? and(...conditions as [any, ...any[]]) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(farmInputsTable)
      .where(whereClause);

    const rows = await db
      .select()
      .from(farmInputsTable)
      .where(whereClause)
      .orderBy(desc(farmInputsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json({ success: true, data: rows, total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/farm-inputs/:id
export const getInput = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(farmInputsTable)
      .where(eq(farmInputsTable.id, parseInt(req.params.id)));

    if (!row) return res.status(404).json({ success: false, message: 'Farm input not found.' });
    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/farm-inputs
export const createInput = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.body.centreId;

    if (!centreId) return res.status(400).json({ success: false, message: 'Centre ID is required.' });

    const [centre] = await db
      .select({ centreName: aggregationCentresTable.centreName })
      .from(aggregationCentresTable)
      .where(eq(aggregationCentresTable.id, centreId));

    if (!centre) return res.status(404).json({ success: false, message: 'Centre not found.' });

    const { supplierId, inputType, inputName, brand, unit, quantityReceived, purchasePricePerUnit, sellingPricePerUnit, notes } = req.body;

    if (!inputType || !inputName || !quantityReceived)
      return res.status(400).json({ success: false, message: 'inputType, inputName, and quantityReceived are required.' });

    let supplierName: string | null = null;
    if (supplierId) {
      const [supplier] = await db.select({ name: suppliersTable.name }).from(suppliersTable).where(eq(suppliersTable.id, parseInt(supplierId)));
      supplierName = supplier?.name ?? null;
    }

    const qty = parseFloat(quantityReceived);

    const [row] = await db.insert(farmInputsTable).values({
      refId:                genInputRef(),
      centreId,
      centreName:           centre.centreName,
      supplierId:           supplierId ? parseInt(supplierId) : null,
      supplierName,
      inputType,
      inputName,
      brand:                brand ?? null,
      unit:                 unit ?? 'kg',
      quantityReceived:     qty,
      quantityAvailable:    qty,
      quantitySold:         0,
      purchasePricePerUnit: purchasePricePerUnit ? parseFloat(purchasePricePerUnit) : null,
      sellingPricePerUnit:  sellingPricePerUnit  ? parseFloat(sellingPricePerUnit)  : null,
      receivedBy:           user.userId,
      receivedAt:           new Date().toISOString(),
      notes:                notes ?? null,
    }).returning();

    return res.status(201).json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/farm-inputs/:id
export const updateInput = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(farmInputsTable).where(eq(farmInputsTable.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Farm input not found.' });

    const { inputName, brand, sellingPricePerUnit, purchasePricePerUnit, notes } = req.body;

    const [row] = await db
      .update(farmInputsTable)
      .set({
        inputName:            inputName            ?? existing.inputName,
        brand:                brand                ?? existing.brand,
        sellingPricePerUnit:  sellingPricePerUnit  ? parseFloat(sellingPricePerUnit)  : existing.sellingPricePerUnit,
        purchasePricePerUnit: purchasePricePerUnit ? parseFloat(purchasePricePerUnit) : existing.purchasePricePerUnit,
        notes:                notes                ?? existing.notes,
        updatedAt:            new Date().toISOString(),
      })
      .where(eq(farmInputsTable.id, id))
      .returning();

    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /api/farm-inputs/:id
export const deleteInput = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(farmInputsTable).where(eq(farmInputsTable.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Farm input not found.' });

    await db.delete(farmInputsTable).where(eq(farmInputsTable.id, id));
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/farm-inputs/sales
export const listInputSales = async (req: Request, res: Response) => {
  try {
    const user     = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.query.centreId ? parseInt(req.query.centreId as string) : undefined;
    const page  = parseInt((req.query.page  as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const offset = (page - 1) * limit;

    const whereClause = centreId ? eq(farmInputSalesTable.centreId, centreId) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(farmInputSalesTable)
      .where(whereClause);

    const rows = await db
      .select()
      .from(farmInputSalesTable)
      .where(whereClause)
      .orderBy(desc(farmInputSalesTable.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json({ success: true, data: rows, total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/farm-inputs/sales
export const createInputSale = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.body.centreId;

    if (!centreId) return res.status(400).json({ success: false, message: 'Centre ID is required.' });

    const { inputId, quantitySold, pricePerUnit, buyerName, buyerPhone, buyerNin, paymentMethod, notes } = req.body;

    if (!inputId || !quantitySold || !pricePerUnit)
      return res.status(400).json({ success: false, message: 'inputId, quantitySold and pricePerUnit are required.' });

    const [input] = await db
      .select()
      .from(farmInputsTable)
      .where(and(eq(farmInputsTable.id, parseInt(inputId)), eq(farmInputsTable.centreId, centreId)));

    if (!input) return res.status(404).json({ success: false, message: 'Farm input not found at this centre.' });

    const qty = parseFloat(quantitySold);

    if (qty > input.quantityAvailable)
      return res.status(400).json({ success: false, message: `Only ${input.quantityAvailable} ${input.unit} available.` });

    const price = parseFloat(pricePerUnit);

    const [saleRow] = await db.insert(farmInputSalesTable).values({
      refId:         genSaleRef(),
      centreId,
      centreName:    input.centreName,
      inputId:       parseInt(inputId),
      inputName:     input.inputName,
      inputType:     input.inputType,
      quantitySold:  qty,
      unit:          input.unit,
      pricePerUnit:  price,
      totalAmount:   qty * price,
      buyerName:     buyerName  ?? null,
      buyerPhone:    buyerPhone ?? null,
      buyerNin:      buyerNin   ?? null,
      paymentMethod: paymentMethod ?? 'cash',
      receiptNumber: genReceiptNumber(),
      soldBy:        user.userId,
      notes:         notes ?? null,
      createdAt:     new Date().toISOString(),
    }).returning();

    await db
      .update(farmInputsTable)
      .set({
        quantityAvailable: input.quantityAvailable - qty,
        quantitySold:      input.quantitySold + qty,
        updatedAt:         new Date().toISOString(),
      })
      .where(eq(farmInputsTable.id, parseInt(inputId)));

    return res.status(201).json({ success: true, data: saleRow });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
