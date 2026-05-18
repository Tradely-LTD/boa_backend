import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { usersTable } from '../../db/schemas/usersSchema';
import type { LoginBody, RegisterBody, JwtPayload } from './types';

const JWT_SECRET     = process.env.JWT_SECRET ?? 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

export const login = async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));

    if (!user || !user.isActive)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = signToken({ userId: user.id, email: user.email, role: user.role, centreId: user.centreId ?? undefined });

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, centreId: user.centreId },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const register = async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  try {
    const { email, password, name, role = 'admin', centreId } = req.body;

    if (!email || !password || !name)
      return res.status(400).json({ success: false, message: 'Email, password and name are required.' });

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db.insert(usersTable).values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
      centreId: centreId ?? null,
    }).returning();

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
