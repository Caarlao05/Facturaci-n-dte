import forge from 'node-forge';
import crypto from 'crypto';
import fs from 'fs';

/**
 * Convierte String/Buffer a Base64Url compatible con JWT/JWS
 */
function base64UrlEncode(str: string | Buffer): string {
    const base64 = Buffer.isBuffer(str) ? str.toString('base64') : Buffer.from(str).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Extrae la llave privada PEM desde un certificado .p12
 */
function getPrivateKeyFromP12(p12Path: string, password: string): string {
    const p12Der = fs.readFileSync(p12Path, 'binary');
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
    
    let privateKeyPem: string | null = null;

    for (const safeContents of p12.safeContents) {
        for (const safeBag of safeContents.safeBags) {
            if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag || safeBag.type === forge.pki.oids.keyBag) {
                const key = safeBag.key;
                if (key) {
                    privateKeyPem = forge.pki.privateKeyToPem(key);
                    break;
                }
            }
        }
        if (privateKeyPem) break;
    }

    if (!privateKeyPem) {
        throw new Error('Llave privada no encontrada en el archivo .p12 provisto.');
    }
    return privateKeyPem;
}

/**
 * Firma un DTE usando JWS (JSON Web Signature) RS256.
 * MODO HÍBRIDO: Si las credenciales reales existen, firma de verdad. 
 * Si no existen, genera un JWS simulado válido estructuralmente.
 */
export async function signDTEJWS(dtePayload: any): Promise<string> {
    const certPath = process.env.MH_CERT_PATH;
    const certPassword = process.env.MH_CERT_PASSWORD;

    const payloadString = JSON.stringify(dtePayload);
    const headerString = JSON.stringify({ alg: "RS256", typ: "JWT" });
    
    const encodedHeader = base64UrlEncode(headerString);
    const encodedPayload = base64UrlEncode(payloadString);
    const signInput = `${encodedHeader}.${encodedPayload}`;

    // Si no tenemos credenciales, caemos a MODO SIMULACIÓN
    if (!certPath || !certPassword || !fs.existsSync(certPath)) {
        console.warn('⚠️  [Firmador] MH_CERT_PATH o MH_CERT_PASSWORD ausentes. Generando JWS SIMULADO.');
        const fakeSignature = base64UrlEncode(crypto.randomBytes(256)); // Simular firma RS256 de 2048 bits
        return `${signInput}.${fakeSignature}`;
    }

    try {
        const privateKeyPem = getPrivateKeyFromP12(certPath, certPassword);
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(signInput);
        sign.end();
        const signatureBuffer = sign.sign(privateKeyPem);
        const encodedSignature = base64UrlEncode(signatureBuffer);
        return `${signInput}.${encodedSignature}`;
    } catch (e: any) {
        console.error('❌ [Firmador] Fallo en firma criptográfica real:', e.message);
        throw new Error('Error firmando el documento: ' + e.message);
    }
}
