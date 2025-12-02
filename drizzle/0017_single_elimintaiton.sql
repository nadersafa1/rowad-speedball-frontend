-- Single Elimination Events Migration
-- This migration adds single-elimination tournament support

-- Step 1: Add new columns to events table
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "format" text DEFAULT 'groups' NOT NULL;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "has_third_place_match" boolean DEFAULT false;

-- Step 2: Migrate existing data from group_mode to format
-- All existing events with group_mode should be mapped to 'groups' format
UPDATE "events" SET "format" = 'groups' WHERE "format" IS NULL OR "format" = '';

-- Step 3: Drop the old group_mode column (if exists)
ALTER TABLE "events" DROP COLUMN IF EXISTS "group_mode";

-- Step 4: Add seed column to registrations for seeding in single elimination
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "seed" integer;

-- Step 5: Make registration IDs nullable in matches (for BYE matches in single elimination)
ALTER TABLE "matches" ALTER COLUMN "registration1_id" DROP NOT NULL;
ALTER TABLE "matches" ALTER COLUMN "registration2_id" DROP NOT NULL;

-- Step 6: Add single elimination specific columns to matches
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "bracket_position" integer;
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "winner_to" uuid;
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "winner_to_slot" integer;
