-- Add federationId to user table
ALTER TABLE "user" ADD COLUMN "federation_id" uuid REFERENCES "federations"("id") ON DELETE SET NULL;

-- Create federation_players junction table
CREATE TABLE IF NOT EXISTS "federation_players" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "federation_id" uuid NOT NULL REFERENCES "federations"("id") ON DELETE CASCADE,
  "player_id" uuid NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "federation_registration_number" varchar(50) NOT NULL,
  "registration_year" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "federation_players_federation_id_player_id_unique" UNIQUE("federation_id", "player_id")
);

