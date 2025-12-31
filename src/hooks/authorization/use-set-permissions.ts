'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'

/**
 * Hook to check set-based permissions
 * Returns permission flags based on the parent event's organization and user role
 *
 * Note: Sets belong to matches which belong to events.
 * Authorization is based on the parent event's organization.
 */
export const useSetPermissions = (eventOrganizationId?: string | null) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach, organization } = context

  return useMemo(() => {
    // Check if event belongs to user's organization
    const isEventFromUserOrg =
      !!organization?.id && eventOrganizationId === organization.id

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
    const canDelete =
      (isSystemAdmin || isAdmin || isOwner || isCoach) &&
      (isSystemAdmin || (isEventFromUserOrg && !!organization?.id))

    return {
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [eventOrganizationId, isSystemAdmin, isAdmin, isOwner, isCoach, organization])
}
