import axios from 'axios';
import { signDTEJWS } from '../security/firmador.service';

// MH URLs (Ambiente de Pruebas)
const MH_AUTH_URL = 'https://apitest.dtes.mh.gob.sv/seguridad/auth';
const MH_RECEPCION_URL = 'https://apitest.dtes.mh.gob.sv/fesv/recepciondte';

let mhToken: string | null = null;
let tokenExpiresAt: number = 0;

export const authMH = async (): Promise<string> => {
  const nit = process.env.MH_NIT;
  const pwd = process.env.MH_API_PASSWORD;

  if (!nit || !pwd) {
    console.warn("⚠️  [MH API] Faltan credenciales (MH_NIT, MH_API_PASSWORD). Usando token simulado.");
    return "mock_mh_token_12345";
  }

  if (mhToken && Date.now() < tokenExpiresAt) {
    return mhToken;
  }

  try {
    const response = await axios.post(MH_AUTH_URL, {
      user: nit,
      pwd: pwd
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data.status === 'OK') {
      mhToken = response.data.body.token;
      tokenExpiresAt = Date.now() + (23 * 60 * 60 * 1000); 
      return mhToken as string;
    }
    throw new Error("MH Auth failed: " + JSON.stringify(response.data));
  } catch (error: any) {
    console.error("❌ Error autenticando con MH:", error.message);
    throw new Error("No se pudo autenticar con el Ministerio de Hacienda");
  }
};

export const signDTE = async (invoicePayload: any): Promise<string> => {
  // Utilizamos el nuevo servicio híbrido (Real/Simulado)
  const jws = await signDTEJWS(invoicePayload);
  return jws;
};

export const transmitDTE = async (signedDocument: string, generationCode: string, tipoDte: string = "01") => {
  const token = await authMH();

  if (token === "mock_mh_token_12345") {
    console.warn("⚠️  [MH Recepción] Entorno simulado activo. Sello mockeado generado.");
    return {
      success: true,
      receptionStamp: `MH-${Date.now()}-MOCK`,
      generationCode: generationCode,
      status: 'PROCESADO'
    };
  }

  try {
    const response = await axios.post(MH_RECEPCION_URL, {
      ambiente: "00", 
      idEnvio: Date.now(),
      version: 1,
      tipoDte: tipoDte,
      documento: signedDocument
    }, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.estado === 'RECHAZADO') {
      throw new Error(`DTE Rechazado por MH: ${JSON.stringify(response.data.observaciones)}`);
    }

    return {
      success: true,
      receptionStamp: response.data.selloRecibido,
      generationCode: generationCode,
      status: response.data.estado
    };
  } catch (error: any) {
    console.error("❌ Error transmitiendo DTE a MH:", error.message);
    throw new Error("Fallo en la recepción del Ministerio de Hacienda");
  }
};
