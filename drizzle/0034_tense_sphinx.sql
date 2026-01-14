CREATE TABLE "federation_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"federation_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"federation_id_number" varchar(50) NOT NULL,
	"first_registration_season_id" uuid NOT NULL,
	"first_registration_date" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_federation_member" UNIQUE("federation_id","player_id"),
	CONSTRAINT "unique_federation_id_number" UNIQUE("federation_id","federation_id_number")
);
--> statement-breakpoint
CREATE TABLE "season_age_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"min_age" integer,
	"max_age" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_season_age_group" UNIQUE("season_id","code"),
	CONSTRAINT "chk_age_range" CHECK ("season_age_groups"."min_age" IS NULL OR "season_age_groups"."max_age" IS NULL OR "season_age_groups"."max_age" >= "season_age_groups"."min_age")
);
--> statement-breakpoint
CREATE TABLE "season_player_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"season_age_group_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"player_age_at_registration" integer NOT NULL,
	"registration_date" timestamp DEFAULT now() NOT NULL,
	"age_warning_shown" boolean DEFAULT false,
	"age_warning_type" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp,
	"approved_by" uuid,
	"rejection_reason" text,
	"payment_status" text DEFAULT 'unpaid',
	"payment_amount" numeric(10, 2),
	"payment_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_player_season_age_group" UNIQUE("season_id","player_id","season_age_group_id")
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"federation_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"season_start_date" date NOT NULL,
	"season_end_date" date NOT NULL,
	"first_registration_start_date" date,
	"first_registration_end_date" date,
	"second_registration_start_date" date,
	"second_registration_end_date" date,
	"max_age_groups_per_player" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_federation_season" UNIQUE("federation_id","start_year","end_year"),
	CONSTRAINT "chk_year_range" CHECK ("seasons"."end_year" = "seasons"."start_year" + 1),
	CONSTRAINT "chk_season_dates" CHECK ("seasons"."season_end_date" > "seasons"."season_start_date"),
	CONSTRAINT "chk_max_age_groups" CHECK ("seasons"."max_age_groups_per_player" >= 1)
);
--> statement-breakpoint
ALTER TABLE "federation_player_requests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "federation_players" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "federation_player_requests" CASCADE;--> statement-breakpoint
DROP TABLE "federation_players" CASCADE;--> statement-breakpoint
ALTER TABLE "championship_editions" ADD COLUMN "season_id" uuid;--> statement-breakpoint
ALTER TABLE "federation_members" ADD CONSTRAINT "federation_members_federation_id_federations_id_fk" FOREIGN KEY ("federation_id") REFERENCES "public"."federations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_members" ADD CONSTRAINT "federation_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federation_members" ADD CONSTRAINT "federation_members_first_registration_season_id_seasons_id_fk" FOREIGN KEY ("first_registration_season_id") REFERENCES "public"."seasons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_age_groups" ADD CONSTRAINT "season_age_groups_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_player_registrations" ADD CONSTRAINT "season_player_registrations_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_player_registrations" ADD CONSTRAINT "season_player_registrations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_player_registrations" ADD CONSTRAINT "season_player_registrations_season_age_group_id_season_age_groups_id_fk" FOREIGN KEY ("season_age_group_id") REFERENCES "public"."season_age_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_player_registrations" ADD CONSTRAINT "season_player_registrations_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_player_registrations" ADD CONSTRAINT "season_player_registrations_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_federation_id_federations_id_fk" FOREIGN KEY ("federation_id") REFERENCES "public"."federations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_federation_members_federation_id" ON "federation_members" USING btree ("federation_id");--> statement-breakpoint
CREATE INDEX "idx_federation_members_player_id" ON "federation_members" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_federation_members_id_number" ON "federation_members" USING btree ("federation_id_number");--> statement-breakpoint
CREATE INDEX "idx_season_age_groups_season_id" ON "season_age_groups" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_season_registrations_season_id" ON "season_player_registrations" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "idx_season_registrations_player_id" ON "season_player_registrations" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_season_registrations_age_group" ON "season_player_registrations" USING btree ("season_age_group_id");--> statement-breakpoint
CREATE INDEX "idx_season_registrations_status" ON "season_player_registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_season_registrations_organization" ON "season_player_registrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_seasons_federation_id" ON "seasons" USING btree ("federation_id");--> statement-breakpoint
CREATE INDEX "idx_seasons_status" ON "seasons" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_seasons_dates" ON "seasons" USING btree ("season_start_date","season_end_date");--> statement-breakpoint
ALTER TABLE "championship_editions" ADD CONSTRAINT "championship_editions_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_editions_season_id" ON "championship_editions" USING btree ("season_id");