import { Request, Response } from 'express';
import { eq, desc, like, and, or, sql, SQL } from 'drizzle-orm';
import { db } from '../../db';
import { applicationsTable } from '../../db/schemas/applicationsSchema';
import { aggregationCentresTable } from '../../db/schemas/aggregationCentresSchema';
import type { CreateApplicationBody, UpdateStatusBody, ApplicationFilters } from './types';
import { createNotification } from '../notifications';

const generateRefId = () =>
  'AGC-' + Math.random().toString(36).substring(2, 10).toUpperCase();

// POST /api/applications — public (from landing page form)
export const createApplication = async (
  req: Request<{}, {}, CreateApplicationBody>,
  res: Response,
) => {
  try {
    const {
      centreName, centreType, regNumber, tinNumber, yearEstablished,
      ownerName, ownerPhone, ownerNin,
      commodities, capacityMt, coldStorageCapacityMt, numBays, floorAreaSqm,
      warehouseType, facilities, powerSource, waterSource,
      hasAccessRoad, warehouseReceiptCapable,
      address, state, lga, gpsLat, gpsLng,
      managerName, managerPhone, managerNin, managerEmail,
      bankName, accountNumber, bvn,
    } = req.body;

    if (!centreName || !centreType)
      return res.status(400).json({ success: false, message: 'Centre name and type are required.' });

    const refId = generateRefId();

    const [application] = await db.insert(applicationsTable).values({
      refId,
      centreName, centreType, regNumber, tinNumber, yearEstablished,
      ownerName, ownerPhone, ownerNin,
      commodities:           commodities ? JSON.stringify(commodities) : null,
      capacityMt, coldStorageCapacityMt, numBays, floorAreaSqm,
      warehouseType,
      facilities:            facilities ? JSON.stringify(facilities) : null,
      powerSource, waterSource, hasAccessRoad, warehouseReceiptCapable,
      address, state, lga, gpsLat, gpsLng,
      managerName, managerPhone, managerNin, managerEmail,
      bankName, accountNumber, bvn,
    }).returning();

    await createNotification('new_application', `New application received from ${centreName} (${state ?? 'N/A'})`, application.refId);

    return res.status(201).json({ success: true, data: { refId: application.refId, id: application.id } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/applications — admin only
export const listApplications = async (
  req: Request<{}, {}, {}, ApplicationFilters>,
  res: Response,
) => {
  try {
    const { status, state, search, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(applicationsTable.status, status as any));
    if (state)  conditions.push(eq(applicationsTable.state, state));
    if (search) {
      const q = `%${search.toLowerCase()}%`;
      conditions.push(or(
        like(sql`lower(${applicationsTable.centreName})`, q),
        like(sql`lower(${applicationsTable.refId})`, q),
      )!);
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(applicationsTable)
      .where(conditions.length ? and(...conditions) : undefined);

    const rows = await db
      .select()
      .from(applicationsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(applicationsTable.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    return res.json({
      success: true,
      data: rows,
      total: Number(total),
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(Number(total) / limitNum),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/applications/:id — admin only
export const getApplication = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, parseInt(req.params.id)));

    if (!row) return res.status(404).json({ success: false, message: 'Application not found.' });

    return res.json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/applications/:id/status — admin only
export const updateStatus = async (
  req: Request<{ id: string }, {}, UpdateStatusBody>,
  res: Response,
) => {
  try {
    const { status, reviewNotes } = req.body;
    const adminId = (req as any).user?.userId;
    const appId   = parseInt(req.params.id);

    const [existing] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, appId));
    if (!existing) return res.status(404).json({ success: false, message: 'Application not found.' });

    const [updated] = await db
      .update(applicationsTable)
      .set({
        status,
        reviewNotes: reviewNotes ?? existing.reviewNotes,
        reviewedBy: adminId,
        reviewedAt: new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
      })
      .where(eq(applicationsTable.id, appId))
      .returning();

    // Auto-create aggregation centre when approved
    if (status === 'approved' && existing.status !== 'approved') {
      await db.insert(aggregationCentresTable).values({
        refId:                   existing.refId,
        applicationId:           existing.id,
        // Identity
        centreName:              existing.centreName,
        centreType:              existing.centreType,
        regNumber:               existing.regNumber,
        tinNumber:               existing.tinNumber,
        yearEstablished:         existing.yearEstablished,
        // Ownership
        ownerName:               existing.ownerName,
        ownerPhone:              existing.ownerPhone,
        ownerNin:                existing.ownerNin,
        // Infrastructure
        commodities:             existing.commodities,
        capacityMt:              existing.capacityMt,
        coldStorageCapacityMt:   existing.coldStorageCapacityMt,
        numBays:                 existing.numBays,
        floorAreaSqm:            existing.floorAreaSqm,
        warehouseType:           existing.warehouseType,
        facilities:              existing.facilities,
        powerSource:             existing.powerSource,
        waterSource:             existing.waterSource,
        hasAccessRoad:           existing.hasAccessRoad,
        warehouseReceiptCapable: existing.warehouseReceiptCapable,
        // Location
        state:                   existing.state ?? '',
        lga:                     existing.lga,
        address:                 existing.address,
        gpsLat:                  existing.gpsLat,
        gpsLng:                  existing.gpsLng,
        // Manager
        managerName:             existing.managerName,
        managerPhone:            existing.managerPhone,
        managerNin:              existing.managerNin,
        managerEmail:            existing.managerEmail,
        // Banking
        bankName:                existing.bankName,
        accountNumber:           existing.accountNumber,
        bvn:                     existing.bvn,
        // Approval
        approvedBy:              adminId,
        approvedAt:              new Date().toISOString(),
      });
    }

    const statusLabel = status.replace('_', ' ');
    await createNotification(
      'status_change',
      `Application ${existing.refId} (${existing.centreName}) marked as ${statusLabel}`,
      existing.refId,
    );

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/applications/ref/:refId — public (applicant status check)
export const getByRefId = async (req: Request<{ refId: string }>, res: Response) => {
  try {
    const [row] = await db
      .select({
        refId:       applicationsTable.refId,
        status:      applicationsTable.status,
        centreName:  applicationsTable.centreName,
        state:       applicationsTable.state,
        createdAt:   applicationsTable.createdAt,
        reviewNotes: applicationsTable.reviewNotes,
      })
      .from(applicationsTable)
      .where(eq(applicationsTable.refId, req.params.refId.toUpperCase()));

    if (!row) return res.status(404).json({ success: false, message: 'Reference ID not found.' });

    return res.json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
