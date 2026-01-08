'use client'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Save } from 'lucide-react'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui'
import { useEventForm, type EventFormProps } from './use-event-form'
import EventBasicInfoFields from './form-sections/event-basic-info-fields'
import EventPlayerConfigFields from './form-sections/event-player-config-fields'
import EventFormatFields from './form-sections/event-format-fields'
import EventDateFields from './form-sections/event-date-fields'
import EventMatchConfigFields from './form-sections/event-match-config-fields'
import EventOrganizationFields from './form-sections/event-organization-fields'

const EventForm = ({
  event,
  onSuccess,
  onCancel,
  hasRegistrations = false,
  hasPlayedSets = false,
  trainingSessionId,
  championshipEditionId,
  title,
  description,
}: EventFormProps) => {
  const formState = useEventForm({
    event,
    onSuccess,
    onCancel,
    hasRegistrations,
    hasPlayedSets,
    trainingSessionId,
    championshipEditionId,
    title,
    description,
  })

  return (
    <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6'>
      <DialogHeader>
        <DialogTitle>
          {title || (formState.isEditing ? 'Edit Event' : 'Create Event')}
        </DialogTitle>
        <DialogDescription>
          {description ||
            (formState.isEditing
              ? 'Update event details below.'
              : 'Fill in the details to create a new event.')}
        </DialogDescription>
      </DialogHeader>

      <Form {...formState.form}>
        <form
          onSubmit={formState.form.handleSubmit(formState.onSubmit)}
          className='space-y-4'
        >
          <EventBasicInfoFields
            form={formState.form}
            isEditing={formState.isEditing}
            hasRegistrations={formState.hasRegistrations}
          />

          <EventPlayerConfigFields
            form={formState.form}
            isEditing={formState.isEditing}
            hasRegistrations={formState.hasRegistrations}
            isSoloEvent={formState.isSoloEvent}
          />

          <EventFormatFields
            form={formState.form}
            isEditing={formState.isEditing}
            hasRegistrations={formState.hasRegistrations}
            selectedFormat={formState.selectedFormat}
            isTestEvent={formState.isTestEvent}
          />

          <EventDateFields
            form={formState.form}
            isEditing={formState.isEditing}
            hasPlayedSets={formState.hasPlayedSets}
          />

          <EventMatchConfigFields
            form={formState.form}
            isEditing={formState.isEditing}
            hasPlayedSets={formState.hasPlayedSets}
            selectedFormat={formState.selectedFormat}
            isSoloTestEvent={formState.isSoloTestEvent}
          />

          <EventOrganizationFields
            form={formState.form}
            isSubmitting={formState.isSubmitting}
            trainingSessionId={formState.trainingSessionId}
            championshipEditionId={formState.championshipEditionId}
            isSystemAdmin={formState.isSystemAdmin}
            isFederationAdmin={formState.isFederationAdmin}
            isFederationEditor={formState.isFederationEditor}
          />

          {formState.error && (
            <div className='text-sm text-destructive'>{formState.error}</div>
          )}

          <DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={formState.isSubmitting}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
            )}
            <Button
              type='submit'
              disabled={formState.isSubmitting}
              className='w-full sm:w-auto'
            >
              <Save className='mr-2 h-4 w-4' />
              {formState.isSubmitting
                ? 'Saving...'
                : formState.isEditing
                ? 'Update'
                : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default EventForm
