import axios from 'axios';
import crypto from 'crypto';

export type Gateway = 'paystack' | 'moniepoint';

export interface InitiatePaymentParams {
  gateway:    Gateway;
  email:      string;
  amountNgn:  number;
  reference:  string;
  callbackUrl: string;
  metadata?:  Record<string, unknown>;
}

export interface InitiatePaymentResult {
  authorizationUrl: string;
  reference:        string;
}

export async function initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
  if (params.gateway === 'paystack') return initiatePaystack(params);
  throw new Error(`Gateway '${params.gateway}' not yet integrated.`);
}

async function initiatePaystack(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY ?? process.env.PAYSTACK_SECRET;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY env var is required.');

  const response = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email:        params.email,
      amount:       Math.round(params.amountNgn * 100), // kobo
      reference:    params.reference,
      callback_url: params.callbackUrl,
      metadata:     params.metadata ?? {},
    },
    { headers: { Authorization: `Bearer ${secretKey}` } },
  );

  const data = response.data?.data;
  return { authorizationUrl: data.authorization_url, reference: data.reference };
}

export function verifyPaystackWebhookSignature(rawBody: string, signature: string): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY ?? process.env.PAYSTACK_SECRET ?? '';
  const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  return hash === signature;
}

export async function verifyPaystackTransaction(reference: string): Promise<boolean> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY ?? process.env.PAYSTACK_SECRET;
  if (!secretKey) return false;
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    return response.data?.data?.status === 'success';
  } catch {
    return false;
  }
}
