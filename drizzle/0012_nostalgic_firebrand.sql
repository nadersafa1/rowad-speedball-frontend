CREATE TYPE "public"."attendance_status" AS ENUM('pending', 'present', 'late', 'absent_excused', 'absent_unexcused', 'suspended');--> statement-breakpoint
CREATE TABLE "training_session_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"training_session_id" uuid NOT NULL,
	"status" "attendance_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "training_session_attendance_player_id_training_session_id_unique" UNIQUE("player_id","training_session_id")
);
--> statement-breakpoint
ALTER TABLE "training_session_attendance" ADD CONSTRAINT "training_session_attendance_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session_attendance" ADD CONSTRAINT "training_session_attendance_training_session_id_training_sessions_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "public"."training_sessions"("id") ON DELETE cascade ON UPDATE no action;