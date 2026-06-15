CREATE TABLE "boa"."commodity_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"commodity" text NOT NULL,
	"centre_id" integer,
	"price_per_kg" real NOT NULL,
	"set_by" integer NOT NULL,
	"notes" text,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boa"."loan_receipt_pledges" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"receipt_id" integer NOT NULL,
	"receipt_number" text NOT NULL,
	"commodity" text NOT NULL,
	"quantity_kg" real NOT NULL,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boa"."loan_applications" ALTER COLUMN "receipt_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "boa"."loan_applications" ALTER COLUMN "receipt_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "boa"."loan_applications" ADD COLUMN "receipt_count" integer DEFAULT 1 NOT NULL;