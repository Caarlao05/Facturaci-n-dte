import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import qrcode from 'qrcode';
import { numeroALetras } from '../utils/numberToLetters';

export const generateInvoicePdf = async (invoiceData: any, settings: any, tenant: any = {}): Promise<Buffer> => {
  // Mapper del JSON para simular lo que exige MH según tu ejemplo
  // Se usa invoiceData si existe, sino se usa fallback del ejemplo
  
  const subtotal = invoiceData.lines && invoiceData.lines.length > 0
    ? invoiceData.lines.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) * Number(curr.historicalUnitPrice)), 0)
    : Number(invoiceData.totalAmount || 0);

  const iva = subtotal * 0.13;
  // Si invoiceData tiene ivaRetenido lo usamos, sino asumimos el 1% si es Gran Contribuyente (ejemplo: 50.11 para 5011.20)
  const ivaRetenido = invoiceData.ivaRetenido !== undefined ? Number(invoiceData.ivaRetenido) : (subtotal >= 100 ? subtotal * 0.01 : 0);
  const retencionRenta = invoiceData.retencionRenta !== undefined ? Number(invoiceData.retencionRenta) : 0;
  const montoTotalOperacion = subtotal + iva;
  const totalPagar = montoTotalOperacion - ivaRetenido - retencionRenta;

  const nexxusLogoPath = path.join(__dirname, '../../../nexxo/public/logo.png');
  let nexxusLogoUrl = '';
  if (fs.existsSync(nexxusLogoPath)) {
    nexxusLogoUrl = `file://${nexxusLogoPath}`;
  }

  const codigoGeneracion = invoiceData.generationCode || invoiceData.id || '0F1C338C-E644-4D3E-A576-BB4C2AD807EA';
  
  const qrUrl = `https://admin.factura.gob.sv/consulta/${codigoGeneracion}`;
  const qrCodeBase64 = await qrcode.toDataURL(qrUrl, { margin: 1, width: 150 });

  const templateData = {
    // ESTILOS
    primaryColor: settings.primaryColor || '#000000',
    secondaryColor: settings.secondaryColor || '#808080',
    qrCodeBase64: qrCodeBase64,

    // EMISOR
    logoUrl: settings.logoUrl ? `http://localhost:3000${settings.logoUrl}` : '',
    companyName: settings.companyName || tenant.businessName || 'G&G SOLUTIONS, SOCIEDAD POR ACCIONES SIMPLIFICADA DE CAPITAL VARIABLE',
    emisorNombreComercial: settings.commercialName || settings.companyName || tenant.businessName || 'G&G SOLUTIONS, SOCIEDAD POR ACCIONES SIMPLIFICADA DE CAPITAL VARIABLE',
    emisorActividad: settings.economicActivity || 'CONSULTORÍAS Y GESTIÓN DE SERVICIOS INFORMÁTICOS',
    emisorNit: tenant.nit || settings.mhNit || '0614-100424-101-5',
    emisorNrc: settings.nrc || tenant.nrc || '342043-9',
    emisorEmail: settings.email || settings.smtpUser || 'rafaelgomez@ggsolutionssv.com',
    emisorPhone: settings.phone || '7868-8228',
    emisorDir: settings.address || 'CALLE ITSHUATAN, POLIGONO J -33, COLONIA JARDINES DE MERLIOT DISTRITO DE SANTA TECLA MUNICIPIO DE LA LIBERTAD SUR DEPARTAMENTO DE LA LIBERTAD',
    establecimiento: settings.establecimiento || 'M001',
    puntoVenta: settings.puntoVenta || 'P001',
    
    // DTE INFO
    codigoGeneracion: invoiceData.generationCode || invoiceData.id || '',
    numeroControl: invoiceData.controlNumber || '',
    selloRecibido: invoiceData.status === 'PROCESSED' ? invoiceData.mhStamp : '',
    date: new Date(invoiceData.issueDate || new Date()).toLocaleString('es-SV', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
    versionJson: '3',

    // RECEPTOR
    clientName: invoiceData.customer?.name || 'SOCIEDAD DE AHORRO Y CREDITO MULTIMONEY, S.A.',
    clientDocType: invoiceData.customer?.dui ? 'DUI' : 'NIT',
    clientDoc: invoiceData.customer?.dui || invoiceData.customer?.nit || '0614-220313-102-0',
    clientNrc: invoiceData.customer?.nrc || '224185-7',
    clientActividad: invoiceData.customer?.economicActivityCode || invoiceData.customer?.activity || 'OTRAS ENTIDADES FINANCIERAS',
    clientDir: invoiceData.customer?.address || 'BOULEVARD DEL HIPODROMO COLONIA SAN BENITO CENTRO COMERCIAL BAMBU ZONA ROSA NIVEL 3 OFICINAS, DISTRITO DE SAN SALVADOR, MUNICIPIO DE SAN SALVADOR CENTRO, DEPARTAMENTO DE SAN SALVADOR',
    clientComercial: invoiceData.customer?.commercialName || '-',
    clientEmail: invoiceData.customer?.email || 'sacmmsvfac@multimoney.com',
    clientPhone: invoiceData.customer?.phone || '6182-6877',

    // ITEMS
    items: invoiceData.lines && invoiceData.lines.length > 0 ? invoiceData.lines.map((i: any, index: number) => ({
      num: index + 1,
      description: i.product?.name || 'Producto',
      quantity: Number(i.quantity),
      unitName: 'Unidad',
      unitPrice: Number(i.historicalUnitPrice),
      discount: 0,
      otrosMontos: 0,
      ventasNoSujetas: 0,
      ventasExentas: 0,
      ventasGravadas: Number(i.quantity) * Number(i.historicalUnitPrice)
    })) : [],

    // TOTALS
    subtotal: subtotal,
    iva: iva,
    ivaRetenido: ivaRetenido,
    retencionRenta: retencionRenta,
    montoTotalOperacion: montoTotalOperacion,
    totalPagar: totalPagar,
    totalLetras: numeroALetras(totalPagar),
    observaciones: '30 Dias Credito',
    condicionOperacion: 'A CRÉDITO',
    nexxusLogoUrl: nexxusLogoUrl
  };

  const templatePath = path.join(__dirname, '../templates/invoice.ejs');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');

  const html = ejs.render(templateHtml, templateData);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });

  const pdfBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '15px',
      right: '15px',
      bottom: '15px',
      left: '15px'
    }
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
};
