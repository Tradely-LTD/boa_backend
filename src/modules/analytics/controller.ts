import { Request, Response } from 'express';
import { sql, eq, count, and } from 'drizzle-orm';
import { db } from '../../db';
import { applicationsTable }        from '../../db/schemas/applicationsSchema';
import { aggregationCentresTable }  from '../../db/schemas/aggregationCentresSchema';
import { commodityIntakesTable }    from '../../db/schemas/commodityIntakesSchema';
import { warehouseReceiptsTable }   from '../../db/schemas/warehouseReceiptsSchema';
import { loanApplicationsTable }    from '../../db/schemas/loanApplicationsSchema';
import { collectionRequestsTable }  from '../../db/schemas/collectionRequestsSchema';
import { marketplaceListingsTable } from '../../db/schemas/marketplaceListingsSchema';
import { marketplaceOrdersTable }   from '../../db/schemas/marketplaceOrdersSchema';
import { marketplacePaymentsTable } from '../../db/schemas/marketplacePaymentsSchema';
import { inventorySalesTable }      from '../../db/schemas/inventorySalesSchema';
import { farmInputSalesTable }      from '../../db/schemas/farmInputSalesSchema';

export const getStats = async (_req: Request, res: Response) => {
  try {
    // ── Applications ──────────────────────────────────────────────────────────
    const appsByStatus = await db
      .select({ status: applicationsTable.status, total: count() })
      .from(applicationsTable)
      .groupBy(applicationsTable.status);

    const appsByState = await db
      .select({ state: applicationsTable.state, total: count() })
      .from(applicationsTable)
      .groupBy(applicationsTable.state)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const appsByType = await db
      .select({ centreType: applicationsTable.centreType, total: count() })
      .from(applicationsTable)
      .groupBy(applicationsTable.centreType);

    // substring(created_at, 1, 7) works for both PostgreSQL and SQLite text columns
    const appsByMonth = await db
      .select({
        month: sql<string>`substring(created_at, 1, 7)`,
        total: count(),
      })
      .from(applicationsTable)
      .groupBy(sql`substring(created_at, 1, 7)`)
      .orderBy(sql`substring(created_at, 1, 7) desc`)
      .limit(6);

    // ── Aggregation Centres ───────────────────────────────────────────────────
    const centresByStatus = await db
      .select({ status: aggregationCentresTable.status, total: count() })
      .from(aggregationCentresTable)
      .groupBy(aggregationCentresTable.status);

    const [capacityResult] = await db
      .select({ totalCapacity: sql<number>`sum(capacity_mt)` })
      .from(aggregationCentresTable)
      .where(eq(aggregationCentresTable.status, 'active'));

    // ── Commodity Intakes ─────────────────────────────────────────────────────
    const [intakeTotals] = await db
      .select({
        total:       count(),
        totalQtyKg:  sql<number>`coalesce(sum(quantity_kg), 0)`,
      })
      .from(commodityIntakesTable);

    const intakesByCommodity = await db
      .select({
        commodity:   commodityIntakesTable.commodity,
        total:       count(),
        totalQtyKg:  sql<number>`coalesce(sum(quantity_kg), 0)`,
      })
      .from(commodityIntakesTable)
      .groupBy(commodityIntakesTable.commodity)
      .orderBy(sql`count(*) desc`)
      .limit(8);

    // ── Warehouse Receipts ────────────────────────────────────────────────────
    const receiptsByStatus = await db
      .select({ status: warehouseReceiptsTable.status, total: count() })
      .from(warehouseReceiptsTable)
      .groupBy(warehouseReceiptsTable.status);

    const [receiptTotals] = await db
      .select({ totalQtyKg: sql<number>`coalesce(sum(quantity_kg), 0)` })
      .from(warehouseReceiptsTable);

    // ── Loans ─────────────────────────────────────────────────────────────────
    const loansByStatus = await db
      .select({ status: loanApplicationsTable.status, total: count() })
      .from(loanApplicationsTable)
      .groupBy(loanApplicationsTable.status);

    const [loanAmounts] = await db
      .select({
        totalRequested: sql<number>`coalesce(sum(loan_amount_requested), 0)`,
        totalApproved:  sql<number>`coalesce(sum(loan_amount_approved), 0)`,
      })
      .from(loanApplicationsTable);

    // ── Collection Requests ───────────────────────────────────────────────────
    const collectionsByStatus = await db
      .select({ status: collectionRequestsTable.status, total: count() })
      .from(collectionRequestsTable)
      .groupBy(collectionRequestsTable.status);

    // ── Marketplace ───────────────────────────────────────────────────────────
    const listingsByStatus = await db
      .select({ status: marketplaceListingsTable.status, total: count() })
      .from(marketplaceListingsTable)
      .groupBy(marketplaceListingsTable.status);

    const ordersByStatus = await db
      .select({ status: marketplaceOrdersTable.status, total: count() })
      .from(marketplaceOrdersTable)
      .groupBy(marketplaceOrdersTable.status);

    const [marketplaceRevenue] = await db
      .select({ total: sql<number>`coalesce(sum(amount), 0)` })
      .from(marketplacePaymentsTable)
      .where(eq(marketplacePaymentsTable.status, 'success'));

    // ── Revenue ───────────────────────────────────────────────────────────────
    const [inventoryRevenue] = await db
      .select({ total: sql<number>`coalesce(sum(total_amount), 0)` })
      .from(inventorySalesTable);

    const [farmInputRevenue] = await db
      .select({ total: sql<number>`coalesce(sum(total_amount), 0)` })
      .from(farmInputSalesTable);

    // ── Assemble ──────────────────────────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    appsByStatus.forEach(r => { statusMap[r.status] = r.total; });

    const loanStatusMap: Record<string, number> = {};
    loansByStatus.forEach(r => { loanStatusMap[r.status] = r.total; });

    const receiptStatusMap: Record<string, number> = {};
    receiptsByStatus.forEach(r => { receiptStatusMap[r.status] = r.total; });

    const collectionStatusMap: Record<string, number> = {};
    collectionsByStatus.forEach(r => { collectionStatusMap[r.status] = r.total; });

    const listingStatusMap: Record<string, number> = {};
    listingsByStatus.forEach(r => { listingStatusMap[r.status] = r.total; });

    const orderStatusMap: Record<string, number> = {};
    ordersByStatus.forEach(r => { orderStatusMap[r.status] = r.total; });

    return res.json({
      success: true,
      data: {
        applications: {
          total:        Object.values(statusMap).reduce((a, b) => a + b, 0),
          pending:      statusMap['pending']      ?? 0,
          under_review: statusMap['under_review'] ?? 0,
          approved:     statusMap['approved']     ?? 0,
          rejected:     statusMap['rejected']     ?? 0,
        },
        centres: {
          total:           centresByStatus.reduce((a, r) => a + r.total, 0),
          active:          centresByStatus.find(r => r.status === 'active')?.total          ?? 0,
          suspended:       centresByStatus.find(r => r.status === 'suspended')?.total       ?? 0,
          decommissioned:  centresByStatus.find(r => r.status === 'decommissioned')?.total  ?? 0,
          totalCapacityMt: capacityResult.totalCapacity ?? 0,
        },
        intakes: {
          total:       intakeTotals.total,
          totalQtyKg:  intakeTotals.totalQtyKg,
          byCommodity: intakesByCommodity.map(r => ({
            commodity:  r.commodity,
            total:      r.total,
            totalQtyKg: r.totalQtyKg,
          })),
        },
        receipts: {
          total:       receiptsByStatus.reduce((a, r) => a + r.total, 0),
          active:      receiptStatusMap['active']   ?? 0,
          pledged:     receiptStatusMap['pledged']  ?? 0,
          redeemed:    receiptStatusMap['redeemed'] ?? 0,
          expired:     receiptStatusMap['expired']  ?? 0,
          totalQtyKg:  receiptTotals.totalQtyKg,
        },
        loans: {
          total:                loansByStatus.reduce((a, r) => a + r.total, 0),
          pending:              loanStatusMap['pending']    ?? 0,
          approved:             loanStatusMap['approved']   ?? 0,
          disbursed:            loanStatusMap['disbursed']  ?? 0,
          repaid:               loanStatusMap['repaid']     ?? 0,
          defaulted:            loanStatusMap['defaulted']  ?? 0,
          rejected:             loanStatusMap['rejected']   ?? 0,
          totalAmountRequested: loanAmounts.totalRequested,
          totalAmountApproved:  loanAmounts.totalApproved,
        },
        collections: {
          total:      collectionsByStatus.reduce((a, r) => a + r.total, 0),
          pending:    collectionStatusMap['pending']    ?? 0,
          assigned:   collectionStatusMap['assigned']   ?? 0,
          in_transit: collectionStatusMap['in_transit'] ?? 0,
          collected:  collectionStatusMap['collected']  ?? 0,
          cancelled:  collectionStatusMap['cancelled']  ?? 0,
        },
        marketplace: {
          totalListings:    listingsByStatus.reduce((a, r) => a + r.total, 0),
          activeListings:   listingStatusMap['active']    ?? 0,
          pausedListings:   listingStatusMap['paused']    ?? 0,
          soldOutListings:  listingStatusMap['sold_out']  ?? 0,
          totalOrders:      ordersByStatus.reduce((a, r) => a + r.total, 0),
          completedOrders:  orderStatusMap['completed']   ?? 0,
          paidOrders:       orderStatusMap['paid']        ?? 0,
          cancelledOrders:  orderStatusMap['cancelled']   ?? 0,
          totalRevenue:     marketplaceRevenue.total,
        },
        revenue: {
          inventorySales:  inventoryRevenue.total,
          farmInputSales:  farmInputRevenue.total,
        },
        appsByState:  appsByState.map(r  => ({ state: r.state ?? 'Unknown', total: r.total })),
        appsByType:   appsByType.map(r   => ({ type:  r.centreType,          total: r.total })),
        appsByMonth:  appsByMonth.reverse().map(r => ({ month: r.month, total: r.total })),
      },
    });
  } catch (err) {
    console.error('[analytics] getStats error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/analytics/centre/:centreId
export const getCentreStats = async (req: Request<{ centreId: string }>, res: Response) => {
  try {
    const centreId = parseInt(req.params.centreId);
    if (isNaN(centreId))
      return res.status(400).json({ success: false, message: 'Invalid centre ID.' });

    // Centre profile
    const [centre] = await db
      .select()
      .from(aggregationCentresTable)
      .where(eq(aggregationCentresTable.id, centreId));

    if (!centre)
      return res.status(404).json({ success: false, message: 'Centre not found.' });

    // Commodity intakes
    const [intakeTotals] = await db
      .select({
        total:      count(),
        totalQtyKg: sql<number>`coalesce(sum(quantity_kg), 0)`,
      })
      .from(commodityIntakesTable)
      .where(eq(commodityIntakesTable.centreId, centreId));

    const intakesByCommodity = await db
      .select({
        commodity:  commodityIntakesTable.commodity,
        total:      count(),
        totalQtyKg: sql<number>`coalesce(sum(quantity_kg), 0)`,
      })
      .from(commodityIntakesTable)
      .where(eq(commodityIntakesTable.centreId, centreId))
      .groupBy(commodityIntakesTable.commodity)
      .orderBy(sql`sum(quantity_kg) desc`);

    const intakesByMonth = await db
      .select({
        month: sql<string>`substring(created_at, 1, 7)`,
        total: count(),
        totalQtyKg: sql<number>`coalesce(sum(quantity_kg), 0)`,
      })
      .from(commodityIntakesTable)
      .where(eq(commodityIntakesTable.centreId, centreId))
      .groupBy(sql`substring(created_at, 1, 7)`)
      .orderBy(sql`substring(created_at, 1, 7) desc`)
      .limit(6);

    // Warehouse receipts
    const receiptsByStatus = await db
      .select({ status: warehouseReceiptsTable.status, total: count() })
      .from(warehouseReceiptsTable)
      .where(eq(warehouseReceiptsTable.centreId, centreId))
      .groupBy(warehouseReceiptsTable.status);

    const [receiptTotals] = await db
      .select({ totalQtyKg: sql<number>`coalesce(sum(quantity_kg), 0)` })
      .from(warehouseReceiptsTable)
      .where(eq(warehouseReceiptsTable.centreId, centreId));

    // Loans
    const loansByStatus = await db
      .select({ status: loanApplicationsTable.status, total: count() })
      .from(loanApplicationsTable)
      .where(eq(loanApplicationsTable.centreId, centreId))
      .groupBy(loanApplicationsTable.status);

    const [loanAmounts] = await db
      .select({
        totalRequested: sql<number>`coalesce(sum(loan_amount_requested), 0)`,
        totalApproved:  sql<number>`coalesce(sum(loan_amount_approved), 0)`,
      })
      .from(loanApplicationsTable)
      .where(eq(loanApplicationsTable.centreId, centreId));

    // Collection requests
    const collectionsByStatus = await db
      .select({ status: collectionRequestsTable.status, total: count() })
      .from(collectionRequestsTable)
      .where(eq(collectionRequestsTable.centreId, centreId))
      .groupBy(collectionRequestsTable.status);

    // Marketplace listings
    const listingsByStatus = await db
      .select({ status: marketplaceListingsTable.status, total: count() })
      .from(marketplaceListingsTable)
      .where(eq(marketplaceListingsTable.centreId, centreId))
      .groupBy(marketplaceListingsTable.status);

    // Marketplace orders
    const ordersByStatus = await db
      .select({ status: marketplaceOrdersTable.status, total: count() })
      .from(marketplaceOrdersTable)
      .where(eq(marketplaceOrdersTable.centreId, centreId))
      .groupBy(marketplaceOrdersTable.status);

    // Sum revenue from completed/paid orders at this centre
    const [marketplaceRevenue] = await db
      .select({ total: sql<number>`coalesce(sum(total_amount), 0)` })
      .from(marketplaceOrdersTable)
      .where(
        and(
          eq(marketplaceOrdersTable.centreId, centreId),
          sql`status in ('completed', 'paid')`,
        ),
      );

    // Inventory sales
    const [inventoryRevenue] = await db
      .select({ total: sql<number>`coalesce(sum(total_amount), 0)` })
      .from(inventorySalesTable)
      .where(eq(inventorySalesTable.centreId, centreId));

    // Farm input sales
    const [farmInputRevenue] = await db
      .select({ total: sql<number>`coalesce(sum(total_amount), 0)` })
      .from(farmInputSalesTable)
      .where(eq(farmInputSalesTable.centreId, centreId));

    // Assemble maps
    const receiptStatusMap: Record<string, number> = {};
    receiptsByStatus.forEach(r => { receiptStatusMap[r.status] = r.total; });

    const loanStatusMap: Record<string, number> = {};
    loansByStatus.forEach(r => { loanStatusMap[r.status] = r.total; });

    const collectionStatusMap: Record<string, number> = {};
    collectionsByStatus.forEach(r => { collectionStatusMap[r.status] = r.total; });

    const listingStatusMap: Record<string, number> = {};
    listingsByStatus.forEach(r => { listingStatusMap[r.status] = r.total; });

    const orderStatusMap: Record<string, number> = {};
    ordersByStatus.forEach(r => { orderStatusMap[r.status] = r.total; });

    return res.json({
      success: true,
      data: {
        centre,
        intakes: {
          total:       intakeTotals.total,
          totalQtyKg:  intakeTotals.totalQtyKg,
          byCommodity: intakesByCommodity,
          byMonth:     intakesByMonth.reverse(),
        },
        receipts: {
          total:      receiptsByStatus.reduce((a, r) => a + r.total, 0),
          active:     receiptStatusMap['active']   ?? 0,
          pledged:    receiptStatusMap['pledged']  ?? 0,
          redeemed:   receiptStatusMap['redeemed'] ?? 0,
          expired:    receiptStatusMap['expired']  ?? 0,
          totalQtyKg: receiptTotals.totalQtyKg,
        },
        loans: {
          total:                loansByStatus.reduce((a, r) => a + r.total, 0),
          pending:              loanStatusMap['pending']   ?? 0,
          approved:             loanStatusMap['approved']  ?? 0,
          disbursed:            loanStatusMap['disbursed'] ?? 0,
          repaid:               loanStatusMap['repaid']    ?? 0,
          defaulted:            loanStatusMap['defaulted'] ?? 0,
          rejected:             loanStatusMap['rejected']  ?? 0,
          totalAmountRequested: loanAmounts.totalRequested,
          totalAmountApproved:  loanAmounts.totalApproved,
        },
        collections: {
          total:      collectionsByStatus.reduce((a, r) => a + r.total, 0),
          pending:    collectionStatusMap['pending']    ?? 0,
          assigned:   collectionStatusMap['assigned']   ?? 0,
          in_transit: collectionStatusMap['in_transit'] ?? 0,
          collected:  collectionStatusMap['collected']  ?? 0,
          cancelled:  collectionStatusMap['cancelled']  ?? 0,
        },
        marketplace: {
          totalListings:    listingsByStatus.reduce((a, r) => a + r.total, 0),
          activeListings:   listingStatusMap['active']   ?? 0,
          pausedListings:   listingStatusMap['paused']   ?? 0,
          soldOutListings:  listingStatusMap['sold_out'] ?? 0,
          totalOrders:      ordersByStatus.reduce((a, r) => a + r.total, 0),
          completedOrders:  orderStatusMap['completed']  ?? 0,
          paidOrders:       orderStatusMap['paid']       ?? 0,
          cancelledOrders:  orderStatusMap['cancelled']  ?? 0,
          totalRevenue:     marketplaceRevenue.total,
        },
        revenue: {
          inventorySales: inventoryRevenue.total,
          farmInputSales: farmInputRevenue.total,
        },
      },
    });
  } catch (err) {
    console.error('[analytics] getCentreStats error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
