import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../modules/auth/types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided.' });

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as JwtPayload;
  if (user?.role !== 'super_admin')
    return res.status(403).json({ success: false, message: 'Super admin access required.' });
  next();
};

export const requireManager = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as JwtPayload;
  if (!['centre_manager', 'admin', 'super_admin'].includes(user?.role))
    return res.status(403).json({ success: false, message: 'Access denied.' });
  next();
};

export const requireManagerOrCollector = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as JwtPayload;
  if (!['centre_manager', 'admin', 'super_admin', 'collector'].includes(user?.role))
    return res.status(403).json({ success: false, message: 'Access denied.' });
  next();
};
