import { Request, Response } from 'express';
import prisma from '../../../config/database';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.tenantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (user.tenantId === 'sandbox-tenant') {
      return res.json({
        success: true,
        data: {
          companyName: 'Empresa Sandbox',
          primaryColor: '#0F172A',
          mhNit: '0000-000000-000-0',
          mhApiPassword: '********',
          mhCertPassword: '',
          environment: '00',
          smtpHost: '',
          smtpPort: '',
          smtpUser: '',
          smtpPass: '',
          logoUrl: ''
        }
      });
    }

    let settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
      include: { tenant: true } // Para obtener environment
    });

    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId: user.tenantId,
          companyName: 'Mi Empresa',
          primaryColor: '#0F172A',
        },
        include: { tenant: true }
      });
    }

    // Ocultar contraseñas antes de enviar al front
    const maskedSettings = {
      ...settings,
      mhApiPassword: settings?.mhApiPassword ? '********' : '',
      mhCertPassword: settings?.mhCertPassword ? '********' : '',
      smtpPass: settings?.smtpPass ? '********' : '',
      environment: settings?.tenant?.environment || '00', // extraído del tenant
      hasCert: !!settings?.mhCertPath
    };

    res.json({ success: true, data: maskedSettings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.tenantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (user.tenantId === 'sandbox-tenant') {
      return res.json({ success: true, message: 'Configuración actualizada en memoria (Sandbox)' });
    }

    const {
      companyName,
      commercialName,
      economicActivity,
      phone,
      address,
      establecimiento,
      puntoVenta,
      nrc,
      email,
      primaryColor,
      secondaryColor,
      mhNit,
      mhApiPassword,
      mhCertPassword,
      environment,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass
    } = req.body;

    // Validación mínima: nombre de empresa y NIT
    if (!companyName?.trim()) {
      return res.status(400).json({ success: false, error: 'El campo "Razón Social" es obligatorio.' });
    }
    if (!mhNit?.trim()) {
      return res.status(400).json({ success: false, error: 'El campo "NIT del Emisor" es obligatorio.' });
    }

    const dataToUpdate: any = {
      companyName,
      commercialName,
      economicActivity,
      phone,
      address,
      establecimiento,
      puntoVenta,
      nrc,
      email,
      primaryColor,
      secondaryColor,
      mhNit,
      smtpHost,
      smtpPort: (smtpPort && !isNaN(parseInt(smtpPort, 10))) ? parseInt(smtpPort, 10) : null,
      smtpUser,
    };

    // Sólo actualizar contraseñas si no vienen como máscaras (********)
    if (mhApiPassword && mhApiPassword !== '********') {
      dataToUpdate.mhApiPassword = mhApiPassword;
    }
    if (mhCertPassword && mhCertPassword !== '********') {
      dataToUpdate.mhCertPassword = mhCertPassword;
    }
    if (smtpPass && smtpPass !== '********') {
      dataToUpdate.smtpPass = smtpPass;
    }

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: dataToUpdate,
      create: {
        tenantId: user.tenantId,
        ...dataToUpdate,
        companyName: companyName || 'Mi Empresa',
      }
    });

    if (environment) {
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: { environment }
      });
    }

    // Devolver la configuración completa para actualizar UI
    const refreshed = await prisma.tenantSettings.findUnique({ where: { tenantId: user.tenantId } });
    res.json({ success: true, message: 'Configuración actualizada exitosamente', data: refreshed });
  } catch (error: any) {
    console.error('Error updating settings', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.tenantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (user.tenantId === 'sandbox-tenant') {
      return res.json({ success: true, logoUrl: '/uploads/logos/mock-logo.png', message: 'Logo subido exitosamente (Sandbox)' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }

    // Ruta de acceso pública para la imagen
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: { logoUrl },
      create: {
        tenantId: user.tenantId,
        companyName: 'Mi Empresa',
        logoUrl
      }
    });

    res.json({ success: true, logoUrl, message: 'Logo subido exitosamente' });
  } catch (error: any) {
    console.error("Error uploadLogo", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const uploadCertificate = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.tenantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se subió ningún archivo p12' });
    }

    const certPath = req.file.path; // Ruta absoluta o relativa al certificado

    await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: { mhCertPath: certPath },
      create: {
        tenantId: user.tenantId,
        companyName: 'Mi Empresa',
        mhCertPath: certPath
      }
    });

    res.json({ success: true, message: 'Certificado subido exitosamente' });
  } catch (error: any) {
    console.error("Error uploadCertificate", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
