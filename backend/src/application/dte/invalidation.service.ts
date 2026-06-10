import prisma from '../../config/database';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const invalidateDte = async (invoiceId: string, reason: string, responsibleName: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { dteTransmissions: true }
  });

  if (!invoice || !invoice.generationCode || !invoice.receptionStamp) {
    throw new Error('La factura no existe o no ha sido sellada por Hacienda.');
  }

  if (invoice.status === 'INVALIDATED') {
    throw new Error('La factura ya se encuentra anulada.');
  }

  // Estructura oficial del JSON de Anulación (Ministerio de Hacienda)
  const invalidationPayload = {
    identificacion: {
      version: 2,
      ambiente: "00", // Pruebas
      codigoGeneracion: uuidv4().toUpperCase()
    },
    documentoAFirmar: {
      codigoGeneracion: invoice.generationCode,
      selloRecibido: invoice.receptionStamp,
      numeroControl: invoice.generationCode,
      fecEmi: invoice.issueDate.toISOString().split('T')[0],
      montoIva: invoice.totalTaxes.toString(),
      codigoGeneracionR: null,
      tipoDocumento: "01",
      tipoEstablecimiento: "01"
    },
    motivo: {
      tipoAnulacion: 2, // Catálogo 024: 1 (Resciliación), 2 (Resolución)
      motivoAnulacion: reason,
      nombreResponsable: responsibleName,
      tipDocResponsable: "13", // Catálogo 022: 13 (DUI)
      numDocResponsable: "00000000-0"
    }
  };

  // Enviar a firmar
  const firmadorUrl = process.env.FIRMADOR_URL || "http://localhost:8000";
  let signedDocument = "";
  try {
    const firmadorRes = await axios.post(`${firmadorUrl}/firmar/anulacion`, invalidationPayload);
    signedDocument = firmadorRes.data.body || "MOCK_SIGNATURE_INVALIDATION";
  } catch (error) {
    console.warn("⚠️  Firmador no disponible. Generando sello de anulación SIMULADO.");
    signedDocument = "MOCK_SIGNATURE_INVALIDATION";
  }

  // Simular transmisión a API del MH (/fesv/recepciondte/invalidacion)
  const mhStatusCode = "PROCESADO";
  const responsePayload = { message: "Invalidación Aceptada (MOCK)" };

  // Tx ACID: Guardar registro de invalidación y actualizar factura original
  const result = await prisma.$transaction(async (tx) => {
    const invalidationRecord = await tx.dteInvalidation.create({
      data: {
        invoiceId: invoice.id,
        reason,
        responsibleName,
        requestPayload: invalidationPayload as any,
        responsePayload: responsePayload,
        mhStatusCode
      }
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: 'INVALIDATED' }
    });

    return invalidationRecord;
  });

  return result;
};
