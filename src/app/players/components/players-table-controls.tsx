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
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table } from "@tanstack/react-table";
import { Player } from "@/types";
import { Gender, AgeGroup, Team } from "../types/enums";

interface PlayersTableControlsProps {
  table: Table<Player>;
  searchValue: string;
  onSearchChange?: (value: string) => void;
  gender?: Gender;
  ageGroup?: AgeGroup;
  team?: Team;
  onGenderChange?: (gender: Gender) => void;
  onAgeGroupChange?: (ageGroup: AgeGroup) => void;
  onTeamChange?: (team: Team) => void;
}

export const PlayersTableControls = ({
  table,
  searchValue,
  onSearchChange,
  gender,
  ageGroup,
  team,
  onGenderChange,
  onAgeGroupChange,
  onTeamChange,
}: PlayersTableControlsProps) => {
  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      preferredHand: "Preferred Hand",
      dateOfBirth: "Date of Birth",
      createdAt: "Created",
    };
    return labels[columnId] || columnId;
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Search input */}
      <div className="flex flex-col md:flex-row gap-4">

      <div className="w-full relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by player's name..."
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

      {/* Row 2: Gender, Age Group, Column visibility */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Gender Filter */}
        <div className="flex-1 w-full md:w-auto">
          <Label htmlFor="gender" className="block mb-2">
            Gender
          </Label>
          <Select
            name="gender"
            value={gender}
            onValueChange={(value: Gender) => onGenderChange?.(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Gender.MALE}>Male</SelectItem>
              <SelectItem value={Gender.FEMALE}>Female</SelectItem>
              <SelectItem value={Gender.ALL}>All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Age Group Filter */}
        <div className="flex-1 w-full md:w-auto">
          <Label htmlFor="ageGroup" className="block mb-2">
            Age Group
          </Label>
          <Select
            name="ageGroup"
            value={ageGroup}
            onValueChange={(value: AgeGroup) => onAgeGroupChange?.(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an Age Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AgeGroup.ALL}>All Age Groups</SelectItem>
              <SelectItem value={AgeGroup.MINI}>Mini (U-07)</SelectItem>
              <SelectGroup>
                <SelectLabel>Juniors</SelectLabel>
                <SelectItem value={AgeGroup.U_09}>U-09</SelectItem>
                <SelectItem value={AgeGroup.U_11}>U-11</SelectItem>
                <SelectItem value={AgeGroup.U_13}>U-13</SelectItem>
                <SelectItem value={AgeGroup.U_15}>U-15</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Seniors</SelectLabel>
                <SelectItem value={AgeGroup.U_17}>U-17</SelectItem>
                <SelectItem value={AgeGroup.U_19}>U-19</SelectItem>
                <SelectItem value={AgeGroup.U_21}>U-21</SelectItem>
                <SelectItem value={AgeGroup.SENIORS}>Seniors</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Team Filter */}
        <div className="flex-1 w-full md:w-auto">
          <Label htmlFor="team" className="block mb-2">
            Team
          </Label>
          <Select
            name="team"
            value={team}
            onValueChange={(value: Team) => onTeamChange?.(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Team.ALL}>All Teams</SelectItem>
              <SelectItem value={Team.FIRST_TEAM}>First Team</SelectItem>
              <SelectItem value={Team.ROWAD_B}>Rowad B</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

