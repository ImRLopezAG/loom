CREATE TABLE "app"."labels" (
	"_id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"_createdAt" bigint DEFAULT floor((EXTRACT(epoch FROM clock_timestamp()) * (1000)::numeric)) NOT NULL,
	"name" text NOT NULL,
	"project_id" uuid NOT NULL
);

--> statement-breakpoint
CREATE TABLE "app"."task_labels" (
	"_id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"_createdAt" bigint DEFAULT floor((EXTRACT(epoch FROM clock_timestamp()) * (1000)::numeric)) NOT NULL,
	"label_id" uuid NOT NULL,
	"task_id" uuid NOT NULL
);

--> statement-breakpoint
CREATE INDEX "labels_0_idx" ON "app"."labels" ("project_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "task_labels_0_idx" ON "app"."task_labels" ("task_id","label_id");
--> statement-breakpoint
ALTER TABLE "app"."labels" ADD CONSTRAINT "labels_project_id_projects__id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("_id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "app"."task_labels" ADD CONSTRAINT "task_labels_label_id_labels__id_fkey" FOREIGN KEY ("label_id") REFERENCES "app"."labels"("_id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "app"."task_labels" ADD CONSTRAINT "task_labels_task_id_tasks__id_fkey" FOREIGN KEY ("task_id") REFERENCES "app"."tasks"("_id") ON DELETE RESTRICT;
