import { Request, Response } from 'express';
import { eq, desc, and, or, isNull, sql } from 'drizzle-orm';
import { db } from '../../db';
import { collectionRequestsTable } from '../../db/schemas/collectionRequestsSchema';
import { usersTable } from '../../db/schemas/usersSchema';
import { createNotification } from '../notifications';

const genRef = () => 'CR-' + Math.random().toString(36).substring(2, 9).toUpperCase();

// POST /api/collection-requests  (PUBLIC)
export const createRequest = async (req: Request, res: Response) => {
  try {
    const {
      farmerName, farmerPhone, farmerNin,
      address, state, lga,
      commodity, estimatedQuantityKg,
      collectionType, preferredDate, preferredTime, notes,
      gpsLat, gpsLng,
    } = req.body;

    if (!farmerName || !farmerPhone || !address || !state || !lga || !commodity || !estimatedQuantityKg || !collectionType || !preferredDate)
      return res.status(400).json({ success: false, message: 'farmerName, farmerPhone, address, state, lga, commodity, estimatedQuantityKg, collectionType, and preferredDate are required.' });

    const [row] = await db.insert(collectionRequestsTable).values({
      refId:               genRef(),
      farmerName,
      farmerPhone,
      farmerNin:           farmerNin ?? null,
      address,
      state,
      lga,
      commodity,
      estimatedQuantityKg: parseFloat(estimatedQuantityKg),
      collectionType,
      preferredDate,
      preferredTime:       preferredTime ?? null,
      notes:               notes         ?? null,
      gpsLat:              gpsLat  ?? null,
      gpsLng:              gpsLng  ?? null,
      status:              'pending',
    }).returning();

    return res.status(201).json({ success: true, data: { refId: row.refId, id: row.id } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/collection-requests
export const listRequests = async (req: Request, res: Response) => {
  try {
    const user   = (req as any).user;
    const page   = parseInt((req.query.page  as string) || '1');
    const limit  = parseInt((req.query.limit as string) || '20');
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const conditions: any[] = [];

    if (user.role === 'centre_manager' && user.centreId) {
      // Show unassigned pending requests (any manager can pick them up) + requests assigned to this centre
      conditions.push(
        or(
          isNull(collectionRequestsTable.centreId),
          eq(collectionRequestsTable.centreId, user.centreId)
        )
      );
    } else if (user.role === 'collector') {
      conditions.push(eq(collectionRequestsTable.collectorId, user.userId));
    }

    if (status) conditions.push(eq(collectionRequestsTable.status, status as any));

    const whereClause = conditions.length ? and(...conditions as [any, ...any[]]) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(collectionRequestsTable)
      .where(whereClause);

    const rows = await db
      .select()
      .from(collectionRequestsTable)
      .where(whereClause)
      .orderBy(desc(collectionRequestsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json({ success: true, data: rows, total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/collection-requests/:id
export const getRequest = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = (req as any).user;
    const [row] = await db
      .select()
      .from(collectionRequestsTable)
      .where(eq(collectionRequestsTable.id, parseInt(req.params.id)));

    if (!row) return res.status(404).json({ success: false, message: 'Request not found.' });

    if (user.role === 'collector' && row.collectorId !== user.userId)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/collection-requests/:id/assign
export const assignCollector = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(collectionRequestsTable).where(eq(collectionRequestsTable.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (existing.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending requests can be assigned.' });

    const { collectorId, centreId, centreName } = req.body;
    if (!collectorId) return res.status(400).json({ success: false, message: 'collectorId is required.' });

    const [collector] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(and(eq(usersTable.id, parseInt(collectorId)), eq(usersTable.role, 'collector')));

    if (!collector) return res.status(404).json({ success: false, message: 'Collector not found.' });

    const resolvedCentreId = centreId ? parseInt(centreId) : existing.centreId;

    const [row] = await db
      .update(collectionRequestsTable)
      .set({
        collectorId:   parseInt(collectorId),
        collectorName: collector.name,
        centreId:      resolvedCentreId,
        centreName:    centreName ?? existing.centreName,
        status:        'assigned',
        assignedAt:    new Date().toISOString(),
        updatedAt:     new Date().toISOString(),
      })
      .where(eq(collectionRequestsTable.id, id))
      .returning();

    if (resolvedCentreId) {
      await createNotification(
        'collection_assigned',
        `Collection assigned to ${collector.name}: ${existing.commodity} from ${existing.farmerName} (${existing.lga}, ${existing.state})`,
        undefined,
        resolvedCentreId,
      );
    }

    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/collection-requests/:id/in-transit
export const markInTransit = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = (req as any).user;
    const id   = parseInt(req.params.id);
    const [existing] = await db.select().from(collectionRequestsTable).where(eq(collectionRequestsTable.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (existing.status !== 'assigned') return res.status(400).json({ success: false, message: 'Only assigned requests can be marked in-transit.' });

    if (user.role === 'collector' && existing.collectorId !== user.userId)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const [row] = await db
      .update(collectionRequestsTable)
      .set({ status: 'in_transit', inTransitAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(collectionRequestsTable.id, id))
      .returning();

    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/collection-requests/:id/collected
export const markCollected = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = (req as any).user;
    const id   = parseInt(req.params.id);
    const [existing] = await db.select().from(collectionRequestsTable).where(eq(collectionRequestsTable.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (existing.status !== 'in_transit') return res.status(400).json({ success: false, message: 'Only in-transit requests can be marked collected.' });

    if (user.role === 'collector' && existing.collectorId !== user.userId)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const { actualQuantityKg, collectionNotes } = req.body;

    const collectedQty = actualQuantityKg ? parseFloat(actualQuantityKg) : existing.estimatedQuantityKg;

    const [row] = await db
      .update(collectionRequestsTable)
      .set({
        status:           'collected',
        collectedAt:      new Date().toISOString(),
        actualQuantityKg: collectedQty,
        collectionNotes:  collectionNotes ?? null,
        updatedAt:        new Date().toISOString(),
      })
      .where(eq(collectionRequestsTable.id, id))
      .returning();

    if (existing.centreId) {
      await createNotification(
        'collection_completed',
        `${existing.commodity} collected from ${existing.farmerName} — ${collectedQty.toLocaleString()} kg ready for intake`,
        undefined,
        existing.centreId,
      );
    }

    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/collection-requests/:id/cancel
export const cancelRequest = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(collectionRequestsTable).where(eq(collectionRequestsTable.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (existing.status === 'collected') return res.status(400).json({ success: false, message: 'Cannot cancel a collected request.' });

    const [row] = await db
      .update(collectionRequestsTable)
      .set({ status: 'cancelled', updatedAt: new Date().toISOString() })
      .where(eq(collectionRequestsTable.id, id))
      .returning();

    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/collection-requests/collectors  — list collectors for a centre (for assign modal)
export const listCollectors = async (req: Request, res: Response) => {
  try {
    const user     = (req as any).user;
    const centreId = user.role === 'centre_manager' ? user.centreId : req.query.centreId ? parseInt(req.query.centreId as string) : undefined;

    const conditions: any[] = [eq(usersTable.role, 'collector'), eq(usersTable.isActive, true)];
    if (centreId) conditions.push(eq(usersTable.centreId, centreId));

    const rows = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, centreId: usersTable.centreId })
      .from(usersTable)
      .where(and(...conditions as [any, ...any[]]));

    return res.json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
