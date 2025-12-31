CREATE INDEX "idx_championships_federation_id" ON "championships" USING btree ("federation_id");--> statement-breakpoint
CREATE INDEX "idx_coaches_organization_id" ON "coaches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_coaches_gender" ON "coaches" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "idx_events_organization_id" ON "events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_events_event_type" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_events_visibility" ON "events" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_events_completed" ON "events" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "idx_events_championship_id" ON "events" USING btree ("championship_id");--> statement-breakpoint
CREATE INDEX "idx_groups_event_id" ON "groups" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_matches_event_id" ON "matches" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_matches_group_id" ON "matches" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_matches_played" ON "matches" USING btree ("played");--> statement-breakpoint
CREATE INDEX "idx_registrations_event_id" ON "registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_registrations_group_id" ON "registrations" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_tests_organization_id" ON "tests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_tests_visibility" ON "tests" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_tests_date_conducted" ON "tests" USING btree ("date_conducted");--> statement-breakpoint
ALTER TABLE "training_session_coaches" ADD CONSTRAINT "unique_session_coach" UNIQUE("training_session_id","coach_id");