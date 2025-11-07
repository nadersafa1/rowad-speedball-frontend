import { SortableField } from "./players-table-utils";
import { Player } from "@/types";
import { Gender, AgeGroup } from "../types/enums";

export interface PlayersTableProps {
  players: Player[];
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
  gender?: Gender;
  ageGroup?: AgeGroup;
  onGenderChange?: (gender: Gender) => void;
  onAgeGroupChange?: (ageGroup: AgeGroup) => void;
  sortBy?: SortableField;
  sortOrder?: "asc" | "desc";
  onSortingChange?: (
    sortBy?: SortableField,
    sortOrder?: "asc" | "desc"
  ) => void;
  isLoading?: boolean;
  onRefetch?: () => void;
}

