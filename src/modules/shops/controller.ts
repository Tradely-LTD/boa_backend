import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../../db';
import { shopsTable, shopIntakesTable, shopSalesTable, shopExpensesTable } from '../../db/schemas/shopsSchema';
import { usersTable } from '../../db/schemas/usersSchema';
import type { JwtPayload } from '../auth/types';

const genShopRef  = (centreId: number) => `SHP-${String(centreId).padStart(2, '0')}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
const genRef      = (prefix: string) => `${prefix}-` + Math.random().toString(36).substring(2, 9).toUpperCase();
const genReceipt  = () => 'SR-' + Date.now().toString(36).toUpperCase();

// ── SHOP CRUD ──────────────────────────────────────────────────────────────────

// GET /api/shops — centre_manager sees their centre's shops; admin/super_admin sees all
export const listShops = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as JwtPayload;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.query.centreId ? parseInt(req.query.centreId as string) : undefined;

    const rows = await db
      .select()
      .from(shopsTable)
      .where(centreId ? eq(shopsTable.centreId, centreId) : undefined)
      .orderBy(desc(shopsTable.createdAt));

    return res.json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/shops/:id
export const getShop = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = (req as any).user as JwtPayload;
    const shopId = parseInt(req.params.id);

    // shop_owner can only see their own shop
    if (user.role === 'shop_owner' && user.shopId !== shopId)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const [row] = await db.select().from(shopsTable).where(eq(shopsTable.id, shopId));
    if (!row) return res.status(404).json({ success: false, message: 'Shop not found.' });

    // Fetch staff (shop_owner + sales_rep) for this shop
    const staff = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, isActive: usersTable.isActive })
      .from(usersTable)
      .where(and(eq(usersTable.shopId, shopId), inArray(usersTable.role, ['shop_owner', 'sales_rep'])));

    return res.json({ success: true, data: { ...row, staff } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/shops — centre_manager or admin creates a shop
export const createShop = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as JwtPayload;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.body.centreId ? parseInt(req.body.centreId) : null;

    if (!centreId) return res.status(400).json({ success: false, message: 'centreId is required.' });

    const { shopName, ownerName, ownerPhone, ownerNin, businessType, spaceNumber,
            ownerEmail, ownerPassword } = req.body;

    if (!shopName || !ownerName || !ownerPhone)
      return res.status(400).json({ success: false, message: 'shopName, ownerName and ownerPhone are required.' });

    const now = new Date().toISOString();
    const shopRefId = genShopRef(centreId);

    // Create the shop
    const [shop] = await db.insert(shopsTable).values({
      shopRefId, centreId,
      shopName, ownerName, ownerPhone,
      ownerNin:     ownerNin     ?? null,
      businessType: businessType ?? null,
      spaceNumber:  spaceNumber  ?? null,
      createdBy:    user.userId,
      createdAt:    now, updatedAt: now,
    }).returning();

    // If owner email + password provided, create shop_owner user account
    let ownerUser = null;
    if (ownerEmail && ownerPassword) {
      const passwordHash = await bcrypt.hash(ownerPassword, 12);
      const [created] = await db.insert(usersTable).values({
        email:        ownerEmail,
        passwordHash,
        name:         ownerName,
        role:         'shop_owner',
        centreId,
        shopId:       shop.id,
        isActive:     true,
        createdAt:    now, updatedAt: now,
      }).returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role });
      ownerUser = created;
    }

    return res.status(201).json({ success: true, data: { ...shop, ownerUser } });
  } catch (err: any) {
    if (err?.code === '23505') return res.status(409).json({ success: false, message: 'Email already registered.' });
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/shops/:id/status — suspend or re-activate
export const updateShopStatus = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    const [updated] = await db
      .update(shopsTable)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(shopsTable.id, parseInt(req.params.id)))
      .returning();

    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── SALES REP MANAGEMENT ──────────────────────────────────────────────────────

// POST /api/shops/:id/staff — shop_owner or manager creates a sales_rep
export const addStaff = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user   = (req as any).user as JwtPayload;
    const shopId = parseInt(req.params.id);

    if (user.role === 'shop_owner' && user.shopId !== shopId)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const [shop] = await db.select({ centreId: shopsTable.centreId }).from(shopsTable).where(eq(shopsTable.id, shopId));
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });

    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'name, email and password are required.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    const [salesRep] = await db.insert(usersTable).values({
      name, email, passwordHash,
      role:      'sales_rep',
      centreId:  shop.centreId,
      shopId,
      isActive:  true,
      createdAt: now, updatedAt: now,
    }).returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, isActive: usersTable.isActive });

    return res.status(201).json({ success: true, data: salesRep });
  } catch (err: any) {
    if (err?.code === '23505') return res.status(409).json({ success: false, message: 'Email already registered.' });
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── SHOP INVENTORY ────────────────────────────────────────────────────────────

// GET /api/shops/:id/inventory
export const getShopInventory = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user   = (req as any).user as JwtPayload;
    const shopId = parseInt(req.params.id);

    if (user.role === 'shop_owner' && user.shopId !== shopId)
      return res.status(403).json({ success: false, message: 'Access denied.' });
    if (user.role === 'sales_rep' && user.shopId !== shopId)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const intakes = await db.select().from(shopIntakesTable).where(eq(shopIntakesTable.shopId, shopId)).orderBy(desc(shopIntakesTable.createdAt));
    const salesRows = await db
      .select({ intakeId: shopSalesTable.intakeId, totalSold: sql<string>`sum(cast(${shopSalesTable.quantityKg} as float))` })
      .from(shopSalesTable)
      .where(eq(shopSalesTable.shopId, shopId))
      .groupBy(shopSalesTable.intakeId);

    const soldMap = new Map<number, number>();
    for (const s of salesRows) { if (s.intakeId) soldMap.set(s.intakeId, parseFloat(s.totalSold)); }

    const inventory = intakes.map(i => ({
      ...i,
      soldKg:      soldMap.get(i.id) ?? 0,
      availableKg: parseFloat(i.quantityKg) - (soldMap.get(i.id) ?? 0),
    }));

    return res.json({ success: true, data: inventory });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/shops/:id/inventory
export const createShopIntake = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user   = (req as any).user as JwtPayload;
    const shopId = parseInt(req.params.id);

    if (user.role === 'shop_owner' && user.shopId !== shopId)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, shopId));
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });

    const { commodity, quantityKg, gradeQuality, sourceType, notes } = req.body;
    if (!commodity || !quantityKg)
      return res.status(400).json({ success: false, message: 'commodity and quantityKg are required.' });

    const [row] = await db.insert(shopIntakesTable).values({
      refId:        genRef('SI'),
      shopId,
      centreId:     shop.centreId,
      commodity,
      quantityKg:   String(parseFloat(quantityKg)),
      gradeQuality: gradeQuality ?? null,
      sourceType:   sourceType   ?? 'purchase',
      notes:        notes        ?? null,
      loggedBy:     user.userId,
      createdAt:    new Date().toISOString(),
    }).returning();

    return res.status(201).json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── SHOP SALES ────────────────────────────────────────────────────────────────

// GET /api/shops/:id/sales
export const listShopSales = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user   = (req as any).user as JwtPayload;
    const shopId = parseInt(req.params.id);

    if (['shop_owner', 'sales_rep'].includes(user.role) && user.shopId !== shopId)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const rows = await db.select().from(shopSalesTable).where(eq(shopSalesTable.shopId, shopId)).orderBy(desc(shopSalesTable.createdAt));
    return res.json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/shops/:id/sales
export const createShopSale = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user   = (req as any).user as JwtPayload;
    const shopId = parseInt(req.params.id);

    if (['shop_owner', 'sales_rep'].includes(user.role) && user.shopId !== shopId)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, shopId));
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });

    const { intakeId, commodity, quantityKg, pricePerKg, buyerName, buyerPhone, paymentMethod, notes } = req.body;
    if (!commodity || !quantityKg || !pricePerKg)
      return res.status(400).json({ success: false, message: 'commodity, quantityKg and pricePerKg are required.' });

    const qty   = parseFloat(quantityKg);
    const price = parseFloat(pricePerKg);

    // If intakeId provided, verify stock
    if (intakeId) {
      const [intake] = await db.select().from(shopIntakesTable)
        .where(and(eq(shopIntakesTable.id, parseInt(intakeId)), eq(shopIntakesTable.shopId, shopId)));
      if (!intake) return res.status(404).json({ success: false, message: 'Intake not found for this shop.' });

      const [{ soldSoFar }] = await db
        .select({ soldSoFar: sql<string>`coalesce(sum(cast(${shopSalesTable.quantityKg} as float)), 0)` })
        .from(shopSalesTable)
        .where(eq(shopSalesTable.intakeId, parseInt(intakeId)));

      const available = parseFloat(intake.quantityKg) - parseFloat(soldSoFar);
      if (qty > available)
        return res.status(400).json({ success: false, message: `Only ${available} kg available from this intake.` });
    }

    const [row] = await db.insert(shopSalesTable).values({
      refId:         genRef('SS'),
      shopId,
      centreId:      shop.centreId,
      intakeId:      intakeId ? parseInt(intakeId) : null,
      commodity,
      quantityKg:    String(qty),
      pricePerKg:    String(price),
      totalAmount:   String(qty * price),
      buyerName:     buyerName     ?? null,
      buyerPhone:    buyerPhone    ?? null,
      paymentMethod: paymentMethod ?? 'cash',
      receiptNumber: genReceipt(),
      soldBy:        user.userId,
      notes:         notes ?? null,
      createdAt:     new Date().toISOString(),
    }).returning();

    return res.status(201).json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── SHOP EXPENSES ─────────────────────────────────────────────────────────────

// GET /api/shops/:id/expenses
export const listShopExpenses = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user   = (req as any).user as JwtPayload;
    const shopId = parseInt(req.params.id);
    if (['shop_owner', 'sales_rep'].includes(user.role) && user.shopId !== shopId)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const rows = await db.select().from(shopExpensesTable).where(eq(shopExpensesTable.shopId, shopId)).orderBy(desc(shopExpensesTable.createdAt));
    return res.json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/shops/:id/expenses
export const createShopExpense = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user   = (req as any).user as JwtPayload;
    const shopId = parseInt(req.params.id);
    if (['shop_owner', 'sales_rep'].includes(user.role) && user.shopId !== shopId)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, shopId));
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found.' });

    const { category, description, amount } = req.body;
    if (!category || !amount)
      return res.status(400).json({ success: false, message: 'category and amount are required.' });

    const [row] = await db.insert(shopExpensesTable).values({
      refId:       genRef('SE'),
      shopId,
      centreId:    shop.centreId,
      category,
      description: description ?? null,
      amount:      String(parseFloat(amount)),
      loggedBy:    user.userId,
      createdAt:   new Date().toISOString(),
    }).returning();

    return res.status(201).json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
