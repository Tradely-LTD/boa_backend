export interface InitiatePaymentBody {
  orderId:  number;
  gateway:  'paystack' | 'moniepoint';
}
