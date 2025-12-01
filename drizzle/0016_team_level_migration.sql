-- Migration: Convert is_first_team boolean to team_level enum
-- Step 1: Add new team_level column as nullable text
ALTER TABLE "players" ADD COLUMN "team_level" text;

-- Step 2: Migrate data from is_first_team to team_level
-- true (First Team) -> team_a
-- false (Rowad B) -> team_c
UPDATE "players" SET "team_level" = CASE 
    WHEN "is_first_team" = true THEN 'team_a' 
    ELSE 'team_c' 
END;

-- Step 3: Set NOT NULL constraint
ALTER TABLE "players" ALTER COLUMN "team_level" SET NOT NULL;

-- Step 4: Set default value
ALTER TABLE "players" ALTER COLUMN "team_level" SET DEFAULT 'team_c';

-- Step 5: Drop the old is_first_team column
ALTER TABLE "players" DROP COLUMN "is_first_team";

