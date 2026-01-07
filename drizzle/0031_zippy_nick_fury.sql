CREATE TABLE "federation_club_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"federation_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"responded_by" uuid,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_pending_federation_request" UNIQUE("organization_id","federation_id","status")
);
--> statement-breakpoint
ALTER TABLE "federation_club_requests" ADD CONSTRAINT "federation_club_requests_federation_id_federations_id_fk" FOREIGN KEY ("federation_id") REFERENCES "public"."federations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_club_requests" ADD CONSTRAINT "federation_club_requests_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_club_requests" ADD CONSTRAINT "federation_club_requests_responded_by_user_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_federation_requests_federation_id" ON "federation_club_requests" USING btree ("federation_id");--> statement-breakpoint
CREATE INDEX "idx_federation_requests_organization_id" ON "federation_club_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_federation_requests_status" ON "federation_club_requests" USING btree ("status");