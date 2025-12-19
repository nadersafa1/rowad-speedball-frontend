ALTER TABLE "registration_players" ADD COLUMN "position_scores" jsonb;--> statement-breakpoint
CREATE INDEX "idx_registration_players_position_scores" ON "registration_players" USING gin ("position_scores");--> statement-breakpoint
ALTER TABLE "registration_players" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "registrations" DROP COLUMN "left_hand_score";--> statement-breakpoint
ALTER TABLE "registrations" DROP COLUMN "right_hand_score";--> statement-breakpoint
ALTER TABLE "registrations" DROP COLUMN "forehand_score";--> statement-breakpoint
ALTER TABLE "registrations" DROP COLUMN "backhand_score";--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "chk_max_gte_min_players" CHECK ("events"."max_players" >= "events"."min_players");