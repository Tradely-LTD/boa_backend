import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

// Junction table: one loan can pledge multiple warehouse receipts
export const loanReceiptPledgesTable = boaSchema.table('loan_receipt_pledges', {
  id:            serial('id').primaryKey(),
  loanId:        integer('loan_id').notNull(),
  receiptId:     integer('receipt_id').notNull(),
  receiptNumber: text('receipt_number').notNull(),
  commodity:     text('commodity').notNull(),
  quantityKg:    real('quantity_kg').notNull(),
  createdAt:     text('created_at').notNull().default(sql`now()`),
});

export type LoanReceiptPledge    = typeof loanReceiptPledgesTable.$inferSelect;
export type NewLoanReceiptPledge = typeof loanReceiptPledgesTable.$inferInsert;
