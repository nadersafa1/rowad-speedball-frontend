import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { DatePicker } from '@/components/ui/date-picker'
import { UseFormReturn } from 'react-hook-form'
import { EventFormData } from '../event-form.schema'

interface EventDateFieldsProps {
  form: UseFormReturn<EventFormData>
  isEditing: boolean
  hasPlayedSets: boolean
}

const EventDateFields = ({
  form,
  isEditing,
  hasPlayedSets,
}: EventDateFieldsProps) => {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
      <FormField
        control={form.control}
        name='registrationStartDate'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Registration Start Date</FormLabel>
            <FormControl>
              <DatePicker
                date={field.value || undefined}
                onDateChange={field.onChange}
                disabled={isEditing && hasPlayedSets}
              />
            </FormControl>
            {isEditing && hasPlayedSets && (
              <p className='text-xs text-muted-foreground'>
                Cannot change registration dates once sets are played
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='registrationEndDate'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Registration End Date</FormLabel>
            <FormControl>
              <DatePicker
                date={field.value || undefined}
                onDateChange={field.onChange}
                disabled={isEditing && hasPlayedSets}
              />
            </FormControl>
            {isEditing && hasPlayedSets && (
              <p className='text-xs text-muted-foreground'>
                Cannot change registration dates once sets are played
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export default EventDateFields
