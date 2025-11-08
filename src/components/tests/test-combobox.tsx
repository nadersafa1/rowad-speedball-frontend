"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiClient } from "@/lib/api-client";
import type { Test, PaginatedResponse } from "@/types";

interface TestComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const TestCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select test...",
  className,
}: TestComboboxProps) => {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tests, setTests] = React.useState<Test[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedTest, setSelectedTest] = React.useState<Test | null>(null);

  // Debounced search effect
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() || open) {
        fetchTests(searchQuery.trim());
      }
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, open]);

  // Fetch selected test when value changes
  React.useEffect(() => {
    if (value && !selectedTest) {
      fetchSelectedTest(value);
    } else if (!value) {
      setSelectedTest(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fetchTests = async (query: string = "") => {
    setIsLoading(true);
    try {
      const response = (await apiClient.getTests({
        q: query,
        limit: 50,
      })) as PaginatedResponse<Test>;

      setTests(response.data);

      // If we have a value, find and set the selected test
      if (value && !selectedTest) {
        const found = response.data.find((t) => t.id === value);
        if (found) {
          setSelectedTest(found);
        }
      }
    } catch (error) {
      console.error("Failed to fetch tests:", error);
      setTests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSelectedTest = async (testId: string) => {
    try {
      const test = (await apiClient.getTest(testId)) as Test;
      setSelectedTest(test);
    } catch (error) {
      console.error("Failed to fetch selected test:", error);
    }
  };

  const getTestType = (test: Test) => {
    if (test.playingTime === 60 && test.recoveryTime === 30) {
      return "Super Solo";
    } else if (test.playingTime === 30 && test.recoveryTime === 30) {
      return "Juniors Solo";
    } else {
      return "Speed Solo";
    }
  };

  const formatTestLabel = (test: Test) => {
    return `${test.name} (${getTestType(test)})`;
  };

  const getTestTypeDetails = (test: Test) => {
    if (test.playingTime === 60 && test.recoveryTime === 30) {
      return "Super Solo (60s/30s)";
    } else if (test.playingTime === 30 && test.recoveryTime === 30) {
      return "Juniors Solo (30s/30s)";
    } else {
      return "Speed Solo (30s/60s)";
    }
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedTest ? formatTestLabel(selectedTest) : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search tests..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Searching...
                  </span>
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {searchQuery
                      ? "No tests found."
                      : "Start typing to search..."}
                  </CommandEmpty>
                  <CommandGroup>
                    {tests.map((test) => (
                      <CommandItem
                        key={test.id}
                        value={test.id}
                        onSelect={(currentValue) => {
                          const newValue =
                            currentValue === value ? "" : currentValue;
                          const test = tests.find((t) => t.id === newValue);
                          if (test) {
                            setSelectedTest(test);
                            onValueChange?.(newValue);
                          }
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === test.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {formatTestLabel(test)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedTest && (
        <div className="text-sm text-gray-600 mt-1">
          Date: {new Date(selectedTest.dateConducted).toLocaleDateString()} • Type: {getTestTypeDetails(selectedTest)}
        </div>
      )}
    </div>
  );
};

export default TestCombobox;

