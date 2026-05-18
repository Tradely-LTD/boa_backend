import { Request, Response } from 'express';
import { sql, eq, count } from 'drizzle-orm';
import { db } from '../../db';
import { applicationsTable } from '../../db/schemas/applicationsSchema';
import { aggregationCentresTable } from '../../db/schemas/aggregationCentresSchema';

export const getStats = async (_req: Request, res: Response) => {
  try {
    // Application counts by status
    const appsByStatus = await db
      .select({ status: applicationsTable.status, total: count() })
      .from(applicationsTable)
      .groupBy(applicationsTable.status);

    // Applications by state (top 10)
    const appsByState = await db
      .select({ state: applicationsTable.state, total: count() })
      .from(applicationsTable)
      .groupBy(applicationsTable.state)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    // Applications by centre type
    const appsByType = await db
      .select({ centreType: applicationsTable.centreType, total: count() })
      .from(applicationsTable)
      .groupBy(applicationsTable.centreType);

    // Centres by status
    const centresByStatus = await db
      .select({ status: aggregationCentresTable.status, total: count() })
      .from(aggregationCentresTable)
      .groupBy(aggregationCentresTable.status);

    // Total capacity across all active centres
    const [capacityResult] = await db
      .select({ totalCapacity: sql<number>`sum(capacity_mt)` })
      .from(aggregationCentresTable)
      .where(eq(aggregationCentresTable.status, 'active'));

    // Applications submitted per month (last 6 months)
    const appsByMonth = await db
      .select({
        month: sql<string>`strftime('%Y-%m', created_at)`,
        total: count(),
      })
      .from(applicationsTable)
      .groupBy(sql`strftime('%Y-%m', created_at)`)
      .orderBy(sql`strftime('%Y-%m', created_at) desc`)
      .limit(6);

    const statusMap: Record<string, number> = {};
    appsByStatus.forEach(r => { statusMap[r.status] = r.total; });

    return res.json({
      success: true,
      data: {
        applications: {
          total:       Object.values(statusMap).reduce((a, b) => a + b, 0),
          pending:     statusMap['pending']      ?? 0,
          under_review: statusMap['under_review'] ?? 0,
          approved:    statusMap['approved']     ?? 0,
          rejected:    statusMap['rejected']     ?? 0,
        },
        centres: {
          total:          centresByStatus.reduce((a, r) => a + r.total, 0),
          active:         centresByStatus.find(r => r.status === 'active')?.total         ?? 0,
          suspended:      centresByStatus.find(r => r.status === 'suspended')?.total      ?? 0,
          decommissioned: centresByStatus.find(r => r.status === 'decommissioned')?.total ?? 0,
          totalCapacityMt: capacityResult.totalCapacity ?? 0,
        },
        appsByState:  appsByState.map(r => ({ state: r.state ?? 'Unknown', total: r.total })),
        appsByType:   appsByType.map(r  => ({ type:  r.centreType,          total: r.total })),
        appsByMonth:  appsByMonth.reverse().map(r => ({ month: r.month, total: r.total })),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
