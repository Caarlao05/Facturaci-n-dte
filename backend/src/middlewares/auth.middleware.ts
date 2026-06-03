import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity_secret_123';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token de autenticación no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    const xTenantId = req.headers['x-tenant-id'];

    // Validar aislamiento de tenants (Si no es SUPERADMIN, debe proveer un X-Tenant-Id válido y coincidente)
    if (payload.role !== 'SUPERADMIN') {
      if (!xTenantId) {
        return res.status(403).json({ success: false, error: 'Cabecera X-Tenant-Id requerida por seguridad.' });
      }
      if (payload.tenantId !== xTenantId) {
        return res.status(403).json({ success: false, error: 'Cross-Tenant Access Forbidden: Violación de aislamiento de datos.' });
      }
    }

    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token de autenticación inválido o expirado.' });
  }
};
