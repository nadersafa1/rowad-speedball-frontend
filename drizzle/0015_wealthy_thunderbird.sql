ALTER TABLE "registrations" DROP CONSTRAINT "registrations_player1_id_players_id_fk";
--> statement-breakpoint
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_player2_id_players_id_fk";
--> statement-breakpoint
ALTER TABLE "registrations" DROP COLUMN "player1_id";--> statement-breakpoint
ALTER TABLE "registrations" DROP COLUMN "player2_id";