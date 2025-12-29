CREATE INDEX "idx_players_organization_id" ON "players" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_players_gender" ON "players" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "idx_players_team_level" ON "players" USING btree ("team_level");--> statement-breakpoint
CREATE INDEX "idx_players_org_gender_team" ON "players" USING btree ("organization_id","gender","team_level");--> statement-breakpoint
CREATE INDEX "idx_attendance_player_id" ON "training_session_attendance" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_session_id" ON "training_session_attendance" USING btree ("training_session_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_status" ON "training_session_attendance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_attendance_player_status" ON "training_session_attendance" USING btree ("player_id","status");--> statement-breakpoint
CREATE INDEX "idx_training_sessions_organization_id" ON "training_sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_training_sessions_date" ON "training_sessions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_training_sessions_org_date" ON "training_sessions" USING btree ("organization_id","date");