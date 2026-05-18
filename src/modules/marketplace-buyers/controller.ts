import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import { marketplaceBuyersTable } from '../../db/schemas/marketplaceBuyersSchema';
import type { RegisterBuyerBody, LoginBuyerBody } from './types';

const JWT_SECRET     = process.env.JWT_SECRET ?? 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '30d';
const genRef = () => 'BYR-' + Math.random().toString(36).substring(2, 9).toUpperCase();

const signToken = (buyerId: number, email: string) =>
  jwt.sign({ buyerId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

// POST /api/marketplace/buyers/register
export const registerBuyer = async (req: Request<{}, {}, RegisterBuyerBody>, res: Response) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });

    const [existing] = await db.select().from(marketplaceBuyersTable).where(eq(marketplaceBuyersTable.email, email.toLowerCase()));
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const [buyer] = await db.insert(marketplaceBuyersTable).values({
      refId:    genRef(),
      fullName,
      email:    email.toLowerCase(),
      phone,
      passwordHash,
      createdAt: new Date().toISOString(),
    }).returning();

    const token = signToken(buyer.id, buyer.email);
    return res.status(201).json({
      success: true,
      data: { token, buyer: { id: buyer.id, fullName: buyer.fullName, email: buyer.email, phone: buyer.phone } },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/marketplace/buyers/login
export const loginBuyer = async (req: Request<{}, {}, LoginBuyerBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const [buyer] = await db.select().from(marketplaceBuyersTable).where(eq(marketplaceBuyersTable.email, email.toLowerCase()));
    if (!buyer)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, buyer.passwordHash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = signToken(buyer.id, buyer.email);
    return res.json({
      success: true,
      data: { token, buyer: { id: buyer.id, fullName: buyer.fullName, email: buyer.email, phone: buyer.phone } },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/marketplace/buyers/me  (buyer auth)
export const getBuyerMe = async (req: Request, res: Response) => {
  try {
    const buyerId = (req as any).buyer?.buyerId;
    const [buyer] = await db.select().from(marketplaceBuyersTable).where(eq(marketplaceBuyersTable.id, buyerId));
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found.' });
    return res.json({
      success: true,
      data: { id: buyer.id, fullName: buyer.fullName, email: buyer.email, phone: buyer.phone },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
