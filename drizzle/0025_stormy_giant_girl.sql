ALTER TABLE "federation_players" DROP CONSTRAINT "federation_players_federation_id_player_id_unique";--> statement-breakpoint
ALTER TABLE "registration_players" DROP CONSTRAINT "registration_players_registration_id_player_id_unique";--> statement-breakpoint
ALTER TABLE "training_session_attendance" DROP CONSTRAINT "training_session_attendance_player_id_training_session_id_unique";--> statement-breakpoint
ALTER TABLE "federation_players" ADD CONSTRAINT "unique_federation_player" UNIQUE("federation_id","player_id");--> statement-breakpoint
ALTER TABLE "registration_players" ADD CONSTRAINT "unique_registration_player" UNIQUE("registration_id","player_id");--> statement-breakpoint
ALTER TABLE "training_session_attendance" ADD CONSTRAINT "unique_player_session" UNIQUE("player_id","training_session_id");