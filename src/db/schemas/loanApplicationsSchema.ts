import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const loanApplicationsTable = boaSchema.table('loan_applications', {
  id:                     serial('id').primaryKey(),
  refId:                  text('ref_id').notNull().unique(),
  // Primary / first receipt (nullable — multi-receipt loans use loanReceiptPledges table)
  receiptId:              integer('receipt_id'),
  receiptNumber:          text('receipt_number'),
  // receipt_count: how many receipts are pledged (1 for legacy, ≥1 for new)
  receiptCount:           integer('receipt_count').notNull().default(1),
  // Denormalised commodity info (from primary receipt; may be mixed commodities in multi-AHR)
  centreId:               integer('centre_id').notNull(),
  centreName:             text('centre_name').notNull(),
  commodity:              text('commodity').notNull(),
  quantityKg:             real('quantity_kg').notNull(),  // total across all pledged receipts
  // Farmer info
  farmerName:             text('farmer_name').notNull(),
  farmerPhone:            text('farmer_phone'),
  farmerNin:              text('farmer_nin'),
  // Loan terms
  loanAmountRequested:    real('loan_amount_requested').notNull(),
  loanAmountApproved:     real('loan_amount_approved'),
  interestRate:           real('interest_rate'),
  repaymentPeriodMonths:  integer('repayment_period_months'),
  // Lifecycle
  status: text('status', {
    enum: ['pending', 'approved', 'disbursed', 'repaid', 'defaulted', 'rejected'],
  }).notNull().default('pending'),
  reviewedBy:   integer('reviewed_by'),
  reviewNotes:  text('review_notes'),
  disbursedAt:  text('disbursed_at'),
  repaidAt:     text('repaid_at'),
  createdAt:    text('created_at').notNull().default(sql`now()`),
});

export type LoanApplication    = typeof loanApplicationsTable.$inferSelect;
export type NewLoanApplication = typeof loanApplicationsTable.$inferInsert;
