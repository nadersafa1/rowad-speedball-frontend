'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { Coach } from '@/db/schema'

/**
 * Hook to check coach-based permissions
 * Returns permission flags based on coach ownership and user role
 */
export const useCoachPermissions = (coach: Coach | null | undefined) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach, organization } = context

  return useMemo(() => {
    if (!coach) {
      return {
        canRead: true, // Coaches are public
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      }
    }

    // Check if coach belongs to user's organization
    const isCoachFromUserOrg =
      !!organization?.id && coach.organizationId === organization.id

    // Read permission: Anyone can read coaches (public)
    const canRead = true

    // Create permission: System admins, org admins, org owners, org coaches
    // Must have an active organization (unless system admin)
    const canCreate =
      isSystemAdmin || ((isAdmin || isOwner || isCoach) && !!organization?.id)

    // Update permission: System admins, org admins, org owners, org coaches
    // Must be from user's org (unless system admin)
    const canUpdate =
      (isSystemAdmin || isAdmin || isOwner || isCoach) &&
      (isSystemAdmin || (isCoachFromUserOrg && !!organization?.id))

    // Delete permission: System admins, org admins, org owners
    // Coaches CANNOT delete coaches (only admins/owners)
    // Must be from user's org (unless system admin)
    const canDelete =
      (isSystemAdmin || isAdmin || isOwner) &&
      (isSystemAdmin || (isCoachFromUserOrg && !!organization?.id))

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [coach, isSystemAdmin, isAdmin, isOwner, isCoach, organization])
}
