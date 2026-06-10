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
    const base64 = fs.readFileSync(nexxusLogoPath).toString('base64');
    nexxusLogoUrl = `data:image/png;base64,${base64}`;
  }

  let customLogoPath = '';
  if (settings.logoUrl) {
    // Intentamos resolver la ruta del logo subido, asumiendo que es relativa a la raíz del backend o workspace
    const tryPath = path.join(process.cwd(), settings.logoUrl);
    const tryPath2 = path.join(__dirname, '../../..', settings.logoUrl); // fallback si corre desde dist
    if (fs.existsSync(tryPath)) customLogoPath = tryPath;
    else if (fs.existsSync(tryPath2)) customLogoPath = tryPath2;
  }

  let logoUrlBase64 = '';
  if (customLogoPath && fs.existsSync(customLogoPath)) {
    const ext = path.extname(customLogoPath).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.svg' ? 'image/svg+xml' : 'image/png';
    const base64 = fs.readFileSync(customLogoPath).toString('base64');
    logoUrlBase64 = `data:${mime};base64,${base64}`;
  }

  const codigoGeneracion = invoiceData.generationCode || invoiceData.id || '0F1C338C-E644-4D3E-A576-BB4C2AD807EA';
  
  const qrUrl = `https://admin.factura.gob.sv/consulta/${codigoGeneracion}`;
  const qrCodeBase64 = await qrcode.toDataURL(qrUrl, { margin: 1, width: 150 });

  const templateData = {
    // ESTILOS
    primaryColor: settings.primaryColor || '#1e40af',
    secondaryColor: settings.secondaryColor || '#0f172a',
    qrCodeBase64: qrCodeBase64,

    // EMISOR
    logoUrl: logoUrlBase64,
    companyName: settings.companyName || tenant.businessName || 'Empresa Emisora S.A. de C.V.',
    emisorNombreComercial: settings.commercialName || settings.companyName || tenant.businessName || 'Empresa Emisora',
    emisorActividad: settings.economicActivity || 'Venta de Productos y Servicios',
    emisorNit: settings.mhNit || tenant.nit || '1234-567890-001-2',
    emisorNrc: settings.nrc || tenant.nrc || '00000-0',
    emisorEmail: settings.email || settings.smtpUser || 'info@empresa.com',
    emisorPhone: settings.phone || '2222-2222',
    emisorDir: settings.address || 'San Salvador, El Salvador',
    establecimiento: settings.establecimiento || 'M001',
    puntoVenta: settings.puntoVenta || 'P001',
    
    // DTE INFO
    codigoGeneracion: invoiceData.generationCode || invoiceData.id || '',
    numeroControl: invoiceData.controlNumber || '',
    selloRecibido: invoiceData.status === 'PROCESSED' ? (invoiceData.receptionStamp || invoiceData.mhStamp || '') : '',
    date: new Date(invoiceData.issueDate || new Date()).toLocaleString('es-SV', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
    versionJson: '3',

    // RECEPTOR
    clientName: (invoiceData.customer?.name || 'Cliente de Contado').toUpperCase(),
    clientDocType: invoiceData.customer?.dui ? 'DUI' : 'NIT',
    clientDoc: invoiceData.customer?.dui || invoiceData.customer?.nit || '0000-000000-000-0',
    clientNrc: invoiceData.customer?.nrc || '00000-0',
    clientActividad: (invoiceData.customer?.economicActivityCode || invoiceData.customer?.activity || 'Consumidor Final').toUpperCase(),
    clientDir: (invoiceData.customer?.address || 'San Salvador, El Salvador').toUpperCase(),
    clientComercial: (invoiceData.customer?.commercialName || invoiceData.customer?.name || '-').toUpperCase(),
    clientEmail: invoiceData.customer?.email || 'cliente@correo.com',
    clientPhone: invoiceData.customer?.phone || '2222-2222',

    // ITEMS
    items: invoiceData.lines && invoiceData.lines.length > 0 ? invoiceData.lines.map((i: any, index: number) => ({
      num: index + 1,
      description: i.description || i.product?.name || 'Producto',
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
