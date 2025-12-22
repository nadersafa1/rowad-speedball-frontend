'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { Player } from '@/db/schema'

/**
 * Hook to check player-based permissions
 * Returns permission flags based on player ownership and user role
 */
export const usePlayerPermissions = (player: Player | null | undefined) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach, organization } = context

  return useMemo(() => {
    // Create permission: System admins, org admins, org owners, org coaches
    // Must have an active organization (unless system admin)
    const canCreate =
      isSystemAdmin || ((isAdmin || isOwner || isCoach) && !!organization?.id)

    if (!player) {
      return {
        canRead: true, // Players are public
        canCreate, // Use the same logic for general creation permission
        canUpdate: false,
        canDelete: false,
      }
    }

    // Check if player belongs to user's organization
    const isPlayerFromUserOrg =
      !!organization?.id && player.organizationId === organization.id

    // Read permission: Anyone can read players (public)
    const canRead = true

    // Update permission: System admins, org admins, org owners, org coaches
    // Must be from user's org (unless system admin)
    const canUpdate =
      (isSystemAdmin || isAdmin || isOwner || isCoach) &&
      (isSystemAdmin || (isPlayerFromUserOrg && !!organization?.id))

    // Delete permission: System admins, org admins, org owners
    // Coaches CANNOT delete players (only admins/owners)
    // Must be from user's org (unless system admin)
    const canDelete =
      (isSystemAdmin || isAdmin || isOwner) &&
      (isSystemAdmin || (isPlayerFromUserOrg && !!organization?.id))

    return {
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  }, [player, isSystemAdmin, isAdmin, isOwner, isCoach, organization])
}
