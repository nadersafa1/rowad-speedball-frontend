CREATE TABLE "federation_player_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"federation_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"responded_by" uuid,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_pending_player_federation_request" UNIQUE("player_id","federation_id","status")
);
--> statement-breakpoint
ALTER TABLE "federation_player_requests" ADD CONSTRAINT "federation_player_requests_federation_id_federations_id_fk" FOREIGN KEY ("federation_id") REFERENCES "public"."federations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_player_requests" ADD CONSTRAINT "federation_player_requests_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_player_requests" ADD CONSTRAINT "federation_player_requests_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_player_requests" ADD CONSTRAINT "federation_player_requests_responded_by_user_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_federation_player_requests_federation_id" ON "federation_player_requests" USING btree ("federation_id");--> statement-breakpoint
CREATE INDEX "idx_federation_player_requests_player_id" ON "federation_player_requests" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_federation_player_requests_organization_id" ON "federation_player_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_federation_player_requests_status" ON "federation_player_requests" USING btree ("status");