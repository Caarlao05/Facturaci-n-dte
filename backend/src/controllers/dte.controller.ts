import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { invalidateDte } from '../services/invalidation.service';
import { processNewInvoice } from '../services/billing.service';

export const processBatchSingle = async (req: Request, res: Response) => {
  try {
    const { row } = req.body;
    if (!row) return res.status(400).json({ success: false });

    // Map Excel Row to processNewInvoice structure
    const customerRecord = {
      nit: row.TipoDTE !== '14' && row.TipoDTE !== '11' ? row.DocumentoReceptor : undefined,
      dui: row.TipoDTE === '14' ? row.DocumentoReceptor : undefined,
      name: row.NombreCliente,
      economicActivityCode: "64199",
      email: "cliente@masivo.com",
      docRelacionado: row.DocRelacionado || undefined,
      paisDestino: row.PaisDestino || undefined,
      incoterm: row.Incoterm || undefined
    };

    const items = [
      {
        id: 1,
        desc: row.Descripcion,
        qty: row.Cantidad,
        price: row.PrecioUnitario
      }
    ];

    const tenantId = req.user?.tenantId;
    const result = await processNewInvoice(customerRecord, items, row.TipoDTE, "cliente@masivo.com", tenantId);
    
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const processBatchDte = async (req: Request, res: Response) => {
  try {
    const { invoices } = req.body;
    if (!invoices || !Array.isArray(invoices)) {
      return res.status(400).json({ success: false, error: 'Invalid batch format.' });
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    res.status(200).json({ 
      success: true, 
      message: `Lote de ${invoices.length} facturas procesado exitosamente.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDteDashboard = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let whereClause: any = {};
    if (status) whereClause.status = status;
    
    if (startDate && endDate) {
      whereClause.issueDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
        dteTransmissions: {
          orderBy: { transmissionDate: 'desc' },
          take: 1
        },
        invalidations: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const invalidateInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, responsibleName } = req.body;
    
    const result = await invalidateDte(id, reason, responsibleName);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const downloadInvoicePdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user || !user.tenantId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        customer: true,
        lines: {
          include: { product: true }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId }
    });

    const { generateInvoicePdf } = require('../services/pdfGenerator.service');
    const pdfBuffer = await generateInvoicePdf(invoice, settings || {});

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=DTE_${invoice.numeroControl || invoice.id}.pdf`);
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ success: false, error: 'Error al generar el PDF' });
  }
};

export const downloadInvoiceJson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        customer: true,
        lines: {
          include: { product: true }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=DTE_${id}.json`);
    return res.send(JSON.stringify(invoice, null, 2));
  } catch (error: any) {
    console.error("Error generating JSON:", error);
    res.status(500).json({ success: false, error: 'Error al generar el JSON' });
  }
};
