import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { usersTable } from '../../db/schemas/usersSchema';
import type { UpdateUserBody, ChangePasswordBody } from './types';

// GET /api/users — super_admin only
export const listUsers = async (req: Request, res: Response) => {
  try {
    const page  = parseInt((req.query.page  as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const offset = (page - 1) * limit;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(usersTable);

    const rows = await db
      .select({
        id:        usersTable.id,
        email:     usersTable.email,
        name:      usersTable.name,
        role:      usersTable.role,
        isActive:  usersTable.isActive,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
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
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/users/:id
export const getUser = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [row] = await db
      .select({
        id:        usersTable.id,
        email:     usersTable.email,
        name:      usersTable.name,
        role:      usersTable.role,
        isActive:  usersTable.isActive,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, parseInt(req.params.id)));

    if (!row) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/users/:id
export const updateUser = async (
  req: Request<{ id: string }, {}, UpdateUserBody>,
  res: Response,
) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'User not found.' });

    const [updated] = await db
      .update(usersTable)
      .set({ ...req.body, updatedAt: new Date().toISOString() })
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id, email: usersTable.email,
        name: usersTable.name, role: usersTable.role, isActive: usersTable.isActive,
      });

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/users/me
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const [row] = await db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, isActive: usersTable.isActive, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!row) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, data: row });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/users/me
export const updateMe = async (req: Request<{}, {}, { name?: string; email?: string }>, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const [updated] = await db
      .update(usersTable)
      .set({ ...req.body, updatedAt: new Date().toISOString() })
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, isActive: usersTable.isActive });
    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/users/:id/change-password
export const changePassword = async (
  req: Request<{ id: string }, {}, ChangePasswordBody>,
  res: Response,
) => {
  try {
    const requesterId = (req as any).user?.userId;
    const targetId    = parseInt(req.params.id);

    if (requesterId !== targetId)
      return res.status(403).json({ success: false, message: 'You can only change your own password.' });

    const { currentPassword, newPassword } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(usersTable).set({ passwordHash, updatedAt: new Date().toISOString() }).where(eq(usersTable.id, targetId));

    return res.json({ success: true, message: 'Password updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
