'use client'

import { useMemo } from 'react'
import { useOrganizationContext } from './use-organization-context'
import type { Match } from '@/types'

/**
 * Hook to check if a player can update a specific match
 * Players can update matches if:
 * 1. User is a player with an organization
 * 2. Event is linked to a training session (has trainingSessionId)
 * 3. Event belongs to player's organization
 * 4. Player is registered in one of the match's registrations
 */
export const useMatchPermissions = (match: Match | null | undefined) => {
  const { context } = useOrganizationContext()
  const { userId, isPlayer, organization } = context

  return useMemo(() => {
    if (!match || !match.event) {
      return { canUpdate: false }
    }

    const event = match.event

    // Check if player can update this match
    const canPlayerUpdate =
      isPlayer &&
      userId &&
      organization?.id &&
      event.trainingSessionId &&
      event.organizationId === organization.id &&
      (match.registration1?.players?.some((p) => p.userId === userId) ||
        match.registration2?.players?.some((p) => p.userId === userId))

    return {
      canUpdate: canPlayerUpdate,
    }
  }, [match, userId, isPlayer, organization])
}

/**
 * Helper function to check if a player can update a match (for use outside hooks)
 */
export const canPlayerUpdateMatch = (
  match: Match | null | undefined,
  userId: string | null,
  isPlayer: boolean,
  organizationId: string | null | undefined
): boolean => {
  if (!match || !match.event) {
    return false
  }

  const event = match.event

  return (
    isPlayer &&
    !!userId &&
    !!organizationId &&
    !!event.trainingSessionId &&
    event.organizationId === organizationId &&
    (match.registration1?.players?.some((p) => p.userId === userId) ||
      match.registration2?.players?.some((p) => p.userId === userId))
  )
}
