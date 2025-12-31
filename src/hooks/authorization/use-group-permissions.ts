'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { Group } from '@/types'

/**
 * Hook to check group-based permissions
 * Returns permission flags based on group's parent event ownership and user role
 *
 * Note: Groups inherit authorization from their parent event.
 * This hook should be used in conjunction with event permissions where applicable.
 */
export const useGroupPermissions = (group?: Group | null) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach, organization } = context

  return useMemo(() => {
    // Create permission: System admins, org admins, org owners, org coaches
    const canCreate =
      isSystemAdmin || ((isAdmin || isOwner || isCoach) && !!organization?.id)

    if (!group) {
      return {
        canRead: true, // Groups inherit visibility from parent events
        canCreate,
        canUpdate: false,
        canDelete: false,
      }
    }

    // Read permission: Groups are generally readable if their parent event is readable
    // The parent event's authorization handles the actual visibility logic
    const canRead = true

    // Update permission: System admins, org admins, org owners, org coaches
    // Groups belong to events, which belong to organizations
    // We allow updates if the user has coach-level permissions in their org
    const canUpdate =
      (isSystemAdmin || isAdmin || isOwner || isCoach) &&
      (isSystemAdmin || !!organization?.id)

    // Delete permission: System admins, org admins, org owners only (coaches cannot delete)
    const canDelete =
      (isSystemAdmin || isAdmin || isOwner) &&
      (isSystemAdmin || !!organization?.id)

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [group, isSystemAdmin, isAdmin, isOwner, isCoach, organization])
}
