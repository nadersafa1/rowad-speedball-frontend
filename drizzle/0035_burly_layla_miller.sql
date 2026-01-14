ALTER TABLE "championship_editions" DROP CONSTRAINT "chk_year_valid";--> statement-breakpoint
DROP INDEX "idx_editions_championship_year";--> statement-breakpoint
ALTER TABLE "championship_editions" DROP COLUMN "year";