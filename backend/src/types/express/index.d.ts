import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId?: string;
        role: string;
        [key: string]: any;
      };
    }
  }
}
