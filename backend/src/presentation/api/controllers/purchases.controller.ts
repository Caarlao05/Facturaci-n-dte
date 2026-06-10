import { Request, Response } from 'express';
import prisma from '../../../config/database';
import { receiveSupplierInvoice } from '../../../application/tenant/accountsPayable.service';

export const getPurchases = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const purchases = await prisma.receivedInvoice.findMany({
      where: { tenantId },
      orderBy: { receptionDate: 'desc' }
    });

    res.json(purchases);
  } catch (error: any) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Error obteniendo las compras DTE.' });
  }
};

import fs from 'fs';

export const importPurchase = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    let payload;
    
    // Verificamos si subió un archivo o si envió JSON directo
    if (req.file) {
      const fileString = fs.readFileSync(req.file.path, 'utf8');
      payload = JSON.parse(fileString);
      // Eliminar el archivo temporal
      fs.unlinkSync(req.file.path);
    } else if (req.body && Object.keys(req.body).length > 0) {
      payload = req.body;
    } else {
      return res.status(400).json({ error: 'No se envió ningún archivo JSON válido.' });
    }

    const newPurchase = await receiveSupplierInvoice(payload, tenantId);

    // Opcional: Si quieres registrar al proveedor automáticamente en el catálogo de clientes/proveedores
    const existingProvider = await prisma.customer.findFirst({
      where: {
        tenantId,
        nit: payload.emisor.nit
      }
    });

    if (!existingProvider) {
      await prisma.customer.create({
        data: {
          tenantId,
          name: payload.emisor.nombre,
          nit: payload.emisor.nit,
          email: payload.emisor.correo || null,
          phone: payload.emisor.telefono || null
        }
      });
    }

    res.status(201).json({ message: 'DTE importado con éxito', data: newPurchase });
  } catch (error: any) {
    console.error('Error importing purchase:', error);
    res.status(400).json({ error: error.message || 'Error procesando el archivo JSON.' });
  }
};
