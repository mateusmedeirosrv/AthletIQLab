CREATE TYPE "public"."council_type" AS ENUM('cref', 'crefito', 'crm', 'crn', 'outro');--> statement-breakpoint
ALTER TABLE "personals" ADD COLUMN "council_type" "council_type" DEFAULT 'cref' NOT NULL;
