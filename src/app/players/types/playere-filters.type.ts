import { AgeGroup, Gender } from "./enums";

interface PlayersFilters {
  q?: string;
  gender?: Gender;
  ageGroup?: AgeGroup;
  page?: number;
  limit?: number;
}

export type { PlayersFilters };
