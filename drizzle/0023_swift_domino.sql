ALTER TABLE "registration_players" ALTER COLUMN "position" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "registration_players" ALTER COLUMN "position" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "players_per_heat" integer;--> statement-breakpoint
ALTER TABLE "registration_players" ADD COLUMN "order" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "team_name" varchar(255);--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "left_hand_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "right_hand_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "forehand_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "backhand_score" integer DEFAULT 0 NOT NULL;