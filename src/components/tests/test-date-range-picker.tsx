'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface TestDateRangePickerProps {
  dateRange?: DateRange | undefined
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TestDateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = 'Pick a date range',
  disabled = false,
  className,
}: TestDateRangePickerProps) {
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            !dateRange?.from && 'text-muted-foreground',
            className
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
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={2}
          className='rounded-lg border shadow-sm'
        />
      </PopoverContent>
    </Popover>
  )
}
