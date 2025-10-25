import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectGroup, SelectLabel } from "@/components/ui/select";
import { Filter, Search } from "lucide-react";
import React from "react";
import { PlayersFilters } from "../types";
import { AgeGroup, Gender } from "../types/enums";

interface PlayersFiltersSectionProps {
  filters: PlayersFilters;
  setFilters: React.Dispatch<React.SetStateAction<PlayersFilters>>;
}

const PlayersFiltersSection = ({
  filters,
  setFilters,
}: PlayersFiltersSectionProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={filters.q}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    q: e.target.value,
                    page: 1,
                  }))
                }
                className="pl-10"
              />
            </div>
          </div>

          {/* Gender and Age Group Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="gender" className="block mb-2">
                Gender
              </Label>
              <Select
                name="gender"
                value={filters.gender}
                onValueChange={(value: Gender) =>
                  setFilters((prev) => ({
                    ...prev,
                    gender: value,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label htmlFor="ageGroup" className="block mb-2">
                Age Group
              </Label>
              <Select
                name="ageGroup"
                value={filters.ageGroup}
                onValueChange={(value: AgeGroup) =>
                  setFilters((prev) => ({
                    ...prev,
                    ageGroup: value,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a Gender" />
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayersFiltersSection;
