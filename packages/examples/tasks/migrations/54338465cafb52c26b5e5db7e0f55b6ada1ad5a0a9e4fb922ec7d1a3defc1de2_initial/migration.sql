CREATE SCHEMA "app";

--> statement-breakpoint
CREATE TABLE "app"."projects" (
	"_id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"_createdAt" bigint DEFAULT floor((EXTRACT(epoch FROM clock_timestamp()) * (1000)::numeric)) NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"owner_issuer" text NOT NULL
);

--> statement-breakpoint
CREATE TABLE "app"."tasks" (
	"_id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"_createdAt" bigint DEFAULT floor((EXTRACT(epoch FROM clock_timestamp()) * (1000)::numeric)) NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL
);

--> statement-breakpoint
CREATE INDEX "projects_0_idx" ON "app"."projects" ("owner_issuer","owner_id");
--> statement-breakpoint
CREATE INDEX "tasks_0_idx" ON "app"."tasks" ("project_id");
--> statement-breakpoint
ALTER TABLE "app"."tasks" ADD CONSTRAINT "tasks_project_id_projects__id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("_id") ON DELETE RESTRICT;
