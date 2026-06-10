import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export const sendDTEEmail = async (
  toEmail: string,
  customerName: string,
  generationCode: string,
  pdfPath: string,
  jsonString: string,
  paymentUrl?: string,
  companyName?: string,
  logoUrl?: string,
  tenantSettings?: any
) => {
  // Credenciales SMTP (Prioridad a configuración del tenant, sino usa entorno)
  const o365Email = tenantSettings?.smtpUser || process.env.O365_EMAIL;
  const o365Password = tenantSettings?.smtpPass || process.env.O365_PASSWORD;
  const smtpHost = tenantSettings?.smtpHost || 'smtp.office365.com';
  const smtpPort = tenantSettings?.smtpPort || 587;

  if (!o365Email || !o365Password) {
    console.warn("⚠️  [Email Service] O365_EMAIL u O365_PASSWORD no configurados. Simulando envío de correo.");
    console.log(`📩 Correo simulado generado para ${toEmail} con adjuntos PDF y JSON.`);
    return true;
  }

  try {
    // Configuración del transporte SMTP para Office 365
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      requireTLS: true,
      auth: {
        user: o365Email,
        pass: o365Password,
      },
    });

    const jsonContent = Buffer.from(jsonString, 'utf-8');

    // Diseño estilo "Netlify" (limpio, elegante, profesional)
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              
              <!-- Contenedor Principal -->
              <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.02); overflow: hidden;">
                
                <!-- Header (Accent top border) -->
                <tr>
                  <td style="height: 4px; background-color: #D4AF37;"></td>
                </tr>

                <!-- Contenido -->
                <tr>
                  <td style="padding: 40px;">
                    <div style="background-color: ${tenantSettings?.primaryColor || '#0f172a'}; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      ${logoUrl 
                        ? `<img src="${logoUrl}" alt="${companyName || 'Empresa'}" style="max-height: 80px; max-width: 250px;">`
                        : `<h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">${companyName || 'Empresa'}</h1>`
                      }
                    </div>
          
                    <div style="padding: 40px 30px; background-color: #ffffff;">
                      <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">Estimado/a <strong>${customerName}</strong>,</p>
                      
                      <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 30px;">
                        Adjuntamos su <strong>Comprobante de Crédito Fiscal Electrónico (DTE)</strong> correspondiente a sus servicios recientes. 
                        Puede descargar el documento en formato PDF o utilizar el enlace de pago a continuación si aplica.
                      </p>
                      
                      <div style="background-color: #f8fafc; border-left: 4px solid ${tenantSettings?.secondaryColor || '#D4AF37'}; padding: 20px; border-radius: 4px; margin-bottom: 35px;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 600;">Código de Generación</p>
                        <p style="margin: 0; font-size: 18px; color: #0f172a; font-family: monospace; font-weight: 700; letter-spacing: 1px;">${generationCode}</p>
                      </div>
    `;

    if (paymentUrl && paymentUrl !== "N/A") {
      htmlContent += `
                    <!-- Botón de Pago -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                      <tr>
                        <td align="center">
                          <a href="${paymentUrl}" style="display: inline-block; padding: 14px 30px; background-color: ${tenantSettings?.secondaryColor || '#D4AF37'}; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 6px; font-size: 16px; letter-spacing: 0.5px;">Pagar Factura en Línea</a>
                        </td>
                      </tr>
                    </table>
      `;
    }

    htmlContent += `
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    
                    <p style="font-size: 14px; color: #94a3b8; text-align: center; margin: 0;">
                      Si tiene alguna pregunta, no dude en contactarnos respondiendo a este correo.
                    </p>
                  </div>
                  
                  <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      Documento Tributario Electrónico emitido por <strong>${companyName || 'Nuestra Empresa'}</strong>
                    </p>
                  </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      Este es un mensaje generado automáticamente. Por favor, no respondas a este correo.
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">
                      © ${new Date().getFullYear()} ${companyName || 'G&G Solutions'}. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Enviar el correo
    const info = await transporter.sendMail({
      from: `"${companyName || 'Facturación Electrónica'}" <${o365Email}>`, // El 'from' debe coincidir con el usuario autenticado en O365
      to: toEmail,
      subject: `Documento Tributario Electrónico - ${generationCode}`,
      text: `Hola ${customerName},\n\nAdjuntamos su Documento Tributario Electrónico (DTE) con código de generación ${generationCode}.\n\nGracias por su preferencia.\n${companyName || 'G&G Solutions'}.`,
      html: htmlContent,
      attachments: [
        {
          filename: `${generationCode}.pdf`,
          path: pdfPath, // Nodemailer puede leer directamente desde el path
          contentType: 'application/pdf'
        },
        {
          filename: `${generationCode}.json`,
          content: jsonContent,
          contentType: 'application/json'
        }
      ]
    });

    console.log(`✅ Correo DTE enviado exitosamente a ${toEmail}. MessageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error("❌ Error enviando correo vía Office 365:", error.message);
    throw new Error("No se pudo enviar el correo al cliente a través de Office 365.");
  }
};
