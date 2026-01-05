CREATE INDEX "idx_federation_clubs_federation_id" ON "federation_clubs" USING btree ("federation_id");--> statement-breakpoint
CREATE INDEX "idx_federation_clubs_organization_id" ON "federation_clubs" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "federation_clubs" ADD CONSTRAINT "unique_federation_organization" UNIQUE("federation_id","organization_id");--> statement-breakpoint
ALTER TABLE "championship_editions" ADD CONSTRAINT "chk_year_valid" CHECK ("championship_editions"."year" >= 2000 AND "championship_editions"."year" <= 2100);--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "chk_best_of_odd" CHECK ("events"."best_of" % 2 = 1);--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "chk_best_of_positive" CHECK ("events"."best_of" > 0);--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "chk_players_per_heat_min" CHECK ("events"."players_per_heat" IS NULL OR "events"."players_per_heat" >= 2);