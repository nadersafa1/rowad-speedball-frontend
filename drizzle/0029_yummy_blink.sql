CREATE TABLE "championship_editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"championship_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"registration_start_date" date,
	"registration_end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"final_position" integer,
	"placement_tier_id" uuid NOT NULL,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_event_registration" UNIQUE("event_id","registration_id")
);
--> statement-breakpoint
CREATE TABLE "placement_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100),
	"description" text,
	"rank" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tiers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "points_schema_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"points_schema_id" uuid NOT NULL,
	"placement_tier_id" uuid NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_schema_tier" UNIQUE("points_schema_id","placement_tier_id")
);
--> statement-breakpoint
CREATE TABLE "points_schemas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_championship_id_championships_id_fk";
--> statement-breakpoint
DROP INDEX "idx_events_championship_id";--> statement-breakpoint
ALTER TABLE "championships" ADD COLUMN "competition_scope" text DEFAULT 'clubs' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "championship_edition_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "points_schema_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "championship_editions" ADD CONSTRAINT "championship_editions_championship_id_championships_id_fk" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_results" ADD CONSTRAINT "event_results_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_results" ADD CONSTRAINT "event_results_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_results" ADD CONSTRAINT "event_results_placement_tier_id_placement_tiers_id_fk" FOREIGN KEY ("placement_tier_id") REFERENCES "public"."placement_tiers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_schema_entries" ADD CONSTRAINT "points_schema_entries_points_schema_id_points_schemas_id_fk" FOREIGN KEY ("points_schema_id") REFERENCES "public"."points_schemas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_schema_entries" ADD CONSTRAINT "points_schema_entries_placement_tier_id_placement_tiers_id_fk" FOREIGN KEY ("placement_tier_id") REFERENCES "public"."placement_tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_editions_championship_year" ON "championship_editions" USING btree ("championship_id","year");--> statement-breakpoint
CREATE INDEX "idx_editions_status" ON "championship_editions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_event_results_event_id" ON "event_results" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_results_registration_id" ON "event_results" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "idx_event_results_placement_tier_id" ON "event_results" USING btree ("placement_tier_id");--> statement-breakpoint
CREATE INDEX "idx_event_results_final_position" ON "event_results" USING btree ("final_position");--> statement-breakpoint
CREATE INDEX "idx_points_schema_entries_schema_id" ON "points_schema_entries" USING btree ("points_schema_id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_championship_edition_id_championship_editions_id_fk" FOREIGN KEY ("championship_edition_id") REFERENCES "public"."championship_editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_points_schema_id_points_schemas_id_fk" FOREIGN KEY ("points_schema_id") REFERENCES "public"."points_schemas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_events_championship_edition_id" ON "events" USING btree ("championship_edition_id");--> statement-breakpoint
CREATE INDEX "idx_events_points_schema_id" ON "events" USING btree ("points_schema_id");--> statement-breakpoint
CREATE INDEX "idx_matches_winner_id" ON "matches" USING btree ("winner_id");--> statement-breakpoint
CREATE INDEX "idx_matches_registration1_id" ON "matches" USING btree ("registration1_id");--> statement-breakpoint
CREATE INDEX "idx_matches_registration2_id" ON "matches" USING btree ("registration2_id");--> statement-breakpoint
CREATE INDEX "idx_matches_event_round" ON "matches" USING btree ("event_id","round");--> statement-breakpoint
CREATE INDEX "idx_sets_match_id" ON "sets" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_sets_match_set_number" ON "sets" USING btree ("match_id","set_number");--> statement-breakpoint
CREATE INDEX "idx_test_results_player_id" ON "test_results" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_test_results_test_id" ON "test_results" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "idx_test_results_player_test" ON "test_results" USING btree ("player_id","test_id");--> statement-breakpoint
ALTER TABLE "championships" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "championships" DROP COLUMN "end_date";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "championship_id";--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "unique_match_set_number" UNIQUE("match_id","set_number");--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "unique_player_test" UNIQUE("player_id","test_id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "chk_round_positive" CHECK ("matches"."round" > 0);--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "chk_match_number_positive" CHECK ("matches"."match_number" > 0);--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "chk_different_registrations" CHECK ("matches"."registration1_id" IS NULL OR "matches"."registration2_id" IS NULL OR "matches"."registration1_id" != "matches"."registration2_id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "chk_winner_valid" CHECK ("matches"."played" = false OR "matches"."winner_id" IS NULL OR "matches"."winner_id" = "matches"."registration1_id" OR "matches"."winner_id" = "matches"."registration2_id");--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "chk_set_number_positive" CHECK ("sets"."set_number" > 0);--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "chk_reg1_score_non_negative" CHECK ("sets"."registration1_score" >= 0);--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "chk_reg2_score_non_negative" CHECK ("sets"."registration2_score" >= 0);--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "chk_left_hand_score_non_negative" CHECK ("test_results"."left_hand_score" >= 0);--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "chk_right_hand_score_non_negative" CHECK ("test_results"."right_hand_score" >= 0);--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "chk_forehand_score_non_negative" CHECK ("test_results"."forehand_score" >= 0);--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "chk_backhand_score_non_negative" CHECK ("test_results"."backhand_score" >= 0);