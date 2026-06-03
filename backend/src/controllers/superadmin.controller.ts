import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

export const getAllTenants = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const tenants = await prisma.tenant.findMany({
      include: {
        settings: true,
        _count: {
          select: { invoices: true, users: true }
        }
      }
    });

    const formatted = tenants.map(t => ({
      id: t.id,
      businessName: t.businessName,
      nit: t.nit,
      environment: t.environment,
      createdAt: t.createdAt,
      totalInvoices: t._count.invoices,
      totalUsers: t._count.users,
      logoUrl: t.settings?.logoUrl
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTenant = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { businessName, nit, adminName, adminEmail, adminPassword } = req.body;

    if (!businessName || !nit || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }

    // Hash the initial password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create Tenant and Admin User in a transaction
    const newTenant = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          businessName,
          nit,
          environment: '00', // Default a pruebas
        }
      });

      await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          name: adminName,
          role: 'TENANT_ADMIN',
          tenantId: tenant.id
        }
      });

      // Inicializar settings básicos
      await tx.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          companyName: businessName,
          primaryColor: '#0F172A',
        }
      });

      return tenant;
    });

    res.json({ success: true, data: newTenant, message: 'Empresa registrada exitosamente' });
  } catch (error: any) {
    // Handling Unique Constraint violations (e.g. duplicated email or nit)
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'El NIT o el correo electrónico ya están registrados.' });
    }
    console.error(error);
    res.status(500).json({ success: false, error: 'Error interno al crear empresa' });
  }
};

