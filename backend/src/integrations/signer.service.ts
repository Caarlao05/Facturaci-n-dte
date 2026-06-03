import * as forge from 'node-forge';

// En un entorno de producción, cargaríamos el .p12 del cliente usando forge.pkcs12.
// Como estamos en Fase Sandbox (Mock), generamos una llave RSA de prueba en memoria.
let mockPrivateKey: forge.pki.PrivateKey;
let mockPublicKey: forge.pki.PublicKey;

// Generar llaves al iniciar el módulo (solo para Sandbox)
console.log("Generando llaves RSA Mock para pruebas MH...");
const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
mockPrivateKey = keypair.privateKey;
mockPublicKey = keypair.publicKey;
console.log("Llaves RSA generadas correctamente.");

function base64urlEncode(str: string | forge.util.ByteStringBuffer): string {
  let base64 = typeof str === 'string' 
    ? forge.util.encode64(str)
    : forge.util.encode64(str.getBytes());
  
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Recibe un payload JSON (El DTE) y retorna una firma JWS RS256 válida.
 */
export const signDteJWS = (payload: any): string => {
  const header = {
    alg: 'RS256',
    typ: 'JWT' // MH exige JWT o JWS en el type
  };

  const headerB64Url = base64urlEncode(JSON.stringify(header));
  const payloadB64Url = base64urlEncode(JSON.stringify(payload));

  const signInput = `${headerB64Url}.${payloadB64Url}`;

  // Firmar con SHA-256 RSA
  const md = forge.md.sha256.create();
  md.update(signInput, 'utf8');
  
  const signature = mockPrivateKey.sign(md);
  const signatureB64Url = base64urlEncode(new forge.util.ByteStringBuffer(signature));

  // Retornar JWS completo
  return `${signInput}.${signatureB64Url}`;
};
