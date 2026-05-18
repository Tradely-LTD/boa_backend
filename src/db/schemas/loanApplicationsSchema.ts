import { integer, text, real, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boaSchema } from '../boaSchema';

export const loanApplicationsTable = boaSchema.table('loan_applications', {
  id:                     serial('id').primaryKey(),
  refId:                  text('ref_id').notNull().unique(),
  // Linked receipt
  receiptId:              integer('receipt_id').notNull(),
  receiptNumber:          text('receipt_number').notNull(),
  // Denormalised commodity info
  centreId:               integer('centre_id').notNull(),
  centreName:             text('centre_name').notNull(),
  commodity:              text('commodity').notNull(),
  quantityKg:             real('quantity_kg').notNull(),
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
