CREATE TABLE "boa"."mech_deployments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" text NOT NULL,
	"tractor_id" integer NOT NULL,
	"tractor_model" text NOT NULL,
	"tractor_serial" text NOT NULL,
	"farmer_name" text NOT NULL,
	"farmer_phone" text NOT NULL,
	"fac_id" integer NOT NULL,
	"fac_name" text NOT NULL,
	"request_id" integer NOT NULL,
	"implements_attached" text DEFAULT '[]' NOT NULL,
	"deployed_at" text NOT NULL,
	"expected_return_at" text NOT NULL,
	"actual_return_at" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_known_lat" real,
	"last_known_lng" real,
	"last_location_at" text,
	"notes" text,
	CONSTRAINT "mech_deployments_ref_id_unique" UNIQUE("ref_id")
);
--> statement-breakpoint
CREATE TABLE "boa"."mech_hire_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" text NOT NULL,
	"farmer_name" text NOT NULL,
	"farmer_phone" text NOT NULL,
	"fac_id" integer NOT NULL,
	"fac_name" text NOT NULL,
	"location_description" text NOT NULL,
	"state" text NOT NULL,
	"lga" text,
	"hectares" real NOT NULL,
	"implements" text DEFAULT '[]' NOT NULL,
	"preferred_date" text,
	"notes" text,
	"quoted_amount" real,
	"quote_notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"tractor_id" integer,
	"tractor_model" text,
	"created_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "mech_hire_requests_ref_id_unique" UNIQUE("ref_id")
);
--> statement-breakpoint
CREATE TABLE "boa"."tractors" (
	"id" serial PRIMARY KEY NOT NULL,
	"serial_number" text NOT NULL,
	"model" text NOT NULL,
	"horsepower_hp" real NOT NULL,
	"drive_type" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"fac_id" integer,
	"fac_name" text,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "tractors_serial_number_unique" UNIQUE("serial_number")
);
