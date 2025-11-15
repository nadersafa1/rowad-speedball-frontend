import { AgeGroup, Gender, Team } from "./enums";

interface PlayersFilters {
  q?: string;
  gender?: Gender;
  ageGroup?: AgeGroup;
  team?: Team;
  page?: number;
  limit?: number;
  sortBy?:
    | "name"
    | "dateOfBirth"
    | "createdAt"
    | "updatedAt"
    | "gender"
    | "preferredHand"
    | "isFirstTeam";
  sortOrder?: "asc" | "desc";
}

export type { PlayersFilters };
