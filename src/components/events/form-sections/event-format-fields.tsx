import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UseFormReturn } from 'react-hook-form'
import { EventFormData } from '../event-form.schema'
import {
  EVENT_FORMAT_OPTIONS,
  LOSERS_BRACKET_START_OPTIONS,
} from '../event-form.constants'

interface EventFormatFieldsProps {
  form: UseFormReturn<EventFormData>
  isEditing: boolean
  hasRegistrations: boolean
  selectedFormat: string
  isTestEvent: boolean
}

const EventFormatFields = ({
  form,
  isEditing,
  hasRegistrations,
  selectedFormat,
  isTestEvent,
}: EventFormatFieldsProps) => {
  return (
    <>
      {/* Format and format-specific options - Hidden for test events */}
      {!isTestEvent && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='format'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Format</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isEditing && hasRegistrations}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select format' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EVENT_FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditing && hasRegistrations && (
                  <p className='text-xs text-muted-foreground'>
                    Cannot change format once registrations exist
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedFormat === 'double-elimination' && (
            <FormField
              control={form.control}
              name='losersStartRoundsBeforeFinal'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Losers Bracket Start</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(
                        value === 'full' ? null : parseInt(value)
                      )
                    }
                    value={
                      field.value === null ? 'full' : String(field.value)
                    }
                    disabled={isEditing && hasRegistrations}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select when losers bracket starts' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOSERS_BRACKET_START_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-muted-foreground'>
                    Players who lose before this round are eliminated. Full
                    double elimination gives everyone a second chance.
                  </p>
                  {isEditing && hasRegistrations && (
                    <p className='text-xs text-muted-foreground'>
                      Cannot change once registrations exist
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {selectedFormat === 'single-elimination' && (
            <FormField
              control={form.control}
              name='hasThirdPlaceMatch'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isEditing && hasRegistrations}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Third Place Match</FormLabel>
                    <p className='text-xs text-muted-foreground'>
                      Include a match for 3rd/4th place between semi-final
                      losers
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )}

      {/* Players per Heat - Only for test events */}
      {isTestEvent && (
        <FormField
          control={form.control}
          name='playersPerHeat'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Players Per Heat</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  placeholder='8'
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 8)
                  }
                  onFocus={(e) => e.target.select()}
                  min={1}
                  disabled={isEditing && hasRegistrations}
                />
              </FormControl>
              <p className='text-xs text-muted-foreground'>
                Number of players that compete in each heat (round)
              </p>
              {isEditing && hasRegistrations && (
                <p className='text-xs text-muted-foreground'>
                  Cannot change once registrations exist
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  )
}

export default EventFormatFields

