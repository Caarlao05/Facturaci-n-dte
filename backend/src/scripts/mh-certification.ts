import { authMH, transmitDTE, signDTE } from '../integrations/hacienda.api';

/**
 * Script de Certificación MH.
 * Propósito: Generar N transmisiones consecutivas para cumplir 
 * las métricas de certificación del Sandbox de la DGII.
 */
const runCertificationSuite = async (numberOfTests: number = 100) => {
  console.log(`🚀 Iniciando Suite de Certificación MH (${numberOfTests} pruebas)...`);

  try {
    const token = await authMH();
    console.log(`✅ Autenticación Exitosa con MH. Token: ${token.substring(0, 15)}...`);
    
    let successes = 0;
    let failures = 0;

    for (let i = 1; i <= numberOfTests; i++) {
      const mockDte = {
        identificacion: {
          version: 1,
          ambiente: "00", // Pruebas
          tipoDte: "01",  // Factura Electrónica
          numeroControl: `DTE-01-MOCK-${i.toString().padStart(5, '0')}`,
          codigoGeneracion: `GEN-MOCK-${Date.now()}-${i}`,
        },
        // Payload truncado para propósito de demostración
        emisor: { nit: "12345678901234", nombre: "G&G Solutions" }
      };

      try {
        // 1. Firmamos el DTE con nuestro firmador JWS Mock
        const jwsFirmado = await signDTE(mockDte);

        // 2. Transmitimos al Ministerio
        const response = await transmitDTE(jwsFirmado, mockDte.identificacion.codigoGeneracion);
        
        console.log(`[Test ${i}/${numberOfTests}] ✅ Aprobado | Sello de Recepción: ${response.receptionStamp}`);
        successes++;
      } catch (err: any) {
        console.error(`[Test ${i}/${numberOfTests}] ❌ Fallido | Error: ${err.message}`);
        failures++;
      }

      // Pequeño delay para no saturar el servidor Sandbox de Hacienda (Rate Limiting)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n🎉 Suite Finalizada.`);
    console.log(`✅ Éxitos: ${successes} | ❌ Fallos: ${failures}`);

  } catch (error: any) {
    console.error("❌ Fallo Crítico en la inicialización:", error.message);
  }
};

// Ejecutamos (Podemos cambiar a 100 pruebas para el trámite final)
runCertificationSuite(5);
