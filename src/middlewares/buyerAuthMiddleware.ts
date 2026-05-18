import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret';

export interface BuyerJwtPayload {
  buyerId: number;
  email:   string;
}

export const buyerAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided.' });

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as BuyerJwtPayload;
    if (!payload.buyerId)
      return res.status(401).json({ success: false, message: 'Invalid buyer token.' });
    (req as any).buyer = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
