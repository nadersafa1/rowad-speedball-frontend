import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UI_EVENT_TYPES, EVENT_TYPE_LABELS } from '@/types/event-types'
import { UseFormReturn } from 'react-hook-form'
import { EventFormData } from '../event-form.schema'

interface EventBasicInfoFieldsProps {
  form: UseFormReturn<EventFormData>
  isEditing: boolean
  hasRegistrations: boolean
}

const EventBasicInfoFields = ({
  form,
  isEditing,
  hasRegistrations,
}: EventBasicInfoFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Name</FormLabel>
            <FormControl>
              <Input placeholder='Enter event name' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='eventType'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isEditing && hasRegistrations}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select event type' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {UI_EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {EVENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && hasRegistrations && (
                <p className='text-xs text-muted-foreground'>
                  Cannot change event type once registrations exist
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='gender'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isEditing && hasRegistrations}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select gender' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='male'>Male</SelectItem>
                  <SelectItem value='female'>Female</SelectItem>
                  <SelectItem value='mixed'>Mixed</SelectItem>
                </SelectContent>
              </Select>
              {isEditing && hasRegistrations && (
                <p className='text-xs text-muted-foreground'>
                  Cannot change gender once registrations exist
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}

export default EventBasicInfoFields
