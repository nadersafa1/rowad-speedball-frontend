/**
 * Table Core - DateRangeFilter Component
 * Reusable date range filter component for tables
 */

'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { TableFilter } from './TableFilter'
import type { DateRange as CalendarDateRange } from 'react-day-picker'

export type DateRange = CalendarDateRange

export interface DateRangeFilterProps {
  label?: string
  htmlFor?: string
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
  required?: boolean
}

export function DateRangeFilter({
  label,
  htmlFor,
  dateRange,
  onDateRangeChange,
  placeholder = 'Pick a date range',
  disabled = false,
  className,
  error,
  required = false,
}: DateRangeFilterProps) {
  const formatDateRange = (range: DateRange | undefined): string => {
    if (!range?.from) {
      return placeholder
    }

    if (range.from && range.to) {
      return `${format(range.from, 'LLL dd, y')} - ${format(
        range.to,
        'LLL dd, y'
      )}`
    }

    return format(range.from, 'LLL dd, y')
  }

  return (
    <TableFilter
      label={label}
      htmlFor={htmlFor}
      error={error}
      required={required}
      className={className}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={htmlFor}
            variant='outline'
            className={cn(
              'w-full justify-start text-left font-normal',
              !dateRange?.from && 'text-muted-foreground',
              error && 'border-destructive'
            )}
            disabled={disabled}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {formatDateRange(dateRange)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='range'
            defaultMonth={dateRange?.from}
            selected={{
              from: dateRange?.from,
              to: dateRange?.to,
            }}
            onSelect={(range) => {
              onDateRangeChange?.(range)
            }}
            numberOfMonths={2}
            className='rounded-lg border shadow-sm'
          />
        </PopoverContent>
      </Popover>
    </TableFilter>
  )
}
