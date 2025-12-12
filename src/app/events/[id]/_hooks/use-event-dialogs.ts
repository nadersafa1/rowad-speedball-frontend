'use client'

import { useState } from 'react'
import type { Event, Registration } from '@/types'

export const useEventDialogs = () => {
  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [registrationFormOpen, setRegistrationFormOpen] = useState(false)
  const [editingRegistration, setEditingRegistration] = useState<string | null>(
    null
  )
  const [deleteRegistrationId, setDeleteRegistrationId] = useState<
    string | null
  >(null)
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = useState(false)

  const openEventForm = () => setEventFormOpen(true)
  const closeEventForm = () => setEventFormOpen(false)

  const openRegistrationForm = (registrationId?: string) => {
    setEditingRegistration(registrationId || null)
    setRegistrationFormOpen(true)
  }

  const closeRegistrationForm = () => {
    setRegistrationFormOpen(false)
    setEditingRegistration(null)
  }

  const openDeleteRegistration = (id: string) => setDeleteRegistrationId(id)
  const closeDeleteRegistration = () => setDeleteRegistrationId(null)

  const openDeleteEvent = () => setDeleteEventDialogOpen(true)
  const closeDeleteEvent = () => setDeleteEventDialogOpen(false)

  return {
    eventFormOpen,
    registrationFormOpen,
    editingRegistration,
    deleteRegistrationId,
    deleteEventDialogOpen,
    openEventForm,
    closeEventForm,
    openRegistrationForm,
    closeRegistrationForm,
    openDeleteRegistration,
    closeDeleteRegistration,
    openDeleteEvent,
    closeDeleteEvent,
  }
}
