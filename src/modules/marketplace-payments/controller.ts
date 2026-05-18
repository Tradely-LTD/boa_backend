import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { marketplacePaymentsTable } from '../../db/schemas/marketplacePaymentsSchema';
import { marketplaceOrdersTable }   from '../../db/schemas/marketplaceOrdersSchema';
import { marketplaceListingsTable } from '../../db/schemas/marketplaceListingsSchema';
import { marketplaceBuyersTable }   from '../../db/schemas/marketplaceBuyersSchema';
import { initiatePayment, verifyPaystackWebhookSignature, verifyPaystackTransaction } from '../../services/paymentGateway';
import { sendOrderConfirmationToBuyer, sendNewOrderNotificationToFAC } from '../../services/emailService';
import { usersTable } from '../../db/schemas/usersSchema';
import type { InitiatePaymentBody } from './types';

const FRONTEND_URL = process.env.FRONTEND_MARKETPLACE_URL ?? 'http://localhost:5173';

// POST /api/marketplace/payments/initiate  (buyer auth)
export const initiateOrderPayment = async (req: Request<{}, {}, InitiatePaymentBody>, res: Response) => {
  try {
    const buyer = (req as any).buyer;
    const { orderId, gateway = 'paystack' } = req.body;

    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required.' });

    const [order] = await db.select().from(marketplaceOrdersTable).where(eq(marketplaceOrdersTable.id, orderId));
    if (!order || order.buyerId !== buyer.buyerId)
      return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.status !== 'pending_payment')
      return res.status(400).json({ success: false, message: 'Order is not awaiting payment.' });

    const [payment] = await db.select().from(marketplacePaymentsTable).where(eq(marketplacePaymentsTable.orderId, orderId));
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });

    await db.update(marketplacePaymentsTable)
      .set({ gateway })
      .where(eq(marketplacePaymentsTable.id, payment.id));

    const result = await initiatePayment({
      gateway,
      email:      order.buyerEmail,
      amountNgn:  order.totalAmount,
      reference:  payment.refId,
      callbackUrl: `${FRONTEND_URL}/marketplace/checkout/verify?ref=${payment.refId}`,
      metadata:   { orderId: order.id, listingId: order.listingId },
    });

    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message ?? 'Payment initiation failed.' });
  }
};

// POST /api/marketplace/payments/webhook/paystack  (public)
export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    const rawBody   = JSON.stringify(req.body);

    if (!verifyPaystackWebhookSignature(rawBody, signature))
      return res.status(401).json({ message: 'Invalid signature.' });

    const { event, data } = req.body;
    if (event !== 'charge.success') return res.sendStatus(200);

    const reference = data?.reference;
    if (!reference) return res.sendStatus(200);

    // Verify independently with Paystack
    const verified = await verifyPaystackTransaction(reference);
    if (!verified) return res.sendStatus(200);

    const [payment] = await db.select().from(marketplacePaymentsTable).where(eq(marketplacePaymentsTable.refId, reference));
    if (!payment || payment.status === 'success') return res.sendStatus(200);

    // Execute atomic transaction: deduct qty, update payment, update order
    await db.transaction(async (tx) => {
      const [order] = await tx.select().from(marketplaceOrdersTable).where(eq(marketplaceOrdersTable.id, payment.orderId));
      if (!order || order.status !== 'pending_payment') return;

      const [listing] = await tx
        .select()
        .from(marketplaceListingsTable)
        .where(eq(marketplaceListingsTable.id, order.listingId))
        .for('update');

      if (!listing) throw new Error('Listing not found during webhook processing.');

      if (listing.quantityAvailableKg < order.quantityKg)
        throw new Error('Insufficient quantity — possible race condition.');

      const newQty = listing.quantityAvailableKg - order.quantityKg;

      await tx.update(marketplaceListingsTable).set({
        quantityAvailableKg: newQty,
        status:              newQty <= 0 ? 'sold_out' : listing.status,
        updatedAt:           new Date().toISOString(),
      }).where(eq(marketplaceListingsTable.id, listing.id));

      await tx.update(marketplacePaymentsTable).set({
        status:         'success',
        gatewayRef:     data.id?.toString() ?? reference,
        webhookPayload: rawBody,
        paidAt:         new Date().toISOString(),
      }).where(eq(marketplacePaymentsTable.id, payment.id));

      await tx.update(marketplaceOrdersTable).set({
        status:    'paid',
        updatedAt: new Date().toISOString(),
      }).where(eq(marketplaceOrdersTable.id, order.id));

      // Fire emails async after transaction
      const [buyer] = await tx.select().from(marketplaceBuyersTable).where(eq(marketplaceBuyersTable.id, order.buyerId));
      const emailParams = {
        buyerName:   order.buyerName,
        buyerEmail:  order.buyerEmail,
        orderRef:    order.refId,
        commodity:   order.commodity,
        quantityKg:  order.quantityKg,
        totalAmount: order.totalAmount,
        centreName:  order.centreName,
      };
      sendOrderConfirmationToBuyer(emailParams).catch(() => {});

      // Get manager email for notification
      const [manager] = await tx.select().from(usersTable).where(eq(usersTable.centreId, listing.centreId));
      if (manager?.email) {
        sendNewOrderNotificationToFAC({ ...emailParams, managerEmail: manager.email }).catch(() => {});
      }
    });

    return res.sendStatus(200);
  } catch {
    return res.sendStatus(500);
  }
};

// GET /api/marketplace/payments/verify/:ref  (public — called by callback page)
export const verifyPaymentByRef = async (req: Request<{ ref: string }>, res: Response) => {
  try {
    const { ref } = req.params;

    const [payment] = await db.select().from(marketplacePaymentsTable).where(eq(marketplacePaymentsTable.refId, ref));
    if (!payment) return res.status(404).json({ success: false, message: 'Payment reference not found.' });

    // Already confirmed (webhook fired first)
    if (payment.status === 'success') {
      const [order] = await db.select().from(marketplaceOrdersTable).where(eq(marketplaceOrdersTable.id, payment.orderId));
      return res.json({ success: true, data: { status: 'success', order } });
    }

    // Webhook hasn't fired yet — verify directly with Paystack
    const verified = await verifyPaystackTransaction(ref);
    if (!verified) return res.json({ success: true, data: { status: 'pending' } });

    // Confirmed by direct verify — run the same atomic update as the webhook
    let updatedOrder: any = null;
    await db.transaction(async (tx) => {
      const [order] = await tx.select().from(marketplaceOrdersTable).where(eq(marketplaceOrdersTable.id, payment.orderId));
      if (!order || order.status !== 'pending_payment') { updatedOrder = order; return; }

      const [listing] = await tx
        .select().from(marketplaceListingsTable)
        .where(eq(marketplaceListingsTable.id, order.listingId))
        .for('update');
      if (!listing) throw new Error('Listing not found.');

      const newQty = Math.max(0, listing.quantityAvailableKg - order.quantityKg);
      await tx.update(marketplaceListingsTable).set({
        quantityAvailableKg: newQty,
        status:   newQty <= 0 ? 'sold_out' : listing.status,
        updatedAt: new Date().toISOString(),
      }).where(eq(marketplaceListingsTable.id, listing.id));

      await tx.update(marketplacePaymentsTable).set({ status: 'success', paidAt: new Date().toISOString() })
        .where(eq(marketplacePaymentsTable.id, payment.id));

      const [updated] = await tx.update(marketplaceOrdersTable)
        .set({ status: 'paid', updatedAt: new Date().toISOString() })
        .where(eq(marketplaceOrdersTable.id, order.id))
        .returning();

      updatedOrder = updated;

      const emailParams = {
        buyerName: order.buyerName, buyerEmail: order.buyerEmail,
        orderRef: order.refId, commodity: order.commodity,
        quantityKg: order.quantityKg, totalAmount: order.totalAmount, centreName: order.centreName,
      };
      sendOrderConfirmationToBuyer(emailParams).catch(() => {});
      const [mgr] = await tx.select().from(usersTable).where(eq(usersTable.centreId, listing.centreId));
      if (mgr?.email) sendNewOrderNotificationToFAC({ ...emailParams, managerEmail: mgr.email }).catch(() => {});
    });

    return res.json({ success: true, data: { status: 'success', order: updatedOrder } });
  } catch {
    return res.status(500).json({ success: false, message: 'Verification failed.' });
  }
};

// GET /api/marketplace/payments/:orderId  (buyer auth)
export const getPaymentForOrder = async (req: Request<{ orderId: string }>, res: Response) => {
  try {
    const buyer   = (req as any).buyer;
    const orderId = parseInt(req.params.orderId);

    const [order] = await db.select().from(marketplaceOrdersTable).where(eq(marketplaceOrdersTable.id, orderId));
    if (!order || order.buyerId !== buyer.buyerId)
      return res.status(404).json({ success: false, message: 'Order not found.' });

    const [payment] = await db.select().from(marketplacePaymentsTable).where(eq(marketplacePaymentsTable.orderId, orderId));
    return res.json({ success: true, data: payment ?? null });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
