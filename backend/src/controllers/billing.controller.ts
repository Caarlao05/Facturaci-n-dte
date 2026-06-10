import { Request, Response } from 'express';
import { processNewInvoice } from '../services/billing.service';
import prisma from '../lib/prisma';

export const createInvoice = async (req: Request, res: Response) => {
  const { customer, items, dteType } = req.body; 
  
  if (!items || !items.length) {
    return res.status(400).json({ error: "Datos de cobro inválidos." });
  }

  try {
    // Buscar o crear el cliente basado en el NIT
    let customerRecord = await prisma.customer.findFirst({
      where: { nit: customer?.nit || "0000-000000-000-0" }
    });
    
    if (!customerRecord) {
      customerRecord = await prisma.customer.create({
        data: {
          name: customer?.razonSocial || "Consumidor Final",
          commercialName: customer?.nombreComercial || null,
          nit: customer?.nit || "0000-000000-000-0",
          nrc: customer?.nrc || null,
          dui: customer?.dui || null,
          economicActivityCode: customer?.actividadEconomica || null,
          email: customer?.email || "info@cliente.com",
          phone: customer?.telefono || null,
          address: customer?.direccion || null
        }
      });
    } else {
      // Si el cliente ya existe, actualizar sus datos con los del formulario (por si hubo cambios de teléfono, dirección, etc.)
      customerRecord = await prisma.customer.update({
        where: { id: customerRecord.id },
        data: {
          name: customer?.razonSocial || customerRecord.name,
          commercialName: customer?.nombreComercial !== undefined ? customer.nombreComercial : customerRecord.commercialName,
          nrc: customer?.nrc !== undefined ? customer.nrc : customerRecord.nrc,
          dui: customer?.dui !== undefined ? customer.dui : customerRecord.dui,
          economicActivityCode: customer?.actividadEconomica !== undefined ? customer.actividadEconomica : customerRecord.economicActivityCode,
          email: customer?.email || customerRecord.email,
          phone: customer?.telefono !== undefined ? customer.telefono : customerRecord.phone,
          address: customer?.direccion !== undefined ? customer.direccion : customerRecord.address
        }
      });
    }

    // Inyectar campos temporales necesarios para DTE específicos
    const enrichedCustomerRecord = {
      ...customerRecord,
      dui: customer?.dui,
      docRelacionado: customer?.docRelacionado,
      motivoContin: customer?.motivoContin,
      paisDestino: customer?.paisDestino,
      incoterm: customer?.incoterm
    };

    const tenantId = req.user?.tenantId;

    const result = await processNewInvoice(enrichedCustomerRecord, items, dteType, customer?.email, tenantId);
    
    if (result.success) {
      return res.status(201).json({ message: "DTE procesado exitosamente", invoice: result.data });
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
};
