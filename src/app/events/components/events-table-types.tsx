import { Event } from "@/types";
import type { EventType } from "@/types/event-types";

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
  eventType?: EventType;
  gender?: "male" | "female" | "mixed";
  organizationId?: string | null;
  onEventTypeChange?: (eventType?: EventType) => void;
  onGenderChange?: (gender?: "male" | "female" | "mixed") => void;
  onOrganizationChange?: (organizationId?: string | null) => void;
  sortBy?: SortableField;
  sortOrder?: "asc" | "desc";
  onSortingChange?: (
    sortBy?: SortableField,
    sortOrder?: "asc" | "desc"
  ) => void;
  isLoading?: boolean;
  onRefetch?: () => void;
}

