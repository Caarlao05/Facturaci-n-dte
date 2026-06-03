import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export const sendDTEEmail = async (
  toEmail: string,
  customerName: string,
  generationCode: string,
  pdfPath: string,
  jsonString: string,
  paymentUrl?: string
) => {
  // Credenciales de Office 365 proporcionadas por el entorno
  const o365Email = process.env.O365_EMAIL;
  const o365Password = process.env.O365_PASSWORD;

  if (!o365Email || !o365Password) {
    console.warn("⚠️  [Email Service] O365_EMAIL u O365_PASSWORD no configurados. Simulando envío de correo.");
    console.log(`📩 Correo simulado generado para ${toEmail} con adjuntos PDF y JSON.`);
    return true;
  }

  try {
    // Configuración del transporte SMTP para Office 365
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      requireTLS: true,
      auth: {
        user: o365Email,
        pass: o365Password,
      },
    });

    const jsonContent = Buffer.from(jsonString, 'utf-8');

    let htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #0b1121;">
        <h2 style="color: #D4AF37;">G&G Solutions</h2>
        <p>Hola <strong>${customerName}</strong>,</p>
        <p>Adjuntamos su Documento Tributario Electrónico (DTE) correspondiente a su reciente compra.</p>
        <p>Código de Generación: <b>${generationCode}</b></p>
    `;

    if (paymentUrl && paymentUrl !== "N/A") {
      htmlContent += `<br/><a href="${paymentUrl}" style="background-color:#D4AF37; color:#0b1121; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold;">💳 PAGAR FACTURA AHORA</a><br/><br/>`;
    }

    htmlContent += `
        <hr />
        <p style="font-size: 12px; color: gray;">Este es un mensaje automático, por favor no responda.</p>
      </div>
    `;

    // Enviar el correo
    const info = await transporter.sendMail({
      from: `"G&G Solutions Facturación" <${o365Email}>`, // El 'from' debe coincidir con el usuario autenticado en O365
      to: toEmail,
      subject: `Documento Tributario Electrónico - ${generationCode}`,
      text: `Hola ${customerName},\n\nAdjuntamos su Documento Tributario Electrónico (DTE) con código de generación ${generationCode}.\n\nGracias por su preferencia.\nG&G Solutions.`,
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
