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

interface EventMatchConfigFieldsProps {
  form: UseFormReturn<EventFormData>
  isEditing: boolean
  hasPlayedSets: boolean
  selectedFormat: string
  isSoloTestEvent: boolean
}

const EventMatchConfigFields = ({
  form,
  isEditing,
  hasPlayedSets,
  selectedFormat,
  isSoloTestEvent,
}: EventMatchConfigFieldsProps) => {
  // Hidden for solo test events only
  if (isSoloTestEvent) {
    return null
  }

  const isGroupsFormat =
    selectedFormat === 'groups' || selectedFormat === 'groups-knockout'

  return (
    <div
      className={`grid gap-4 ${
        isGroupsFormat
          ? 'grid-cols-1 sm:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-1'
      }`}
    >
      <FormField
        control={form.control}
        name='bestOf'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Best Of (Sets)</FormLabel>
            <FormControl>
              <Input
                type='number'
                placeholder='3'
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 3)}
                onFocus={(e) => e.target.select()}
                min={1}
                disabled={isEditing && hasPlayedSets}
                step={2}
              />
            </FormControl>
            {isEditing && hasPlayedSets && (
              <p className='text-xs text-muted-foreground'>
                Cannot change bestOf once sets are played
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {isGroupsFormat && (
        <>
          <FormField
            control={form.control}
            name='pointsPerWin'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points Per Win</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='3'
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 3)
                    }
                    onFocus={(e) => e.target.select()}
                    min={0}
                    disabled={isEditing && hasPlayedSets}
                  />
                </FormControl>
                {isEditing && hasPlayedSets && (
                  <p className='text-xs text-muted-foreground'>
                    Cannot change points per win once sets are played
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='pointsPerLoss'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points Per Loss</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='0'
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                    onFocus={(e) => e.target.select()}
                    min={0}
                    disabled={isEditing && hasPlayedSets}
                  />
                </FormControl>
                {isEditing && hasPlayedSets && (
                  <p className='text-xs text-muted-foreground'>
                    Cannot change points per loss once sets are played
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  )
}

export default EventMatchConfigFields
