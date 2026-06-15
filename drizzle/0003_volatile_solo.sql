ALTER TABLE "boa"."commodity_intakes" ADD COLUMN "transaction_type" text DEFAULT 'trade' NOT NULL;--> statement-breakpoint
ALTER TABLE "boa"."commodity_intakes" ADD COLUMN "quality_specs" text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "boa"."tractors" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "boa"."tractors" ADD COLUMN "year_manufactured" integer;--> statement-breakpoint
ALTER TABLE "boa"."tractors" ADD COLUMN "fuel_type" text DEFAULT 'diesel';--> statement-breakpoint
ALTER TABLE "boa"."tractors" ADD COLUMN "engine_cc" real;--> statement-breakpoint
ALTER TABLE "boa"."tractors" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "boa"."tractors" ADD COLUMN "current_implements" text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "boa"."tractors" ADD COLUMN "notes" text;