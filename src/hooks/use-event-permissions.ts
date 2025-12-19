'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { Event } from '@/types'

/**
 * Hook to check event-based permissions
 * Returns permission flags based on event ownership and user role
 */
export const useEventPermissions = (event: Event | null | undefined) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach, organization } = context

  return useMemo(() => {
    if (!event) {
      return {
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      }
    }

    // Check if event belongs to user's organization
    const isEventFromUserOrg =
      !!organization?.id && event.organizationId === organization.id

    // Read permission: matches backend logic
    // System admin: can see all events
    // Org members: can see their org events (public + private) + public events + events without org
    // Non-authenticated: can see public events + events without org
    const isPublic = event.visibility === 'public'
    const hasNoOrganization = event.organizationId === null
    const canRead =
      isSystemAdmin || isPublic || hasNoOrganization || isEventFromUserOrg

    // Create permission: System admins, org admins, org owners, org coaches
    const canCreate =
      isSystemAdmin || ((isAdmin || isOwner || isCoach) && !!organization?.id)

    // Update permission: System admins, org admins, org owners, org coaches
    // Must be from user's org (unless system admin)
    const canUpdate =
      (isSystemAdmin || isAdmin || isOwner || isCoach) &&
      (isSystemAdmin || (isEventFromUserOrg && !!organization?.id))

    // Delete permission: System admins, org admins, org owners, org coaches
    // Must be from user's org (unless system admin)
    // Note: For registrations, coaches can delete. For events, only admins/owners can delete.
    const canDelete =
      (isSystemAdmin || isAdmin || isOwner || isCoach) &&
      (isSystemAdmin || (isEventFromUserOrg && !!organization?.id))

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [event, isSystemAdmin, isAdmin, isOwner, isCoach, organization])
}
