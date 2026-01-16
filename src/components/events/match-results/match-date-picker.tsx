'use client'

import { useState, useEffect } from 'react'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface MatchDatePickerProps {
  matchDate: Date | undefined
  hasSets: boolean
  hasOriginalDate: boolean
  onDateChange: (date: Date | undefined) => Promise<void>
}

/**
 * Date picker component for match date selection.
 * Disables editing once sets have been entered.
 * Date is submitted via button click, not automatically.
 */
const MatchDatePicker = ({
  matchDate,
  hasSets,
  hasOriginalDate,
  onDateChange,
}: MatchDatePickerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    matchDate || new Date()
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update local state when matchDate prop changes
  useEffect(() => {
    setSelectedDate(matchDate || new Date())
  }, [matchDate])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date || new Date())
  }

  const handleSubmit = async () => {
    if (!selectedDate || hasSets) return

    setIsSubmitting(true)
    try {
      await onDateChange(selectedDate)
      toast.success('Match date updated successfully')
    } catch (error: any) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update match date'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDateChanged = () => {
    // If no original date exists, allow submission (to set today's date)
    if (!hasOriginalDate) return true
    // If no matchDate or selectedDate, can't compare
    if (!matchDate || !selectedDate) return false
    // Check if date has changed
    return matchDate.toDateString() !== selectedDate.toDateString()
  }

  const isButtonDisabled = hasSets || isSubmitting || !isDateChanged()

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>Match Date</label>
      <div className='flex items-center gap-2'>
        <div className='flex-1'>
          <DatePicker
            date={selectedDate}
            onDateChange={handleDateSelect}
            placeholder='Select match date'
            disabled={hasSets}
          />
        </div>
        <Button
          type='button'
          size='icon'
          onClick={handleSubmit}
          disabled={isButtonDisabled}
          className='shrink-0'
        >
          {isSubmitting ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <CalendarCheck className='h-4 w-4' />
          )}
        </Button>
      </div>
      {hasSets && (
        <p className='text-xs text-muted-foreground'>
          Match date cannot be changed once sets are entered
        </p>
      )}
      {!hasOriginalDate && selectedDate && !hasSets && (
        <p className='text-xs text-muted-foreground'>
          Match date defaulted to today. Change it above if needed.
        </p>
      )}
    </div>
  )
}

export default MatchDatePicker
