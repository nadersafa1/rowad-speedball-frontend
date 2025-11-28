ALTER TABLE "coaches" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;