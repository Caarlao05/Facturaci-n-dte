import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import crypto from 'crypto';

// Extender Request de Express para inyectar el Tenant
export interface ApiRequest extends Request {
  tenantId?: string;
  tenantNit?: string;
}

export const requireApiKey = async (req: ApiRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Missing or invalid API Key. Expected: Bearer <API_KEY>' 
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token missing' });
  }
  
  // En producción, aquí haríamos un hash SHA256 del token para comparar con la DB
  // Por ahora, asumiremos que guardamos la llave en 'keyHash' (Demo mode)
  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { keyHash: token },
    include: { tenant: { include: { quotas: true } } }
  });

  if (!apiKeyRecord || !apiKeyRecord.isActive) {
    return res.status(401).json({ success: false, error: 'Invalid or inactive API Key' });
  }

  const tenant = apiKeyRecord.tenant;
  const quota = tenant.quotas;

  // Verificación de Saldo Prepago
  if (!quota || quota.balanceDtes <= 0) {
    return res.status(402).json({ 
      success: false, 
      error: 'Insufficient DTE Quota. Please recharge your balance to continue emitting invoices.',
      currentBalance: quota?.balanceDtes || 0
    });
  }

  // Inyectar datos del Tenant al controlador
  req.tenantId = tenant.id;
  req.tenantNit = tenant.nit;

  next();
};
