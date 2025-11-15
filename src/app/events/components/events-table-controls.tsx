import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table } from "@tanstack/react-table";
import { Event } from "@/types";

interface EventsTableControlsProps {
  table: Table<Event>;
  searchValue: string;
  onSearchChange?: (value: string) => void;
  eventType?: "singles" | "doubles";
  gender?: "male" | "female" | "mixed";
  onEventTypeChange?: (eventType?: "singles" | "doubles") => void;
  onGenderChange?: (gender?: "male" | "female" | "mixed") => void;
}

export const EventsTableControls = ({
  table,
  searchValue,
  onSearchChange,
  eventType,
  gender,
  onEventTypeChange,
  onGenderChange,
}: EventsTableControlsProps) => {
  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      eventType: "Type",
      gender: "Gender",
      completed: "Completed",
      registrationDates: "Registration Dates",
      eventDates: "Event Dates",
      bestOf: "Best Of",
      registrationsCount: "Registrations",
      lastMatchPlayedDate: "Last Match",
    };
    return labels[columnId] || columnId;
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Search input and Column Visibility */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            className="w-full md:max-w-md pl-10"
          />
        </div>
        {/* Column Visibility */}
        <div className="w-full md:w-auto md:ml-auto">
          <Label className="block mb-2 md:invisible md:h-0 md:mb-0">
            Columns
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {getColumnLabel(column.id)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2: Event Type and Gender Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Event Type Filter */}
        <div className="flex-1 w-full md:w-auto">
          <Label htmlFor="eventType" className="block mb-2">
            Event Type
          </Label>
          <Select
            name="eventType"
            value={eventType || "all"}
            onValueChange={(value) =>
              onEventTypeChange?.(value === "all" ? undefined : (value as "singles" | "doubles"))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="singles">Singles</SelectItem>
              <SelectItem value="doubles">Doubles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gender Filter */}
        <div className="flex-1 w-full md:w-auto">
          <Label htmlFor="gender" className="block mb-2">
            Gender
          </Label>
          <Select
            name="gender"
            value={gender || "all"}
            onValueChange={(value) =>
              onGenderChange?.(
                value === "all" ? undefined : (value as "male" | "female" | "mixed")
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

