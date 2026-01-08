import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import ClubCombobox from '@/components/organizations/club-combobox'
import ChampionshipEditionCombobox from '@/components/championship-editions/championship-edition-combobox'
import PointsSchemaCombobox from '@/components/points-schemas/points-schema-combobox'
import { UseFormReturn } from 'react-hook-form'
import { EventFormData } from '../event-form.schema'

interface EventOrganizationFieldsProps {
  form: UseFormReturn<EventFormData>
  isSubmitting: boolean
  trainingSessionId?: string
  championshipEditionId?: string
  isSystemAdmin: boolean
  isFederationAdmin: boolean
  isFederationEditor: boolean
}

const EventOrganizationFields = ({
  form,
  isSubmitting,
  trainingSessionId,
  championshipEditionId,
  isSystemAdmin,
  isFederationAdmin,
  isFederationEditor,
}: EventOrganizationFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name='visibility'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Visibility</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                disabled={!!trainingSessionId}
                className='flex flex-col sm:flex-row gap-4 sm:gap-6'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem
                    value='public'
                    id='public'
                    disabled={!!trainingSessionId}
                  />
                  <label htmlFor='public'>Public</label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem
                    value='private'
                    id='private'
                    disabled={!!trainingSessionId}
                  />
                  <label htmlFor='private'>Private</label>
                </div>
              </RadioGroup>
            </FormControl>
            {trainingSessionId && (
              <p className='text-xs text-muted-foreground'>
                Events created from training sessions are always private
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Club Field - Only for System Admins, and only if not creating from training session */}
      {isSystemAdmin && !trainingSessionId && (
        <FormField
          control={form.control}
          name='organizationId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Club</FormLabel>
              <FormControl>
                <ClubCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                  placeholder='Select a club (optional)'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Championship Edition Field - Only for authorized users and not creating from training session */}
      {!trainingSessionId &&
        (isSystemAdmin || isFederationAdmin || isFederationEditor) && (
          <FormField
            control={form.control}
            name='championshipEditionId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Championship Edition</FormLabel>
                <FormControl>
                  <ChampionshipEditionCombobox
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || !!championshipEditionId}
                    placeholder='Select championship edition (optional)'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

      {/* Points Schema Field - Always required */}
      <FormField
        control={form.control}
        name='pointsSchemaId'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Points Schema *</FormLabel>
            <FormControl>
              <PointsSchemaCombobox
                value={field.value || undefined}
                onValueChange={field.onChange}
                disabled={isSubmitting}
                placeholder='Select points schema'
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

export default EventOrganizationFields

