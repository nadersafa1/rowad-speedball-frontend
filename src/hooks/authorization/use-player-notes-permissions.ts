'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { Player } from '@/types'

/**
 * Hook to check player notes permissions
 * Returns permission flags based on player ownership and user role
 * Mirrors the logic from checkPlayerNotesReadAuthorization
 */
export const usePlayerNotesPermissions = (
  player: Player | null | undefined
) => {
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach, organization, isAuthenticated } =
    context

  return useMemo(() => {
    if (!player) {
      return {
        canReadNotes: false,
      }
    }

    // Require authentication
    if (!isAuthenticated) {
      return {
        canReadNotes: false,
      }
    }

    // System admins can read all notes
    if (isSystemAdmin) {
      return {
        canReadNotes: true,
      }
    }

    // Check if player belongs to user's organization
    // Note: Player type may not include organizationId in TypeScript, but it exists in the database
    // The API returns the full database object which includes organizationId
    const playerOrgId = (player as any).organizationId as string | null | undefined
    const isPlayerFromUserOrg =
      !!organization?.id && !!playerOrgId && organization.id === playerOrgId

    // Org members can read notes for their org's players
    const canReadNotes =
      (isAdmin || isOwner || isCoach) && isPlayerFromUserOrg

    return {
      canReadNotes,
    }
  }, [player, isSystemAdmin, isAdmin, isOwner, isCoach, organization, isAuthenticated])
}

