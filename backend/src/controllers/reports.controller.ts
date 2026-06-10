import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import dayjs from 'dayjs';

export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const whereClause: any = { tenantId, status: 'PROCESSED' };
    
    if (startDate && endDate) {
      whereClause.issueDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: { customer: true },
      orderBy: { issueDate: 'asc' }
    });

    let csvContent = 'Fecha Emision,Codigo Generacion,Cliente,NIT/DUI,Total Gravado,Total IVA,Total Operacion,Estado\n';
    
    invoices.forEach(inv => {
      const date = dayjs(inv.issueDate).format('YYYY-MM-DD');
      const total = Number(inv.totalAmount).toFixed(2);
      const iva = Number(inv.totalTaxes).toFixed(2);
      const base = (Number(inv.totalAmount) - Number(inv.totalTaxes)).toFixed(2);
      const document = inv.customer.nit || inv.customer.dui || '';
      
      csvContent += `${date},${inv.generationCode || ''},"${inv.customer.name}",${document},${base},${iva},${total},${inv.status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ventas_${dayjs().format('YYYYMMDD')}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPurchasesReport = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const whereClause: any = { tenantId };
    
    if (startDate && endDate) {
      whereClause.receptionDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const purchases = await prisma.receivedInvoice.findMany({
      where: whereClause,
      orderBy: { receptionDate: 'asc' }
    });

    let csvContent = 'Fecha Recepcion,Codigo Generacion,Proveedor,NIT,Total IVA,Total Operacion,Estado\n';
    
    purchases.forEach(p => {
      const date = dayjs(p.receptionDate).format('YYYY-MM-DD');
      csvContent += `${date},${p.generationCode},"${p.supplierName}",${p.supplierNit},${p.totalTaxes},${p.totalAmount},${p.status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=compras_${dayjs().format('YYYYMMDD')}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error generating purchases report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
