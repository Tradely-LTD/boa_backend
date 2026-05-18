import { Request, Response } from 'express';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../db';
import { tractorsTable } from '../../db/schemas/tractorsSchema';
import { mechHireRequestsTable } from '../../db/schemas/mechHireRequestsSchema';
import { mechDeploymentsTable } from '../../db/schemas/mechDeploymentsSchema';
import { aggregationCentresTable } from '../../db/schemas/aggregationCentresSchema';

const genRef  = (prefix: string) => prefix + '-' + Math.random().toString(36).substring(2, 9).toUpperCase();
const now     = () => new Date().toISOString();

// ── TRACTORS ─────────────────────────────────────────────────────────────────

export const listAllTractors = async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(tractorsTable).orderBy(desc(tractorsTable.createdAt));
    return res.json({ success: true, data: rows.map(parseTractor) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const addTractor = async (req: Request, res: Response) => {
  try {
    const { serialNumber, model, horsepowerHp, driveType, brand, yearManufactured, fuelType, engineCc, color, notes } = req.body;
    if (!serialNumber || !model || !horsepowerHp || !driveType)
      return res.status(400).json({ success: false, message: 'serialNumber, model, horsepowerHp, and driveType are required.' });

    const [row] = await db.insert(tractorsTable).values({
      serialNumber,
      model,
      brand:            brand            ?? null,
      horsepowerHp:     Number(horsepowerHp),
      driveType,
      yearManufactured: yearManufactured ? Number(yearManufactured) : null,
      fuelType:         fuelType         ?? 'diesel',
      engineCc:         engineCc         ? Number(engineCc)        : null,
      color:            color            ?? null,
      notes:            notes            ?? null,
    }).returning();

    return res.status(201).json({ success: true, data: parseTractor(row) });
  } catch (err: any) {
    if (err?.code === '23505')
      return res.status(409).json({ success: false, message: 'A tractor with this serial number already exists.' });
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const assignTractorToFac = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { facId } = req.body;
    if (!facId) return res.status(400).json({ success: false, message: 'facId is required.' });

    const [centre] = await db
      .select({ centreName: aggregationCentresTable.centreName })
      .from(aggregationCentresTable)
      .where(eq(aggregationCentresTable.id, Number(facId)));

    if (!centre) return res.status(404).json({ success: false, message: 'Centre not found.' });

    const [row] = await db
      .update(tractorsTable)
      .set({ facId: Number(facId), facName: centre.centreName, updatedAt: now() })
      .where(eq(tractorsTable.id, id))
      .returning();

    if (!row) return res.status(404).json({ success: false, message: 'Tractor not found.' });
    return res.json({ success: true, data: parseTractor(row) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const getMyTractors = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const rows = await db.select().from(tractorsTable).where(eq(tractorsTable.facId, user.centreId));
    return res.json({ success: true, data: rows.map(parseTractor) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const updateTractor = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { model, brand, yearManufactured, horsepowerHp, driveType, fuelType, engineCc, color, notes, status } = req.body;

    const [existing] = await db.select().from(tractorsTable).where(eq(tractorsTable.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Tractor not found.' });

    if (status && !['available', 'maintenance'].includes(status))
      return res.status(400).json({ success: false, message: 'Status must be available or maintenance.' });

    const [row] = await db
      .update(tractorsTable)
      .set({
        model:            model            ?? existing.model,
        brand:            brand            ?? existing.brand,
        yearManufactured: yearManufactured  ? Number(yearManufactured)  : existing.yearManufactured,
        horsepowerHp:     horsepowerHp     ? Number(horsepowerHp)      : existing.horsepowerHp,
        driveType:        driveType        ?? existing.driveType,
        fuelType:         fuelType         ?? existing.fuelType,
        engineCc:         engineCc         ? Number(engineCc)          : existing.engineCc,
        color:            color            ?? existing.color,
        notes:            notes            ?? existing.notes,
        ...(status ? { status } : {}),
        updatedAt:        now(),
      })
      .where(eq(tractorsTable.id, id))
      .returning();

    return res.json({ success: true, data: parseTractor(row) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const attachImplements = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = (req as any).user;
    const id   = parseInt(req.params.id);
    const { implements: impls } = req.body;

    if (!Array.isArray(impls))
      return res.status(400).json({ success: false, message: 'implements must be an array of strings.' });

    const whereClause = user.role === 'centre_manager'
      ? and(eq(tractorsTable.id, id), eq(tractorsTable.facId, user.centreId))
      : eq(tractorsTable.id, id);

    const [row] = await db
      .update(tractorsTable)
      .set({ currentImplements: JSON.stringify(impls), updatedAt: now() })
      .where(whereClause as any)
      .returning();

    if (!row) return res.status(404).json({ success: false, message: 'Tractor not found or not assigned to your centre.' });
    return res.json({ success: true, data: parseTractor(row) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const updateTractorStatus = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user   = (req as any).user;
    const id     = parseInt(req.params.id);
    const { status } = req.body;

    if (!['available', 'maintenance'].includes(status))
      return res.status(400).json({ success: false, message: 'Status must be available or maintenance.' });

    const whereClause = user.role === 'centre_manager'
      ? and(eq(tractorsTable.id, id), eq(tractorsTable.facId, user.centreId))
      : eq(tractorsTable.id, id);

    const [row] = await db
      .update(tractorsTable)
      .set({ status, updatedAt: now() })
      .where(whereClause as any)
      .returning();

    if (!row) return res.status(404).json({ success: false, message: 'Tractor not found or not assigned to your centre.' });
    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── HIRE REQUESTS ─────────────────────────────────────────────────────────────

export const getHireRequests = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const rows = await db
      .select()
      .from(mechHireRequestsTable)
      .where(eq(mechHireRequestsTable.facId, user.centreId))
      .orderBy(desc(mechHireRequestsTable.createdAt));

    return res.json({ success: true, data: rows.map(parseRequest) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const sendQuote = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { quotedAmount, quoteNotes } = req.body;
    if (!quotedAmount) return res.status(400).json({ success: false, message: 'quotedAmount is required.' });

    const [row] = await db
      .update(mechHireRequestsTable)
      .set({ quotedAmount: Number(quotedAmount), quoteNotes: quoteNotes ?? null, status: 'quoted' })
      .where(and(eq(mechHireRequestsTable.id, id), eq(mechHireRequestsTable.status, 'pending')) as any)
      .returning();

    if (!row) return res.status(404).json({ success: false, message: 'Request not found or not in pending state.' });
    return res.json({ success: true, data: parseRequest(row) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const confirmPaymentAndAssign = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { tractorId, expectedReturnAt, notes } = req.body;
    if (!tractorId || !expectedReturnAt)
      return res.status(400).json({ success: false, message: 'tractorId and expectedReturnAt are required.' });

    const [request] = await db
      .select()
      .from(mechHireRequestsTable)
      .where(eq(mechHireRequestsTable.id, id));

    if (!request) return res.status(404).json({ success: false, message: 'Hire request not found.' });
    if (request.status !== 'payment_confirmed')
      return res.status(400).json({ success: false, message: 'Request must be in payment_confirmed state.' });

    const [tractor] = await db
      .select()
      .from(tractorsTable)
      .where(and(eq(tractorsTable.id, Number(tractorId)), eq(tractorsTable.status, 'available')) as any);

    if (!tractor) return res.status(400).json({ success: false, message: 'Tractor not found or not available.' });

    await db.update(tractorsTable).set({ status: 'deployed', updatedAt: now() }).where(eq(tractorsTable.id, tractor.id));

    const deployedAt = now();
    await db.insert(mechDeploymentsTable).values({
      refId:              genRef('DEP'),
      tractorId:          tractor.id,
      tractorModel:       tractor.model,
      tractorSerial:      tractor.serialNumber,
      farmerName:         request.farmerName,
      farmerPhone:        request.farmerPhone,
      facId:              request.facId,
      facName:            request.facName,
      requestId:          request.id,
      implementsAttached: request.implements,
      deployedAt,
      expectedReturnAt,
      notes:              notes ?? null,
    });

    const [updated] = await db
      .update(mechHireRequestsTable)
      .set({ status: 'deployed', tractorId: tractor.id, tractorModel: tractor.model })
      .where(eq(mechHireRequestsTable.id, id))
      .returning();

    return res.json({ success: true, data: parseRequest(updated) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── DEPLOYMENTS ───────────────────────────────────────────────────────────────

export const listAllDeployments = async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(mechDeploymentsTable).orderBy(desc(mechDeploymentsTable.deployedAt));
    return res.json({ success: true, data: rows.map(parseDeployment) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const getMyDeployments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const rows = await db
      .select()
      .from(mechDeploymentsTable)
      .where(eq(mechDeploymentsTable.facId, user.centreId))
      .orderBy(desc(mechDeploymentsTable.deployedAt));

    return res.json({ success: true, data: rows.map(parseDeployment) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const markTractorReturned = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const [deployment] = await db
      .select()
      .from(mechDeploymentsTable)
      .where(eq(mechDeploymentsTable.id, id));

    if (!deployment) return res.status(404).json({ success: false, message: 'Deployment not found.' });
    if (deployment.status === 'returned')
      return res.status(400).json({ success: false, message: 'Tractor already returned.' });

    const actualReturnAt = now();
    const [updated] = await db
      .update(mechDeploymentsTable)
      .set({ status: 'returned', actualReturnAt })
      .where(eq(mechDeploymentsTable.id, id))
      .returning();

    await db
      .update(tractorsTable)
      .set({ status: 'available', updatedAt: actualReturnAt })
      .where(eq(tractorsTable.id, deployment.tractorId));

    await db
      .update(mechHireRequestsTable)
      .set({ status: 'completed' })
      .where(eq(mechHireRequestsTable.id, deployment.requestId));

    return res.json({ success: true, data: parseDeployment(updated) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── STATS ─────────────────────────────────────────────────────────────────────

export const getAdminStats = async (_req: Request, res: Response) => {
  try {
    const tractors = await db.select({ status: tractorsTable.status }).from(tractorsTable);
    const deployments = await db.select({ status: mechDeploymentsTable.status }).from(mechDeploymentsTable);

    return res.json({
      success: true,
      data: {
        totalTractors:      tractors.length,
        available:          tractors.filter(t => t.status === 'available').length,
        deployed:           tractors.filter(t => t.status === 'deployed').length,
        maintenance:        tractors.filter(t => t.status === 'maintenance').length,
        activeDeployments:  deployments.filter(d => d.status === 'active').length,
        overdueDeployments: deployments.filter(d => d.status === 'overdue').length,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const getManagerStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const centreId = user.centreId;

    const tractors    = await db.select({ status: tractorsTable.status }).from(tractorsTable).where(eq(tractorsTable.facId, centreId));
    const deployments = await db.select({ status: mechDeploymentsTable.status }).from(mechDeploymentsTable).where(eq(mechDeploymentsTable.facId, centreId));
    const requests    = await db.select({ status: mechHireRequestsTable.status }).from(mechHireRequestsTable).where(eq(mechHireRequestsTable.facId, centreId));

    return res.json({
      success: true,
      data: {
        assignedTractors:  tractors.length,
        activeDeployments: deployments.filter(d => d.status === 'active').length,
        pendingRequests:   requests.filter(r => r.status === 'pending').length,
        overdueReturns:    deployments.filter(d => d.status === 'overdue').length,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const updateDeploymentLocation = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined)
      return res.status(400).json({ success: false, message: 'lat and lng are required.' });

    const [row] = await db
      .update(mechDeploymentsTable)
      .set({ lastKnownLat: Number(lat), lastKnownLng: Number(lng), lastLocationAt: now() })
      .where(eq(mechDeploymentsTable.id, id))
      .returning();

    if (!row) return res.status(404).json({ success: false, message: 'Deployment not found.' });
    return res.json({ success: true, data: parseDeployment(row) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

function parseTractor(t: any) {
  return { ...t, currentImplements: safeParseJson(t.currentImplements, []) };
}

function parseRequest(r: any) {
  return { ...r, implements: safeParseJson(r.implements, []) };
}

function parseDeployment(d: any) {
  return { ...d, implementsAttached: safeParseJson(d.implementsAttached, []) };
}

function safeParseJson(val: any, fallback: any) {
  try { return typeof val === 'string' ? JSON.parse(val) : val ?? fallback; }
  catch { return fallback; }
}
