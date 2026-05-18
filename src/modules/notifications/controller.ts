import { Request, Response } from 'express';
import { desc, eq, isNull } from 'drizzle-orm';
import { db } from '../../db';
import { notificationsTable } from '../../db/schemas/notificationsSchema';

// GET /api/notifications
export const listNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    let whereClause;
    if (user.role === 'admin' || user.role === 'super_admin') {
      // Admins see global (centre-less) notifications only
      whereClause = isNull(notificationsTable.centreId);
    } else if (user.centreId) {
      // Centre managers and collectors see only their centre's notifications
      whereClause = eq(notificationsTable.centreId, user.centreId);
    } else {
      return res.json({ success: true, data: [] });
    }

    const rows = await db
      .select()
      .from(notificationsTable)
      .where(whereClause)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    return res.json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Internal helper — call from other modules to create a notification
// centreId: undefined/null → admin-only; number → scoped to that centre
export const createNotification = async (
  type: string,
  message: string,
  applicationRefId?: string,
  centreId?: number | null,
) => {
  try {
    await db.insert(notificationsTable).values({
      type,
      message,
      applicationRefId: applicationRefId ?? null,
      centreId:         centreId ?? null,
      createdAt:        new Date().toISOString(),
    });
  } catch {
    // Never let a failed notification bring down a real operation
  }
};
