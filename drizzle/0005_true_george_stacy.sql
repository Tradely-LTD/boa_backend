CREATE TABLE "boa"."shop_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" text NOT NULL,
	"shop_id" integer NOT NULL,
	"centre_id" integer NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"amount" text NOT NULL,
	"logged_by" integer NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "shop_expenses_ref_id_unique" UNIQUE("ref_id")
);
--> statement-breakpoint
CREATE TABLE "boa"."shop_intakes" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" text NOT NULL,
	"shop_id" integer NOT NULL,
	"centre_id" integer NOT NULL,
	"commodity" text NOT NULL,
	"quantity_kg" text NOT NULL,
	"grade_quality" text,
	"source_type" text DEFAULT 'purchase' NOT NULL,
	"notes" text,
	"logged_by" integer NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "shop_intakes_ref_id_unique" UNIQUE("ref_id")
);
--> statement-breakpoint
CREATE TABLE "boa"."shop_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" text NOT NULL,
	"shop_id" integer NOT NULL,
	"centre_id" integer NOT NULL,
	"intake_id" integer,
	"commodity" text NOT NULL,
	"quantity_kg" text NOT NULL,
	"price_per_kg" text NOT NULL,
	"total_amount" text NOT NULL,
	"buyer_name" text,
	"buyer_phone" text,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"receipt_number" text NOT NULL,
	"sold_by" integer NOT NULL,
	"notes" text,
	"created_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "shop_sales_ref_id_unique" UNIQUE("ref_id")
);
--> statement-breakpoint
CREATE TABLE "boa"."shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_ref_id" text NOT NULL,
	"centre_id" integer NOT NULL,
	"shop_name" text NOT NULL,
	"owner_name" text NOT NULL,
	"owner_phone" text NOT NULL,
	"owner_nin" text,
	"business_type" text,
	"space_number" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "shops_shop_ref_id_unique" UNIQUE("shop_ref_id")
);
--> statement-breakpoint
ALTER TABLE "boa"."users" ADD COLUMN "shop_id" integer;