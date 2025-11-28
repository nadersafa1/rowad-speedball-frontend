"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMemo } from "react";

export function TestDatePicker({
  date,
  onDateChange,
  disabled = false,
  className,
  ...props
}: {
  date: Date;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
  className?: string;
} & Omit<React.ComponentProps<typeof Button>, 'date' | 'onDateChange'>) {
  const today = useMemo(() => new Date(), []);

  const oneYearFromNow = useMemo(() => {
    return new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  }, [today]);

  const fiveYearsAgo = useMemo(() => {
    return new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
  }, [today]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={cn(
            "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal",
            "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
            className
          )}
          disabled={disabled}
          {...props}
        >
          <CalendarIcon />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          required
          defaultMonth={date}
          disabled={{
            before: fiveYearsAgo,
            after: oneYearFromNow,
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
