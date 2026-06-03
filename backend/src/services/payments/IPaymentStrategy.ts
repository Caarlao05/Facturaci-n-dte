export interface PaymentRequest {
  amount: number;
  currency: string;
  referenceId: string;
  customerEmail?: string;
  customerName?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string; // Link para redireccionar al usuario a pagar
  status: string; // PENDING, SUCCESS, FAILED
}

export interface IPaymentStrategy {
  generatePaymentLink(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(transactionId: string): Promise<boolean>;
}
