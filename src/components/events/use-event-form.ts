import { useEffect, useState } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, addDays } from 'date-fns'
import { useEventsStore } from '@/store/events-store'
import { apiClient } from '@/lib/api-client'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import {
  isTestEventType,
  isSoloTestEventType,
  isSoloEventType,
} from '@/types/event-types'
import { eventSchema, type EventFormData } from './event-form.schema'

export interface EventFormProps {
  event?: any
  onSuccess?: () => void
  onCancel?: () => void
  hasRegistrations?: boolean
  hasPlayedSets?: boolean
  trainingSessionId?: string
  championshipEditionId?: string
  title?: string
  description?: string
}

export interface UseEventFormReturn {
  form: UseFormReturn<EventFormData>
  isSubmitting: boolean
  isEditing: boolean
  selectedFormat: string
  selectedEventType: string
  isTestEvent: boolean
  isSoloEvent: boolean
  isSoloTestEvent: boolean
  hasRegistrations: boolean
  hasPlayedSets: boolean
  trainingSessionId?: string
  championshipEditionId?: string
  isSystemAdmin: boolean
  isFederationAdmin: boolean
  isFederationEditor: boolean
  error: string | null
  onSubmit: (data: EventFormData) => Promise<void>
}

export const useEventForm = ({
  event,
  onSuccess,
  hasRegistrations = false,
  hasPlayedSets = false,
  trainingSessionId,
  championshipEditionId,
}: EventFormProps): UseEventFormReturn => {
  const { createEvent, updateEvent, error, clearError } = useEventsStore()
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isFederationAdmin, isFederationEditor } = context
  const isEditing = !!event
  const [trainingSession, setTrainingSession] = useState<any>(null)

  // Fetch training session data if trainingSessionId is provided
  useEffect(() => {
    if (trainingSessionId && !isEditing) {
      apiClient
        .getTrainingSession(trainingSessionId)
        .then((session) => {
          setTrainingSession(session)
        })
        .catch((error) => {
          console.error('Error fetching training session:', error)
        })
    }
  }, [trainingSessionId, isEditing])

  // Calculate default dates from training session
  const getDefaultDates = () => {
    if (trainingSession?.date) {
      const sessionDate = new Date(trainingSession.date)
      return {
        startDate: sessionDate,
        endDate: addDays(sessionDate, 7), // 7 days after session date
      }
    }
    return {
      startDate: event?.registrationStartDate
        ? new Date(event.registrationStartDate)
        : undefined,
      endDate: event?.registrationEndDate
        ? new Date(event.registrationEndDate)
        : undefined,
    }
  }

  const defaultDates = getDefaultDates()

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: event?.name || '',
      eventType: event?.eventType || 'singles',
      gender: event?.gender || 'male',
      format: event?.format || 'groups',
      visibility:
        event?.visibility || (trainingSessionId ? 'private' : 'public'),
      minPlayers: event?.minPlayers || 1,
      maxPlayers: event?.maxPlayers || 1,
      registrationStartDate: defaultDates.startDate,
      registrationEndDate: defaultDates.endDate,
      bestOf: event?.bestOf || 3,
      pointsPerWin:
        event?.format === 'groups' || event?.format === 'groups-knockout'
          ? event?.pointsPerWin ?? 3
          : undefined,
      pointsPerLoss:
        event?.format === 'groups' || event?.format === 'groups-knockout'
          ? event?.pointsPerLoss ?? 0
          : undefined,
      hasThirdPlaceMatch:
        event?.format === 'single-elimination'
          ? event?.hasThirdPlaceMatch ?? false
          : false,
      losersStartRoundsBeforeFinal:
        event?.format === 'double-elimination'
          ? event?.losersStartRoundsBeforeFinal ?? null
          : null,
      playersPerHeat: event?.playersPerHeat ?? 8,
      organizationId:
        event?.organizationId || trainingSession?.organizationId || null,
      championshipEditionId:
        event?.championshipEditionId || championshipEditionId || undefined,
      pointsSchemaId: event?.pointsSchemaId || '',
    },
  })

  // Update form when training session is loaded
  useEffect(() => {
    if (trainingSession && !isEditing) {
      if (trainingSession.organizationId) {
        form.setValue('organizationId', trainingSession.organizationId, {
          shouldDirty: false,
        })
      }
      if (trainingSession.date) {
        const sessionDate = new Date(trainingSession.date)
        form.setValue('registrationStartDate', sessionDate, {
          shouldDirty: false,
        })
        form.setValue('registrationEndDate', addDays(sessionDate, 7), {
          shouldDirty: false,
        })
      }
      // Force visibility to private for training session events
      form.setValue('visibility', 'private', { shouldDirty: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    trainingSession?.id,
    trainingSession?.organizationId,
    trainingSession?.date,
    isEditing,
  ])

  // Update form when championshipEditionId prop is provided
  useEffect(() => {
    if (championshipEditionId && !isEditing) {
      form.setValue('championshipEditionId', championshipEditionId, {
        shouldDirty: false,
      })
      // Championship events have no organization
      form.setValue('organizationId', null, { shouldDirty: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [championshipEditionId, isEditing])

  const { isSubmitting } = form.formState
  const selectedFormat = form.watch('format')
  const selectedEventType = form.watch('eventType')
  const isTestEvent = isTestEventType(selectedEventType)
  const isSoloEvent = isSoloEventType(selectedEventType)
  const isSoloTestEvent = isSoloTestEventType(selectedEventType)

  // Handle event type changes - auto-set format and player counts for test events
  useEffect(() => {
    if (isTestEvent) {
      // Auto-set format to 'tests' for test events
      form.setValue('format', 'tests', { shouldValidate: false })
      // Auto-set min/max players based on event type
      if (isSoloTestEventType(selectedEventType)) {
        form.setValue('minPlayers', 1, { shouldValidate: false })
        form.setValue('maxPlayers', 1, { shouldValidate: false })
      } else {
        // Team test events
        form.setValue('minPlayers', 2, { shouldValidate: false })
        form.setValue('maxPlayers', 6, { shouldValidate: false })
      }
    }
  }, [selectedEventType, form, isTestEvent])

  // Handle format changes - clear or set default values
  useEffect(() => {
    if (selectedFormat === 'single-elimination') {
      // Clear points fields for single-elimination
      form.setValue('pointsPerWin', undefined, { shouldValidate: false })
      form.setValue('pointsPerLoss', undefined, { shouldValidate: false })
      form.setValue('losersStartRoundsBeforeFinal', null, {
        shouldValidate: false,
      })
    } else if (selectedFormat === 'double-elimination') {
      // Clear points fields and hasThirdPlaceMatch for double-elimination
      form.setValue('pointsPerWin', undefined, { shouldValidate: false })
      form.setValue('pointsPerLoss', undefined, { shouldValidate: false })
      form.setValue('hasThirdPlaceMatch', false, { shouldValidate: false })
    } else if (selectedFormat === 'tests') {
      // Clear all competition-related fields for test events
      form.setValue('pointsPerWin', undefined, { shouldValidate: false })
      form.setValue('pointsPerLoss', undefined, { shouldValidate: false })
      form.setValue('losersStartRoundsBeforeFinal', null, {
        shouldValidate: false,
      })
      form.setValue('hasThirdPlaceMatch', false, { shouldValidate: false })
    } else if (
      (selectedFormat === 'groups' || selectedFormat === 'groups-knockout') &&
      !form.getValues('pointsPerWin')
    ) {
      // Set default values for groups format if not already set
      form.setValue('pointsPerWin', 3, { shouldValidate: false })
      form.setValue('pointsPerLoss', 0, { shouldValidate: false })
      form.setValue('losersStartRoundsBeforeFinal', null, {
        shouldValidate: false,
      })
      form.setValue('hasThirdPlaceMatch', false, { shouldValidate: false })
    }
  }, [selectedFormat, form])

  const onSubmit = async (data: EventFormData) => {
    clearError()
    try {
      const isGroupsFormat =
        data.format === 'groups' || data.format === 'groups-knockout'
      const isSingleElimination = data.format === 'single-elimination'
      const isDoubleElimination = data.format === 'double-elimination'
      const isTestFormat = data.format === 'tests'

      // Determine final organizationId: null for championship events, otherwise use form value
      const finalOrganizationId = championshipEditionId
        ? null
        : data.organizationId || trainingSession?.organizationId || null

      // Determine final championshipEditionId: use prop if provided, otherwise form value
      const finalChampionshipEditionId =
        championshipEditionId || data.championshipEditionId

      const formattedData = {
        ...data,
        registrationStartDate: format(data.registrationStartDate, 'yyyy-MM-dd'),
        registrationEndDate: format(data.registrationEndDate, 'yyyy-MM-dd'),
        // Points are only meaningful for groups format
        // For single-elimination and test events, set to 0 since they're not used
        pointsPerWin: isGroupsFormat ? data.pointsPerWin ?? 3 : 0,
        pointsPerLoss: isGroupsFormat ? data.pointsPerLoss ?? 0 : 0,
        // hasThirdPlaceMatch is only for single-elimination
        hasThirdPlaceMatch: isSingleElimination
          ? data.hasThirdPlaceMatch ?? false
          : false,
        // losersStartRoundsBeforeFinal is only for double-elimination
        losersStartRoundsBeforeFinal: isDoubleElimination
          ? data.losersStartRoundsBeforeFinal ?? null
          : null,
        // playersPerHeat is only for test events
        playersPerHeat: isTestFormat ? data.playersPerHeat ?? 8 : undefined,
        // bestOf defaults to 1 for test events
        bestOf: isTestFormat ? 1 : data.bestOf,
        // Training session events are always private
        visibility: trainingSessionId ? 'private' : data.visibility,
        // Organization ID: null for championship events
        organizationId: finalOrganizationId,
        // Include trainingSessionId if provided (only for creation)
        ...(trainingSessionId && !isEditing && { trainingSessionId }),
        // Championship-related fields
        ...(finalChampionshipEditionId && {
          championshipEditionId: finalChampionshipEditionId,
        }),
        // Points schema is always required
        pointsSchemaId: data.pointsSchemaId,
      }

      if (isEditing) {
        // Filter out fields that cannot be changed when editing
        const updateData: any = {}

        // Fields that can always be changed
        if (formattedData.name !== undefined) {
          updateData.name = formattedData.name
        }
        if (formattedData.visibility !== undefined) {
          updateData.visibility = formattedData.visibility
        }

        // Fields that cannot be changed if registrations exist
        if (!hasRegistrations) {
          if (formattedData.eventType !== undefined) {
            updateData.eventType = formattedData.eventType
          }
          if (formattedData.gender !== undefined) {
            updateData.gender = formattedData.gender
          }
          if (formattedData.minPlayers !== undefined) {
            updateData.minPlayers = formattedData.minPlayers
          }
          if (formattedData.maxPlayers !== undefined) {
            updateData.maxPlayers = formattedData.maxPlayers
          }
          if (formattedData.format !== undefined) {
            updateData.format = formattedData.format
          }
          if (formattedData.losersStartRoundsBeforeFinal !== undefined) {
            updateData.losersStartRoundsBeforeFinal =
              formattedData.losersStartRoundsBeforeFinal
          }
          if (formattedData.hasThirdPlaceMatch !== undefined) {
            updateData.hasThirdPlaceMatch = formattedData.hasThirdPlaceMatch
          }
          if (formattedData.playersPerHeat !== undefined) {
            updateData.playersPerHeat = formattedData.playersPerHeat
          }
        }

        // Fields that cannot be changed if sets are played
        if (!hasPlayedSets) {
          if (formattedData.bestOf !== undefined) {
            updateData.bestOf = formattedData.bestOf
          }
          if (formattedData.pointsPerWin !== undefined) {
            updateData.pointsPerWin = formattedData.pointsPerWin
          }
          if (formattedData.pointsPerLoss !== undefined) {
            updateData.pointsPerLoss = formattedData.pointsPerLoss
          }
          if (formattedData.registrationStartDate !== undefined) {
            updateData.registrationStartDate =
              formattedData.registrationStartDate
          }
          if (formattedData.registrationEndDate !== undefined) {
            updateData.registrationEndDate = formattedData.registrationEndDate
          }
        }

        // organizationId is handled by backend based on user permissions
        // Only include if it's different and user is system admin
        if (
          isSystemAdmin &&
          formattedData.organizationId !== undefined &&
          formattedData.organizationId !== event?.organizationId
        ) {
          updateData.organizationId = formattedData.organizationId
        }

        await updateEvent(event.id, updateData)
      } else {
        await createEvent(formattedData)
      }

      form.reset()
      onSuccess?.()
    } catch (err) {
      console.error('Error submitting event form:', err)
      // Error is handled by the store
    }
  }

  return {
    form,
    isSubmitting,
    isEditing,
    selectedFormat,
    selectedEventType,
    isTestEvent,
    isSoloEvent,
    isSoloTestEvent,
    hasRegistrations,
    hasPlayedSets,
    trainingSessionId,
    championshipEditionId,
    isSystemAdmin,
    isFederationAdmin,
    isFederationEditor,
    error,
    onSubmit,
  }
}

