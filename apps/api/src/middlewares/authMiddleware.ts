import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not defined');
    return res.status(500).json({ error: 'Internal server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string, tenantId: string, role: string };
    
    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
