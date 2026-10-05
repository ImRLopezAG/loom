CREATE SCHEMA "start_app";

--> statement-breakpoint
CREATE TABLE "start_app"."notes" (
	"_id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"_createdAt" bigint DEFAULT floor((EXTRACT(epoch FROM clock_timestamp()) * (1000)::numeric)) NOT NULL,
	"issuer" text NOT NULL,
	"owner" text NOT NULL,
	"text" text NOT NULL
);

--> statement-breakpoint
CREATE INDEX "notes_0_idx" ON "start_app"."notes" ("issuer","owner");
