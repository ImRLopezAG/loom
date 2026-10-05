CREATE SCHEMA "app";

--> statement-breakpoint
CREATE TABLE "app"."files" (
	"_id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"_createdAt" bigint DEFAULT floor((EXTRACT(epoch FROM clock_timestamp()) * (1000)::numeric)) NOT NULL,
	"bucket" text NOT NULL,
	"content_type" text NOT NULL,
	"intent_id" uuid NOT NULL UNIQUE,
	"job_id" uuid,
	"owner_id" text NOT NULL,
	"owner_issuer" text NOT NULL,
	"owner_tenant" text NOT NULL,
	"sha256" text NOT NULL,
	"size" integer NOT NULL,
	"summary" text
);

--> statement-breakpoint
CREATE INDEX "files_0_idx" ON "app"."files" ("owner_issuer","owner_id","owner_tenant");
