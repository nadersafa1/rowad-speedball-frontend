ALTER TABLE "coaches" ADD COLUMN "name_rtl" varchar(255);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "name_rtl" varchar(255);--> statement-breakpoint
UPDATE "coaches" SET "name_rtl" = "name";--> statement-breakpoint
UPDATE "players" SET "name_rtl" = "name";