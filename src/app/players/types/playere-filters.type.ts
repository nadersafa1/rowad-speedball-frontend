import { AgeGroup, Gender } from "./enums";

interface PlayersFilters {
  q?: string;
  gender?: Gender;
  ageGroup?: AgeGroup;
  page?: number;
  limit?: number;
  sortBy?:
    | "name"
    | "dateOfBirth"
    | "createdAt"
    | "updatedAt"
    | "gender"
    | "preferredHand";
  sortOrder?: "asc" | "desc";
}

export type { PlayersFilters };
