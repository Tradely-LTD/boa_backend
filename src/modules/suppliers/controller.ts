import { Request, Response } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { suppliersTable } from '../../db/schemas/suppliersSchema';

// GET /api/suppliers
export const listSuppliers = async (req: Request, res: Response) => {
  try {
    const user     = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.query.centreId ? parseInt(req.query.centreId as string) : undefined;
    const page  = parseInt((req.query.page  as string) || '1');
    const limit = parseInt((req.query.limit as string) || '50');
    const offset = (page - 1) * limit;

    const whereClause = centreId ? eq(suppliersTable.centreId, centreId) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(suppliersTable)
      .where(whereClause);

    const rows = await db
      .select()
      .from(suppliersTable)
      .where(whereClause)
      .orderBy(desc(suppliersTable.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json({ success: true, data: rows, total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/suppliers/:id
export const getSupplier = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, parseInt(req.params.id)));

    if (!row) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/suppliers
export const createSupplier = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, phone, email, address, state, lga, supplierType } = req.body;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.body.centreId;

    if (!name) return res.status(400).json({ success: false, message: 'Supplier name is required.' });

    const [row] = await db.insert(suppliersTable).values({
      name,
      phone:        phone ?? null,
      email:        email ?? null,
      address:      address ?? null,
      state:        state ?? null,
      lga:          lga ?? null,
      supplierType: supplierType ?? 'individual',
      centreId:     centreId ?? null,
      isActive:     true,
    }).returning();

    return res.status(201).json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/suppliers/:id
export const updateSupplier = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Supplier not found.' });

    const { name, phone, email, address, state, lga, supplierType, isActive } = req.body;

    const [row] = await db
      .update(suppliersTable)
      .set({
        name:         name          ?? existing.name,
        phone:        phone         ?? existing.phone,
        email:        email         ?? existing.email,
        address:      address       ?? existing.address,
        state:        state         ?? existing.state,
        lga:          lga           ?? existing.lga,
        supplierType: supplierType  ?? existing.supplierType,
        isActive:     isActive      !== undefined ? isActive : existing.isActive,
        updatedAt:    new Date().toISOString(),
      })
      .where(eq(suppliersTable.id, id))
      .returning();

    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /api/suppliers/:id
export const deleteSupplier = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Supplier not found.' });

    await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
