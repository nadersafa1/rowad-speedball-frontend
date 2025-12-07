"use client";

import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const HeaderTooltip = ({
  label,
  description,
}: {
  label: string;
  description: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="cursor-help">{label}</span>
    </TooltipTrigger>
    <TooltipContent>
      <p>{description}</p>
    </TooltipContent>
  </Tooltip>
);

export const StandingsTableHeader = () => (
  <TooltipProvider>
    <TableHeader>
      <TableRow>
        <TableHead className="w-12 px-2 sm:px-4">Position</TableHead>
        <TableHead className="px-2 sm:px-4">Player(s)</TableHead>
        <TableHead className="text-center px-2 sm:px-4">
          <HeaderTooltip
            label="MP"
            description="Matches Played - Total number of matches completed"
          />
        </TableHead>
        <TableHead className="text-center px-2 sm:px-4">
          <HeaderTooltip label="W" description="Wins - Number of matches won" />
        </TableHead>
        <TableHead className="text-center px-2 sm:px-4">
          <HeaderTooltip
            label="L"
            description="Losses - Number of matches lost"
          />
        </TableHead>
        <TableHead className="text-center px-2 sm:px-4">
          <HeaderTooltip label="SF" description="Sets For - Total sets won" />
        </TableHead>
        <TableHead className="text-center px-2 sm:px-4">
          <HeaderTooltip
            label="SA"
            description="Sets Against - Total sets lost"
          />
        </TableHead>
        <TableHead className="text-center px-2 sm:px-4">
          <HeaderTooltip
            label="SD"
            description="Sets Difference - Difference between sets won and sets lost (SF - SA)"
          />
        </TableHead>
        <TableHead className="text-center px-2 sm:px-4">Points</TableHead>
      </TableRow>
    </TableHeader>
  </TooltipProvider>
);

