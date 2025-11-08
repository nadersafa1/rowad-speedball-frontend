"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ScoreInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
}

const ScoreInput = React.forwardRef<HTMLInputElement, ScoreInputProps>(
  ({ value, onChange, className, disabled, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(
      value?.toString() || ""
    );

    // Update display value when prop value changes (for edit mode)
    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(value.toString());
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty string
      if (inputValue === "") {
        setDisplayValue("");
        onChange?.(0);
        return;
      }

      // Only allow numeric characters
      const numericValue = inputValue.replace(/[^0-9]/g, "");

      // Limit to 3 digits
      if (numericValue.length > 3) {
        return;
      }

      setDisplayValue(numericValue);

      // Convert to number and call onChange
      const numValue = parseInt(numericValue, 10);
      if (!isNaN(numValue)) {
        onChange?.(numValue);
      } else {
        onChange?.(0);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all text on focus
      e.target.select();
    };

    const handleBlur = () => {
      // Validate range 0-999 on blur
      const numValue = parseInt(displayValue, 10);
      if (isNaN(numValue) || numValue < 0) {
        setDisplayValue("0");
        onChange?.(0);
      } else if (numValue > 999) {
        setDisplayValue("999");
        onChange?.(999);
      } else {
        // Ensure display value matches the number (removes leading zeros except for 0)
        const normalizedValue = numValue.toString();
        if (displayValue !== normalizedValue) {
          setDisplayValue(normalizedValue);
        }
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={3}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn("text-center", className)}
        {...props}
      />
    );
  }
);

ScoreInput.displayName = "ScoreInput";

export default ScoreInput;

