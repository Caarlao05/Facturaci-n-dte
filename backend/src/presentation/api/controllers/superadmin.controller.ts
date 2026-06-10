import { Request, Response } from 'express';
import prisma from '../../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity_secret_123';

export const getAllTenants = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const tenants = await prisma.tenant.findMany({
      include: {
        settings: true,
        quotas: true,
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
      logoUrl: t.settings?.logoUrl,
      balanceDtes: t.quotas?.balanceDtes || 0,
      totalEmitted: t.quotas?.totalEmitted || 0,
      isMHReady: Boolean(t.settings?.mhApiPassword)
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

      // Inicializar Cuotas (100 de regalo)
      await tx.tenantQuota.create({
        data: {
          tenantId: tenant.id,
          balanceDtes: 100,
          totalEmitted: 0
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

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'SUPERADMIN') return res.status(403).json({ success: false, error: 'Forbidden' });

    const users = await prisma.user.findMany({
      include: { tenant: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const formatted = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      tenantName: u.tenant ? u.tenant.businessName : 'Sistema Global',
      createdAt: u.createdAt
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'SUPERADMIN') return res.status(403).json({ success: false, error: 'Forbidden' });
    const { id } = req.params;
    const { environment, businessName } = req.body;

    const updated = await prisma.tenant.update({
      where: { id: id as string },
      data: { environment, businessName }
    });
    res.json({ success: true, data: updated, message: 'Empresa actualizada correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteTenant = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'SUPERADMIN') return res.status(403).json({ success: false, error: 'Forbidden' });
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      await tx.apiKey.deleteMany({ where: { tenantId: id as string } });
      await tx.tenantQuota.deleteMany({ where: { tenantId: id as string } });
      await tx.user.deleteMany({ where: { tenantId: id as string } });
      await tx.tenantSettings.deleteMany({ where: { tenantId: id as string } });
      await tx.tenant.delete({ where: { id: id as string } });
    });

    res.json({ success: true, message: 'Empresa eliminada exitosamente' });
  } catch (error: any) {
    if (error.code === 'P2003') {
       return res.status(400).json({ success: false, error: 'No se puede eliminar la empresa porque ya tiene facturas, clientes o productos asociados. Considérala en producción.' });
    }
    console.error(error);
    res.status(500).json({ success: false, error: 'Error interno al eliminar empresa' });
  }
};

export const rechargeQuota = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'SUPERADMIN') return res.status(403).json({ success: false, error: 'Forbidden' });
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Monto de recarga inválido' });
    }

    const quota = await prisma.tenantQuota.upsert({
      where: { tenantId: id as string },
      create: {
        tenantId: id as string,
        balanceDtes: amount,
        totalEmitted: 0
      },
      update: {
        balanceDtes: { increment: amount },
        lastRecharge: new Date()
      }
    });

    res.json({ success: true, data: quota, message: `Se han recargado ${amount} DTEs correctamente` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getGlobalAnalytics = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'SUPERADMIN') return res.status(403).json({ success: false, error: 'Forbidden' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // 30 days including today

    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true
      }
    });

    const grouped = invoices.reduce((acc: any, inv) => {
      const dateStr = inv.createdAt.toISOString().split('T')[0] as string;
      if (!acc[dateStr]) acc[dateStr] = 0;
      acc[dateStr]++;
      return acc;
    }, {});

    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0] as string;
      chartData.push({
        name: dateStr,
        Facturas: grouped[dateStr] || 0
      });
    }

    res.json({ success: true, data: chartData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const impersonateTenant = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'SUPERADMIN') return res.status(403).json({ success: false, error: 'Forbidden' });
    const { id } = req.params;

    const tenantAdmin = await prisma.user.findFirst({
      where: { tenantId: id as string, role: 'TENANT_ADMIN' },
      orderBy: { createdAt: 'asc' } // Tomar el primer admin creado
    });

    if (!tenantAdmin) {
      return res.status(404).json({ success: false, error: 'No se encontró un administrador válido para esta empresa' });
    }

    const token = jwt.sign(
      { userId: tenantAdmin.id, tenantId: tenantAdmin.tenantId, role: tenantAdmin.role },
      JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { id: tenantAdmin.id, email: tenantAdmin.email, name: tenantAdmin.name, tenantId: tenantAdmin.tenantId, role: tenantAdmin.role }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

