-- Convert boolean to text enum using USING clause to cast during type change
ALTER TABLE "tests" ALTER COLUMN "visibility" SET DATA TYPE text USING CASE WHEN "visibility" = true THEN 'public' ELSE 'private' END;--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "visibility" SET DEFAULT 'public';