import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as usersSchema from './schemas/usersSchema';
import * as applicationsSchema from './schemas/applicationsSchema';
import * as aggregationCentresSchema from './schemas/aggregationCentresSchema';
import * as inventorySalesSchema from './schemas/inventorySalesSchema';
import * as suppliersSchema from './schemas/suppliersSchema';
import * as farmInputsSchema from './schemas/farmInputsSchema';
import * as farmInputSalesSchema from './schemas/farmInputSalesSchema';
import * as collectionRequestsSchema from './schemas/collectionRequestsSchema';
import * as commodityIntakesSchema from './schemas/commodityIntakesSchema';
import * as warehouseReceiptsSchema from './schemas/warehouseReceiptsSchema';
import * as loanApplicationsSchema from './schemas/loanApplicationsSchema';
import * as notificationsSchema from './schemas/notificationsSchema';
import * as marketplaceListingsSchema from './schemas/marketplaceListingsSchema';
import * as marketplaceBuyersSchema   from './schemas/marketplaceBuyersSchema';
import * as marketplaceOrdersSchema   from './schemas/marketplaceOrdersSchema';
import * as marketplacePaymentsSchema from './schemas/marketplacePaymentsSchema';
import * as tractorsSchema            from './schemas/tractorsSchema';
import * as mechHireRequestsSchema    from './schemas/mechHireRequestsSchema';
import * as mechDeploymentsSchema     from './schemas/mechDeploymentsSchema';
import * as commodityPricesSchema     from './schemas/commodityPricesSchema';
import * as loanReceiptPledgesSchema  from './schemas/loanReceiptPledgesSchema';
import * as shopsSchema               from './schemas/shopsSchema';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL env var is required');

const client = postgres(DATABASE_URL, { ssl: 'require' });

export const db = drizzle(client, {
  schema: {
    ...usersSchema,
    ...applicationsSchema,
    ...aggregationCentresSchema,
    ...inventorySalesSchema,
    ...suppliersSchema,
    ...farmInputsSchema,
    ...farmInputSalesSchema,
    ...collectionRequestsSchema,
    ...commodityIntakesSchema,
    ...warehouseReceiptsSchema,
    ...loanApplicationsSchema,
    ...notificationsSchema,
    ...marketplaceListingsSchema,
    ...marketplaceBuyersSchema,
    ...marketplaceOrdersSchema,
    ...marketplacePaymentsSchema,
    ...tractorsSchema,
    ...mechHireRequestsSchema,
    ...mechDeploymentsSchema,
    ...commodityPricesSchema,
    ...loanReceiptPledgesSchema,
    ...shopsSchema,
  },
});

export type DB = typeof db;
