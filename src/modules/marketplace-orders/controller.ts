import { Request, Response } from 'express';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../../db';
import { marketplaceOrdersTable }   from '../../db/schemas/marketplaceOrdersSchema';
import { marketplaceListingsTable } from '../../db/schemas/marketplaceListingsSchema';
import { marketplaceBuyersTable }   from '../../db/schemas/marketplaceBuyersSchema';
import { marketplacePaymentsTable } from '../../db/schemas/marketplacePaymentsSchema';
import { usersTable } from '../../db/schemas/usersSchema';
import { sendOrderConfirmationToBuyer, sendNewOrderNotificationToFAC, sendOrderStatusUpdateToBuyer } from '../../services/emailService';
import { createNotification } from '../notifications';
import type { CreateOrderBody, UpdateOrderStatusBody, ConfirmPosBody } from './types';

const genRef = () => 'MO-' + Math.random().toString(36).substring(2, 9).toUpperCase();
const genPayRef = () => 'PAY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();

// POST /api/marketplace/orders  (buyer auth)
export const createOrder = async (req: Request<{}, {}, CreateOrderBody>, res: Response) => {
  try {
    const buyer = (req as any).buyer;
    const { listingId, quantityKg, notes, deliveryType = 'pickup', deliveryState, deliveryLga, deliveryCharge = 0, paymentGateway = 'paystack' } = req.body;

    if (!listingId || !quantityKg || quantityKg <= 0)
      return res.status(400).json({ success: false, message: 'listingId and quantityKg (> 0) are required.' });

    if (deliveryType === 'delivery' && !deliveryState)
      return res.status(400).json({ success: false, message: 'deliveryState is required for delivery orders.' });

    const [listing] = await db.select().from(marketplaceListingsTable).where(eq(marketplaceListingsTable.id, listingId));
    if (!listing || listing.status !== 'active')
      return res.status(404).json({ success: false, message: 'Listing not available.' });

    if (listing.quantityAvailableKg < quantityKg)
      return res.status(400).json({ success: false, message: `Only ${listing.quantityAvailableKg}kg available.` });

    if (deliveryType === 'delivery' && !listing.deliveryAvailable)
      return res.status(400).json({ success: false, message: 'This listing does not offer delivery.' });

    const [buyerRecord] = await db.select().from(marketplaceBuyersTable).where(eq(marketplaceBuyersTable.id, buyer.buyerId));
    if (!buyerRecord) return res.status(404).json({ success: false, message: 'Buyer not found.' });

    const totalAmount = quantityKg * listing.pricePerKg + deliveryCharge;
    const orderRef    = genRef();

    const [order] = await db.insert(marketplaceOrdersTable).values({
      refId:          orderRef,
      listingId,
      buyerId:        buyer.buyerId,
      centreId:       listing.centreId,
      centreName:     listing.centreName,
      commodity:      listing.commodity,
      quantityKg,
      pricePerKg:     listing.pricePerKg,
      totalAmount,
      buyerName:      buyerRecord.fullName,
      buyerEmail:     buyerRecord.email,
      buyerPhone:     buyerRecord.phone,
      status:         'pending_payment',
      isManual:       false,
      notes:          notes ?? null,
      deliveryType,
      deliveryState:  deliveryState ?? null,
      deliveryLga:    deliveryLga ?? null,
      deliveryCharge,
      paymentGateway: paymentGateway ?? null,
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
    }).returning();

    // Create a pending payment record
    const [payment] = await db.insert(marketplacePaymentsTable).values({
      refId:     genPayRef(),
      orderId:   order.id,
      gateway:   paymentGateway as any,
      amount:    totalAmount,
      status:    'pending',
      createdAt: new Date().toISOString(),
    }).returning();

    await createNotification(
      'marketplace_order',
      `New order from ${buyerRecord.fullName}: ${quantityKg.toLocaleString()} kg of ${listing.commodity} — ₦${totalAmount.toLocaleString()}`,
      undefined,
      listing.centreId,
    );

    return res.status(201).json({ success: true, data: { order, payment } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/marketplace/orders/mine  (buyer auth)
export const getBuyerOrders = async (req: Request, res: Response) => {
  try {
    const buyer = (req as any).buyer;
    const rows  = await db
      .select()
      .from(marketplaceOrdersTable)
      .where(eq(marketplaceOrdersTable.buyerId, buyer.buyerId))
      .orderBy(desc(marketplaceOrdersTable.createdAt));

    return res.json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/marketplace/orders/centre?manual=true  (manager auth)
export const getCentreOrders = async (req: Request, res: Response) => {
  try {
    const user     = (req as any).user;
    const isManual = req.query.manual === 'true';
    if (!user.centreId) return res.status(403).json({ success: false, message: 'No centre assigned.' });

    const rows = await db
      .select()
      .from(marketplaceOrdersTable)
      .where(and(
        eq(marketplaceOrdersTable.centreId, user.centreId),
        eq(marketplaceOrdersTable.isManual, isManual),
      ))
      .orderBy(desc(marketplaceOrdersTable.createdAt));

    return res.json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/marketplace/orders/:id/status  (manager auth)
export const updateOrderStatus = async (req: Request<{ id: string }, {}, UpdateOrderStatusBody>, res: Response) => {
  try {
    const user    = (req as any).user;
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['processing', 'completed', 'cancelled'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    const [order] = await db.select().from(marketplaceOrdersTable).where(eq(marketplaceOrdersTable.id, orderId));
    if (!order)                          return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.centreId !== user.centreId) return res.status(403).json({ success: false, message: 'Not your order.' });
    if (order.status === 'pending_payment') return res.status(400).json({ success: false, message: 'Cannot update unpaid order.' });

    const [updated] = await db
      .update(marketplaceOrdersTable)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(marketplaceOrdersTable.id, orderId))
      .returning();

    if (order.buyerEmail) {
      sendOrderStatusUpdateToBuyer({
        buyerEmail: order.buyerEmail,
        buyerName:  order.buyerName,
        orderRef:   order.refId,
        newStatus:  status,
      }).catch(() => {});
    }

    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/marketplace/orders/:id/confirm-bank  (manager auth)
export const confirmBankTransfer = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user    = (req as any).user;
    const orderId = parseInt(req.params.id);

    const [order] = await db.select().from(marketplaceOrdersTable).where(eq(marketplaceOrdersTable.id, orderId));
    if (!order)                           return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.centreId !== user.centreId) return res.status(403).json({ success: false, message: 'Not your order.' });
    if (order.status !== 'pending_payment')
      return res.status(400).json({ success: false, message: 'Order is not awaiting payment.' });

    await db.update(marketplacePaymentsTable)
      .set({ status: 'success', paidAt: new Date().toISOString() })
      .where(eq(marketplacePaymentsTable.orderId, orderId));

    const [updated] = await db.update(marketplaceOrdersTable)
      .set({ status: 'processing', updatedAt: new Date().toISOString() })
      .where(eq(marketplaceOrdersTable.id, orderId))
      .returning();

    const emailParams = {
      buyerName:   order.buyerName,  buyerEmail: order.buyerEmail,
      orderRef:    order.refId,      commodity:  order.commodity,
      quantityKg:  order.quantityKg, totalAmount: order.totalAmount,
      centreName:  order.centreName,
    };
    sendOrderConfirmationToBuyer(emailParams).catch(() => {});
    const [mgr] = await db.select().from(usersTable).where(eq(usersTable.centreId, order.centreId));
    if (mgr?.email) sendNewOrderNotificationToFAC({ ...emailParams, managerEmail: mgr.email }).catch(() => {});

    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/marketplace/orders/:id/confirm-pos  (manager auth)
export const confirmPosPayment = async (req: Request<{ id: string }, {}, ConfirmPosBody>, res: Response) => {
  try {
    const user    = (req as any).user;
    const orderId = parseInt(req.params.id);
    const { stan, rrn } = req.body;

    if (!stan || !rrn)
      return res.status(400).json({ success: false, message: 'STAN and RRN are required.' });

    const [order] = await db.select().from(marketplaceOrdersTable).where(eq(marketplaceOrdersTable.id, orderId));
    if (!order)                           return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.centreId !== user.centreId) return res.status(403).json({ success: false, message: 'Not your order.' });
    if (order.status !== 'pending_payment')
      return res.status(400).json({ success: false, message: 'Order is not awaiting payment.' });

    // Update payment record
    await db.update(marketplacePaymentsTable)
      .set({ stan, rrn, status: 'success', paidAt: new Date().toISOString() })
      .where(eq(marketplacePaymentsTable.orderId, orderId));

    // Advance order to processing
    const [updated] = await db.update(marketplaceOrdersTable)
      .set({ status: 'processing', updatedAt: new Date().toISOString() })
      .where(eq(marketplaceOrdersTable.id, orderId))
      .returning();

    const emailParams = {
      buyerName:   order.buyerName,  buyerEmail: order.buyerEmail,
      orderRef:    order.refId,      commodity:  order.commodity,
      quantityKg:  order.quantityKg, totalAmount: order.totalAmount,
      centreName:  order.centreName,
    };
    sendOrderConfirmationToBuyer(emailParams).catch(() => {});
    const [mgr] = await db.select().from(usersTable).where(eq(usersTable.centreId, order.centreId));
    if (mgr?.email) sendNewOrderNotificationToFAC({ ...emailParams, managerEmail: mgr.email }).catch(() => {});

    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
