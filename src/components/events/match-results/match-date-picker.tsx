'use client'

import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
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
 */
const MatchDatePicker = ({
  matchDate,
  hasSets,
  hasOriginalDate,
  onDateChange,
}: MatchDatePickerProps) => {
  const handleDateChange = async (date: Date | undefined) => {
    if (!date) return
    try {
      await onDateChange(date)
      toast.success('Match date updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update match date')
    }
  }

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>Match Date</label>
      <DatePicker
        date={matchDate}
        onDateChange={handleDateChange}
        placeholder='Select match date'
        disabled={hasSets}
      />
      {hasSets && (
        <p className='text-xs text-muted-foreground'>
          Match date cannot be changed once sets are entered
        </p>
      )}
      {!hasOriginalDate && matchDate && !hasSets && (
        <p className='text-xs text-muted-foreground'>
          Match date defaulted to today. Change it above if needed.
        </p>
      )}
    </div>
  )
}

export default MatchDatePicker

