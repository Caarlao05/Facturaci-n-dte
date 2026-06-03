import prisma from '../lib/prisma';
import { transmitDTE, signDTE } from '../integrations/hacienda.api';
import { generateInvoicePdf } from './pdfGenerator.service';
import { sendDTEEmail } from './email.service';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { uploadToAzureBlob } from './storage.service';
import { buildDTEPayload } from './dtePayloadBuilders';

export const processNewInvoice = async (customerRecord: any, items: any[], dteType: string = '01', customerEmail?: string, tenantId?: string) => {
  // We use Prisma Transactions to ensure ACID compliance
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate totals (in a real scenario, we'd query product prices from DB)
      let subTotal = 0;
      
      const invoiceLinesData = items.map(item => {
        const lineSubtotal = item.qty * item.price;
        subTotal += lineSubtotal;
        return {
          quantity: item.qty,
          historicalUnitPrice: item.price,
          subtotal: lineSubtotal
        };
      });

      const tipoDteCode = dteType || '01';
      const totalTaxes = ['14', '11'].includes(tipoDteCode) ? 0 : subTotal * 0.13;
      const montoTotalOperacion = subTotal + totalTaxes;
      
      // Retención de IVA 1% si es CCF (03) y el subtotal es >= 100
      const ivaRete1 = (tipoDteCode === '03' && subTotal >= 100) ? (subTotal * 0.01) : 0;
      
      // Retención de Renta 10% si es FSE (14)
      const renta = (tipoDteCode === '14') ? (subTotal * 0.10) : 0;
      
      const totalPagar = montoTotalOperacion - ivaRete1 - renta;
      const totalAmount = montoTotalOperacion; // Para BD local 
      
      // Generar UUID del documento y Número de Control (Requisito MH)
      const generationCode = uuidv4().toUpperCase();
      
      // La regla de máscara exacta: DTE-[Tipo]-[Sucursal][Caja]-[Correlativo]
      const seqCorrelativo = Math.floor(Math.random() * 10000000); 
      const padCorrelativo = String(seqCorrelativo).padStart(15, '0');
      const numeroControl = `DTE-${tipoDteCode}-S001P001-${padCorrelativo}`;

      // 2. Generate JSON payload for DTE
      const totals = { subTotal, totalTaxes, montoTotalOperacion, ivaRete1, renta, totalPagar };
      const dtePayload = buildDTEPayload(
        tipoDteCode, 
        customerRecord, 
        customerEmail || "", 
        items, 
        generationCode, 
        numeroControl, 
        totals
      );

      // 3. Sign Document (MH Firmador Real / Simulado)
      const signedDte = await signDTE(dtePayload);

      // 4. Send to MH API (Real / Simulado)
      const mhResponse = await transmitDTE(signedDte, generationCode, tipoDteCode);

      if (!mhResponse.success) {
        throw new Error("Transmisión al MH falló. Rollback de base de datos.");
      }

      // 5. Persist Invoice in DB with the MH Reception Stamp
      const newInvoice = await tx.invoice.create({
        data: {
          customerId: customerRecord.id,
          tenantId: tenantId || null,
          generationCode: mhResponse.generationCode,
          receptionStamp: mhResponse.receptionStamp,
          totalAmount: totalAmount,
          totalTaxes: totalTaxes,
          issueDate: new Date(),
          status: 'APPROVED',
          lines: {
            create: invoiceLinesData
          }
        }
      });

      // 6. Log transmission
      await tx.dteTransmission.create({
        data: {
          invoiceId: newInvoice.id,
          transmissionDate: new Date(),
          requestPayload: JSON.stringify(signedDte),
          responsePayload: JSON.stringify(mhResponse),
          httpStatus: 200,
          mhStatusCode: mhResponse.status
        }
      });

      // 7. Generate PDF y Enviar Correo (Asíncrono en backend)
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      
      const pdfPath = path.join(tempDir, `${generationCode}.pdf`);
      
      let tenantSettings = null;
      let tenant = null;
      if (tenantId) {
        tenantSettings = await tx.tenantSettings.findUnique({ where: { tenantId } });
        tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      }

      const invoiceForPdf = {
        id: newInvoice.id,
        generationCode: mhResponse.generationCode,
        controlNumber: numeroControl,
        status: 'PROCESSED',
        mhStamp: mhResponse.receptionStamp,
        issueDate: newInvoice.issueDate,
        customer: {
          name: customerRecord.name,
          nit: customerRecord.nit,
          dui: (customerRecord as any).dui,
          nrc: customerRecord.nrc,
          email: customerRecord.email,
          activity: customerRecord.economicActivityCode
        },
        lines: items.map(item => ({
          product: { name: item.desc },
          quantity: item.qty,
          historicalUnitPrice: item.price
        }))
      };

      const pdfBuffer = await generateInvoicePdf(invoiceForPdf, tenantSettings || {}, tenant || {});
      fs.writeFileSync(pdfPath, pdfBuffer);

      // 8. Upload to Azure Blob Storage
      const jsonPath = path.join(tempDir, `${generationCode}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(dtePayload));
      const pdfBlobUrl = await uploadToAzureBlob(pdfPath, `${generationCode}.pdf`);
      const jsonBlobUrl = await uploadToAzureBlob(jsonPath, `${generationCode}.json`);

      // Actualizar registro con Blob URLs
      await tx.invoice.update({
        where: { id: newInvoice.id },
        data: { pdfBlobUrl }
      });

      // 9. Send Email
      const destinationEmail = customerEmail || customerRecord.email || 'info@cliente.com';
      await sendDTEEmail(destinationEmail, customerRecord.id, generationCode, pdfPath, JSON.stringify(dtePayload, null, 2), "N/A");

      return { ...newInvoice, pdfBlobUrl, jsonPayload: dtePayload };
    }, { timeout: 30000, maxWait: 10000 });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error processing invoice:", error);
    return { success: false, error: error.message };
  }
};
