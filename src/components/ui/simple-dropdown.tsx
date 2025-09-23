"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

interface SimpleDropdownProps {
  trigger: React.ReactNode;
  options: DropdownOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  multiSelect?: boolean;
  placeholder?: string;
  className?: string;
}

export const SimpleDropdown = ({
  trigger,
  options,
  selectedValues,
  onSelectionChange,
  multiSelect = true,
  placeholder = "Select options",
  className,
}: SimpleDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (value: string) => {
    if (multiSelect) {
      const newSelection = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([value]);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] max-w-[400px] bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="py-1">
            {options.map((option) => (
              <div
                key={option.value}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                onClick={() => handleOptionClick(option.value)}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-sm text-gray-500">
                      {option.description}
                    </div>
                  )}
                </div>
                {multiSelect && selectedValues.includes(option.value) && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleDropdown;
