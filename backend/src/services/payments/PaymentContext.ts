import { IPaymentStrategy, PaymentRequest, PaymentResponse } from './IPaymentStrategy';

export class PaymentContext {
  private strategy: IPaymentStrategy;

  constructor(strategy: IPaymentStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: IPaymentStrategy) {
    this.strategy = strategy;
  }

  async executePaymentLinkGeneration(request: PaymentRequest): Promise<PaymentResponse> {
    return await this.strategy.generatePaymentLink(request);
  }

  async executePaymentVerification(transactionId: string): Promise<boolean> {
    return await this.strategy.verifyPayment(transactionId);
  }
}
