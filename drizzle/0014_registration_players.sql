CREATE TABLE "registration_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "registration_players_registration_id_player_id_unique" UNIQUE("registration_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "registrations" ALTER COLUMN "player1_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "min_players" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "max_players" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
-- Migrate existing events: set min based on event type for backward compatibility
UPDATE "events" SET "min_players" = 
  CASE 
    WHEN "event_type" IN ('solo', 'singles') THEN 1
    WHEN "event_type" = 'doubles' THEN 2
    ELSE 2
  END;--> statement-breakpoint
ALTER TABLE "registration_players" ADD CONSTRAINT "registration_players_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_players" ADD CONSTRAINT "registration_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Migrate existing player1Id data to registration_players junction table
INSERT INTO "registration_players" ("registration_id", "player_id", "position", "created_at")
SELECT id, player1_id, 1, created_at FROM "registrations" WHERE player1_id IS NOT NULL;--> statement-breakpoint
-- Migrate existing player2Id data to registration_players junction table
INSERT INTO "registration_players" ("registration_id", "player_id", "position", "created_at")
SELECT id, player2_id, 2, created_at FROM "registrations" WHERE player2_id IS NOT NULL;