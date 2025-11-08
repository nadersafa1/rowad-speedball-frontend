type SortableField =
  | "totalScore"
  | "leftHandScore"
  | "rightHandScore"
  | "forehandScore"
  | "backhandScore"
  | "playerName"
  | "ageGroup"
  | "age"
  | "createdAt";

export const columnToApiFieldMap: Record<string, SortableField> = {
  rank: "totalScore",
  playerName: "playerName",
  ageGroup: "ageGroup",
  gender: "playerName",
  age: "age",
  leftHandScore: "leftHandScore",
  rightHandScore: "rightHandScore",
  forehandScore: "forehandScore",
  backhandScore: "backhandScore",
  totalScore: "totalScore",
  createdAt: "createdAt",
};

import { ResultWithPlayer as StoreResultWithPlayer } from "@/store/results-store";

export type ResultWithPlayer = StoreResultWithPlayer;

export interface ResultsTableProps {
  results: ResultWithPlayer[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange?: (search: string) => void;
  searchValue?: string;
  gender?: "male" | "female" | "all";
  ageGroup?: string;
  yearOfBirth?: number;
  onGenderChange?: (gender: "male" | "female" | "all") => void;
  onAgeGroupChange?: (ageGroup: string) => void;
  onYearOfBirthChange?: (year: number | undefined) => void;
  sortBy?: SortableField;
  sortOrder?: "asc" | "desc";
  onSortingChange?: (
    sortBy?: SortableField,
    sortOrder?: "asc" | "desc"
  ) => void;
  isLoading?: boolean;
  onRefetch?: () => void;
}

export type { SortableField };

