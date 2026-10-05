CREATE SCHEMA "cmp_journal_81dd6b775afcccb6dbb8a25a";

--> statement-breakpoint
CREATE TABLE "cmp_journal_81dd6b775afcccb6dbb8a25a"."entries" (
	"_id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"_createdAt" bigint DEFAULT floor((EXTRACT(epoch FROM clock_timestamp()) * (1000)::numeric)) NOT NULL,
	"issuer" text NOT NULL,
	"owner" text NOT NULL,
	"text" text NOT NULL
);

--> statement-breakpoint
CREATE INDEX "entries_0_idx" ON "cmp_journal_81dd6b775afcccb6dbb8a25a"."entries" ("issuer","owner");
