import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { UseFormReturn } from 'react-hook-form'
import { EventFormData } from '../event-form.schema'

interface EventPlayerConfigFieldsProps {
  form: UseFormReturn<EventFormData>
  isEditing: boolean
  hasRegistrations: boolean
  isSoloEvent: boolean
}

const EventPlayerConfigFields = ({
  form,
  isEditing,
  hasRegistrations,
  isSoloEvent,
}: EventPlayerConfigFieldsProps) => {
  if (isSoloEvent) {
    return null
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
      <FormField
        control={form.control}
        name='minPlayers'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Min Players per Team</FormLabel>
            <FormControl>
              <Input
                type='number'
                placeholder='1'
                {...field}
                onChange={(e) =>
                  field.onChange(parseInt(e.target.value) || 1)
                }
                onFocus={(e) => e.target.select()}
                min={1}
                disabled={isEditing && hasRegistrations}
              />
            </FormControl>
            {isEditing && hasRegistrations && (
              <p className='text-xs text-muted-foreground'>
                Cannot change once registrations exist
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='maxPlayers'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Players per Team</FormLabel>
            <FormControl>
              <Input
                type='number'
                placeholder='2'
                {...field}
                onChange={(e) =>
                  field.onChange(parseInt(e.target.value) || 2)
                }
                onFocus={(e) => e.target.select()}
                min={1}
                disabled={isEditing && hasRegistrations}
              />
            </FormControl>
            {isEditing && hasRegistrations && (
              <p className='text-xs text-muted-foreground'>
                Cannot change once registrations exist
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export default EventPlayerConfigFields

