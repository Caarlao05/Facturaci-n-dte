import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

export const generateDTEPdf = async (invoiceData: any, generationCode: string, receptionStamp: string, outputPath: string, tenantSettings?: any): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Configuraciones de Diseño Premium
      const doc = new PDFDocument({ margin: 40, size: 'LETTER', bufferPages: true });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Paleta de Colores Dinámica (Fallback a Slate)
      const brandDark = tenantSettings?.primaryColor || '#0F172A';     
      const brandAccent = tenantSettings?.secondaryColor || '#3B82F6';   
      const textPrimary = '#1E293B';   // Slate 800
      const textSecondary = '#64748B'; // Slate 500
      const borderSoft = '#E2E8F0';    // Slate 200
      const bgLight = '#F8FAFC';       // Slate 50
      const bgZebra = '#F1F5F9';       // Slate 100
      const white = '#FFFFFF';
      
      const dteType = invoiceData.dteType || '01';

      // Textos Oficiales MH
      const dteTitles: Record<string, string> = {
        '01': 'FACTURA ELECTRÓNICA',
        '03': 'COMPROBANTE DE CRÉDITO FISCAL',
        '04': 'NOTA DE REMISIÓN',
        '05': 'NOTA DE CRÉDITO',
        '06': 'NOTA DE DÉBITO',
        '11': 'FACTURA DE EXPORTACIÓN',
        '14': 'FACTURA DE SUJETO EXCLUIDO',
        '15': 'COMPROBANTE DE DONACIÓN'
      };
      const titleStr = dteTitles[dteType] || 'DOCUMENTO TRIBUTARIO ELECTRÓNICO';

      // --- LOGO Y CABECERA DEL EMISOR ---
      
      // Rectángulo Superior Suave
      doc.roundedRect(40, 40, 532, 100, 8).fill(bgLight).stroke(borderSoft);
      
      // Dibujamos un logo estilizado o la imagen
      const logoX = 60;
      const logoY = 60;
      
      if (tenantSettings?.logoUrl) {
        // Asumiendo que logoUrl es del tipo /uploads/logos/archivo.png
        const localLogoPath = path.join(__dirname, '../../', tenantSettings.logoUrl);
        if (fs.existsSync(localLogoPath)) {
          doc.image(localLogoPath, logoX, logoY, { fit: [50, 50] });
        } else {
          // Fallback
          doc.roundedRect(logoX, logoY, 40, 40, 8).fill(brandDark);
          doc.font('Helvetica-Bold').fontSize(22).fillColor(white).text('C', logoX + 12, logoY + 10);
        }
      } else {
        doc.roundedRect(logoX, logoY, 40, 40, 8).fill(brandDark);
        doc.font('Helvetica-Bold').fontSize(22).fillColor(white).text('C', logoX + 12, logoY + 10);
      }

      // Info Emisor
      const companyName = tenantSettings?.companyName || 'Empresa Emisora, S.A. DE C.V.';
      const companyNit = tenantSettings?.mhNit || '0000-000000-000-0';

      doc.fillColor(brandDark).font('Helvetica-Bold').fontSize(12)
         .text(companyName, 120, 55);
      
      doc.fillColor(textSecondary).font('Helvetica').fontSize(8);
      doc.text('Consultorías y gestión de servicios', 120, 70);
      doc.text(`NIT: ${companyNit}  |  NRC: 123456-7`, 120, 82);
      doc.text('San Salvador, El Salvador', 120, 94);
      doc.text('contacto@empresa.com  |  2222-0000', 120, 106);

      // Titulo del DTE a la Derecha
      doc.fillColor(brandDark).font('Helvetica-Bold').fontSize(14)
         .text(titleStr, 300, 55, { align: 'right', width: 250 });
      doc.fillColor(brandAccent).font('Helvetica-Bold').fontSize(10)
         .text(`DTE-${dteType}-S001P001`, 300, 72, { align: 'right', width: 250 });
      doc.fillColor(textSecondary).font('Helvetica').fontSize(8)
         .text('Documento Aprobado por el Ministerio de Hacienda', 300, 86, { align: 'right', width: 250 });

      // --- BLOQUE DE IDENTIFICACIÓN (CÓDIGOS MH) ---
      let y = 160;
      
      // Generamos el QR
      const qrData = `https://admin.factura.gob.sv/consulta/${generationCode}`;
      const qrImage = await QRCode.toBuffer(qrData, { width: 85, margin: 0, color: { dark: brandDark, light: white } });
      doc.image(qrImage, 40, y, { width: 85 });

      // Caja de Codigos
      doc.roundedRect(140, y, 432, 85, 6).stroke(borderSoft);
      doc.fillColor(textSecondary).fontSize(7).font('Helvetica');
      doc.text('CÓDIGO DE GENERACIÓN (UUID)', 155, y + 10);
      doc.text('SELLO DE RECEPCIÓN', 155, y + 45);
      doc.text('FECHA Y HORA', 400, y + 10);
      doc.text('NÚMERO DE CONTROL', 400, y + 45);

      doc.fillColor(textPrimary).fontSize(10).font('Helvetica-Bold');
      doc.text(generationCode, 155, y + 22);
      doc.text(receptionStamp, 155, y + 57);
      
      doc.fillColor(textPrimary).fontSize(9);
      doc.text(new Date().toLocaleString('es-SV'), 400, y + 22);
      const padCorrelativo = String(Math.floor(Math.random() * 1000000)).padStart(15, '0');
      doc.text(`DTE-${dteType}-S001P001-${padCorrelativo}`, 400, y + 57);

      // --- DATOS DEL RECEPTOR ---
      y = 265;
      doc.roundedRect(40, y, 532, 80, 6).fill(bgLight).stroke(borderSoft);
      
      doc.fillColor(brandDark).font('Helvetica-Bold').fontSize(9)
         .text(dteType === '14' ? 'DATOS DEL SUJETO EXCLUIDO' : 'DATOS DEL CLIENTE', 55, y + 10);
      
      doc.moveTo(40, y + 25).lineTo(572, y + 25).stroke(borderSoft);

      doc.fillColor(textSecondary).fontSize(7).font('Helvetica');
      doc.text(dteType === '14' ? 'NOMBRE DEL SUJETO' : 'RAZÓN SOCIAL / NOMBRE', 55, y + 35);
      doc.text(dteType === '14' ? 'N° DE DOCUMENTO (DUI)' : 'NIT / PASAPORTE', 55, y + 55);
      doc.text('CORREO ELECTRÓNICO', 300, y + 35);
      
      if (['03', '05', '06'].includes(dteType)) {
        doc.text('NRC', 300, y + 55);
      } else if (dteType === '11') {
        doc.text('PAÍS DE DESTINO', 300, y + 55);
      }

      doc.fillColor(textPrimary).fontSize(9).font('Helvetica-Bold');
      doc.text(invoiceData.customerName || 'Cliente Genérico', 170, y + 34);
      
      // Mostramos DUI para 14, NIT para resto
      let docIdText = "0000-000000-000-0";
      if (dteType === '14') docIdText = invoiceData.customerDui || '00000000-0';
      if (dteType === '11') docIdText = 'EX-00123';
      doc.text(docIdText, 170, y + 54);

      doc.font('Helvetica');
      doc.text('contacto@cliente.com', 400, y + 34);
      
      if (['03', '05', '06'].includes(dteType)) {
        doc.text('123456-7', 400, y + 54);
      } else if (dteType === '11') {
        doc.text(invoiceData.paisDestino || 'ESTADOS UNIDOS (USA)', 400, y + 54);
      }

      // --- DOCUMENTOS RELACIONADOS (SOLO NOTA CREDITO/DEBITO) ---
      let bodyStartY = 365;
      if (['05', '06'].includes(dteType)) {
        doc.roundedRect(40, bodyStartY, 532, 40, 6).fill(white).stroke(borderSoft);
        doc.fillColor(textSecondary).fontSize(7).font('Helvetica-Bold').text('DOCUMENTO AFECTADO (UUID)', 55, bodyStartY + 10);
        doc.fillColor(textPrimary).fontSize(8).font('Helvetica').text(invoiceData.docRelacionado || 'N/A', 55, bodyStartY + 22);
        
        doc.fillColor(textSecondary).fontSize(7).font('Helvetica-Bold').text('MOTIVO', 300, bodyStartY + 10);
        doc.fillColor(textPrimary).fontSize(8).font('Helvetica').text(invoiceData.motivoContin || 'Devolución de mercadería', 300, bodyStartY + 22);
        bodyStartY += 55;
      }

      // --- TABLA DE CUERPO DEL DTE ---
      doc.roundedRect(40, bodyStartY, 532, 20, 6).fill(brandDark);
      doc.fillColor(white).font('Helvetica-Bold').fontSize(8);
      doc.text('CANT', 50, bodyStartY + 6);
      doc.text('DESCRIPCIÓN DEL BIEN O SERVICIO', 90, bodyStartY + 6);
      doc.text('PRECIO UNIT', 360, bodyStartY + 6, { align: 'right', width: 70 });
      doc.text('DESCUENTO', 440, bodyStartY + 6, { align: 'right', width: 60 });
      doc.text('SUBTOTAL', 510, bodyStartY + 6, { align: 'right', width: 50 });

      let rowY = bodyStartY + 28;
      let totalGravado = 0;

      invoiceData.items.forEach((item: any, i: number) => {
        // Zebra striping
        if (i % 2 === 0) {
          doc.rect(40, rowY - 4, 532, 20).fill(bgZebra);
        }
        
        const itemSubtotal = item.qty * item.price;
        totalGravado += itemSubtotal;

        doc.fillColor(textPrimary).font('Helvetica').fontSize(8);
        doc.text(item.qty.toString(), 50, rowY);
        doc.text(item.desc, 90, rowY, { width: 260, height: 12, lineBreak: false });
        doc.text('$' + item.price.toFixed(2), 360, rowY, { align: 'right', width: 70 });
        doc.text('$0.00', 440, rowY, { align: 'right', width: 60 });
        doc.text('$' + itemSubtotal.toFixed(2), 510, rowY, { align: 'right', width: 50 });
        
        rowY += 20;
      });

      // Dibujar línea inferior de la tabla
      doc.moveTo(40, rowY).lineTo(572, rowY).stroke(borderSoft);

      // --- TOTALES Y RESUMEN ---
      let footerY = rowY + 20;
      
      // Columna Izquierda: Condiciones, Incoterms, Letras
      doc.roundedRect(40, footerY, 300, 80, 6).fill(bgLight).stroke(borderSoft);
      doc.fillColor(textSecondary).fontSize(7).font('Helvetica-Bold').text('CONDICIÓN DE LA OPERACIÓN:', 50, footerY + 10);
      doc.fillColor(textPrimary).fontSize(8).font('Helvetica').text('CRÉDITO (30 DÍAS)', 50, footerY + 22);

      if (dteType === '11') {
        doc.fillColor(textSecondary).fontSize(7).font('Helvetica-Bold').text('INCOTERM DE EXPORTACIÓN:', 50, footerY + 40);
        doc.fillColor(textPrimary).fontSize(8).font('Helvetica').text(invoiceData.incoterm || 'FOB', 50, footerY + 52);
      } else {
        doc.fillColor(textSecondary).fontSize(7).font('Helvetica-Bold').text('TOTAL EN LETRAS:', 50, footerY + 40);
        doc.fillColor(textPrimary).fontSize(8).font('Helvetica').text('SUMA DE LETRAS AUTOMATIZADA CONFORME A LA LEY', 50, footerY + 52);
      }

      // Columna Derecha: Matemáticas
      doc.roundedRect(360, footerY, 212, 100, 6).stroke(borderSoft);
      
      let iva = 0;
      let renta = 0;
      
      if (!['11', '14'].includes(dteType)) iva = totalGravado * 0.13;
      if (dteType === '14') renta = totalGravado * 0.10;
      
      const totalPagar = totalGravado + iva - renta;

      const maths = [
        { label: 'Suma de Ventas:', val: totalGravado },
        { label: 'Descuentos:', val: 0 },
        { label: 'Sub-Total:', val: totalGravado }
      ];

      if (!['11', '14'].includes(dteType)) maths.push({ label: 'IVA (13%):', val: iva });
      if (dteType === '14') maths.push({ label: 'Retención Renta (10%):', val: -renta });
      
      let mathY = footerY + 10;
      maths.forEach(m => {
        doc.fillColor(textSecondary).fontSize(8).font('Helvetica').text(m.label, 370, mathY);
        const valStr = m.val < 0 ? `-$${Math.abs(m.val).toFixed(2)}` : `$${m.val.toFixed(2)}`;
        doc.fillColor(textPrimary).text(valStr, 490, mathY, { align: 'right', width: 70 });
        mathY += 15;
      });

      // Linea de total
      doc.moveTo(360, mathY).lineTo(572, mathY).stroke(borderSoft);
      mathY += 10;
      
      doc.fillColor(brandDark).fontSize(10).font('Helvetica-Bold').text('TOTAL A PAGAR:', 370, mathY);
      doc.fillColor(brandAccent).fontSize(12).text(`$${totalPagar.toFixed(2)}`, 490, mathY - 2, { align: 'right', width: 70 });

      // Footer
      const bottomY = doc.page.height - 40;
      doc.fillColor(textSecondary).fontSize(7).font('Helvetica').text('Este documento es una representación impresa de un Documento Tributario Electrónico (DTE) conforme al Modelo de Facturación del Ministerio de Hacienda de El Salvador.', 40, bottomY, { align: 'center', width: 532 });

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};
