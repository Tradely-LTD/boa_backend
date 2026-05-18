CREATE TABLE "boa"."marketplace_buyers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_buyers_ref_id_unique" UNIQUE("ref_id"),
	CONSTRAINT "marketplace_buyers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "boa"."marketplace_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" text NOT NULL,
	"centre_id" integer NOT NULL,
	"centre_name" text NOT NULL,
	"centre_state" text NOT NULL,
	"centre_lga" text,
	"commodity" text NOT NULL,
	"grade_quality" text,
	"description" text,
	"quantity_available_kg" real NOT NULL,
	"price_per_kg" real NOT NULL,
	"images" text DEFAULT '[]',
	"status" text DEFAULT 'active' NOT NULL,
	"is_receipt_backed" boolean DEFAULT false NOT NULL,
	"delivery_available" boolean DEFAULT false NOT NULL,
	"delivery_zones" text DEFAULT '[]' NOT NULL,
	"specs" text DEFAULT '{}' NOT NULL,
	"packaging" text DEFAULT '{}' NOT NULL,
	"bank_name" text,
	"bank_account_number" text,
	"bank_account_name" text,
	"posted_by" integer NOT NULL,
	"expires_at" text,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_listings_ref_id_unique" UNIQUE("ref_id")
);
--> statement-breakpoint
CREATE TABLE "boa"."marketplace_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" text NOT NULL,
	"listing_id" integer NOT NULL,
	"buyer_id" integer NOT NULL,
	"centre_id" integer NOT NULL,
	"centre_name" text NOT NULL,
	"commodity" text NOT NULL,
	"quantity_kg" real NOT NULL,
	"price_per_kg" real NOT NULL,
	"total_amount" real NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_phone" text NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"is_manual" boolean DEFAULT false NOT NULL,
	"notes" text,
	"delivery_type" text DEFAULT 'pickup' NOT NULL,
	"delivery_state" text,
	"delivery_lga" text,
	"delivery_charge" real DEFAULT 0 NOT NULL,
	"payment_gateway" text,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_orders_ref_id_unique" UNIQUE("ref_id")
);
--> statement-breakpoint
CREATE TABLE "boa"."marketplace_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" text NOT NULL,
	"order_id" integer NOT NULL,
	"gateway" text DEFAULT 'paystack' NOT NULL,
	"gateway_ref" text,
	"amount" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"webhook_payload" text,
	"paid_at" text,
	"stan" text,
	"rrn" text,
	"created_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_payments_ref_id_unique" UNIQUE("ref_id")
);
--> statement-breakpoint
ALTER TABLE "boa"."notifications" ADD COLUMN "centre_id" integer;