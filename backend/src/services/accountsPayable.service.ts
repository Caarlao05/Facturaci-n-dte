import prisma from '../lib/prisma';

export const receiveSupplierInvoice = async (payload: any, tenantId: string) => {
  // Validamos que sea un JSON válido de Hacienda
  if (!payload || !payload.identificacion || !payload.identificacion.codigoGeneracion) {
    throw new Error("Formato DTE inválido");
  }

  // Revisar si ya existe
  const existing = await prisma.receivedInvoice.findUnique({
    where: { generationCode: payload.identificacion.codigoGeneracion }
  });

  if (existing) {
    throw new Error("Este DTE ya fue importado previamente.");
  }

  const newReceivedInvoice = await prisma.receivedInvoice.create({
    data: {
      tenantId, // Guardar bajo la empresa actual
      generationCode: payload.identificacion.codigoGeneracion,
      receptionStamp: payload.selloRecibido || 'PENDING',
      supplierNit: payload.emisor.nit,
      supplierName: payload.emisor.nombre,
      totalAmount: payload.resumen.totalPagar,
      status: 'PENDING_APPROVAL'
    }
  });

  return newReceivedInvoice;
};

export const approveInvoice = async (id: string) => {
  const invoice = await prisma.receivedInvoice.update({
    where: { id },
    data: { status: 'APPROVED' } // Aquí cambiaría el estatus para pasar a cola de pago
  });
  return invoice;
};
