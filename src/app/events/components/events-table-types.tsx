import { Event } from "@/types";

type SortableField =
  | "name"
  | "eventType"
  | "gender"
  | "completed"
  | "registrationsCount"
  | "lastMatchPlayedDate";

export interface EventsTableProps {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  eventType?: "singles" | "doubles";
  gender?: "male" | "female" | "mixed";
  onEventTypeChange?: (eventType?: "singles" | "doubles") => void;
  onGenderChange?: (gender?: "male" | "female" | "mixed") => void;
  sortBy?: SortableField;
  sortOrder?: "asc" | "desc";
  onSortingChange?: (
    sortBy?: SortableField,
    sortOrder?: "asc" | "desc"
  ) => void;
  isLoading?: boolean;
  onRefetch?: () => void;
}

