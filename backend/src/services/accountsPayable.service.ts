import prisma from '../lib/prisma';

export const receiveSupplierInvoice = async (payload: any) => {
  // Validamos que sea un JSON válido de Hacienda
  if (!payload || !payload.identificacion || !payload.identificacion.codigoGeneracion) {
    throw new Error("Formato DTE inválido");
  }

  const newReceivedInvoice = await prisma.receivedInvoice.create({
    data: {
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
