import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = () => process.env.EMAIL_FROM ?? 'BOA Marketplace <onboarding@resend.dev>';

interface OrderEmailParams {
  buyerName:   string;
  buyerEmail:  string;
  orderRef:    string;
  commodity:   string;
  quantityKg:  number;
  totalAmount: number;
  centreName:  string;
}

async function send(payload: Parameters<Resend['emails']['send']>[0], label: string) {
  if (!process.env.RESEND_API_KEY) { console.warn(`[EMAIL] RESEND_API_KEY not set — skipping ${label}`); return; }
  const { error } = await getResend().emails.send(payload);
  if (error) console.error(`[EMAIL] ${label} failed:`, error);
  else console.log(`[EMAIL] ${label} sent to ${Array.isArray(payload.to) ? payload.to.join(',') : payload.to}`);
}

export async function sendOrderConfirmationToBuyer(p: OrderEmailParams) {
  await send({
    from:    FROM(),
    to:      p.buyerEmail,
    subject: `Order Confirmed — ${p.orderRef}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#f4f6f5;padding:32px;border-radius:12px;">
        <div style="background:#1a5632;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#f5a623;margin:0;font-size:22px;">BOA Marketplace</h1>
          <p style="color:#fff;margin:8px 0 0;font-size:14px;">Order Confirmed</p>
        </div>
        <p style="color:#1a3a24;font-size:16px;">Hi <strong>${p.buyerName}</strong>,</p>
        <p style="color:#374151;">Your payment was received. Here are your order details:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#1a5632;color:#fff;">
            <th style="padding:10px;text-align:left;border-radius:6px 0 0 6px;">Field</th>
            <th style="padding:10px;text-align:left;border-radius:0 6px 6px 0;">Value</th>
          </tr>
          <tr style="background:#fff;"><td style="padding:10px;color:#6b7280;">Order Ref</td><td style="padding:10px;font-weight:600;">${p.orderRef}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:10px;color:#6b7280;">Commodity</td><td style="padding:10px;">${p.commodity}</td></tr>
          <tr style="background:#fff;"><td style="padding:10px;color:#6b7280;">Quantity</td><td style="padding:10px;">${p.quantityKg} kg</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:10px;color:#6b7280;">Amount Paid</td><td style="padding:10px;font-weight:600;color:#1a5632;">₦${p.totalAmount.toLocaleString()}</td></tr>
          <tr style="background:#fff;"><td style="padding:10px;color:#6b7280;">FAC Centre</td><td style="padding:10px;">${p.centreName}</td></tr>
        </table>
        <p style="color:#374151;font-size:14px;">The FAC will prepare your order and update the status to <strong>Processing</strong> shortly. You will receive another email when your order is ready.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:32px;">BOA AgriHub · Federal Ministry of Agriculture · Nigeria</p>
      </div>
    `,
  }, `order confirmation to ${p.buyerEmail}`);
}

export async function sendNewOrderNotificationToFAC(p: OrderEmailParams & { managerEmail: string }) {
  await send({
    from:    FROM(),
    to:      p.managerEmail,
    subject: `New Marketplace Order — ${p.orderRef}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#f4f6f5;padding:32px;border-radius:12px;">
        <div style="background:#1a5632;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#f5a623;margin:0;font-size:22px;">New Order Received</h1>
          <p style="color:#fff;margin:8px 0 0;font-size:14px;">BOA Marketplace</p>
        </div>
        <p style="color:#1a3a24;">A new order has been placed for your listing:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#1a5632;color:#fff;">
            <th style="padding:10px;text-align:left;">Field</th><th style="padding:10px;text-align:left;">Value</th>
          </tr>
          <tr style="background:#fff;"><td style="padding:10px;color:#6b7280;">Order Ref</td><td style="padding:10px;font-weight:600;">${p.orderRef}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:10px;color:#6b7280;">Buyer</td><td style="padding:10px;">${p.buyerName}</td></tr>
          <tr style="background:#fff;"><td style="padding:10px;color:#6b7280;">Commodity</td><td style="padding:10px;">${p.commodity}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:10px;color:#6b7280;">Quantity</td><td style="padding:10px;">${p.quantityKg} kg</td></tr>
          <tr style="background:#fff;"><td style="padding:10px;color:#6b7280;">Revenue</td><td style="padding:10px;font-weight:600;color:#1a5632;">₦${p.totalAmount.toLocaleString()}</td></tr>
        </table>
        <p style="color:#374151;font-size:14px;">Log in to your FAC Manager Dashboard to update the order status to <strong>Processing</strong> when you begin fulfilment.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:32px;">BOA AgriHub · Federal Ministry of Agriculture · Nigeria</p>
      </div>
    `,
  }, `FAC notification to ${p.managerEmail}`);
}

export async function sendOrderStatusUpdateToBuyer(params: {
  buyerEmail: string; buyerName: string; orderRef: string; newStatus: string;
}) {
  const statusLabel: Record<string, string> = {
    processing: 'Your order is being processed by the FAC.',
    completed:  'Your order has been fulfilled and is ready for collection.',
    cancelled:  'Your order has been cancelled.',
  };
  const label = statusLabel[params.newStatus] ?? `Status updated to: ${params.newStatus}`;
  await send({
    from:    FROM(),
    to:      params.buyerEmail,
    subject: `Order Update — ${params.orderRef}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#f4f6f5;padding:32px;border-radius:12px;">
        <div style="background:#1a5632;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#f5a623;margin:0;font-size:22px;">Order Update</h1>
        </div>
        <p style="color:#1a3a24;">Hi <strong>${params.buyerName}</strong>,</p>
        <p style="color:#374151;">${label}</p>
        <p style="color:#6b7280;font-size:14px;">Order Reference: <strong>${params.orderRef}</strong></p>
        <p style="color:#9ca3af;font-size:12px;margin-top:32px;">BOA AgriHub · Federal Ministry of Agriculture · Nigeria</p>
      </div>
    `,
  }, `status update to ${params.buyerEmail}`);
}
