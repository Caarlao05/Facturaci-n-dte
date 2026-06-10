import axios from 'axios';
import { IPaymentStrategy, PaymentRequest, PaymentResponse } from './IPaymentStrategy';

export class WompiStrategy implements IPaymentStrategy {
  private publicKey: string;
  private privateKey: string;
  private apiUrl: string;

  constructor(publicKey: string, privateKey: string) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    // URL real de Wompi El Salvador (ej. https://api.wompi.sv/v1)
    this.apiUrl = 'https://api.wompi.sv/v1'; 
  }

  async generatePaymentLink(request: PaymentRequest): Promise<PaymentResponse> {
    console.log(`[Wompi] Generando Payment Link para referencia: ${request.referenceId}`);
    
    try {
      // Mock: En producción haríamos un POST a /payment_links usando this.privateKey
      const fakeWompiUrl = `https://checkout.wompi.sv/pay/${request.referenceId}?amount=${request.amount}`;
      
      return {
        success: true,
        transactionId: `WOMPI-${Date.now()}`,
        paymentUrl: fakeWompiUrl,
        status: 'PENDING'
      };
    } catch (error) {
      console.error("[Wompi] Error generating payment link", error);
      return { success: false, transactionId: '', status: 'FAILED' };
    }
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    console.log(`[Wompi] Verificando transacción en red de Banco Agrícola: ${transactionId}`);
    // Mock: GET /transactions/{id}
    return true; 
  }
}
